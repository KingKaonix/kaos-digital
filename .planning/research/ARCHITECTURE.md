# Architecture Research

**Domain:** AI-enabled website generator (Angular + Bootstrap 5 template generation)
**Researched:** 2026
**Confidence:** MEDIUM (Stripe/Supabase patterns verified via official docs; overall AI-website-generator topology grounded in established SaaS + AI-code-generation patterns, not live-verified for this exact niche)

## Standard Architecture

An AI website generator is fundamentally a **request→generate→preview→save→(paywalled) export** pipeline. The generator itself is an Angular + Bootstrap 5 application that *also* produces Angular + Bootstrap 5 code, so the frontend and the generated output share the same stack.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Angular SPA)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  Prompt UI  │  │  Previewer  │  │ Template    │  │   Export UI     │   │
│  │  (describe) │  │  (iframe)   │  │ Editor/List │  │  (paywall-gated)│   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────────┘   │
│         │                │                │                │              │
├─────────┼────────────────┼────────────────┼────────────────┼──────────────┤
│                         API GATEWAY (serverless functions)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ Generation   │  │ Template     │  │ Auth/Sessions│  │ Entitlement   │   │
│  │ Orchestrator │  │ Service      │  │ (Supabase)   │  │ Check (Stripe)│   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘   │
│         │                 │                 │                 │            │
├─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┤
│                         INTEGRATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │  Nemotron    │  │ Supabase     │  │ Stripe       │  │ ZIP/Packager  │   │
│  │ (AI codegen) │  │ (auth+store) │  │ (payments)   │  │ (export build)│   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Prompt UI | Accepts natural-language template description; validates input length/format; forwards to Generation Orchestrator | Angular reactive form + Bootstrap 5 |
| Previewer | Renders generated Angular + Bootstrap 5 markup in an isolated iframe/sandbox so the user can inspect before saving | `<iframe>` with sanitized HTML + inline styles; Angular `DomSanitizer` bypass only for trusted generated output |
| Template Editor/List | Lists user's saved templates, lets user edit the description and regenerate, opens saved template in Previewer | Angular components + Supabase queries |
| Export UI | Triggers ZIP/download or deployable-code export; gated by entitlement check; shows upsell to free users | Angular component calling Entitlement Check then Export endpoint |
| Generation Orchestrator | Receives prompt, builds the Nemotron system+user prompt, calls Nemotron, validates/sanitizes output, returns Angular+Bootstrap code | Serverless function (Vercel/Netlify) or thin backend |
| Template Service | CRUD for saved templates, versions, ownership (user_id), last-generated code | Supabase (Postgres) with Row Level Security |
| Auth/Sessions | Sign up, login, logout, session management, current-user resolution | Supabase Auth (email/password) |
| Entitlement Check | Determines whether the current user may export (free = preview only; paid = ZIP/deployable code) | Stripe subscription lookup + cached entitlement flag in Supabase |
| Nemotron | NVIDIA Nemotron LLM: converts natural language into Angular component + Bootstrap 5 markup | NVIDIA NIM / build.nvidia.com API (HTTP) |
| ZIP/Packager | Bundles generated files (component, module, routes, styles) into a downloadable ZIP or scaffolded Angular project | Server-side zip (e.g., archiver) or client-side JSZip after entitlement pass |
| Supabase (store) | Source of truth: users, templates, template versions, subscription/entitlement cache | Supabase Postgres + Auth |
| Stripe | Subscription creation, checkout sessions, customer portal, webhooks for subscription state | Stripe SDK + webhook endpoints |

## Recommended Project Structure

Because the generator and its output are both Angular + Bootstrap 5, keep the generator app and the generated-template scaffold clearly separated.

```
ai-template-generator/
├── .planning/              # GSD planning artifacts (research, roadmap, phases)
├── src/
│   ├── app/
│   │   ├── core/           # Singletons: auth guard, supabase client, stripe client, API config
│   │   │   ├── auth.service.ts
│   │   │   ├── supabase.service.ts
│   │   │   └── stripe.service.ts
│   │   ├── shared/         # Reusable UI: buttons, inputs, layout, Bootstrap 5 wrappers
│   │   ├── features/
│   │   │   ├── generate/   # Prompt UI, generation request, result display
│   │   │   │   ├── prompt-form.component.ts
│   │   │   │   └── generate.service.ts   # calls Generation Orchestrator endpoint
│   │   │   ├── preview/    # Previewer (iframe/sandbox) + sanitization
│   │   │   │   └── preview.component.ts
│   │   │   ├── templates/  # Saved-template list + editor + regenerate
│   │   │   │   ├── template-list.component.ts
│   │   │   │   └── template-editor.component.ts
│   │   │   └── export/     # Export UI, paywall upsell, download trigger
│   │   │       └── export.service.ts     # entitlement check + download
│   │   └── app.component.ts / app.routes.ts / app.config.ts
│   ├── assets/             # Bootstrap 5 CSS (via CDN or npm), icons
│   └── environments/       # dev/prod: Supabase URL+anon key, Stripe public key, Nemotron endpoint
├── functions/              # Serverless functions (Vercel / Netlify)
│   ├── generate.ts         # Generation Orchestrator → Nemotron
│   ├── export.ts           # ZIP/packager (paid gate)
│   ├── stripe-webhook.ts   # Subscription state → Supabase entitlement cache
│   └── entitlement.ts      # Entitlement check for export gating
├── supabase/               # Migrations (auth, templates, versions, entitlements)
│   └── migrations/
├── .env.example
├── angular.json
├── package.json
└── README.md
```

### Structure Rationale

- **`src/app/core/`:** Singleton services (auth, Supabase, Stripe) injected once; keeps API keys and clients out of feature components.
- **`src/app/features/`:** Feature-based folders keep generation, preview, templates, and export cohesive — matches the vertical slice nature of the product.
- **`functions/`:** Serverless functions match the Vercel/Netlify deployment target and keep AI/Stripe/Supabase secrets off the client.
- **`supabase/migrations/`:** Version-controlled schema; RLS policies live here so user-owned data isolation is codified from day one.

## Architectural Patterns

### Pattern 1: Backend-for-Frontend (BFF) via Serverless Functions

**What:** The Angular frontend never calls Nemotron, Stripe, or Supabase directly with secret keys. It calls project-owned serverless functions (`/api/generate`, `/api/export`, `/api/entitlement`), which hold the secret keys and orchestrate the external services.

**When to use:** Always — secret keys (Nemotron API key, Stripe secret key, Supabase service role) must never ship to the browser.

**Trade-offs:**
- + Secrets stay server-side; function acts as a single audit/log point.
- + Easy to add rate limiting and input validation before hitting Nemotron (cost control).
- − Cold starts add latency to generation; mitigated by keeping functions warm or using edge runtime.

**Example:**
```typescript
// functions/generate.ts — Generation Orchestrator (Vercel/Netlify serverless)
import { NemotronClient } from '@some/nemotron-sdk';
import { validateAngularOutput } from './lib/validate-output';

export default async function handler(req, res) {
  const { prompt, userId } = req.body;
  if (!prompt || prompt.length > 2000) return res.status(400).json({ error: 'invalid prompt' });

  const systemPrompt = `You generate a single Angular standalone component + Bootstrap 5 markup. Output only valid Angular/HTML/CSS.`;
  const raw = await NemotronClient.chat({ model: 'nemotron', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }] });

  const code = validateAngularOutput(raw); // sanitize, strip fences, verify no <script>
  res.status(200).json({ code, generatedAt: new Date().toISOString() });
}
```

### Pattern 2: Row-Level Security (RLS) for Multi-User Template Isolation

**What:** Every template row carries `user_id` (auth.uid()). Supabase RLS policies ensure a user can only read/write their own templates. The client never enforces ownership — the database does.

**When to use:** Whenever user-owned data is stored (saved templates, versions, entitlement cache). Required because Supabase client is used directly from the browser with the anon key.

**Trade-offs:**
- + Ownership enforced at the data layer, impossible to bypass via client bugs.
- + Simplifies frontend (no ownership checks in every component).
- − Schema and policies must be correct before any data is written; mistakes leak data.

**Example:**
```sql
-- supabase/migrations/XXXX_create_templates.sql
create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  description text not null,
  generated_code text not null,
  version int not null default 1,
  created_at timestamptz default now()
);

alter table templates enable row level security;

create policy "users see own templates"
  on templates for select using (auth.uid() = user_id);
create policy "users insert own templates"
  on templates for insert with check (auth.uid() = user_id);
create policy "users update own templates"
  on templates for update using (auth.uid() = user_id);
```

### Pattern 3: Entitlement-Checked Export (Paywall)

**What:** Export (ZIP / deployable code) is a server-side action guarded by an entitlement check. Free users can generate and preview unlimited templates but receive an upsell when they click export. Paid users (active Stripe subscription) receive the artifact. Stripe webhooks keep a cached `entitlements` row in Supabase so the check doesn't hit Stripe on every click.

**When to use:** For the export paywall — the core monetization boundary in PROJECT.md.

**Trade-offs:**
- + Export cannot be bypassed by client manipulation (gate is server-side).
- + Webhook-cached entitlement is fast and resilient to Stripe latency.
- − Requires keeping Stripe subscription state in sync via webhooks; handle webhook failures/idempotency.

**Example:**
```typescript
// functions/entitlement.ts
export default async function handler(req, res) {
  const { userId } = req.body;
  const { data: ent } = await supabase.from('entitlements').select('can_export').eq('user_id', userId).single();
  res.json({ can_export: ent?.can_export ?? false });
}

// functions/export.ts — only reachable after entitlement pass
export default async function handler(req, res) {
  const { userId, templateId } = req.body;
  const allowed = await checkEntitlement(userId); // server-side
  if (!allowed) return res.status(403).json({ error: 'export requires paid plan' });

  const template = await supabase.from('templates').select('*').eq('id', templateId).single();
  const zip = await packTemplate(template); // build Angular project + zip
  res.setHeader('Content-Type', 'application/zip');
  res.send(zip.buffer);
}
```

## Data Flow

### Request Flow (generation)

```
[User describes template]
       ↓
[Prompt UI (Angular)] ──► [Generation Orchestrator function]
       │                         │
       │                         ▼
       │              [Nemotron: prompt → Angular+Bootstrap 5 code]
       │                         │
       │                         ▼
       │              [validate/sanitize output (no <script>, strip fences)]
       │                         │
       └─────────── [generated code] ◄───────────────────────┘
       ↓
[Previewer (iframe, sandboxed)] ──► [User inspects]
       ↓
[User clicks "Save"]
       ↓
[Template Service → Supabase (user_id, description, generated_code, version)]
       ↓
[Saved to user's template list]
```

### State Management

```
[Supabase client + Auth session]
       ↓ (subscribe to templates table via Realtime or poll)
[Feature components] ←→ [Actions (save/regenerate/export)] → [Supabase / Stripe]
       ↓
[Local UI state: current draft, preview code, isExporting, entitlement flag]
```

### Key Data Flows

1. **Generation flow:** Prompt UI → Generation Orchestrator → Nemotron → sanitize/validate → Previewer → user. All server-side; client only renders.
2. **Save flow:** Previewer → Template Service → Supabase (RLS enforces `user_id`). Templates are versioned; editing description + regenerate creates a new version.
3. **Export/paywall flow:** Export UI → Entitlement Check (cached Supabase row, synced via Stripe webhook) → if paid, ZIP/Packager → download; if free, upsell modal.
4. **Subscription flow:** Stripe Checkout/Customer Portal → Stripe webhook (`customer.subscription.updated`) → update `entitlements.can_export` in Supabase → UI reflects paywall state.

### Data Flow Direction (explicit)

- **Client → Server:** prompt, template save, export request, auth login. Never secret keys.
- **Server → External:** Nemotron API call (server-side), Stripe API calls (server-side).
- **External → Server:** Nemotron generated code, Stripe webhook events.
- **Server → Client:** sanitized generated code, preview HTML, entitlement flag, template list.
- **Client ↔ Supabase:** direct (anon key) for user-owned template reads/writes, gated by RLS.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Monolithic Angular SPA + serverless functions is fine; Supabase free tier; Stripe test mode. |
| 1k–100k users | Add rate limiting per user on `/api/generate` (Nemotron cost control); cache entitlement checks; move to paid Supabase tier; preview via dedicated edge cache. |
| 100k+ users | Split generation orchestrator into its own service; add a CDN for preview assets; consider a background job for ZIP generation instead of inline serverless (timeout limits). |

### Scaling Priorities

1. **First bottleneck:** Nemotron cost/latency — generation is the most expensive operation. Add per-user rate limits and input validation before calling Nemotron.
2. **Second bottleneck:** Serverless function timeouts during ZIP export for large templates. Move export to a background job or generate ZIP client-side (JSZip) after server-side entitlement pass.
3. **Third bottleneck:** Supabase Realtime/connection count if many users have template lists open. Poll instead of Realtime for template list unless real-time updates are needed.

## Anti-Patterns

### Anti-Pattern 1: Calling Nemotron/Stripe directly from the browser

**What people do:** Embedding the Nemotron API key or Stripe secret key in the Angular app and calling external APIs from the frontend.
**Why it's wrong:** Keys are exposed in client-side code; anyone can generate at your expense or create charges. Violates the paywall (client can fake entitlement).
**Do this instead:** Route all Nemotron and Stripe calls through serverless functions holding the secrets; client only calls your endpoints.

### Anti-Pattern 2: Storing generated code only in client state

**What people do:** Keeping the generated Angular template in a local service/state with no Supabase persistence.
**Why it's wrong:** Users lose work on refresh; violates the "save and return to edit later" requirement; no multi-device access.
**Do this instead:** Persist every generation to Supabase with `user_id` and versioning on save.

### Anti-Pattern 3: Client-enforced paywall

**What people do:** Hiding the export button with CSS/ngIf based on a frontend flag, but still serving the ZIP when the URL is guessed.
**Why it's wrong:** The paywall is trivially bypassed; revenue leakage.
**Do this instead:** Enforce entitlement server-side in `/api/export`; frontend flag is UX only, never security.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| NVIDIA Nemotron | Serverless function → NVIDIA NIM / build.nvidia.com HTTP API | Secret key server-side; validate and sanitize all output before returning to client |
| Supabase | Angular app + serverless functions via Supabase client (anon key client-side, service role server-side) | RLS for ownership; migrations version-controlled; email/password auth only (per PROJECT.md) |
| Stripe | Serverless functions via Stripe SDK; Checkout + Customer Portal + webhooks | Webhooks update Supabase entitlement cache; handle idempotency; test mode during development |
| ZIP Packager | Serverless function (archiver) or client-side JSZip after entitlement pass | Watch serverless timeout limits for large template ZIPs |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Angular frontend ↔ serverless functions | HTTP (REST), JSON bodies | Secret keys never leave functions |
| Generation Orchestrator ↔ Nemotron | HTTP API (server-side) | Validate/sanitize AI output; strip markdown fences; reject `<script>` |
| Template Service ↔ Supabase | Supabase client (REST + Realtime) | RLS enforces `user_id` ownership |
| Export ↔ Stripe | Stripe SDK + webhook → Supabase entitlement row | Entitlement check reads Supabase cache, not Stripe directly, for speed |

## Suggested Build Order (dependencies)

1. **Supabase data + auth layer** — migrations, RLS, email/password auth. Foundation everything else builds on.
2. **Angular shell + Bootstrap 5** — core UI framework, routing, shared components.
3. **Generation pipeline** — Nemotron integration via serverless function + validation/sanitization + Prompt UI. This is the core value.
4. **Previewer** — sandboxed iframe rendering of generated code; gives the user feedback before saving.
5. **Save/load templates** — Template Service + Supabase CRUD with RLS; versioned edits.
6. **Entitlement + Stripe paywall** — Stripe Checkout/Portal, webhooks, entitlement cache, Export UI upsell.
7. **Export (ZIP/deployable code)** — ZIP packager gated by entitlement; paid download.
8. **Deploy to Vercel/Netlify** — serverless function config, environment variables, custom domain.

**Phase ordering rationale:** Persistence and auth first (they're dependencies for templates and entitlements), then the core generation+preview loop (the product's value), then monetization and delivery (paywall + deploy). Build the paywall last so you can validate generation quality before gating export.

## Sources

- Stripe Docs (docs.stripe.com/subscriptions): subscriptions, checkout sessions, customer portal, entitlements — fetched live, server-rendered. Confidence: MEDIUM (official docs, single source).
- Supabase Docs (supabase.com/docs/guides/auth): auth, sessions, Row Level Security, policies — fetched live. Confidence: MEDIUM (official docs, single source).
- Angular (angular.dev): component/module project structure — SPA shell, not server-rendered; content inferred from established Angular conventions. Confidence: MEDIUM.
- NVIDIA Nemotron / build.nvidia.com: code-generation API target per PROJECT.md constraint. Confidence: MEDIUM (specified in project, integration pattern is standard LLM-BFF).
- Vercel / Netlify serverless functions: deployment target per PROJECT.md. Confidence: MEDIUM (standard static+serverless pattern).
- AI website generator overall topology (request→generate→preview→save→export): established SaaS + AI-code-generation pattern; not live-verified for this exact niche due to search-tool unavailability in this environment. Confidence: MEDIUM.

---
*Architecture research for: AI Template Generator (Angular + Bootstrap 5, Nemotron, Supabase, Stripe, Vercel/Netlify)*
*Researched: 2026*
*Next: feeds STACK.md, FEATURES.md, and roadmap phase structure*