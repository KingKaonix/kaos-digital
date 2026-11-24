/**
 * api/stripe/checkout.ts
 *
 * POST /api/stripe/checkout
 * Body: { priceId: string, type: 'subscription' | 'export' }
 * Headers: Authorization: Bearer <supabase-access-token>
 *
 * Creates a Stripe Checkout Session server-side (subscription or one-time
 * payment). Returns { sessionId, url } so the frontend can redirect the
 * customer to Stripe's secure checkout page (card entry happens on Stripe,
 * never on our server).
 *
 * After a successful checkout, Stripe fires checkout.session.completed which
 * our webhook (/api/stripe/webhook) handles by activating the subscription in
 * Supabase. The frontend then re-checks entitlement and export unlocks.
 *
 * Server-side only: STRIPE_SECRET_KEY is never exposed to the frontend.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getOrCreateCustomer } from '../../../lib/stripe';

interface NormalizedRequest {
  method: string;
  headers: Record<string, string>;
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

async function normalizeRequest(req: any): Promise<NormalizedRequest> {
  let method = 'POST';
  const headers: Record<string, string> = req.headers || {};
  let body: any = {};

  if (req && req.method) {
    method = String(req.method || 'POST');
    body = req.body || {};
  } else if (req && req.httpMethod) {
    method = String(req.httpMethod || 'POST');
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      body = {};
    }
  }

  return { method, headers, body };
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

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

  if (!STRIPE_SECRET_KEY) {
    const response = jsonResponse(500, {
      error: 'Payments are not configured on the server.',
    });
    sendResponse(res, response);
    return response;
  }

  // --- Auth ----------------------------------------------------------------
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response = jsonResponse(401, { error: 'Authentication required.' });
    sendResponse(res, response);
    return response;
  }

  const accessToken = authHeader.slice(7);
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  let userEmail = '';
  let userId = '';

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      const response = jsonResponse(401, { error: 'Invalid or expired session.' });
      sendResponse(res, response);
      return response;
    }
    userId = data.user.id;
    userEmail = data.user.email ?? '';
  } else {
    const response = jsonResponse(500, { error: 'Server not configured for Supabase.' });
    sendResponse(res, response);
    return response;
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

  // --- Parse body ----------------------------------------------------------
  const { priceId, type = 'export' } = request.body || {};
  if (!priceId) {
    const response = jsonResponse(400, { error: 'priceId is required.' });
    sendResponse(res, response);
    return response;
  }

  const isSubscription = type === 'subscription';
  const mode = isSubscription ? 'subscription' : 'payment';

  // --- Get or create Stripe customer ---------------------------------------
  const customer = await getOrCreateCustomer({ userId, email: userEmail });
  if ('error' in customer) {
    const response = jsonResponse(500, { error: customer.error });
    sendResponse(res, response);
    return response;
  }

  // --- Build success / cancel URLs -----------------------------------------
  const origin = headers.origin || headers['x-forwarded-host'];
  const base = origin ? (origin.startsWith('http') ? origin : `https://${origin}`) : '';
  const successUrl = `${base}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`.replace(/\/$/, '/');
  const cancelUrl = `${base}/pricing?canceled=1`.replace(/\/$/, '/');

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customer.customerId,
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: userId,
        type: isSubscription ? 'subscription' : 'export',
      },
      customer_email: userEmail || undefined,
      allow_promotion_codes: true,
    });

    const response = jsonResponse(200, {
      sessionId: session.id,
      url: session.url,
    });
    sendResponse(res, response);
    return response;
  } catch (err) {
    const response = jsonResponse(500, {
      error:
        err instanceof Error
          ? err.message
          : 'Unable to start checkout. Please try again later.',
    });
    sendResponse(res, response);
    return response;
  }
}
