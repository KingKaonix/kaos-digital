/**
 * api/stripe/webhook.ts
 *
 * Stripe webhook endpoint. Receives Stripe events, verifies the signature,
 * processes each event idempotently, and updates the subscriptions table.
 *
 * Compatible with Vercel (Node.js runtime) and Netlify (Node.js runtime).
 *
 * Events handled:
 *  - checkout.session.completed      -> activate a subscription / one-time export
 *  - customer.subscription.updated   -> refresh status + period end
 *  - customer.subscription.deleted   -> mark canceled
 *  - invoice.payment_succeeded       -> refresh status + period end
 *  - invoice.payment_failed          -> mark past_due
 *
 * Server-side only: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are read from
 * server env and never exposed to the frontend.
 */

import Stripe from 'stripe';
import { getServerSupabaseClient } from '../../../lib/supabase-server';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

interface NormalizedRequest {
  method: string;
  headers: Record<string, string>;
  rawBody: string;
  body: any;
}

interface NormalizedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  };
}

function jsonResponse(statusCode: number, body: unknown): NormalizedResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
    body: JSON.stringify(body),
  };
}

function sendResponse(res: any, response: NormalizedResponse): void {
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(response.statusCode).json(JSON.parse(response.body));
    return;
  }
  if (res && typeof res.writeHead === 'function') {
    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
    return;
  }
}

/** Read the raw request body as a string (needed for Stripe signature verification). */
async function readRawBody(req: any): Promise<string> {
  if (req.rawBody) {
    return String(req.rawBody);
  }
  if (req.body && typeof req.body === 'string') {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function normalizeRequest(req: any): Promise<NormalizedRequest> {
  let method = 'GET';
  const headers: Record<string, string> = req.headers || {};
  let rawBody = '';

  if (req && req.method) {
    method = String(req.method || 'GET');
    rawBody = await readRawBody(req);
  } else if (req && req.httpMethod) {
    method = String(req.httpMethod || 'GET');
    rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  }

  let body: any = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    body = {};
  }

  return { method, headers, rawBody, body };
}

/** Record a processed Stripe event id so it is never handled twice. */
async function recordProcessedEvent(
  supabase: any,
  eventId: string,
  eventType: string
): Promise<boolean> {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: eventId, type: eventType });
  if (error) {
    // Duplicate primary key = already processed -> idempotent skip.
    return error.code === '23505';
  }
  return true;
}

/** Check whether an event id was already processed. */
async function isEventProcessed(
  supabase: any,
  eventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  return !!data;
}

/** Upsert the subscriptions row for a user based on a Stripe checkout/subscription. */
async function updateSubscriptionFromStripe(
  supabase: any,
  params: {
    userId: string;
    customerId: string;
    subscriptionId?: string;
    status: string;
    planType: string;
    priceId?: string;
    currentPeriodEnd?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const payload: any = {
    user_id: params.userId,
    stripe_customer_id: params.customerId,
    status: params.status,
    plan_type: params.planType,
    updated_at: now,
  };
  if (params.subscriptionId) payload.stripe_subscription_id = params.subscriptionId;
  if (params.priceId) payload.price_id = params.priceId;
  if (params.currentPeriodEnd !== undefined)
    payload.current_period_end = params.currentPeriodEnd;

  await supabase.from('subscriptions').upsert(payload, {
    onConflict: 'user_id',
  });
}

/**
 * Process a single Stripe event. Returns a description of what was done.
 */
async function processEvent(
  supabase: any,
  event: any,
  stripe: Stripe
): Promise<string> {
  const eventType = event.type;
  const data = event.data?.object ?? {};

  switch (eventType) {
    case 'checkout.session.completed': {
      const customerId = data.customer;
      const subscriptionId = data.subscription;
      const metadata = data.metadata || {};
      const userId = metadata.supabase_user_id;
      if (!userId || !customerId) {
        return 'checkout.session.completed: missing user/customer metadata';
      }

      let status = 'active';
      let planType = 'one_time';
      let priceId: string | undefined;
      let periodEnd: string | null = null;

      // If a subscription was created, pull its details from Stripe.
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        status = sub.status;
        planType = 'subscription';
        priceId = sub.items.data[0]?.price?.id ?? undefined;
        periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
      }

      await updateSubscriptionFromStripe(supabase, {
        userId,
        customerId,
        subscriptionId,
        status,
        planType,
        priceId,
        currentPeriodEnd: periodEnd,
      });
      return `checkout.session.completed: activated ${planType} for ${userId}`;
    }

    case 'customer.subscription.updated': {
      const customerId = data.customer;
      const subscriptionId = data.id;
      const { data: row } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();
      const userId = row?.user_id;
      if (!userId) {
        return `customer.subscription.updated: no subscription row for ${subscriptionId}`;
      }
      await updateSubscriptionFromStripe(supabase, {
        userId,
        customerId,
        subscriptionId,
        status: data.status,
        planType: 'subscription',
        priceId: data.items.data[0]?.price?.id ?? undefined,
        currentPeriodEnd: data.current_period_end
          ? new Date(data.current_period_end * 1000).toISOString()
          : null,
      });
      return `customer.subscription.updated: ${data.status} for ${userId}`;
    }

    case 'customer.subscription.deleted': {
      const subscriptionId = data.id;
      const { data: row } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();
      const userId = row?.user_id;
      if (!userId) {
        return `customer.subscription.deleted: no subscription row for ${subscriptionId}`;
      }
      await updateSubscriptionFromStripe(supabase, {
        userId,
        customerId: data.customer,
        subscriptionId,
        status: 'canceled',
        planType: 'subscription',
      });
      return `customer.subscription.deleted: canceled for ${userId}`;
    }

    case 'invoice.payment_succeeded': {
      const subscriptionId = data.subscription;
      if (!subscriptionId) {
        return 'invoice.payment_succeeded: no subscription';
      }
      const { data: row } = await supabase
        .from('subscriptions')
        .select('user_id, stripe_customer_id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();
      const userId = row?.user_id;
      const customerId = row?.stripe_customer_id;
      if (!userId || !customerId) {
        return `invoice.payment_succeeded: no subscription row for ${subscriptionId}`;
      }
      await updateSubscriptionFromStripe(supabase, {
        userId,
        customerId,
        subscriptionId,
        status: 'active',
        planType: 'subscription',
        currentPeriodEnd: data.period_end
          ? new Date(data.period_end * 1000).toISOString()
          : null,
      });
      return `invoice.payment_succeeded: reactivated ${userId}`;
    }

    case 'invoice.payment_failed': {
      const subscriptionId = data.subscription;
      if (!subscriptionId) {
        return 'invoice.payment_failed: no subscription';
      }
      const { data: row } = await supabase
        .from('subscriptions')
        .select('user_id, stripe_customer_id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();
      const userId = row?.user_id;
      const customerId = row?.stripe_customer_id;
      if (!userId || !customerId) {
        return `invoice.payment_failed: no subscription row for ${subscriptionId}`;
      }
      await updateSubscriptionFromStripe(supabase, {
        userId,
        customerId,
        subscriptionId,
        status: 'past_due',
        planType: 'subscription',
      });
      return `invoice.payment_failed: past_due for ${userId}`;
    }

    default:
      return `unhandled event type ${eventType}`;
  }
}

export default async function handler(
  req: any,
  res: any
): Promise<NormalizedResponse | void> {
  const request = await normalizeRequest(req);
  const { method, headers } = request;

  if (method === 'OPTIONS') {
    const response = jsonResponse(204, {});
    sendResponse(res, response);
    return response;
  }

  if (method !== 'POST') {
    const response = jsonResponse(405, { error: 'Method not allowed. Use POST.' });
    sendResponse(res, response);
    return response;
  }

  // --- Configuration check ------------------------------------------------
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    const response = jsonResponse(500, {
      error: 'Stripe is not configured on the server.',
    });
    sendResponse(res, response);
    return response;
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

  const signature = headers['stripe-signature'] || headers['Stripe-Signature'];

  // --- Verify Stripe signature --------------------------------------------
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(request.rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const response = jsonResponse(400, {
      error: `Webhook signature verification failed: ${err instanceof Error ? err.message : 'invalid signature'}`,
    });
    sendResponse(res, response);
    return response;
  }

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    const response = jsonResponse(500, {
      error: 'Server not configured for Supabase.',
    });
    sendResponse(res, response);
    return response;
  }

  // --- Idempotency: skip already-processed events -------------------------
  const eventId = event.id;
  const alreadyProcessed = await isEventProcessed(supabase, eventId);
  if (alreadyProcessed) {
    const response = jsonResponse(200, { status: 'already processed', event_id: eventId });
    sendResponse(res, response);
    return response;
  }

  // --- Process the event --------------------------------------------------
  let result = '';
  try {
    result = await processEvent(supabase, event, stripe);
  } catch (err) {
    const response = jsonResponse(500, {
      error: `Webhook processing failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
    sendResponse(res, response);
    return response;
  }

  // Record the event as processed (idempotency key).
  const recorded = await recordProcessedEvent(supabase, eventId, event.type);
  if (!recorded) {
    // Another worker already recorded it between our check and insert.
    const response = jsonResponse(200, { status: 'already processed', event_id: eventId });
    sendResponse(res, response);
    return response;
  }

  const response = jsonResponse(200, { status: 'processed', event_id: eventId, detail: result });
  sendResponse(res, response);
  return response;
}
