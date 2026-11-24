---
gsd_state_version: "1.0"
milestone: v2.0
milestone_name: Kaos Site Integration
status: complete
last_updated: "2026-11-24T05:00:00.000Z"
last_activity: 2026-11-24
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 0
  completed_plans: 9
  percent: 100
---

# STATE — AI Template Generator

## Project Reference

- **Core value**: Users can describe a website in plain language and get a complete, editable Angular + Bootstrap 5 template back — with saving, editing, and (paid) export.
- **Current focus**: v2.0 Kaos Site Integration milestone complete — kaosnet.org site upgraded to Angular 22/Bootstrap 5 and integrated with the generator app
- **Project mode**: mvp

## Current Position

Phase: v2.0 complete
Plan: 8.01–8.04, 9.01–9.05
Status: v2.0 Kaos Site Integration complete
Last activity: 2026-11-24 — Phase 9 Integration complete (marketing pages as routes, shared navbar, generator at /generator, shared Supabase auth); v2.0 milestone done


## Performance Metrics

- Templates generated: 0
- Templates exported (paid): 0
- Sign-ups: 0
- Paywall conversions: 0

## Accumulated Context

### Decisions
- AI provider: NVIDIA Nemotron (code generation)
- Frontend framework: Angular + Bootstrap 5
- Database: Supabase (auth, saved templates, subscription state)
- Payments: Stripe (export paywall)
- Deployment: Vercel or Netlify
- Angular version: 22.3.0 (standalone components)
- Bootstrap: 5.3.9

### Decisions (added in Phase 2)

- Nemotron API key kept server-side only (api/generate.ts reads process.env; never in frontend bundle)

### Decisions (added in Phase 3)

- TemplatesService returns never-throw TemplateResult { success, data?, error? } with input validation, mirroring Phase 2's GenerationResult
- User isolation enforced entirely by Supabase RLS (auth.uid() = user_id); service layer performs no client-side ownership checks
- Edit overwrites the existing template record (no version history); version history (TPL-03) deferred to v2
- Regenerate reuses Phase 2 /api/generate (Nemotron) and overwrites description + generated_code + updated_at on success only; original kept unchanged on failure
- Gallery uses cards view with inline code-snippet preview
- Serverless function verifies caller's Supabase access token before generating
- GenerationService returns { success, code?, error? } and never throws to UI
- Preview uses iframe srcdoc with sandbox attributes; unique origin isolates parent data
- Global AppErrorHandler converts unexpected errors to friendly messages (no stack traces to UI)

### Decisions (added in Phase 4)
- Stripe server-side only: STRIPE_SECRET_KEY never in frontend; NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for Elements
- Paywall enforced server-side via checkEntitlement() on /api/export/zip and /api/export/project; frontend is UX only
- Entitlement: active = status='active' AND (one-time no expiry OR current_period_end > now); re-verified on export
- Stripe webhook (checkout.session.completed, subscription.updated/deleted, invoice.payment_succeeded/failed) updates subscriptions table with idempotency key
- Export ZIP via archiver; deployable Angular project ZIP with standalone component structure (matches Phase 2 Nemotron prompt)
- Paywall UI: visible-but-gated export buttons with upsell modal; Stripe Checkout + customer portal

### Decisions (added in v1.1 Kaos Brand)
- Zero-new-dependency theming: Bootstrap 5.3 Sass/CSS-variable overrides in `src/styles.scss`, Inter Google Fonts CDN link in `index.html`, brand assets in `public/`
- Tailwind, `ngx-bootstrap`, CSS-in-JS, and a theme-switcher engine explicitly rejected (app must stay Bootstrap 5-aligned; generated output targets Bootstrap 5)
- Kaos palette defined as `--kaos-*` CSS custom properties on `:root`; Bootstrap `--bs-*` overridden there; tokens referenced via `var(--kaos-*)` everywhere — no hardcoded hex in components
- Single logo variant (dark brand); light mode and per-user brand kit deferred to v2
- Kaos dark-theme utility classes (`.kaos-card`, `.kaos-form-control`, `.kaos-alert-*`, `.kaos-spinner`, `.kaos-empty`, `.kaos-page`) in `src/styles.scss` — all reference `var(--kaos-*)` tokens, zero hardcoded hex in components
- Auth pages (login/signup) wrapped in `.kaos-page` + `.kaos-card` dark surface instead of Bootstrap white cards
- Preview iframe shell uses kaos dark header + slate-900 body; generated Angular code left untouched (core value: editable boilerplate)
- Unknown routes (`**`) render branded NotFoundComponent instead of redirecting to dashboard

### Decisions (added in v2.0 Kaos Site Integration)
- kaosnet-site repo cloned to ~/kaosnet-site/ (KingKaonix/kaos-digital, Angular 14 / Bootstrap 4.5.3, "Now UI Kit" template)
- kaosnet-site to be upgraded in place: Angular 14 → 22 (standalone components), Bootstrap 4.5.3 → 5.3.9, drop jQuery/ng-bootstrap
- kaosnet marketing content (about, contact, services, pricing, products) to be ported as routes in the generator app
- Single Vercel/Netlify deployment of marketing + generator; shared Supabase auth
- kaos brand design system (slate-900, Inter, logo, favicon) applied to marketing pages (extends v1.1 theming)

### Todos
- Phase 8: Upgrade kaosnet-site to Angular 22 / Bootstrap 5 (`/gsd:plan-phase 8`)
- Phase 9: Integrate kaosnet marketing content with generator (`/gsd:plan-phase 9`)
- v2.0 milestone complete (Phases 8-9); all 9 INTEGRATE/UPGR requirements complete

### Blockers
- None yet

### Research Flags
- Angular 14 → 22 upgrade path for kaosnet-site (standalone components migration, Bootstrap 4 → 5 breaking changes)
- kaosnet-site is a "Now UI Kit" template — marketing content is minimal (single landing page); may need to recreate about/contact/services/pricing/products pages

## Session Continuity

- Last action: Executed Phase 9 — Integrate kaosnet marketing content with generator. v2.0 Kaos Site Integration milestone complete (Phases 8-9): kaosnet-site upgraded to Angular 22/Bootstrap 5, marketing pages integrated as routes, shared navbar + Supabase auth, generator at /generator
- Next step: `/gsd:complete-milestone` (archive v2.0) or continue to v3 planning

### Completed Requirements (v1.0)

- AUTH-01: User can sign up with email and password — Complete (Phase 1)
- AUTH-02: User can log in and log out — Complete (Phase 1)
- GEN-01: User can describe a template in natural language — Complete (Phase 2)
- GEN-02: AI (NVIDIA Nemotron) generates Angular + Bootstrap 5 code — Complete (Phase 2)
- GEN-03: User can preview the generated template — Complete (Phase 2)
- GEN-04: User can edit a saved template's description and regenerate — Complete (Phase 3)
- TPL-01: User can save a generated template to their account — Complete (Phase 3)
- TPL-02: User can view their saved templates in a personal gallery — Complete (Phase 3)
- EXP-01: Free users can generate and preview templates — Complete (Phase 4)
- EXP-02: Export actions blocked for free users with paywall upsell — Complete (Phase 4)
- EXP-03: Paid users can download a generated template as a ZIP — Complete (Phase 4)
- EXP-04: Paid users can download deployable Angular project code — Complete (Phase 4)

### Completed Requirements (v1.1 Kaos Brand)

- BRAND-01: Kaos color palette (slate-900 `#020617` background + violet `#7c3aed` accents) applied globally via `:root` CSS custom properties and Bootstrap 5 theme variable overrides — Complete (Phase 5)
- BRAND-02: Inter typography (Google Fonts weights 400/500/600/700) across all pages — Complete (Phase 5)
- BRAND-03: Kaos logo in the navbar on every page — Complete (Phase 6)
- BRAND-04: Kaos favicon replacing the default Angular favicon — Complete (Phase 6)
- BRAND-05: Bootstrap 5 theme variables (`--bs-*`) overridden with Kaos palette so components inherit brand colors — Complete (Phase 5)
- BRAND-06: Consistent branding across all existing pages (login, signup, dashboard, generate, gallery, edit, paywall modal, toast) via app shell + global styles — Complete (Phase 7)
- BRAND-07: Branded paywall modal and toast notifications using Kaos accent colors — Complete (Phase 7)
- BRAND-08: Branded preview iframe shell for generated templates (Kaos header/footer wrapper, generated code untouched) — Complete (Phase 7)
- BRAND-09: Kaos-colored loading and empty states across all pages — Complete (Phase 7)
- BRAND-010: Branded 404/not-found page using Kaos palette — Complete (Phase 7)

### Completed Requirements (v2.0 Kaos Site Integration)

- UPGR-01: kaosnet-site upgraded from Angular 14 → Angular 22 (standalone components, CLI 22) — Complete (Phase 8)
- UPGR-02: kaosnet-site upgraded from Bootstrap 4.5.3 → Bootstrap 5.3.9 (jQuery + ng-bootstrap removed) — Complete (Phase 8)
- UPGR-03: kaosnet-site builds cleanly (`ng build` passes) — Complete (Phase 8)
- UPGR-04: kaosnet-site uses kaos brand design tokens (slate-900, Inter font, logo, favicon) — Complete (Phase 8)
- INTE-01: kaosnet marketing pages (about, contact, services, pricing, products) ported as Angular routes in the generator app — Complete (Phase 9)
- INTE-02: Shared navbar wrapping marketing pages + generator pages — Complete (Phase 9)
- INTE-03: Shared Supabase auth — site visitors and generator users use same accounts — Complete (Phase 9)
- INTE-04: Generator accessible at `/generator` route; marketing homepage at `/` — Complete (Phase 9)
- INTE-05: Single Angular 22 app (single deployment target) — Complete (Phase 9)

## Operator Next Steps

- `/gsd:complete-milestone` — archive v2.0 Kaos Site Integration milestone
