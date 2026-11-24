# Roadmap: AI Template Generator — Kaos Digital Platform

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-11-23)
- ✅ **v1.1 Kaos Brand** — Phases 5-7 (shipped 2026-11-23)
- ✅ **v2.0 Kaos Site Integration** — Phases 8-9 (shipped 2026-11-24)

## Phases

- [x] **Phase 1: Foundation — Auth + Data Layer** — completed 2026-11-23
- [x] **Phase 2: Core — Generation Pipeline + Preview** — completed 2026-11-23
- [x] **Phase 3: Persistence — Save/Load Templates + Gallery** — completed 2026-11-23
- [x] **Phase 4: Monetization — Stripe Paywall + Export** — completed 2026-11-23
- [x] **Phase 5: Brand Foundation** — completed 2026-11-23
- [x] **Phase 6: Assets & Icons** — completed 2026-11-23
- [x] **Phase 7: Cross-Page Consistency** — completed 2026-11-23
- [x] **Phase 8: Upgrade kaosnet-site to Angular 22 / Bootstrap 5** — completed 2026-11-24
- [x] **Phase 9: Integrate kaosnet marketing content with generator** — completed 2026-11-24

Full phase details archived at: .planning/milestones/v1.0-ROADMAP.md, .planning/milestones/v1.1-ROADMAP.md

## Phase Details

### Phase 8: Upgrade kaosnet-site to Angular 22 / Bootstrap 5
**Goal**: The kaosnet.org site repo (KingKaonix/kaos-digital, cloned to ~/kaosnet-site/) is upgraded from Angular 14 / Bootstrap 4.5.3 to Angular 22 / Bootstrap 5.3.9 — standalone components, no jQuery, clean build. This is the prerequisite for integrating the site with the generator.
**Depends on**: Nothing (first phase of v2.0; builds on v1/v1.1 validated auth/generation/persistence/monetization/branding)
**Requirements**: UPGR-01, UPGR-02, UPGR-03, UPGR-04
**Success Criteria** (what must be TRUE):
  1. kaosnet-site uses Angular CLI 22, Angular core 22, standalone components
  2. kaosnet-site uses Bootstrap 5.3.9 (jQuery removed, ng-bootstrap removed)
  3. `ng build` passes with zero errors (no Angular 14 deprecations, no Bootstrap 4 leftovers)
  4. kaosnet-site uses kaos brand design tokens (slate-900 bg, Inter font, logo, favicon)
**Plans**: 8.01–8.04 (all complete) — completed 2026-11-24
**UI hint**: yes

### Phase 9: Integrate kaosnet marketing content with generator
**Goal**: kaosnet marketing content (about, contact, services, pricing, products) ported as Angular routes in the generator app; shared navbar + routing; shared Supabase auth; single Vercel/Netlify deployment of marketing + generator.
**Depends on**: Phase 8
**Requirements**: INTE-01, INTE-02, INTE-03, INTE-04, INTE-05
**Success Criteria** (what must be TRUE):
  1. Marketing pages accessible as routes in the generator app (about, contact, services, pricing, products)
  2. Shared navbar wraps marketing pages + generator pages
  3. Site visitors and generator users share Supabase auth accounts
  4. Generator at `/generator` route; marketing homepage at `/`
  5. Single Vercel/Netlify deployment of marketing + generator
**Plans**: 9.01–9.05 (all complete) — completed 2026-11-24
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1 - Foundation — Auth + Data Layer | 5/5 | Complete | 2026-11-23 |
| 2 - Core — Generation Pipeline + Preview | 5/5 | Complete | 2026-11-23 |
| 3 - Persistence — Save/Load Templates + Gallery | 5/5 | Complete | 2026-11-23 |
| 4 - Monetization — Stripe Paywall + Export | 5/5 | Complete | 2026-11-23 |
| 5 - Brand Foundation | 1/1 | Complete | 2026-11-23 |
| 6 - Assets & Icons | 1/1 | Complete | 2026-11-23 |
| 7 - Cross-Page Consistency | 1/1 | Complete | 2026-11-23 |
| 8 - Upgrade kaosnet-site to Angular 22 / Bootstrap 5 | 1/1 | Complete | 2026-11-24 |
| 9 - Integrate kaosnet marketing content with generator | 1/1 | Complete | 2026-11-24 |
