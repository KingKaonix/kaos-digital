# Phase 8 Plan — Upgrade kaosnet-site to Angular 22 / Bootstrap 5

**Milestone:** v2.0 Kaos Site Integration  
**Phase:** 8 (continues from v1.1's Phase 7)  
**Goal**: The kaosnet.org site repo (KingKaonix/kaos-digital, cloned to ~/kaosnet-site/) is upgraded from Angular 14 / Bootstrap 4.5.3 to Angular 22 / Bootstrap 5.3.9 — standalone components, no jQuery, clean build. Prerequisite for integrating the site with the generator.  
**Requirements**: UPGR-01, UPGR-02, UPGR-03, UPGR-04  
**Depends on**: Nothing (first phase of v2.0; builds on v1/v1.1 validated auth/generation/persistence/monetization/branding)  
**Status:** Planned

---

## Current kaosnet-site state (cloned to ~/kaosnet-site/)

| Item | Current | Target |
|------|---------|--------|
| Angular CLI / core | 14.2.7 / 14.2.0 | 22.x |
| Bootstrap | 4.5.3 | 5.3.9 |
| jQuery | 3.5.1 | removed |
| ng-bootstrap | 6.0.0 | removed (Bootstrap 5 native) |
| TypeScript | ~4.7.2 | ~6.0.x |
| Components | NgModule-based | Standalone |
| Pages | LandingComponent + NavbarComponent | Landing + marketing pages |
| Build | `ng build` (Angular 14) | `ng build` (Angular 22) |

Scope note: kaosnet-site is a "Now UI Kit" template — a single `LandingComponent` (229 lines HTML) + `NavbarComponent` + UI kit components. The real kaosnet.org marketing content (about, contact, services, pricing, products) lives in the static HTML files at ~/kaosnet/. Phase 8 upgrades the site shell to Angular 22/Bootstrap 5; Phase 9 ports the real marketing content into routes.

---

## Scope Boundary

**In scope (UPGR-01 through UPGR-04):**
- kaosnet-site Angular CLI/core upgraded to 22
- kaosnet-site Bootstrap upgraded to 5.3.9; jQuery + ng-bootstrap removed
- kaosnet-site `ng build` passes cleanly
- kaosnet-site uses kaos brand design tokens (slate-900 bg, Inter font, logo, favicon)

**Out of scope (Phase 9):**
- Porting real kaosnet.org marketing pages (about/contact/services/pricing/products) — Phase 9
- Shared navbar routing with generator — Phase 9
- Combined Vercel/Netlify deployment — Phase 9

---

## Tasks

### Task 8.01 — Scaffold Angular 22 app + port kaosnet structure

Given Angular 14 → 22 spans 6 major versions (unreliable `ng update` chain), scaffold a fresh Angular 22 standalone app in ~/kaosnet-site/ and port the kaosnet structure (app shell, navbar, landing page) over.

**Files:**
- `~/kaosnet-site/` — regenerate with `ng new` (Angular 22, SCSS, routing)
- `~/kaosnet-site/src/app/app.component.ts/html/scss` — app shell
- `~/kaosnet-site/src/app/navbar/navbar.component.ts/html/scss` — navbar (ported from Now UI Kit)
- `~/kaosnet-site/src/app/landing/landing.component.ts/html/scss` — landing page (ported content)
- `~/kaosnet-site/src/app/app.routes.ts` — routes (`/` → landing)

**Acceptance criteria:**
- `ng new` completes with Angular 22, standalone components, SCSS
- `tsc --noEmit` passes
- `ng build` completes

**Verification command:** `cd ~/kaosnet-site && npx tsc --noEmit && npx ng build`

**Threat model:** T-8-01 — Losing Now UI Kit styling during port. Mitigation: port key SCSS variables/styles; rebuild look with Bootstrap 5 utilities.

**Reversibility:** checkpoint:decision — scaffold vs. in-place upgrade. Scaffold chosen for reliability; documented here.

---

### Task 8.02 — Upgrade Bootstrap to 5.3.9, remove jQuery + ng-bootstrap

Replace Bootstrap 4.5.3 with 5.3.9. Remove jQuery 3.5.1 and @ng-bootstrap/ng-bootstrap 6.0.0 (Bootstrap 5 has native JS). Update any jQuery-dependent Now UI Kit markup to Bootstrap 5 equivalents.

**Files:**
- `~/kaosnet-site/package.json` — bootstrap ^5.3.9; remove jquery, @ng-bootstrap/ng-bootstrap
- `~/kaosnet-site/angular.json` — styles: bootstrap.min.css; scripts: bootstrap.bundle.min.js (drop jquery)
- `~/kaosnet-site/src/app/**/*.html` — update any Bootstrap 4 classes to Bootstrap 5

**Acceptance criteria:**
- package.json has bootstrap ^5.3.9, no jquery, no @ng-bootstrap/ng-bootstrap
- `npm install` completes
- No jQuery `$` references in src/
- `tsc --noEmit` passes

**Verification command:** `cd ~/kaosnet-site && npx tsc --noEmit && grep -r '\$' src/ | grep -v node_modules || echo "NO_JQUERY"`

**Threat model:** T-8-02 — Bootstrap 4 → 5 class changes break layout. Mitigation: test each ported page visually after build.

**Reversibility:** reversible — package.json changes can be reverted.

---

### Task 8.03 — Convert all components to standalone

Remove NgModule declarations; convert app.component, navbar, landing to standalone components with `imports: [RouterLink, ...]`.

**Files:**
- `~/kaosnet-site/src/app/app.component.ts` — standalone
- `~/kaosnet-site/src/app/navbar/navbar.component.ts` — standalone
- `~/kaosnet-site/src/app/landing/landing.component.ts` — standalone
- `~/kaosnet-site/src/app/app.module.ts` — remove or convert to bootstrapApplication
- `~/kaosnet-site/src/main.ts` — use `bootstrapApplication` with routes

**Acceptance criteria:**
- No NgModule `@NgModule` decorators in src/app/
- `main.ts` uses `bootstrapApplication(AppComponent, { providers: [provideRouter(routes)] })`
- `tsc --noEmit` passes
- `ng build` passes

**Verification command:** `cd ~/kaosnet-site && npx tsc --noEmit && grep -l '@NgModule' src/app/ || echo "NO_NGMODULE"`

**Threat model:** T-8-03 — Standalone migration misses providers. Mitigation: verify build + runtime routes work.

**Reversibility:** reversible.

---

### Task 8.04 — Apply kaos brand design tokens

Apply kaos brand to kaosnet-site: slate-900 background, Inter font (Google Fonts), kaos logo, kaos favicon, kaos theme-color meta, kaos utility classes (from v1.1 styles.scss).

**Files:**
- `~/kaosnet-site/src/styles.scss` — kaos `--kaos-*` tokens + `--bs-*` overrides + `.kaos-page`/`.kaos-card` etc.
- `~/kaosnet-site/src/index.html` — Inter font link, kaos title, kaos favicon, theme-color meta
- `~/kaosnet-site/src/app/navbar/navbar.component.html` — kaos logo image (from public/assets/)
- `~/kaosnet-site/public/` — logo.png, favicon.png, apple-touch-icon.png, site.webmanifest (copied from generator public/)
- `~/kaosnet-site/angular.json` — assets: public/ glob

**Acceptance criteria:**
- `src/styles.scss` has `--kaos-bg-primary: #020617`, `--kaos-accent-primary: #7c3aed`
- `index.html` title = "Kaos Digital — AI & IT Systems for Local Business"
- Navbar renders kaos logo image
- `public/favicon.png`, `public/logo.png` exist
- `tsc --noEmit` passes
- `ng build` passes

**Verification command:** `cd ~/kaosnet-site && npx tsc --noEmit && npx ng build && ls public/logo.png public/favicon.png`

**Threat model:** T-8-04 — Asset paths break between generator and site repos. Mitigation: keep assets self-contained in kaosnet-site/public/.

**Reversibility:** reversible.

---

## Execution Waves

**Wave 1 (sequential):**
- Task 8.01 (scaffold Angular 22 app) — prerequisite for all
- Task 8.02 (Bootstrap 5.3.9, remove jQuery/ng-bootstrap) — after 8.01
- Task 8.03 (standalone components) — after 8.02
- Task 8.04 (kaos brand tokens) — after 8.03

---

## REQUIREMENTS.md Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPGR-01 | Phase 8 | Planned |
| UPGR-02 | Phase 8 | Planned |
| UPGR-03 | Phase 8 | Planned |
| UPGR-04 | Phase 8 | Planned |

---

## Definition of Done (Phase 8)

- [ ] Task 8.01: Angular 22 standalone app scaffolded in ~/kaosnet-site/, builds
- [ ] Task 8.02: Bootstrap 5.3.9, jQuery + ng-bootstrap removed, builds
- [ ] Task 8.03: All components standalone, no NgModule, builds
- [ ] Task 8.04: kaos brand tokens applied (slate-900, Inter, logo, favicon), builds
- [ ] `cd ~/kaosnet-site && npx tsc --noEmit` passes with zero errors
- [ ] `cd ~/kaosnet-site && npx ng build` passes
- [ ] REQUIREMENTS.md: UPGR-01/02/03/04 → Phase 8 Complete

---

*Phase 8 plan ready for execution.*