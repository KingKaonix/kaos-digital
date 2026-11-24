# Phase 6 Plan — Assets & Icons

**Milestone:** v1.1 Kaos Brand  
**Phase:** 6  
**Goal:** Kaos logo and favicon assets exist in the repo and are wired into the Angular app shell, so the brand mark and tab identity appear on every page without broken asset paths.  
**Requirements:** BRAND-03, BRAND-04  
**Depends on:** Phase 5 (Brand Foundation)  
**Status:** Planned

---

## Scope Boundary

**In scope (BRAND-03, BRAND-04):**
- Kaos logo SVG/PNG in `public/assets/`, rendered in navbar replacing "AI Template Generator" text
- Kaos favicon (PNG + ICO fallback) replacing default Angular favicon
- Complete icon set: apple-touch-icon, site.webmanifest, theme-color meta
- Updated page title: "Kaos Digital — AI Template Generator"

**Out of scope:**
- Per-user brand kit / theme editor (v2+)
- Multiple logo variants / light mode (v2+)

---

## Available Assets (already exist on disk)

- `/data/data/com.termux/files/home/kaosnet-logo.png` — 512×512 PNG (50KB)
- `/data/data/com.termux/files/home/kaosnet-logo.webp` — 512×512 WebP (24KB)
- `/data/data/com.termux/files/home/storage/kaosnet/public/favicon.ico` — default Angular favicon (to be replaced)

No ImageMagick available, so favicon will use PNG (modern browser compatible) + ICO fallback.

---

## Tasks

### Task 6.01 — Add kaos logo assets to public/

Copy the kaos logo into `public/assets/` so Angular's asset pipeline serves them.

**Files:**
- `public/assets/logo.png` — copy of kaosnet-logo.png
- `public/assets/logo.webp` — copy of kaosnet-logo.webp (PNG fallback)

**Acceptance criteria:**
- Both files exist in `public/assets/`
- `ng build` copies them to dist (verified by build output)

**Verification command:** `ls public/assets/logo.png public/assets/logo.webp`

---

### Task 6.02 — Wire logo into navbar (BRAND-03)

Replace the "AI Template Generator" text brand with the kaos logo image in `navbar.component.ts` inline template.

**Files:**
- `src/app/shared/navbar/navbar.component.ts` — `<a class="navbar-brand" routerLink="/"><img src="assets/logo.png" alt="Kaos Digital" height="32"></a>`

**Acceptance criteria:**
- Navbar renders `` logo instead of plain text
- Logo has alt text
- Navbar brand links to `/`
- `tsc --noEmit` passes

**Verification command:** `npx tsc --noEmit`

---

### Task 6.03 — Complete favicon set + index.html head (BRAND-04)

Replace default Angular favicon with kaos branding: PNG favicon (primary), ICO fallback, apple-touch-icon, site.webmanifest, theme-color meta, and updated page title.

**Files:**
- `public/favicon.ico` — replace with kaos-branded ICO (copy logo.png renamed, or keep as PNG fallback)
- `public/assets/favicon.png` — kaos favicon PNG
- `public/assets/apple-touch-icon.png` — kaos apple touch icon
- `public/site.webmanifest` — PWA manifest
- `src/index.html` — icon links, theme-color meta, updated title

**Acceptance criteria:**
- `<link rel="icon" type="image/png" href="assets/favicon.png">` present
- `<link rel="icon" href="favicon.ico" sizes="any">` fallback present
- `<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">` present
- `<meta name="theme-color" content="#020617">` present
- `<title>Kaos Digital — AI Template Generator</title>` set
- `tsc --noEmit` passes

**Verification command:** `npx tsc --noEmit`

---

### Task 6.04 — Verify asset pipeline + no regressions

Confirm `ng build` copies assets to dist and no new template/Sass errors introduced (pre-existing Phase 2 NG8002 routerLink issues remain out of scope).

**Acceptance criteria:**
- `tsc --noEmit` passes
- `ng build` completes (only pre-existing NG8002 errors, no new errors)
- dist/ contains assets/logo.png, assets/favicon.png

**Verification command:** `npx tsc --noEmit && npx ng build 2>&1 | grep -i "error" | grep -v "NG8002\|routerLink" || echo "NO_NEW_ERRORS"`

---

## Execution Waves

**Wave 1 (sequential):**
- Task 6.01 (copy logo assets) — prerequisite for 6.02, 6.03
- Task 6.02 (navbar logo) — after 6.01
- Task 6.03 (favicon + index.html) — after 6.01
- Task 6.04 (verify) — after 6.02, 6.03

---

## REQUIREMENTS.md Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-03 | Phase 6 | Planned |
| BRAND-04 | Phase 6 | Planned |

---

## Definition of Done (Phase 6)

- [ ] Task 6.01: logo.png + logo.webp in public/assets/
- [ ] Task 6.02: navbar renders kaos logo image (BRAND-03)
- [ ] Task 6.03: favicon set + theme-color + updated title (BRAND-04)
- [ ] Task 6.04: tsc --noEmit passes, ng build copies assets, no new errors
- [ ] REQUIREMENTS.md: BRAND-03/04 → Phase 6 Complete

---

*Phase 6 plan ready for execution.*