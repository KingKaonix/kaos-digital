# AI Template Generator — Kaos Digital Platform

## What This Is

Kaos Digital's combined platform: the kaosnet.org marketing/consultancy site (websites, booking systems, AI chatbots, review management for local business) integrated with the AI Template Generator app (users describe a web template in natural language and get editable Angular + Bootstrap 5 code). The marketing site and the generator share the kaos brand, Supabase auth, and a single deployment.

## Core Value

Kaos Digital helps local businesses get online fast — with AI-generated templates for developers/designers, plus consulting services (websites, booking systems, AI chatbots, reviews). One platform, one brand, one deployment.

## Business Context

- **Customer**: Local businesses needing websites/digital services; developers/designers needing Angular/Bootstrap templates fast
- **Revenue model**: Consulting services + template export paywall (ZIP / deployable code)
- **Success metric**: Number of templates generated/exported (paid conversions) and consulting leads
- **Strategy notes**: Unify kaosnet.org marketing site + AI Template Generator under one Angular 22 / Bootstrap 5 deployment

## Requirements

### Validated

- AUTH-01: User can sign up with email and password — Complete (Phase 1)
- AUTH-02: User can log in and log out — Complete (Phase 1)
- GEN-01: User can describe a template in natural language — Complete (Phase 2)
- GEN-02: AI (NVIDIA Nemotron) generates Angular + Bootstrap 5 code from the description — Complete (Phase 2)
- GEN-03: User can preview the generated template — Complete (Phase 2)
- GEN-04: User can edit a saved template's description and regenerate — Complete (Phase 3)
- TPL-01: User can save a generated template to their account — Complete (Phase 3)
- TPL-02: User can view their saved templates in a personal gallery — Complete (Phase 3)
- EXP-01: Free users can generate and preview templates — Complete (Phase 4)
- EXP-02: Export (ZIP download or deployable code) is behind a paywall — Complete (Phase 4)
- EXP-03: Paid users can export templates as ZIP — Complete (Phase 4)
- EXP-04: Paid users can export deployable Angular code — Complete (Phase 4)
- BRAND-01: Kaos color palette applied globally — Complete (Phase 5)
- BRAND-02: Inter typography across all pages — Complete (Phase 5)
- BRAND-03: Kaos logo in the navbar on every page — Complete (Phase 6)
- BRAND-04: Kaos favicon — Complete (Phase 6)
- BRAND-05: Bootstrap 5 theme variables overridden with Kaos palette — Complete (Phase 5)
- BRAND-06: Consistent branding across all existing pages — Complete (Phase 7)
- BRAND-07: Branded paywall modal and toast notifications — Complete (Phase 7)
- BRAND-08: Branded preview iframe shell — Complete (Phase 7)
- BRAND-09: Kaos-colored loading and empty states — Complete (Phase 7)
- BRAND-010: Branded 404/not-found page — Complete (Phase 7)

### Active

(None yet — define v2.0 requirements in the requirements step)

### Out of Scope

- Real-time collaborative editing — complexity not core to v2 value
- OAuth login (Google, GitHub) — email/password sufficient
- Mobile-native app — web-first, mobile later
- Real-time chat / AI assistant beyond generation — not core
- Video or rich media assets in templates — storage/bandwidth costs, defer
- Maintaining two separate Angular versions (14 and 22) — kaosnet-site upgraded to 22/5, then content integrated

## Context

- AI provider: NVIDIA Nemotron (code generation)
- Frontend framework: Angular 22 (standalone components)
- CSS framework: Bootstrap 5.3.9
- Database: Supabase (user accounts, saved templates, subscription/payment state)
- Payment processor: Stripe (export paywall)
- Deployment: Vercel or Netlify (single combined deployment)
- kaosnet-site repo: cloned to ~/kaosnet-site/ (KingKaonix/kaos-digital, Angular 14 / Bootstrap 4 → to be upgraded to 22/5)

## Current Milestone: v2.0 Kaos Site Integration

**Goal:** Upgrade the kaosnet.org site (kaosnet-site repo, Angular 14 / Bootstrap 4) to Angular 22 / Bootstrap 5, then integrate its marketing content (about, contact, services, pricing, products) into the AI Template Generator app as shared routes under one kaos brand and one deployment.

**Target features:**
- kaosnet-site upgraded Angular 14 → 22, Bootstrap 4 → 5.3.9, standalone components
- kaos brand design system (slate-900, Inter font, logo, favicon) applied to marketing pages
- Marketing pages (about, contact, services, pricing, products) as Angular routes in the combined app
- Shared navbar + routing between marketing pages and generator
- Shared Supabase auth for site visitors + generator users
- Single Vercel/Netlify deployment of marketing + generator

## Constraints

- **[AI]**: NVIDIA Nemotron — must be used for code generation
- **[Frontend]**: Angular 22 + Bootstrap 5 — both the generator's stack and the upgraded site's target stack
- **[Database]**: Supabase — for auth and saved templates
- **[Payments]**: Stripe — for export paywall
- **[Deployment]**: Vercel or Netlify — single combined deployment on user's domain

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NVIDIA Nemotron for AI generation | User specified | — Pending |
| Angular 22 + Bootstrap 5 for site + generator | User specified ("update it to 22/5") | — Pending |
| Upgrade kaosnet-site in place, then integrate | Avoids maintaining two Angular versions | — Pending |
| Supabase for database/auth | User specified | — Pending |
| Stripe for paywall | Recommended, standard for SaaS export gating | — Pending |
| Vercel or Netlify deployment | User specified | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: v2.0 Kaos Site Integration milestone start*