/**
 * api/export/zip.ts
 *
 * GET /api/export/zip?templateId=<uuid>
 * Headers: Authorization: Bearer <supabase-access-token>
 *
 * Authenticated + entitled users can download their generated template as a ZIP.
 * Free users receive 403 with a paywall message.
 *
 * ZIP contents:
 *   - index.html      self-contained preview of the generated template
 *   - README.txt      human-readable description + export info
 *   - metadata.json   template metadata (id, title, description, dates)
 *
 * Server-side only: entitlement is verified via /api/entitlement logic here.
 * Built with archiver (already a project dependency).
 */

import archiver from 'archiver';
import { createClient } from '@supabase/supabase-js';
import { verifyServerUser } from '../../../lib/supabase-server';
import { checkEntitlement } from '../../../lib/entitlement';

interface NormalizedRequest {
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
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

/** Build a self-contained HTML preview of the generated component template. */
function buildIndexHtml(template: any): string {
  const escaped = (template.generated_code || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const title = template.title || 'Generated Template';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
  <style>body { margin: 0; background: #f8f9fa; } #root { min-height: 100vh; overflow: auto; }</style>
</head>
<body>
  <div id="root" class="p-3 p-md-4 container">
    ${template.generated_code ? '' : '<div class="text-center text-muted py-5"><p>No template content available.</p></div>'}
    <!-- The generated Angular component source (for reference): -->
    <script type="text/plain" id="generated-component">
${escaped}
    </script>
  </div>
</body>
</html>`;
}

function buildReadme(template: any): string {
  return `AI Template Generator - Export
==============================

Title: ${template.title || 'Untitled'}
Description: ${template.description || 'No description provided.'}
Exported: ${new Date().toISOString()}
Template ID: ${template.id || 'unknown'}

This ZIP contains a self-contained preview of your generated Angular +
Bootstrap 5 template (index.html) plus the raw generated component source
(embedded in index.html for reference).

To use the generated code locally:
1. Create a new Angular project: ng new my-template
2. Copy the generated component source into src/app/
3. Run: ng serve

Generated with the AI Template Generator.
`;
}

function buildMetadata(template: any): string {
  return JSON.stringify(
    {
      id: template.id,
      title: template.title,
      description: template.description,
      created_at: template.created_at,
      updated_at: template.updated_at,
      exported_at: new Date().toISOString(),
      source: 'ai-template-generator',
    },
    null,
    2
  );
}

async function normalizeRequest(req: any): Promise<NormalizedRequest> {
  let method = 'GET';
  const headers: Record<string, string> = req.headers || {};
  const query: Record<string, string> = {};
  let body: any = {};

  if (req && req.method) {
    method = String(req.method || 'GET');
    // Vercel: req.query is already parsed
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        query[key] = String(value);
      }
    }
    body = req.body || {};
  } else if (req && req.httpMethod) {
    method = String(req.httpMethod || 'GET');
    // Netlify: parse query string
    const qs = req.queryStringParameters || {};
    for (const [key, value] of Object.entries(qs)) {
      query[key] = String(value);
    }
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      body = {};
    }
  }

  return { method, headers, query, body };
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

  const templateId = request.query.templateId;
  if (!templateId) {
    const response = jsonResponse(400, { error: 'templateId is required.' });
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
  const entitled = await checkEntitlement(userId);
  if (!entitled.entitled) {
    const response = jsonResponse(403, {
      error: 'Paywall: export is a paid feature. Upgrade to download your template.',
      reason: entitled.reason,
      upgrade_url: '/pricing',
    });
    sendResponse(res, response);
    return response;
  }

  // --- Fetch the template (RLS enforces user ownership) ------------------
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  let supabase: any = null;
  if (supabaseUrl && serviceRoleKey) {
    supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  if (!supabase) {
    const response = jsonResponse(500, { error: 'Server not configured for Supabase.' });
    sendResponse(res, response);
    return response;
  }

  const { data: template, error } = await supabase
    .from('templates')
    .select('id, user_id, title, description, generated_code, created_at, updated_at')
    .eq('id', templateId)
    .maybeSingle();

  if (error || !template) {
    const response = jsonResponse(404, { error: 'Template not found.' });
    sendResponse(res, response);
    return response;
  }

  // Verify ownership (defence in depth; RLS already enforces this).
  if (template.user_id !== userId) {
    const response = jsonResponse(403, { error: 'You do not own this template.' });
    sendResponse(res, response);
    return response;
  }

  // --- Build the ZIP ------------------------------------------------------
  const zip = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  zip.on('data', (chunk: Buffer) => chunks.push(chunk));

  zip.append(buildIndexHtml(template), { name: 'index.html' });
  zip.append(buildReadme(template), { name: 'README.txt' });
  zip.append(buildMetadata(template), { name: 'metadata.json' });

  zip.finalize();

  try {
    await new Promise<void>((resolve, reject) => {
      zip.on('end', resolve);
      zip.on('error', reject);
    });
  } catch (err) {
    const response = jsonResponse(500, {
      error: 'Unable to build the export archive. Please try again later.',
    });
    sendResponse(res, response);
    return response;
  }

  const buffer = Buffer.concat(chunks);
  const fileName = `${(template.title || 'template').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.zip`;

  if (res && typeof res.writeHead === 'function') {
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(buffer.length),
      ...corsHeaders(),
    });
    res.end(buffer);
    return;
  }

  // Netlify: return a raw response object
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(buffer.length),
      ...corsHeaders(),
    },
    body: buffer.toString('base64'),
    isBase64Encoded: true,
  };
}
