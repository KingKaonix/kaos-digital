# Project Research Summary

**Project:** AI Template Generator — milestone v1.1 Kaos Brand (kaosnet.org visual branding)
**Domain:** CSS/theming additions to an existing Angular 22 + Bootstrap 5 standalone-component app
**Researched:** 2026-11-23
**Confidence:** HIGH (stack/features), MEDIUM (pitfalls), architecture research unavailable

## Executive Summary

The AI Template Generator is an Angular 22 + Bootstrap 5 application (standalone components) whose next milestone, v1.1 Kaos Brand, applies the kaosnet.org visual brand — slate-900 (`#020617`) background, violet (`#7c3aed`) primary, Inter typography, kaos logo, and kaos favicon — across all existing pages (login, signup, dashboard, generate, gallery, edit, paywall modal, toast). The recommended approach is zero-new-dependency theming: Bootstrap 5.3 Sass/CSS-variable overrides in `src/styles.scss`, an Inter Google Fonts CDN link in `index.html`, and brand assets (logo SVG, favicon set) dropped into `public/`. Tailwind, `ngx-bootstrap`, CSS-in-JS, and a theme-switcher engine are explicitly rejected.

The key risks are concentration of brand tokens in individual components (palette drift), editing `node_modules/bootstrap` (wiped on CI/deploy), unbranded auth pages that look like a different app, an incomplete favicon set (no PWA/mobile icons), WCAG contrast failures on the dark slate-900 base, and Nemotron-generated templates that bypass the kaos theme. Each has a defined prevention strategy and an owner phase (see Critical Pitfalls and Implications for Roadmap).

**Note:** ARCHITECTURE.md research is unavailable (researcher failed 3 times). Architecture findings below are inferred from FEATURES.md (app shell: `app.html` = navbar + router-outlet + toast; standalone components) and STACK.md (Angular 22 + Bootstrap 5). No dedicated architecture research exists for this milestone.

## Key Findings

### Recommended Stack (from STACK.md)

**Core technologies:**
- **Bootstrap 5.3.9** — CSS/UI framework and theming base; already a dependency; exposes CSS custom properties (`--bs-*`) and Sass variables ideal for overlaying the kaos palette without replacing Bootstrap.
- **Sass (dart-sass)** — bundled with Angular CLI 22.3.0; compiles SCSS theme overrides; `inlineStyleLanguage: scss` already set in `angular.json`; no new install needed.
- **CSS custom properties (native)** — theme tokens applied at runtime on `:root`; cascade regardless of `angular.json` stylesheet load order; preferred over Sass-only overrides.
- **Google Fonts (Inter) CDN** — web font (Inter 300/400/500/600/700); zero-build-step `<link>` in `src/index.html`; honors the explicit Inter requirement (note: kaosnet.org actually loads Jost, not Inter — flagged as a font discrepancy).

**Critical version requirements:** `bootstrap@5.3.9`, `@angular/core@22.3.0`, `sass` present in `node_modules`. No new npm packages strictly required; only a font link and asset files.

### Expected Features (from FEATURES.md)

**Must have (table stakes) — P1, launch with v1.1:**
- Kaos color palette (slate-900 bg + accents) applied globally — defines the brand's visual identity
- Inter typography (Google Fonts 400/500/600/700) across all pages — kaosnet.org's signature type treatment
- Kaos logo in the navbar — primary brand mark on every page
- Kaos favicon — tab/bookmark identity; default Angular favicon looks unfinished
- Consistent branding across all existing pages — achieved via app shell + global styles (no per-page re-theming)
- Bootstrap 5 theme variable overrides with Kaos palette — prevents Bootstrap defaults from clashing with slate-900

**Should have (competitive) — P2, add after core branding ships:**
- Branded paywall modal & toast — monetization surfaces should feel like part of the product
- Branded preview iframe shell — generated-template previews should match the branded app shell
- Kaos-colored loading/empty states — polish pass after core branding ships
- Branded 404/not-found page — optional if `**` redirect changes to a real not-found route

**Defer (v2+) — P3 / anti-features:**
- Per-user brand kit / theme editor — scope creep; significant settings + theming engine work
- Multiple logo variants / light mode — single dark-brand variant suffices for v1.1
- Heavy motion / animations — anti-feature; performance + `prefers-reduced-motion` concerns
- Rebranding generated template output — violates the "editable Angular/Bootstrap 5 boilerplate" promise
- Replacing Bootstrap 5 with Tailwind — violates PROJECT.md constraint; class conflicts

### Architecture Approach (inferred — ARCHITECTURE.md unavailable)

No dedicated architecture research exists for this milestone (ARCHITECTURE.md researcher failed 3 times). Inferred from FEATURES.md and STACK.md:

1. **App shell** (`app.html`) — composes `<app-navbar />`, `<router-outlet />`, `<app-toast />`; global styles + navbar changes here cascade to every routed page, so branding needs no per-page work.
2. **Global theme layer** (`src/styles.scss`) — single source of truth for kaos design tokens (`--kaos-*` CSS custom properties) and Bootstrap `--bs-*` overrides; consumed by all feature pages.
3. **Feature pages** (login, signup, dashboard, generate, gallery, edit) — standalone components that consume `--kaos-*` vars and avoid redefining core brand values.
4. **Nemotron generation pipeline** — emits Angular + Bootstrap 5 templates; must be instructed to emit kaos design tokens so generated previews/exports match the app shell.

### Critical Pitfalls (from PITFALLS.md — top 5)

1. **Brand colors hardcoded per component instead of CSS custom properties on `:root`** — causes palette drift across pages. Avoid: define kaos palette as `--kaos-*` vars on `:root` in `src/styles.scss`, override Bootstrap `--bs-*` there, reference via `var(--kaos-*)` everywhere. Owner: Phase 1.
2. **Editing Bootstrap's dist CSS or files inside `node_modules`** — changes wiped on `npm install`/CI/deploy; never apply to Nemotron-generated output. Avoid: never touch `node_modules`; use `:root` CSS variable overrides or Sass `!default` override ordering. Owner: Phase 1.
3. **Auth pages (login/signup) look like a different app** — full-page routes bypass the shared app shell and fail to inherit theme/logo. Avoid: wrap auth pages in the same brand theme context; review login/signup side-by-side with dashboard. Owner: Phase 3.
4. **Incomplete favicon/asset handling (only `favicon.ico`)** — iOS/Android/PWA icons missing; blurry raster logo on retina. Avoid: complete icon set (SVG + ICO `rel=icon`, `apple-touch-icon` 180×180, Android icons, `site.webmanifest`, `theme-color` meta); SVG logo with PNG fallback. Owner: Phase 2.
5. **Nemotron-generated templates bypass the brand theme** — generated previews/exports look like stock Bootstrap, breaking brand consistency. Avoid: update Nemotron system prompt to emit `--kaos-*`/`--bs-*` variable usage matching kaos palette; preview page applies same global theme. Owner: Phase 3.

Additional tracked pitfalls: hardcoded absolute asset paths breaking on deploy subpaths (Phase 2), WCAG contrast failures on dark base (Phase 1), theme drift across lazy-loaded feature pages (Phase 3), removed `$theme-colors` keys breaking Bootstrap internals (Phase 1), CSS variables inside media queries silently failing (Phase 1).

## Implications for Roadmap

Based on combined research, the suggested phase structure follows the dependency chain in FEATURES.md: design assets → logo in navbar → consistent branding across all pages, with Bootstrap variable overrides gating the color palette.

### Phase 1: Brand foundation (theme tokens + Bootstrap override + global styles)
**Rationale:** All branding depends on a single source of truth for kaos design tokens; Bootstrap component colors derive from theme variables, so the palette must be defined before any component can be styled correctly. This is the lowest-risk, highest-leverage phase.
**Delivers:** `--kaos-*` CSS custom properties on `:root`, Bootstrap `--bs-*` overrides, `body` slate-900 + Inter font, `src/styles.scss` as the single theme layer, WCAG-validated contrast pairs, visible focus rings on dark bg.
**Addresses:** Kaos color palette globally; Inter typography globally; Bootstrap 5 theme variable overrides.
**Avoids:** Pitfall 1 (hardcoded per-component colors), Pitfall 2 (editing node_modules), Pitfall 3 removal of `$theme-colors` keys, Pitfall 4 (CSS vars in media queries), Pitfall 8 (WCAG contrast failure).
**Research flag:** None — well-documented Bootstrap 5 theming patterns; skip research-phase.

### Phase 2: Assets & icons (logo, favicon, manifest)
**Rationale:** Design assets are the #1 dependency — the milestone is blocked until the kaos logo and favicon exist in the repo. Assets must be complete (not just `favicon.ico`) and referenced through Angular's asset pipeline, not hardcoded absolute paths.
**Delivers:** kaos logo SVG + PNG fallback in `public/assets/`, complete favicon set (SVG + ICO, `apple-touch-icon` 180×180, Android icons), `site.webmanifest`, `theme-color` meta, `index.html` head updates (title, font link, icon link), favicon swap.
**Addresses:** Kaos logo in navbar (asset dependency); kaos favicon.
**Uses:** `public/` assets glob already configured in `angular.json`.
**Avoids:** Pitfall 6 (incomplete favicon/assets), Pitfall 7 (hardcoded absolute asset paths breaking on subpaths).
**Research flag:** Phase 2 needs design-asset confirmation (logo file source — extract from kaosnet.org or commission); standard asset-handling patterns otherwise.

### Phase 3: Cross-page consistency (auth, generation, gallery, edit)
**Rationale:** Once tokens and assets exist, branding must be verified across every route. Auth pages bypass the app shell and are the highest drift risk; Nemotron-generated output must be brought under the theme so previews/exports match the app shell.
**Delivers:** kaos-branded login/signup (slate-900 bg, logo, Inter), branded paywall modal & toast, branded preview iframe shell, kaos-colored loading/empty states, Nemotron prompt updated to emit kaos tokens, theme-consistency review of all routes together.
**Addresses:** Consistent branding across all pages; branded paywall modal & toast (P2); branded preview iframe shell (P2); kaos-colored loading/empty states (P3).
**Uses:** Theme tokens from Phase 1; assets from Phase 2.
**Avoids:** Pitfall 5 (unbranded auth pages), Pitfall 9 (Nemotron output off-brand), Pitfall 10 (feature page theme drift).
**Research flag:** Phase 3 likely needs `/gsd:plan-phase --research-phase 3` — Nemotron prompt engineering for brand-token output is a niche integration with sparse documentation.

### Phase Ordering Rationale

- **Why this order:** Phase 1 (tokens) → Phase 2 (assets) → Phase 3 (apply + verify) follows the hard dependency chain: you cannot render a logo that doesn't exist (Phase 2 blocks Phase 3 navbar work), and Bootstrap components keep default colors until theme variables are overridden (Phase 1 blocks all visual branding).
- **Why this grouping:** Phase 1 and 2 are infra-ish theming work; Phase 3 is page-surface work that consumes the foundation. This matches the app-shell architecture where `app.html` (navbar + router-outlet + toast) cascades branding to all routes.
- **How this avoids pitfalls:** Centralizing tokens in Phase 1 prevents component-level hardcoding (Pitfall 1) and theme drift (Pitfall 10); banning `node_modules` edits in Phase 1 prevents CI-wiped customizations (Pitfall 2); Phase 3 explicitly targets auth-page branding (Pitfall 5) and Nemotron output (Pitfall 9).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified via npm registry; kaosnet.org design tokens verified by direct live-site fetch; Bootstrap theming docs well-documented. |
| Features | HIGH | kaosnet.org branding read directly from local `about.html`; Angular app structure read directly from source; milestone scope and exclusions clear. |
| Architecture | LOW | ARCHITECTURE.md research unavailable (researcher failed 3 times). Architecture inferred from FEATURES.md/STACK.md only; component boundaries and data flow not independently researched. |
| Pitfalls | MEDIUM | Bootstrap 5.3 docs (CSS variables, Sass theming) and MDN icon/link docs are primary sources; some MDN sources flagged LOW confidence. Pitfall-to-phase mapping is coherent but not yet validated in code. |

**Overall confidence:** HIGH (stack + features drive the roadmap; architecture gap noted as a gap to address).

### Gaps to Address

- **Architecture research missing:** ARCHITECTURE.md not available. Before finalizing the roadmap, confirm component boundaries, data flow, and whether the app shell (`app.html` = navbar + router-outlet + toast) is the correct theming surface for all routes including auth.
- **Design assets not yet in repo:** The kaos logo and favicon files are the #1 blocking dependency. Confirm asset source (extract from kaosnet.org or commission) before scheduling Phase 2.
- **Inter vs Jost font discrepancy:** STACK.md found kaosnet.org actually loads Jost, not Inter. The task requires Inter; flag this as a decision point (honor explicit Inter requirement vs. pixel-exact Jost match).
- **Nemotron prompt engineering:** No prior research on instructing the generation model to emit kaos design tokens; Phase 3 may need dedicated research.

## Sources

### Primary (HIGH confidence)
- Live site fetch: https://kaosnet.org — HTML and compiled CSS; design tokens extracted directly (slate-900 `#020617`, violet `#7c3aed`, blue `#2563eb`, yellow `#fde047`, red `#dc2626`; font = Jost via Google Fonts). (STACK.md)
- npm registry (`npm view bootstrap`, `npm view @angular/core`) — verified `bootstrap` 5.3.9 and `@angular/core` 22.3.0 installed; `sass` present in `node_modules`. (STACK.md)
- Bootstrap 5.3 theming docs — CSS custom properties / Sass variables / `color-contrast()` WCAG function. (STACK.md, PITFALLS.md)
- kaosnet.org branding reference: local `about.html` (bg-slate-900, Inter Google Fonts, favicon, "Kaos Digital — AI & IT Systems for Local Business"). (FEATURES.md)
- Angular app source: `src/` — app shell, navbar, routes, components; confirms Bootstrap 5 + standalone components structure. (FEATURES.md)
- `angular.json` — `inlineStyleLanguage: scss`, `public/` assets glob, styles/build configuration. (STACK.md, FEATURES.md, PITFALLS.md)

### Secondary (MEDIUM confidence)
- Bootstrap 5.3 CSS variables docs (root variables, dark mode, `--bs-*` prefix, media-query limitation): https://getbootstrap.com/docs/5.3/customize/css-variables/ (PITFALLS.md)
- Bootstrap 5.3 Sass customizing docs (`!default` ordering, `$theme-colors` required keys): https://getbootstrap.com/docs/5.3/customize/sass/ (PITFALLS.md)
- Angular 22.3.0 project structure — `src/styles.scss` global stylesheet, standalone components. (PITFALLS.md)

### Tertiary (LOW confidence)
- MDN `<link>` element — `rel="icon"`, `rel="apple-touch-icon"`, `sizes`/`type` hints, CSP `img-src` applies to favicon: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link (PITFALLS.md — needs validation against actual deployment)

---
*Research completed: 2026-11-23*
*Sources synthesized: STACK.md, FEATURES.md, PITFALLS.md (ARCHITECTURE.md unavailable)*
*Ready for roadmap: yes*
