/**
 * api/entitlement.ts
 *
 * GET /api/entitlement
 * Headers: Authorization: Bearer <supabase-access-token>
 *
 * Returns { entitled: boolean, reason?: string }.
 *
 * This is the server-side source of truth for paywall gating. Frontend UI may
 * show entitlement as a UX hint, but export endpoints always re-verify here
 * and never trust a frontend isPaid flag.
 */

import { verifyServerUser } from '../../../lib/supabase-server';
import { checkEntitlement } from '../../../lib/entitlement';

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  let method = 'GET';
  const headers: Record<string, string> = req.headers || {};
  let body: any = {};

  if (req && req.method) {
    method = String(req.method || 'GET');
    if (req.body) {
      body = req.body;
    }
  } else if (req && req.httpMethod) {
    method = String(req.httpMethod || 'GET');
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      body = {};
    }
  }

  return { method, headers, body };
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

  if (method !== 'GET') {
    const response = jsonResponse(405, { error: 'Method not allowed. Use GET.' });
    sendResponse(res, response);
    return response;
  }

  // --- Auth: verify the caller's Supabase access token --------------------
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response = jsonResponse(401, { error: 'Authentication required.' });
    sendResponse(res, response);
    return response;
  }

  const accessToken = authHeader.slice(7);
  const auth = await verifyServerUser(accessToken);
  if (!auth.user || auth.error) {
    const response = jsonResponse(401, { error: 'Invalid or expired session.' });
    sendResponse(res, response);
    return response;
  }

  const userId = auth.user.id;

  // --- Entitlement check (server-side source of truth) --------------------
  const entitlement = await checkEntitlement(userId);

  const response = jsonResponse(200, {
    entitled: entitlement.entitled,
    reason: entitlement.reason,
    user_id: userId,
  });
  sendResponse(res, response);
  return response;
}
