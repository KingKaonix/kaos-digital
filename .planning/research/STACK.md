# Stack Research — CSS/Theming Stack (v1.1 Kaos Brand)

**Domain:** CSS/theming additions to match kaosnet.org (Kaos Digital) visual branding on an existing Angular 22 + Bootstrap 5 standalone-component app
**Project:** AI Template Generator — milestone v1.1 Kaos Brand
**Researched:** 2026-11-23
**Overall confidence:** HIGH (versions verified via npm registry; kaosnet.org design tokens verified by fetching the live site)

## Scope of This Research

This covers ONLY the new branding capabilities for milestone v1.1:
- Apply kaosnet.org color palette (slate-900 background, violet primary, accent colors)
- Apply kaosnet.org typography (Inter, per requirement — see note below)
- Integrate kaos logo + favicon
- Consistent branding across auth, generation, gallery, and edit pages

It does NOT re-research the validated stack (Auth/Supabase, Generation/Nemotron, Persistence, Monetization/Stripe) from v1.0.

## Key Finding — kaosnet.org's Actual Design (verified by direct fetch)

I fetched https://kaosnet.org and parsed its compiled CSS. The live site is built with **Tailwind CSS**, but the design tokens are what matter for the Bootstrap 5 app:

| Design Token | kaosnet.org value | Bootstrap 5 mapping | Where used |
|--------------|-------------------|---------------------|------------|
| Background | `#020617` (slate-900) | `$body-bg` | `<body>`, all pages |
| Primary | `#7c3aed` (violet-500) | `$primary` | buttons, links, focus rings, navbar |
| Accent blue | `#2563eb` (blue-500/600) | custom var | secondary actions |
| Accent yellow | `#fde047` (yellow-400) | custom var | highlights, CTAs |
| Text | `#fff` (white) | `$body-color` | body/heading text |
| Muted text | `#6b7280` (gray-500) | `$body-color-muted` | secondary text |
| Danger/red | `#dc2626` (red-600) | `$danger` | destructive actions |
| Border | `#475569` (slate-600) / `#cbd5e1` alpha | `$border-color` | inputs, cards |

**Font discrepancy:** The task lists "Inter font", but kaosnet.org actually loads **Jost** from Google Fonts (`family=Jost:wght@300;400;500;600;700&display=swap`), not Inter. Recommendation below honors the explicit Inter requirement but flags Jost as the pixel-exact match.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Bootstrap 5 | 5.3.9 | CSS/UI framework + theming base | Already a dependency; the app and generated output share Bootstrap. Bootstrap 5.3 exposes CSS custom properties and Sass variables ideal for overlaying the kaos palette without replacing Bootstrap. Verified via npm registry. |
| Sass (dart-sass) | bundled with Angular CLI 22.3.0 | Compile SCSS theme overrides | `inlineStyleLanguage: scss` is already set in `angular.json` and `sass` is present in `node_modules`. No new install needed. Used to override Bootstrap Sass variables before Bootstrap's compiled CSS cascades. |
| CSS custom properties | native (no package) | Theme tokens applied at runtime | Bootstrap 5.3 maps components to CSS variables (`--bs-primary`, `--bs-body-bg`, etc.). Overriding these in `:root` lets the kaos palette propagate instantly with zero build-step theming. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Google Fonts (Inter) | n/a (CDN link) | Web font — Inter (300/400/500/600/700) | Load via `<link>` in `src/index.html`. Simplest integration, no build change. Use this to honor the explicit "Inter" requirement. |
| (optional) @fontsource/inter | 5.1.x | Self-hosted Inter font files | Only if you need offline/privacy-hosted fonts (e.g. no Google Fonts request). Adds a build dependency; not required for v1.1. |

No new JavaScript theming library is required. The kaos look is achieved with Bootstrap 5 Sass/CSS-variable overrides plus a font link — zero new runtime dependencies.

## Kaos Brand Design Tokens to Implement

Recommended SCSS variables to add in `src/styles.scss` (map kaosnet.org tokens onto Bootstrap):

```scss
// kaosnet.org brand palette (verified from live site CSS)
$kaos-bg:         #020617 !default;  // slate-900
$kaos-primary:    #7c3aed !default;  // violet-500
$kaos-primary-rgb: 124, 58, 237 !default;
$kaos-accent-blue: #2563eb !default; // blue-500
$kaos-accent-yellow: #fde047 !default; // yellow-400
$kaos-text:       #ffffff !default;
$kaos-muted:      #6b7280 !default;  // gray-500
$kaos-danger:     #dc2626 !default;  // red-600
```

Then override Bootstrap:
```scss
$body-bg:       $kaos-bg;
$body-color:    $kaos-text;
$primary:       $kaos-primary;
$secondary:     $kaos-muted;
$success:       $kaos-accent-blue;
$danger:        $kaos-danger;
$border-color:  rgba($kaos-text, 0.12);
```

## Integration Points (specific files)

| File | Integration point | What to add |
|------|-------------------|-------------|
| `src/styles.scss` | Global theme layer (already empty) | Kaos SCSS variables + Bootstrap Sass variable overrides + `:root` CSS custom properties + Inter `@import`/font declaration + base component styles (`.bg-kaos`, `.text-kaos`, `.btn-kaos`) |
| `angular.json` | Build `styles` array | Ensure kaos theme loads **after** `bootstrap.min.css` so custom rules cascade over Bootstrap. Current order (`src/styles.scss` first, then Bootstrap) means Bootstrap wins on conflicts — **reorder** or use `:root` CSS variables (which cascade naturally regardless of load order). |
| `src/index.html` | Document head | Replace `<title>`, add kaos `<meta name="theme-color" content="#020617">`, add Inter Google Fonts `<link>`, swap `favicon.ico` for kaos favicon |
| `public/favicon.ico` (or `public/assets/favicon-*.ico`) | Static asset | Replace default favicon with kaos brand favicon (reference as `href="favicon.ico"` or hashed asset) |
| `public/assets/logo.svg` | Static asset (new folder) | Add kaos logo SVG; referenced by navbar as `src="/assets/logo.svg"` (`public/` is already a build asset via angular.json glob) |
| `src/app/shared/navbar/navbar.component.ts` | Brand shell | Swap `navbar-dark bg-primary` → kaos classes (`bg-kaos-bg`, `text-kaos-text`), render `<img src="/assets/logo.svg">` as `navbar-brand`, add kaos focus/ring styles |
| Feature pages (login, signup, generate, gallery, edit, dashboard) | Component templates | Apply kaos utility classes; no per-page theming library needed |

Sass availability confirmed: `node_modules/sass` is installed, so `angular.json` `"inlineStyleLanguage": "scss"` works without changes.

## Installation

Bootstrap 5.3.9, @angular/core 22.3.0, and sass are already installed. No new npm package is strictly required. Only add a font (CDN link = zero install) and asset files.

```bash
# Optional: self-hosted Inter (only if avoiding Google Fonts CDN)
npm install @fontsource/inter@5.1.x

# No other new runtime deps. Bootstrap 5.3.9 + sass already present.
```

```html
<!-- src/index.html — head additions -->
<meta name="theme-color" content="#020617">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="icon" type="image/x-icon" href="favicon.ico">
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Bootstrap 5 Sass/CSS-variable overrides (zero new deps) | Tailwind CSS | If you want to rebuild the entire UI utility-first. **Not recommended here** — kaosnet.org uses Tailwind, but the *app* must stay on Bootstrap 5 because generated templates output Bootstrap. Mixing Tailwind + Bootstrap adds a second build step and class conflicts. |
| Google Fonts CDN link | `@fontsource/inter` npm package | If you need offline/self-hosted fonts or want to block external requests. Adds a build dependency; CDN link is simpler for v1.1. |
| `:root` CSS custom properties (runtime theming) | Sass-only variable overrides | CSS variables are preferred because they cascade regardless of `angular.json` load order and allow runtime theme switching later. Sass-only overrides depend on load order. |

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Tailwind CSS as a second framework | Conflicts with Bootstrap 5 (utility class collisions, two build pipelines, bundle bloat). The generator's *output* is Bootstrap 5, so the app must stay Bootstrap-aligned. kaosnet.org uses Tailwind, but that is the marketing site, not the Angular app stack. | Bootstrap 5 Sass/CSS-variable overrides (already in stack) |
| `ngx-bootstrap` / `@ng-bootstrap/ng-bootstrap` | Bootstrap 5 support incomplete; version-coupled to Bootstrap; adds an abstraction layer the generated templates don't use. Already rejected in the v1.0 STACK.md. | Plain Bootstrap 5 classes in Angular standalone components |
| CSS-in-JS (styled-components, emotion, etc.) | Not idiomatic in Angular; adds runtime bundle size and a non-SSCS build step; fights Angular's view encapsulation model. | Component SCSS + global `styles.scss` |
| A theme-switcher / context-provider library | v1.1 is a single fixed kaos brand (dark slate). A full light/dark theme engine is premature complexity. | Hard-coded kaos CSS variables; add switching only if a real multi-theme requirement emerges |
| A dedicated icon font library (e.g. FontAwesome npm) | The kaos logo is an image/SVG; Bootstrap icons can be added via CDN if needed later. | SVG logo asset in `public/assets/` |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `bootstrap@5.3.9` | `@popperjs/core@2.11.8` (already present) | Bootstrap 5 JS dropdowns/tooltips require Popper 2.x; no change needed. |
| `bootstrap@5.3.9` | Angular 22.3.0 standalone components | No conflict — Bootstrap CSS/JS loaded globally, consumed via classes in templates. |
| Sass | Angular CLI 22.3.0 (`inlineStyleLanguage: scss`) | `sass` confirmed present in `node_modules`; no install required. |
| Google Fonts Inter CDN | All browsers | Zero build-step; works alongside Bootstrap 5. |

## Sources

- Live site fetch: https://kaosnet.org — HTML (`body.bg-slate-900`, favicon path) and compiled CSS (`index-Dkm8ZNgY.css`). Design tokens extracted directly (slate-900 `#020617`, violet `#7c3aed`, blue `#2563eb`, yellow `#fde047`, red `#dc2626`, font = Jost via Google Fonts). Confidence: HIGH (direct observation of live production site).
- npm registry (`npm view bootstrap`, `npm view @angular/core`) — verified `bootstrap` 5.3.9 and `@angular/core` 22.3.0 installed; `sass` present in `node_modules`. Confidence: HIGH (direct registry query).
- Bootstrap 5.3 theming docs (CSS custom properties / Sass variables) — standard, well-documented theming mechanism. Confidence: HIGH.
- Angular 22 standalone component / `angular.json` asset and style configuration — confirmed against this project's `angular.json`. Confidence: HIGH.

*CSS/theming stack research for: kaosnet.org branding on Angular 22 + Bootstrap 5 (v1.1 Kaos Brand)*
*Researched: 2026-11-23*
