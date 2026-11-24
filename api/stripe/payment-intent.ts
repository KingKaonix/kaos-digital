/**
 * api/stripe/payment-intent.ts
 *
 * POST /api/stripe/payment-intent
 * Body: { priceId: string }
 * Headers: Authorization: Bearer <supabase-access-token>
 *
 * Creates a Stripe PaymentIntent server-side (one-time payment, e.g. the
 * one-time export tier). Returns { clientSecret } so the frontend can confirm
 * the payment with Stripe Elements (embedded card form — card data never
 * touches our server).
 *
 * After a successful payment, Stripe fires checkout.session.completed only for
 * Checkout; for PaymentIntent we rely on the frontend confirming and then
 * re-checking entitlement. The webhook also handles invoice.payment_succeeded
 * if a subscription is involved.
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
  const { priceId } = request.body || {};
  if (!priceId) {
    const response = jsonResponse(400, { error: 'priceId is required.' });
    sendResponse(res, response);
    return response;
  }

  // --- Resolve the price to know the amount/currency -----------------------
  let amount = 0;
  let currency = 'usd';
  try {
    const price = await stripe.prices.retrieve(priceId);
    amount = price.unit_amount ?? 0;
    currency = price.currency ?? 'usd';
  } catch {
    // If the price cannot be retrieved, fall back to the placeholder so the
    // flow still surfaces a friendly error on confirm rather than crashing.
    amount = 0;
  }

  // --- Get or create Stripe customer ---------------------------------------
  const customer = await getOrCreateCustomer({ userId, email: userEmail });
  if ('error' in customer) {
    const response = jsonResponse(500, { error: customer.error });
    sendResponse(res, response);
    return response;
  }

  // --- Create the PaymentIntent --------------------------------------------
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customer.customerId,
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        supabase_user_id: userId,
        price_id: priceId,
        type: 'export',
      },
    });

    const response = jsonResponse(200, {
      clientSecret: paymentIntent.client_secret,
    });
    sendResponse(res, response);
    return response;
  } catch (err) {
    const response = jsonResponse(500, {
      error:
        err instanceof Error
          ? err.message
          : 'Unable to create payment intent. Please try again later.',
    });
    sendResponse(res, response);
    return response;
  }
}
