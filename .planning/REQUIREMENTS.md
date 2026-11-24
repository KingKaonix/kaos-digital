# Requirements: AI Template Generator — Kaos Digital Platform

**Defined:** 2026-11-23
**Core Value:** Kaos Digital's combined platform — kaosnet.org marketing/consultancy site integrated with the AI Template Generator app, shared kaos brand, Supabase auth, single Angular 22 / Bootstrap 5 deployment.

## v2.0 Requirements (Kaos Site Integration)

Requirements for the v2.0 milestone — upgrade kaosnet-site (Angular 14 / Bootstrap 4) to Angular 22 / Bootstrap 5, then integrate its marketing content into the generator app. Each maps to a roadmap phase.

### Site Upgrade

- [ ] **UPGR-01**: kaosnet-site upgraded from Angular 14 → Angular 22 (standalone components, CLI 22)
- [ ] **UPGR-02**: kaosnet-site upgraded from Bootstrap 4.5.3 → Bootstrap 5.3.9 (drop jQuery, ng-bootstrap dependency)
- [ ] **UPGR-03**: kaosnet-site builds cleanly (`ng build` passes, no Angular 14 deprecations)
- [ ] **UPGR-04**: kaosnet-site uses kaos brand design tokens (slate-900, Inter font, logo, favicon)

### Integration

- [ ] **INTE-01**: kaosnet marketing pages (about, contact, services, pricing, products) ported as Angular routes in the generator app
- [ ] **INTE-02**: Shared navbar wrapping marketing pages + generator pages
- [ ] **INTE-03**: Shared Supabase auth — site visitors and generator users use same accounts
- [ ] **INTE-04**: Generator accessible at `/generator` route; marketing homepage at `/`
- [ ] **INTE-05**: Single Vercel/Netlify deployment of marketing + generator

## v3 Requirements (Future)

Deferred to future release.

### Combination Expansion

- **COMB-01**: kaosnet consulting services (booking, AI chatbot setup) integrated with generator templates
- **COMB-02**: Multi-site management from generator dashboard

## Out of Scope

| Feature | Reason |
|---------|--------|
| Maintaining Angular 14 version of kaosnet-site | Must upgrade to 22/5 to combine with generator |
| Two separate deployments | Single combined deployment required |
| OAuth login | Email/password sufficient |
| Mobile-native app | Web-first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPGR-01 | Phase 8 | Complete |
| UPGR-02 | Phase 8 | Complete |
| UPGR-03 | Phase 8 | Complete |
| UPGR-04 | Phase 8 | Complete |
| INTE-01 | Phase 9 | Complete |
| INTE-02 | Phase 9 | Complete |
| INTE-03 | Phase 9 | Complete |
| INTE-04 | Phase 9 | Complete |
| INTE-05 | Phase 9 | Complete |

**Coverage:**
- v2.0 requirements: 9 total
- Mapped to phases: 0 (to be mapped during roadmap creation)
- Unmapped: 9 ⚠️

---
*Requirements defined: 2026-11-23*
*Last updated: 2026-11-23 after initial definition*