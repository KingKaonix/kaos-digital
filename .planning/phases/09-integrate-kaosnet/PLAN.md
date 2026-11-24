# Phase 9 Plan — Integrate kaosnet marketing content with generator

**Milestone:** v2.0 Kaos Site Integration  
**Phase:** 9 (final phase of v2.0)  
**Goal**: kaosnet marketing content (about, contact, services, pricing, products) ported as Angular routes in the generator app; shared navbar + routing; shared Supabase auth; single Vercel/Netlify deployment of marketing + generator.  
**Requirements**: INTE-01, INTE-02, INTE-03, INTE-04, INTE-05  
**Depends on**: Phase 8 (kaosnet-site upgraded to Angular 22/Bootstrap 5)  
**Status:** Planned

---

## Integration architecture

**Routing structure (single Angular 22 app, generator repo at ~/storage/kaosnet/):**
| Route | Purpose |
|-------|---------|
| `/` | Marketing home (kaosnet landing — ported from kaosnet-site) |
| `/about` | Marketing: About / Hands-On Consulting |
| `/services` | Marketing: Four Automated Products |
| `/pricing` | Marketing: Pricing |
| `/products` | Marketing: Products |
| `/contact` | Marketing: Contact / consultation form |
| `/login`, `/signup` | Shared auth (Supabase) |
| `/generator` | AI Template Generator app shell (dashboard) |
| `/generator/generate` | Generation pipeline + preview |
| `/generator/gallery` | Template gallery |
| `/generator/templates/:id/edit` | Edit/regenerate |
| `/**` | 404 (NotFoundComponent) |

**Auth:** Shared Supabase auth — `/login`/`/signup` serve both marketing visitors and generator users. AuthGuard protects `/generator/*` routes.

**Navbar:** Single shared `NavbarComponent` with kaos logo, marketing links (services/about/contact), and generator link ("Get Started" → /generator). Replaces per-page embedded navbars.

---

## Scope Boundary

**In scope (INTE-01 through INTE-05):**
- Marketing pages as routes in the generator app
- Shared navbar wrapping marketing + generator
- Shared Supabase auth (same accounts)
- Generator at `/generator`; marketing homepage at `/`
- Single app (single deployment target)

**Out of scope:**
- Actual Vercel/Netlify deployment configuration (deployment config exists; deploying is ops, not code)
- Real-time collaboration, OAuth, mobile app

---

## Tasks

### Task 9.01 — Create marketing components

**Files:**
- `src/app/features/marketing/home/home.component.ts/html/scss` — kaosnet landing (ported from kaosnet-site home)
- `src/app/features/marketing/about/about.component.ts/html/scss`
- `src/app/features/marketing/services/services.component.ts/html/scss`
- `src/app/features/marketing/pricing/pricing.component.ts/html/scss`
- `src/app/features/marketing/products/products.component.ts/html/scss`
- `src/app/features/marketing/contact/contact.component.ts/html/scss`

**Acceptance criteria:**
- All components standalone, import FormsModule where forms used
- Each page uses kaos brand (kaos-bg, kaos-text, kaos-card, Inter font)
- `tsc --noEmit` passes

**Verification command:** `npx tsc --noEmit`

**Threat model:** T-9-01 — Content drift between kaosnet-site and generator. Mitigation: port faithfully from kaosnet-site landing component.

---

### Task 9.02 — Restructure routing (marketing at root, generator under /generator)

**Files:**
- `src/app/app.routes.ts` — new route table
- `src/app/features/generate/generate.component.ts/html` — any internal `/` links → `/generator/...`
- `src/app/features/dashboard/dashboard.component.ts` — any internal links
- `src/app/features/templates/edit/template-edit.component.ts/html` — any internal links
- `src/app/shared/navbar/navbar.component.ts/html` — link targets updated

**Changes:**
- `''` → marketing HomeComponent (was redirectTo /dashboard)
- `'login'`, `'signup'` → stay at root (shared auth)
- `'dashboard'` → `'generator/dashboard'`
- `'generate'` → `'generator/generate'`
- `'gallery'` → `'generator/gallery'`
- `'templates/:id/edit'` → `'generator/templates/:id/edit'`
- `'generator'` → generator DashboardComponent (shell)
- `'about'|'services'|'pricing'|'products'|'contact'` → marketing components
- `'**'` → NotFoundComponent

**Acceptance criteria:**
- `npx tsc --noEmit` passes
- `ng build` passes
- No dangling `/dashboard`, `/generate`, `/gallery` routes

**Verification command:** `npx tsc --noEmit && npx ng build`

**Threat model:** T-9-02 — Broken internal links after route prefix change. Mitigation: grep for routerLink="/dashboard" etc. and update.

---

### Task 9.03 — Update shared navbar with marketing + generator links

**Files:**
- `src/app/shared/navbar/navbar.component.ts/html`

**Changes:**
- Navbar brand: kaos logo + "Kaos Digital"
- Nav links: Services, About, Contact (marketing), Get Started → /generator (generator)
- Auth state: Login/Signup if not authenticated; Dashboard → /generator/dashboard if authenticated

**Acceptance criteria:**
- Navbar renders on all pages (marketing + generator)
- Get Started → /generator
- `tsc --noEmit` passes

**Verification command:** `npx tsc --noEmit`

---

### Task 9.04 — Update AuthGuard + route protection for /generator

**Files:**
- `src/app/core/auth.guard.ts` (if path-specific)
- `src/app/app.routes.ts` — canActivate on /generator/*

**Changes:**
- AuthGuard protects all `/generator/*` routes
- Marketing routes (`/`, `/about`, etc.) are public
- `/login`, `/signup` redirect to `/generator/dashboard` if already authenticated

**Acceptance criteria:**
- Unauthenticated access to /generator/* → redirect to /login
- Marketing pages public (no auth required)
- `tsc --noEmit` passes

**Verification command:** `npx tsc --noEmit`

---

### Task 9.05 — Full build verification

**Acceptance criteria:**
- `npx tsc --noEmit` passes with zero errors
- `npx ng build` passes (only pre-existing budget warnings, no errors)
- All 9 v2.0 requirements mapped to Phase 8/9 in REQUIREMENTS.md

**Verification command:** `npx tsc --noEmit && npx ng build`

---

## Execution Waves

**Wave 1 (sequential):**
- Task 9.01 (marketing components) — prerequisite
- Task 9.02 (routing restructure) — after 9.01
- Task 9.03 (navbar links) — after 9.02
- Task 9.04 (auth guard) — after 9.03
- Task 9.05 (verify) — after all

---

## REQUIREMENTS.md Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INTE-01 | Phase 9 | Planned |
| INTE-02 | Phase 9 | Planned |
| INTE-03 | Phase 9 | Planned |
| INTE-04 | Phase 9 | Planned |
| INTE-05 | Phase 9 | Planned |

---

## Definition of Done (Phase 9)

- [ ] Task 9.01: marketing components (home, about, services, pricing, products, contact) created
- [ ] Task 9.02: routing restructured (marketing root, generator /generator)
- [ ] Task 9.03: shared navbar with marketing + generator links
- [ ] Task 9.04: AuthGuard protects /generator/*, marketing public
- [ ] Task 9.05: tsc --noEmit passes, ng build passes
- [ ] REQUIREMENTS.md: INTE-01 through INTE-05 → Phase 9 Complete
- [ ] All v2.0 requirements (UPGR + INTE) Complete → v2.0 milestone done

---

*Phase 9 plan ready for execution.*