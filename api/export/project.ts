/**
 * api/export/project.ts
 *
 * GET /api/export/project?templateId=<uuid>
 * Headers: Authorization: Bearer <supabase-access-token>
 *
 * Authenticated + entitled users can download their generated template as a
 * full, runnable Angular project ZIP.
 *
 * ZIP contents:
 *   - package.json        Angular 22 dependencies
 *   - angular.json        Angular CLI workspace config
 *   - tsconfig.json       TypeScript config
 *   - src/main.ts         bootstraps the standalone AppComponent
 *   - src/app/app.component.ts  the generated standalone component (root)
 *   - src/app/app.config.ts     app config (providers)
 *   - src/styles.css      Bootstrap 5 CSS
 *   - README.md           npm install + ng serve instructions
 *
 * The generated component is placed as src/app/app.component.ts with a
 * `selector: 'app-root'` so it bootstraps as the root component.
 *
 * Server-side only: entitlement verified here; never trusts frontend flags.
 */

import archiver from 'archiver';
import { createClient } from '@supabase/supabase-js';
import { verifyServerUser } from '../../../lib/supabase-server';
import { checkEntitlement } from '../../../lib/entitlement';

interface NormalizedRequest {
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(statusCode: number, body: unknown): any {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
    body: JSON.stringify(body),
  };
}

function sendResponse(res: any, response: any): void {
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
  const query: Record<string, string> = {};

  if (req && req.method) {
    method = String(req.method || 'GET');
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        query[key] = String(value);
      }
    }
  } else if (req && req.httpMethod) {
    method = String(req.httpMethod || 'GET');
    const qs = req.queryStringParameters || {};
    for (const [key, value] of Object.entries(qs)) {
      query[key] = String(value);
    }
  }

  return { method, headers, query };
}

/** Ensure the generated component bootstraps as the app root. */
function ensureRootComponent(code: string): string {
  if (/selector\s*:/.test(code)) {
    return code;
  }
  return code.replace(/@Component\s*\(/, "@Component({\n  selector: 'app-root',");
}

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: 'ai-template-export',
      version: '1.0.0',
      description: 'Exported Angular template from AI Template Generator',
      private: true,
      dependencies: {
        '@angular/common': '^22.3.0',
        '@angular/compiler': '^22.3.0',
        '@angular/core': '^22.3.0',
        '@angular/forms': '^22.3.0',
        '@angular/platform-browser': '^22.3.0',
        '@angular/platform-browser-dynamic': '^22.3.0',
        '@angular/router': '^22.3.0',
        bootstrap: '^5.3.9',
        rxjs: '~7.8.0',
        'zone.js': '~0.15.0',
      },
      devDependencies: {
        '@angular/build': '^22.3.0',
        '@angular/cli': '^22.3.0',
        '@angular/compiler-cli': '^22.3.0',
        typescript: '~6.0.2',
      },
    },
    null,
    2
  );
}

function buildAngularJson(): string {
  return JSON.stringify(
    {
      version: 1,
      defaultProject: 'ai-template-export',
      projects: {
        'ai-template-export': {
          root: '',
          sourceRoot: 'src',
          projectType: 'application',
          prefix: 'app',
          architect: {
            build: {
              builder: '@angular/build:browser',
              options: {
                outputPath: 'dist/ai-template-export',
                index: 'src/index.html',
                main: 'src/main.ts',
                styles: ['src/styles.css'],
                scripts: [],
              },
            },
            serve: {
              builder: '@angular/build:dev-server',
              options: { buildTarget: 'ai-template-export:build' },
            },
          },
        },
      },
    },
    null,
    2
  );
}

function buildTsconfigJson(): string {
  return JSON.stringify(
    {
      compileOnSave: false,
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        lib: ['ES2022', 'DOM'],
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noEmitOverride: true,
        noEmit: true,
      },
      files: ['src/main.ts'],
      include: ['src/**/*.ts'],
      exclude: ['node_modules'],
    },
    null,
    2
  );
}

function buildMainTs(): string {
  return `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
`;
}

function buildAppConfigTs(): string {
  return `import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter([]),
  ],
};
`;
}

function buildStylesCss(): string {
  return `@import 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';

body {
  margin: 0;
  background: #f8f9fa;
}
`;
}

function buildReadme(template: any): string {
  return `# Exported Angular Template

## Title
${template.title || 'Untitled'}

## Description
${template.description || 'No description provided.'}

## Exported
${new Date().toISOString()}

## Template ID
${template.id || 'unknown'}

## Getting Started

This is a standalone Angular 22 project containing your generated template
as the root component (src/app/app.component.ts).

### Install dependencies

\`\`\`bash
npm install
\`\`\`

### Run the development server

\`\`\`bash
npx ng serve
\`\`\`

Then open http://localhost:4200

## Structure

- package.json — Angular 22 dependencies
- angular.json — Angular CLI workspace configuration
- tsconfig.json — TypeScript configuration
- src/main.ts — bootstraps the standalone AppComponent
- src/app/app.component.ts — your generated component (root)
- src/app/app.config.ts — application providers
- src/styles.css — Bootstrap 5 styles

Generated by the AI Template Generator.
`;
}

function buildIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Exported Template</title>
</head>
<body>
  <app-root></app-root>
</body>
</html>`;
}

export default async function handler(
  req: any,
  res: any
): Promise<any> {
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

  // --- Auth ----------------------------------------------------------------
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

  // --- Entitlement (server-side source of truth) ---------------------------
  const entitled = await checkEntitlement(userId);
  if (!entitled.entitled) {
    const response = jsonResponse(403, {
      error: 'Paywall: project export is a paid feature. Upgrade to download.',
      reason: entitled.reason,
      upgrade_url: '/pricing',
    });
    sendResponse(res, response);
    return response;
  }

  // --- Fetch the template (RLS enforces user ownership) -------------------
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

  if (template.user_id !== userId) {
    const response = jsonResponse(403, { error: 'You do not own this template.' });
    sendResponse(res, response);
    return response;
  }

  // --- Build the Angular project ZIP ---------------------------------------
  const appComponentTs = ensureRootComponent(template.generated_code || '');

  const zip = archiver('zip', { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  zip.on('data', (chunk: Buffer) => chunks.push(chunk));

  zip.append(buildPackageJson(), { name: 'package.json' });
  zip.append(buildAngularJson(), { name: 'angular.json' });
  zip.append(buildTsconfigJson(), { name: 'tsconfig.json' });
  zip.append(buildIndexHtml(), { name: 'src/index.html' });
  zip.append(buildMainTs(), { name: 'src/main.ts' });
  zip.append(appComponentTs, { name: 'src/app/app.component.ts' });
  zip.append(buildAppConfigTs(), { name: 'src/app/app.config.ts' });
  zip.append(buildStylesCss(), { name: 'src/styles.css' });
  zip.append(buildReadme(template), { name: 'README.md' });

  zip.finalize();

  try {
    await new Promise<void>((resolve, reject) => {
      zip.on('end', resolve);
      zip.on('error', reject);
    });
  } catch (err) {
    const response = jsonResponse(500, {
      error: 'Unable to build the project archive. Please try again later.',
    });
    sendResponse(res, response);
    return response;
  }

  const buffer = Buffer.concat(chunks);
  const fileName = `${(template.title || 'angular-project')
    .replace(/[^a-z0-9]+/gi, '_')
    .toLowerCase()}.zip`;

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
