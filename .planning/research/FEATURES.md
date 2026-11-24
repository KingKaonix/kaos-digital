# Feature Research

**Domain:** Visual branding / design-system application — applying kaosnet.org look (color palette, typography, logo, favicon) to an existing Angular + Bootstrap 5 AI Template Generator app
**Milestone:** v1.1 Kaos Brand (subsequent milestone — Auth, Generation, Persistence, Monetization already validated; do not re-research those)
**Researched:** 2025-11-23
**Confidence:** HIGH (kaosnet.org branding read directly from local about.html contact point; Angular app structure read directly from source)

---

## Scope Boundary (what this research covers and excludes)

IN SCOPE (this milestone): color palette, typography (Inter), logo, favicon, and consistent application of these across all existing pages (login, signup, dashboard, generate, gallery, edit, paywall modal, toast), delivered as Angular/Bootstrap 5 theming.

EXCLUDED (already validated, out of scope per PROJECT.md + milestone context): Auth (Supabase), Generation (Nemotron), Persistence (templates CRUD + gallery), Monetization (Stripe paywall + export). Branding styles these features' UIs but does not change their logic.

EXCLUDED (out of scope per PROJECT.md): OAuth, mobile-native app, real-time collaboration, video/rich media, AI chat beyond generation.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist when an app claims to "match kaosnet.org look." Missing these = the milestone feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Kaos color palette (slate-900 background + accent colors) applied globally | kaosnet.org body uses `bg-slate-900`; this is the most recognizable visual signal of the brand | LOW | Override Bootstrap 5 `$body-bg` and theme variables in `src/styles.scss` / `src/app/app.scss`; apply `.bg-slate-900` to `<body>` and page containers |
| Inter typography (Google Fonts, weights 400/500/600/700) across all pages | kaosnet.org loads `Inter:wght@400;500;600;700`; missing it breaks the "match the look" promise | LOW | Add Google Fonts preconnect + stylesheet link in `src/index.html`; set `font-family: Inter, sans-serif` globally; map weights to headings/body/buttons |
| Kaos logo in the navbar (replacing plain "AI Template Generator" text) | Brand identity; navbar brand is the most visible logo placement on every page | LOW | Replace navbar brand text with `` or SVG logo; ensure it scales and has alt text; link to `/` |
| Kaos favicon replacing default Angular favicon | Browser tab/bookmark identity; default Angular favicon looks unfinished | MEDIUM | Swap `public/favicon.ico` and `<link rel="icon">` in `src/index.html`; may need PNG/apple-touch-icon variants for deployment targets (Vercel/Netlify) |
| Consistent branding across all pages (login, signup, dashboard, generate, gallery, edit, paywall modal, toast) | Milestone explicitly requires branding "across all pages"; inconsistent pages feel like different apps | LOW | Branding lives in app shell (`app.html`: navbar + router-outlet + toast) + global styles; page components inherit, no per-page re-theming |
| Bootstrap 5 theme variables overridden with Kaos palette | App is built on Bootstrap 5 (buttons, cards, badges, modals); if variables aren't overridden, components keep Bootstrap defaults and clash with slate-900 | MEDIUM | Customize Bootstrap 5 SCSS variables (`primary`, `secondary`, `dark`, `body-bg`, etc.) to Kaos colors so generated UI inherits branding automatically |

### Differentiators (Competitive Advantage)

Not required to "match the look," but valuable for making the brand feel intentional rather than slapped on.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Slate-900 dark base throughout (distinct from default Bootstrap light/white) | Differentiates from generic Angular/Bootstrap starter apps; matches kaosnet.org's dark aesthetic | LOW | Comes free with global `.bg-slate-900`; ensure text contrast on dark backgrounds |
| Branded paywall modal and toast notifications | Paywall/toast are Bootstrap defaults by default; branding them makes monetization feel like part of the product, not an overlay | LOW | Kaos accent colors on paywall CTA buttons; toast uses slate-900 + accent |
| Branded preview iframe shell for generated templates | Generated templates preview inside a Kaos-branded shell reinforces brand while the user's code stays untouched | MEDIUM | Preview component wraps iframe with Kaos header/footer; does not alter generated code |
| Kaos-colored loading/empty states | Loading spinners and empty galleries in Kaos accent color feel polished | LOW | Bootstrap spinners + custom empty-state components with accent color |
| Branded 404/not-found and auth error pages | Route `**` redirects to dashboard today; a branded not-found feels complete | LOW | Optional route + component using Kaos palette |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good for a branding milestone but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Rebranding / restyling the AI-generated template output (user's Angular + Bootstrap 5 code) | Users might want their exported code to look "Kaos" automatically | Conflicts with core value: generated code must be the user's editable Angular/Bootstrap 5, not force-branded; hard to reverse; breaks "editable boilerplate" promise | Brand only the preview shell/wrapper around generated output, not the code itself |
| Replacing Bootstrap 5 with Tailwind or a custom CSS framework | "Modern design systems use Tailwind"; desire for finer design control | Violates PROJECT.md constraint (Angular + Bootstrap 5); large rewrite; generated output targets Bootstrap 5, so the app must stay Bootstrap 5 | Override Bootstrap 5 SCSS variables; keep Bootstrap 5 as the framework |
| Per-user brand kit / theme editor (custom colors, fonts, upload logo) | SaaS apps often offer white-labeling | Scope creep; not in milestone goal (match ONE brand: kaosnet.org); adds settings UI, storage, theming engine complexity | Hard-code Kaos brand; offer user theming only as v2+ if requested |
| Multiple logo variants (dark/light/monochrome/full-color) | Professional brand guidelines usually include variants | Over-engineering for v1.1; one logo on slate-900 navbar suffices; extra assets to maintain | Single logo variant; add light variant only if a light mode is ever added |
| Heavy animations / motion everywhere (floating elements, marquees, hover transforms) | Makes a site feel "designed" | Performance cost on low-end devices; accessibility concerns (vestibular); not part of kaosnet.org's clean look | Subtle, restrained motion only; respect `prefers-reduced-motion` |
| Adding kaosnet.org product pages (booking, AI chatbot, reviews) to the app | kaosnet.org is a consultancy site with multiple products | This app is an AI Template Generator, not kaosnet.org itself; adding unrelated product pages confuses the product | Apply kaosnet.org *look* only; do not clone kaosnet.org's *content* or navigation |

---

## Feature Dependencies

```
[Kaos design assets (logo file, favicon file)]
    └──requires──> [Logo in navbar]
                       └──requires──> [Consistent branding across all pages]

[Google Fonts Inter (network stylesheet)]
    └──requires──> [Inter typography across all pages]

[Bootstrap 5 SCSS variable overrides]
    └──requires──> [Kaos color palette globally]
                       └──requires──> [Consistent branding across all pages]
                               └──enhances──> [Branded paywall modal & toast]
                               └──enhances──> [Branded preview iframe shell]

[Existing pages (login, signup, dashboard, generate, gallery, edit)]
    └──requires──> [Auth, Generation, Persistence (already validated phases)]
                       └──receives──> [Branding via app shell + global styles]

[public/favicon.ico + index.html <link rel="icon">]
    └──requires──> [Kaos favicon]

[App shell (app.html: navbar + router-outlet + toast)]
    └──enables──> [Navbar logo]
                       └──enables──> [Branded toast]
```

### Dependency Notes

- **[Kaos design assets] require [Logo in navbar]:** You cannot render a logo that doesn't exist. If no logo/favicon asset is committed to the repo, the milestone is blocked until design assets are created or extracted from kaosnet.org. This is the #1 dependency to confirm before scheduling.
- **[Bootstrap 5 SCSS variable overrides] require [Kaos color palette]:** Bootstrap components (buttons, badges, modals, navbars) derive colors from theme variables. Palette must be defined (hex values) before variables can be overridden, otherwise components keep Bootstrap `primary` blue on a slate-900 background — unreadable.
- **[Existing pages] require [validated Auth/Generation/Persistence]:** Branding is applied *to* those pages' UIs; it does not depend on their internal logic. Since all four are validated (Phases 1–4), branding can be applied in parallel to their existing components without touching services/guards.
- **[App shell] enables [Navbar logo] + [Branded toast]:** `app.html` already composes `<app-navbar />`, `<router-outlet />`, `<app-toast />`. Global styles + navbar changes here cascade to every routed page, so no per-page branding work is needed — a key dependency that keeps complexity LOW.

---

## MVP Definition

### Launch With (v1.1 Kaos Brand)

- [ ] **Kaos color palette (slate-900 bg + accent) applied globally** — Essential; defines the brand's visual identity
- [ ] **Inter typography (Google Fonts 400/500/600/700) across all pages** — Essential; kaosnet.org's signature type treatment
- [ ] **Kaos logo in navbar** — Essential; primary brand mark on every page
- [ ] **Kaos favicon** — Essential; tab/bookmark identity; default Angular favicon looks unfinished
- [ ] **Consistent branding across all existing pages** — Essential per milestone goal ("across all pages"); achieved via app shell + global styles
- [ ] **Bootstrap 5 theme variable overrides with Kaos palette** — Essential; prevents Bootstrap defaults from clashing with slate-900

### Add After Validation (v1.1.x)

- [ ] **Branded paywall modal & toast** — Trigger: paywall/stripe modals feel like Bootstrap defaults after brand is live
- [ ] **Branded preview iframe shell** — Trigger: generated-template previews look unbranded next to the branded app
- [ ] **Kaos-colored loading/empty states** — Trigger: polish pass after core branding ships
- [ ] **Branded 404/not-found page** — Trigger: if `**` redirect behavior changes to a real not-found route

### Future Consideration (v2+)

- [ ] **Per-user brand kit / theme editor** — Defer: not in milestone goal; significant settings + theming engine work
- [ ] **Multiple logo variants / light mode** — Defer: single dark-brand variant suffices for v1.1
- [ ] **Heavy motion / animations** — Defer: performance + a11y concerns; not part of kaosnet.org look

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Kaos color palette (slate-900 bg + accent) globally | HIGH | LOW | P1 |
| Inter typography across all pages | HIGH | LOW | P1 |
| Kaos logo in navbar | HIGH | LOW | P1 |
| Kaos favicon | MEDIUM | MEDIUM | P1 |
| Consistent branding across all pages | HIGH | LOW | P1 |
| Bootstrap 5 theme variable overrides | HIGH | MEDIUM | P1 |
| Branded paywall modal & toast | MEDIUM | LOW | P2 |
| Branded preview iframe shell | MEDIUM | MEDIUM | P2 |
| Kaos-colored loading/empty states | LOW | LOW | P3 |
| Branded 404/not-found page | LOW | LOW | P3 |
| Per-user brand kit / theme editor | MEDIUM | HIGH | P3 (future) |
| Multiple logo variants / light mode | LOW | MEDIUM | P3 (future) |
| Heavy motion / animations | LOW | MEDIUM | P3 (anti-feature v1.1) |

**Priority key:**
- P1: Must have for v1.1 Kaos Brand milestone
- P2: Should have, add after core branding ships
- P3: Nice to have, future consideration or anti-feature

**Priority rationale:** P1 items are purely cosmetic/theming and low cost — they deliver the entire milestone value. P2 items extend branding to monetization/preview surfaces users actually see. P3 items are either deferrable or actively discouraged (anti-features).

---

## Competitor / Reference Analysis

| Reference | Branding Approach | Relevance to This Milestone |
|-----------|-------------------|-----------------------------|
| kaosnet.org (target) | `bg-slate-900` body, Inter 400/500/600/700 via Google Fonts, favicon, "Kaos Digital" wordmark | **Primary source** — the look to match |
| Default Angular + Bootstrap 5 app | White/gray Bootstrap defaults, Angular favicon, no custom font | **Baseline to escape** — current app state before branding |
| v0.dev / Lovable / Bolt.new | Branded dark shells, custom fonts, favicons, consistent UI across auth/generate/gallery | **Pattern confirmation** — consistent app-wide branding is standard for AI generator SaaS |
| Bootstrap 5 theming docs | SCSS variable overrides (`$body-bg`, `$primary`, etc.) | **Implementation reference** — how to inject Kaos palette into Bootstrap components |

---

## Sources

- kaosnet.org branding reference: local `about.html` (bg-slate-900, Inter Google Fonts, favicon, "Kaos Digital — AI & IT Systems for Local Business")
- Angular app source: `src/` (app shell, navbar, routes, components) — confirms Bootstrap 5 + standalone components structure
- PROJECT.md (milestone context, constraints, validated features, out-of-scope items)
- Existing `.planning/research/` (STACK.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md) — stack: Angular 22 + Bootstrap 5 + Supabase + Stripe; deployment Vercel/Netlify
- Bootstrap 5 theming (SCSS variable customization) — general framework knowledge

---

*Feature research for: v1.1 Kaos Brand milestone — applying kaosnet.org visual branding to the Angular AI Template Generator app*
*Researched: 2025-11-23*
*Confidence: HIGH*
