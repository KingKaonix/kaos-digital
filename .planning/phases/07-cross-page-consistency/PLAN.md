# Phase 7 Plan — Cross-Page Consistency

**Milestone:** v1.1 Kaos Brand  
**Phase:** 7 (final phase of v1.1)  
**Goal:** Every existing page and surface (login, signup, dashboard, generate, gallery, edit, paywall modal, toast, loading states, empty states, 404) carries consistent kaos branding, and generated template previews match the app shell (generated code untouched).  
**Requirements:** BRAND-06, BRAND-07, BRAND-08, BRAND-09, BRAND-010  
**Depends on:** Phase 6 (Assets & Icons)  
**Status:** Planned

---

## Scope Boundary

**In scope (BRAND-06 through BRAND-010):**
- BRAND-06: Kaos branding (slate-900 bg, Inter font, logo, dark cards) on login, signup, dashboard, generate, gallery, edit, paywall modal, toast
- BRAND-07: Branded paywall modal + toast notifications using kaos accent colors
- BRAND-08: Branded preview iframe shell (kaos header/footer; generated code untouched)
- BRAND-09: Kaos-colored loading and empty states across all pages
- BRAND-010: Branded 404/not-found page using kaos palette

**Out of scope:**
- Rebranding AI-generated template output (core value: editable boilerplate)
- New features beyond branding existing surfaces

---

## Kaos dark-theme utility classes (added to styles.scss)

Add to `src/styles.scss` (Phase 5 already defined `--kaos-*` CSS vars):

| Class | Purpose |
|-------|---------|
| `.kaos-bg` | `background-color: var(--kaos-bg-primary)` |
| `.kaos-text` | `color: var(--kaos-text-primary)` |
| `.kaos-card` | dark card: bg slate-900, border kaos-accent, text light |
| `.kaos-card-body` | card body with dark bg + light text |
| `.kaos-form-control` | dark input: bg darker slate, light text, kaos focus |
| `.kaos-alert-*` | kaos-colored alert variants |
| `.kaos-spinner` | kaos-accent primary spinner |
| `.kaos-empty` | centered empty-state styling |
| `.kaos-page` | full-page dark container (replaces `.container mt-5` on auth pages) |

---

## Tasks

### Task 7.01 — Kaos dark-theme utility CSS (enabler for all tasks)

**Files:** `src/styles.scss`

Add `.kaos-bg`, `.kaos-text`, `.kaos-card`, `.kaos-card-body`, `.kaos-form-control`, `.kaos-alert-*`, `.kaos-spinner`, `.kaos-empty`, `.kaos-page` utility classes using `var(--kaos-*)` tokens.

**Acceptance criteria:**
- All classes compile in SCSS
- `tsc --noEmit` passes (no TS impact, CSS-only)

---

### Task 7.02 — Brand auth pages (login + signup) — BRAND-06

Replace `.container mt-5` + white-card structure with kaos dark page wrapper + kaos card.

**Files:**
- `src/app/features/auth/login/login.component.ts` (inline template)
- `src/app/features/auth/signup/signup.component.ts` (inline template)

**Changes:**
- Wrapper: `<div class="kaos-page min-vh-100 d-flex align-items-center justify-content-center py-4">`
- Card: `<div class="kaos-card shadow">` with `.kaos-card-body`
- Form labels: `text-light` (kaos-text)
- Form controls: `.kaos-form-control`
- Alerts: `.kaos-alert-danger`
- Primary button: Bootstrap `btn-primary` (already kaos violet via Phase 5 `--bs-primary`)

**Acceptance criteria:**
- Login/signup render on slate-900 background
- Cards are dark (kaos-card), not white
- Form inputs dark with light text
- `tsc --noEmit` passes

---

### Task 7.03 — Brand dashboard — BRAND-06

**Files:** `src/app/features/dashboard/dashboard.component.ts`

**Changes:**
- Wrapper: `.kaos-page` + `.kaos-card` + `.kaos-card-body`
- Text: `text-light` / `kaos-text`
- Welcome message uses kaos text color

**Acceptance criteria:**
- Dashboard renders on slate-900 background with dark card
- `tsc --noEmit` passes

---

### Task 7.04 — Brand paywall modal — BRAND-07

**Files:** `src/app/shared/paywall-modal.component.html`

**Changes:**
- Modal backdrop: kaos dark overlay
- Modal content: `.kaos-card` dark bg, not white
- Crown icon: kaos-accent-primary color (`text-violet` via style)
- Title: `kaos-text`
- Body text: `text-light` secondary
- "Upgrade now" button: `btn-primary` (kaos violet)
- "Not now" button: `btn-outline-light` (kaos border)

**Acceptance criteria:**
- Paywall modal uses dark kaos palette, not Bootstrap white defaults
- Crown icon is kaos violet
- `tsc --noEmit` passes

---

### Task 7.05 — Brand toast component — BRAND-07

**Files:** `src/app/shared/toast/toast.component.ts` (inline template)

**Changes:**
- Toast container: kaos dark bg
- Toast items: `.kaos-card` style per type (success/danger/info/warning) with kaos accent borders
- Close button: `btn-close-white` on dark bg (keep)
- Action button: kaos-accent styling

**Acceptance criteria:**
- Toasts render on dark slate base with kaos-colored variants
- `tsc --noEmit` passes

---

### Task 7.06 — Brand preview iframe shell — BRAND-08

**Files:** `src/app/features/generate/preview/preview.component.ts`

**Changes:**
- Iframe HTML `<body>` background: `var(--kaos-bg-primary)` (slate-900), not `#f8f9fa`
- Iframe text color: `var(--kaos-text-primary)`
- Preview iframe shell header: kaos-branded bar (slate-900 + violet accent)
- Generated code untouched (still inside `<script type="text/plain">`)
- Loading spinner: kaos-accent color
- Error state: kaos-accent warning color

**Acceptance criteria:**
- Preview iframe uses kaos dark theme shell
- Generated Angular code is NOT modified (core value preserved)
- `tsc --noEmit` passes

---

### Task 7.07 — Kaos-colored loading + empty states — BRAND-09

**Files:** `src/styles.scss` (enabler), applied across components

**Changes:**
- `.kaos-spinner`: `color: var(--kaos-accent-primary)`
- `.kaos-empty`: centered, `kaos-text-secondary`, kaos accent icon color
- Apply kaos spinner to preview loading state (already references `text-primary` → kaos violet via Phase 5)
- Apply kaos empty state to gallery empty state

**Acceptance criteria:**
- Loading spinners render kaos violet
- Empty states use kaos secondary text + accent accents
- `tsc --noEmit` passes

---

### Task 7.08 — Branded 404/not-found page — BRAND-010

**Files:**
- `src/app/features/not-found/not-found.component.ts` (new component)
- `src/app/app.routes.ts` — change `{ path: '**', redirectTo: '/dashboard' }` to `{ path: '**', component: NotFoundComponent }`

**Changes:**
- NotFoundComponent: kaos page wrapper, kaos card, "404 — Page not found" heading, kaos violet accent, link back to dashboard
- Route: `**` → NotFoundComponent

**Acceptance criteria:**
- Unknown routes render branded 404 page (slate-900, kaos card, violet accents)
- Link "Back to Dashboard" navigates to `/dashboard`
- `tsc --noEmit` passes
- Route registered in app.routes.ts

---

## Execution Waves

**Wave 1 (foundation, sequential):**
- Task 7.01 (kaos utility CSS) — prerequisite for all styling tasks

**Wave 2 (page branding, parallel after 7.01):**
- Task 7.02 (login + signup)
- Task 7.03 (dashboard)
- Task 7.04 (paywall modal)
- Task 7.05 (toast component)
- Task 7.08 (404 page + route)

**Wave 3 (preview + loading/empty, parallel after 7.01):**
- Task 7.06 (preview iframe shell)
- Task 7.07 (loading + empty states)

---

## REQUIREMENTS.md Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-06 | Phase 7 | Planned |
| BRAND-07 | Phase 7 | Planned |
| BRAND-08 | Phase 7 | Planned |
| BRAND-09 | Phase 7 | Planned |
| BRAND-010 | Phase 7 | Planned |

---

## Definition of Done (Phase 7)

- [ ] Task 7.01: kaos dark-theme utility CSS in styles.scss
- [ ] Task 7.02: login + signup pages branded (BRAND-06)
- [ ] Task 7.03: dashboard branded (BRAND-06)
- [ ] Task 7.04: paywall modal branded (BRAND-07)
- [ ] Task 7.05: toast component branded (BRAND-07)
- [ ] Task 7.06: preview iframe shell branded (BRAND-08)
- [ ] Task 7.07: loading + empty states kaos-colored (BRAND-09)
- [ ] Task 7.08: branded 404 page + route (BRAND-010)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] REQUIREMENTS.md: BRAND-06 through BRAND-010 → Phase 7 Complete
- [ ] All v1.1 requirements (BRAND-01 through BRAND-010) Complete

---

*Phase 7 plan ready for execution.*