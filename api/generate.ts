/**
 * api/generate.ts
 *
 * Serverless function that generates Angular + Bootstrap 5 code from a
 * natural-language description using NVIDIA NIM (Nemotron).
 *
 * Compatible with Vercel (Node.js runtime) and Netlify (Node.js runtime).
 *
 * Security:
 *  - NVIDIA_NIM_API_KEY is read ONLY from server-side environment. Never
 *    exposed to the client.
 *  - Only authenticated users (valid Supabase session) may call this
 *    endpoint. The client must send `Authorization: Bearer <access-token>`.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** NVIDIA NIM REST API endpoint (chat completions). */
const NIM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

/**
 * Nemotron model ID. Confirm the latest model ID at build.nvidia.com.
 * MVP default: nemotron-4-340b-instruct (strong code-generation model).
 */
const NEMOTRON_MODEL = 'nvidia/nemotron-4-340b-instruct';

/** Server-side only. Never shipped to the client bundle. */
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY || '';

/** Supabase config (anon key is public; URL + key read server-side here). */
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GenerateRequest {
  description: string;
}

interface GenerateResponse {
  code: string;
  error?: string;
}

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  // Vercel Node.js runtime: res is a ServerResponse with .status/.json helpers
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(response.statusCode).json(JSON.parse(response.body));
    return;
  }
  // Raw Node.js ServerResponse
  if (res && typeof res.writeHead === 'function') {
    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
    return;
  }
  // Netlify runtime: return the response object
  if (res === undefined || typeof res === 'object') {
    // Handled by caller returning the object
    return;
  }
}

/** Read raw body from a Node.js IncomingMessage stream when req.body is absent. */
function readRawBody(req: any): Promise<any> {
  if (req.body) {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(buffer ? JSON.parse(buffer) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

/** Normalize Vercel (req/res) and Netlify (event/context) into one shape. */
async function normalizeRequest(req: any, res: any): Promise<NormalizedRequest> {
  let method: string;
  let headers: Record<string, string> = {};
  let body: any = {};

  if (req && req.method) {
    // Vercel Node.js function: req is IncomingMessage-like
    method = String(req.method || 'GET');
    headers = req.headers || {};
    body = await readRawBody(req);
  } else if (req && req.httpMethod) {
    // Netlify function: req is the event object
    method = String(req.httpMethod || 'GET');
    headers = req.headers || {};
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      body = {};
    }
  } else {
    method = 'GET';
  }

  return { method, headers, body };
}

/** Build a Supabase client scoped to the caller's access token for auth checks. */
function supabaseClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Verify the caller is authenticated by exchanging their Supabase access
 * token for a user record. Returns the user or null.
 */
async function verifyAuth(authorizationHeader: string | undefined): Promise<{ user: any; error: string | null }> {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }

  const accessToken = authorizationHeader.slice(7);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { user: null, error: 'Server not configured for authentication' };
  }

  try {
    const supabase = supabaseClient(accessToken);
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user ?? null, error: null };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : 'Authentication check failed' };
  }
}

/**
 * System prompt that constrains Nemotron to emit valid Angular standalone
 * components styled with Bootstrap 5.3 and no external dependencies.
 */
function systemPrompt(): string {
  return `You are an expert Angular developer. Generate a complete, production-ready
Angular STANDALONE component from the user's description.

STRICT REQUIREMENTS:
1. Output Angular 17+ standalone components only (@Component with standalone: true).
2. Use ONLY Bootstrap 5.3 CSS classes for styling (container, row, col-*, btn, card, alert, etc.).
3. No external dependencies, no custom CSS files, no images, no fonts beyond Bootstrap CDN.
4. Do NOT use NgModules, @NgModule, or module-based architecture.
5. Do NOT use Angular signals unless wrapped in standalone component context.
6. Return a single TypeScript code block containing the component class.
7. Do not include any explanation, markdown fences outside the code block, or conversational text.
8. If the description is vague, produce a sensible, clean template anyway.

The output must contain exactly one fenced TypeScript code block with the
standalone Angular component.`;
}

/**
 * Extract the first fenced code block from the model's response.
 * Returns null if no code block is found.
 */
function extractCodeBlock(text: string): string | null {
  const fenceMatch = text.match(/```(?:typescript|ts|angular|html)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  // Fallback: look for any fenced block
  const anyFence = text.match(/```\s*\n([\s\S]*?)\n```/);
  if (anyFence) {
    return anyFence[1].trim();
  }
  return null;
}

/** Basic sanity check: the generated code looks like an Angular component. */
function isValidAngularCode(code: string): boolean {
  if (!code || code.length < 10) {
    return false;
  }
  const lower = code.toLowerCase();
  return (
    lower.includes('@component') ||
    lower.includes('standalone') ||
    lower.includes('<') ||
    lower.includes('template')
  );
}

/**
 * Call NVIDIA NIM chat completions API with exponential backoff retry.
 * Returns { code } or { error }.
 */
async function callNemotron(description: string): Promise<GenerateResponse> {
  if (!NVIDIA_NIM_API_KEY) {
    return { error: 'Generation service is not configured (missing NVIDIA_NIM_API_KEY).' };
  }

  const maxAttempts = 3;
  const baseDelayMs = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(NIM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_NIM_API_KEY}`,
        },
        body: JSON.stringify({
          model: NEMOTRON_MODEL,
          messages: [
            { role: 'system', content: systemPrompt() },
            { role: 'user', content: description },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const status = response.status;
        // Retry on transient server errors (5xx) and rate limiting (429)
        const retryable = status === 429 || (status >= 500 && status < 600);
        if (retryable && attempt < maxAttempts) {
          await sleep(baseDelayMs * Math.pow(2, attempt - 1));
          continue;
        }
        const errorText = await response.text().catch(() => '');
        return { error: `Nemotron API error (${status}): ${errorText.slice(0, 200)}` };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';
      const code = extractCodeBlock(content);

      if (!code || !isValidAngularCode(code)) {
        return { error: 'Nemotron did not return valid Angular code. Please try again.' };
      }

      return { code };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort || (attempt < maxAttempts)) {
        await sleep(baseDelayMs * Math.pow(2, attempt - 1));
        continue;
      }
      return {
        error: err instanceof Error ? err.message : 'Generation failed unexpectedly.',
      };
    }
  }

  return { error: 'Generation service temporarily unavailable. Please try again later.' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * POST /api/generate
 * Body: { description: string }
 * Headers: Authorization: Bearer <supabase-access-token>
 *
 * Returns: { code: string } on success, { error: string } on failure.
 */
export default async function handler(req: any, res: any): Promise<NormalizedResponse | void> {
  // Normalize request across Vercel / Netlify
  const request = await normalizeRequest(req, res);
  const { method, headers } = request;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    const response = jsonResponse(204, {});
    sendResponse(res, response);
    return response;
  }

  // Only POST is allowed
  if (method !== 'POST') {
    const response = jsonResponse(405, { error: 'Method not allowed. Use POST.' });
    sendResponse(res, response);
    return response;
  }

  // --- Auth check ----------------------------------------------------------
  const authHeader = headers.authorization || headers.Authorization;
  const auth = await verifyAuth(authHeader);
  if (!auth.user || auth.error) {
    const response = jsonResponse(401, { error: 'Authentication required to generate templates.' });
    sendResponse(res, response);
    return response;
  }

  // --- Parse body ----------------------------------------------------------
  const body = (request.body as GenerateRequest) || {};
  const { description } = body;

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    const response = jsonResponse(400, { error: 'Please provide a description of the template you want to generate.' });
    sendResponse(res, response);
    return response;
  }

  // --- Call Nemotron -------------------------------------------------------
  const result = await callNemotron(description.trim());

  if (result.error) {
    const response = jsonResponse(200, { code: '', error: result.error });
    sendResponse(res, response);
    return response;
  }

  const response = jsonResponse(200, { code: result.code });
  sendResponse(res, response);
  return response;
}
