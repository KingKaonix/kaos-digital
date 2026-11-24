# Phase 5 Plan — Brand Foundation

**Milestone:** v1.1 Kaos Brand  
**Phase:** 5 (continues from v1.0's Phase 4)  
**Goal:** The app has a single source of truth for kaos design tokens (slate-900 background, violet #7c3aed primary, Inter typography) with Bootstrap 5 components inheriting brand colors via `--bs-*` overrides — no hardcoded hex in components, no edits to node_modules.  
**Requirements:** BRAND-01, BRAND-02, BRAND-05  
**Depends on:** Nothing (first phase of v1.1; builds on v1.0 validated auth/generation/persistence/monetization)  
**Status:** Planned

---

## Scope Boundary

**In scope (BRAND-01, BRAND-02, BRAND-05):**
- Kaos color palette (`--kaos-*` CSS custom properties on `:root`) applied globally
- Bootstrap 5 `--bs-*` theme variable overrides with kaos palette
- Inter typography (Google Fonts 400/500/600/700) across all pages
- WCAG-validated contrast on dark slate-900 base

**Out of scope (deferred to Phase 6):**
- Kaos logo in navbar (BRAND-03)
- Kaos favicon (BRAND-04)
- Branded paywall/toast/preview/loading/404 (BRAND-06 through BRAND-010, Phase 7)

---

## Tracer Slice (Task 5.01) — Verified Before Expansion

**Task 5.01 — Tracer: Global theme tokens applied end-to-end**

Apply `--kaos-*` design tokens on `:root` in `src/styles.scss`, override Bootstrap `--bs-*` variables, set `body` background to slate-900 and Inter font globally. Verify the app renders slate-900 + Inter end-to-end before any per-component styling.

**Files:**
- `src/styles.scss` — create theme token layer (`--kaos-*` + `--bs-*` overrides)
- `src/index.html` — add Inter Google Fonts `<link>` + preconnect

**Acceptance criteria:**
- `tsc --noEmit` passes with zero errors
- App body renders `bg-slate-900` (#020617)
- Body text uses Inter font
- Bootstrap buttons render violet #7c3aed primary (not Bootstrap default blue)
- `grep` for hardcoded kaos hex values in `src/` components returns zero matches (tokens via `var(--kaos-*)` only)

**Verification command:** `npx tsc --noEmit && echo "TSC_OK"`

**Threat model:** T-5-01 — Hardcoded hex in components causes palette drift. Mitigation: all colors via `var(--kaos-*)`; verified by grep.

**Reversibility:** checkpoint:decision — kaos palette hex values (#020617, #7c3aed). Changing them after Phase 5 requires updating `--kaos-*` tokens (low cost, not one-way).

---

## Expansion Tasks (after tracer verified)

**Task 5.02 — Bootstrap `--bs-*` variable overrides**

Override Bootstrap theme variables (`--bs-body-bg`, `--bs-primary`, `--bs-secondary`, `--bs-dark`, `--bs-light`, `--bs-focus-ring`, etc.) with kaos palette values so all Bootstrap components (buttons, cards, modals, navbars, badges) inherit brand colors automatically.

**Files:** `src/styles.scss`

**Acceptance criteria:**
- Bootstrap buttons render #7c3aed primary
- Bootstrap focus rings use kaos accent
- No Bootstrap default blue (#0d6efd) visible in rendered app
- WCAG contrast 4.5:1 text / 3:1 non-text on all brand pairs

**Verification command:** `npx tsc --noEmit && echo "TSC_OK"`

**Threat model:** T-5-02 — Removed `$theme-colors` keys break Bootstrap internals. Mitigation: never remove required keys (`primary`, `secondary`, `danger`); only override values. T-5-03 — CSS variables inside media queries silently fail. Mitigation: avoid `--kaos-*` inside `@media`; verify visually.

**Reversibility:** checkpoint:decision — Bootstrap variable mapping. Reversible (just change variable values).

---

**Task 5.03 — WCAG contrast validation on dark base**

Define and verify kaos color contrast pairs meet WCAG AA (4.5:1 text, 3:1 non-text) on slate-900 background. Document contrast ratios for each brand foreground/background combination.

**Files:** `src/styles.scss` (token values), `docs/KAOS_BRAND.md` (optional contrast reference)

**Acceptance criteria:**
- `--kaos-text-primary` on `--kaos-bg-primary` passes 4.5:1
- `--kaos-text-secondary` on `--kaos-bg-primary` passes 4.5:1
- `--kaos-accent` (violet) on slate-900 passes 4.5:1
- Focus rings visible on dark background

**Verification command:** `npx tsc --noEmit && echo "TSC_OK"` + manual contrast check

**Threat model:** T-5-04 — WCAG contrast failure on dark base. Mitigation: validate all pairs before closing phase.

---

**Task 5.04 — Zero hardcoded kaos hex sweep**

Sweep all `src/` component files for hardcoded kaos hex values (#020617, #7c3aed, etc.) and replace with `var(--kaos-*)` references. Ensures single source of truth.

**Files:** `src/**/*.ts`, `src/**/*.html`, `src/**/*.scss`

**Acceptance criteria:**
- `grep -rn '#020617\|#7c3aed\|#2563eb\|#fde047\|#dc2626' src/` returns zero matches in component files
- All brand colors referenced via `var(--kaos-*)`

**Verification command:** `grep -rn '#020617\|#7c3aed' src/ | grep -v styles.scss | echo "CHECKED"` (expect empty)

**Threat model:** T-5-01 (recurrence) — palette drift via hardcoded values. Mitigation: grep sweep as gate.

---

## Execution Waves

**Wave 1 (sequential, tracer-first):**
- Task 5.01 (tracer) — must pass verification before Wave 2

**Wave 2 (parallel, after tracer):**
- Task 5.02 (Bootstrap variable overrides)
- Task 5.03 (WCAG contrast validation)

**Wave 3 (after Wave 2):**
- Task 5.04 (hardcoded hex sweep) — final gate

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | Zero errors |
| No hardcoded hex | `grep -rn '#020617\|#7c3aed' src/ --include='*.ts' --include='*.html'` | Empty (except styles.scss) |
| WCAG contrast | Manual review of `--kaos-*` pairs | 4.5:1 text / 3:1 non-text |

---

## REQUIREMENTS.md Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 5 | Planned |
| BRAND-02 | Phase 5 | Planned |
| BRAND-05 | Phase 5 | Planned |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Palette drift (hardcoded hex in components) | All colors via `var(--kaos-*)`; grep sweep as final gate (T-5-01) |
| node_modules edits wiped on deploy | Never edit `node_modules`; use `:root` CSS variable overrides (T-5-02) |
| WCAG contrast failure on dark base | Validate all pairs before closing phase (T-5-04) |
| CSS vars in media queries silently fail | Avoid `--kaos-*` inside `@media` (T-5-03) |

---

## Definition of Done (Phase 5)

- [ ] Task 5.01 tracer: `src/styles.scss` has `--kaos-*` tokens + `--bs-*` overrides; `src/index.html` has Inter font link; app renders slate-900 + Inter
- [ ] Task 5.02: Bootstrap components render kaos palette, not defaults
- [ ] Task 5.03: WCAG contrast passes on all brand pairs
- [ ] Task 5.04: Zero hardcoded kaos hex in `src/` components
- [ ] `tsc --noEmit` passes with zero errors
- [ ] REQUIREMENTS.md traceability updated: BRAND-01/02/05 → Phase 5

---

*Phase 5 plan ready for execution via `/gsd:execute-phase 5`*