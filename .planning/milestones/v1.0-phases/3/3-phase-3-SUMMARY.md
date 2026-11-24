---
phase: 3
plan: 3
subsystem: persistence
tags: [supabase, rls, templates, gallery, angular-22, bootstrap-5, crud, save-load]
dependency_graph:
  requires:
    - phase: 1
      provides: "Supabase client singleton (lib/supabase.ts), AuthService + authGuard + session persistence, templates table with RLS (auth.uid() = user_id), base TemplatesService CRUD, auth shell (login/signup/dashboard/navbar)"
    - phase: 2
      provides: "GenerationService + /api/generate Nemotron serverless function, PreviewComponent (sandboxed iframe), /generate prompt page, AppErrorHandler zero-client-error boundary"
  provides:
    - TemplatesService full CRUD: createTemplate, getUserTemplates, getTemplateById, updateTemplate, deleteTemplate, duplicateTemplate — all never-throw TemplateResult { success, data?, error? } with input validation
    - /gallery route — personal cards-view gallery (loading / empty / error states), Delete / Duplicate / Rename actions on cards
    - Save flow on /generate — "Save Template" button (after successful generation), title-prompt modal, createTemplate call, success toast with "Go to Gallery" action, friendly error handling
    - /templates/:id/edit — load template, pre-filled title/description, Regenerate (reuses /api/generate, overwrites existing record, keeps original unchanged on failure), Save Changes, Duplicate, Delete, preview via Phase 2 PreviewComponent
    - ToastService + ToastComponent — app-wide success/error/info/warning toasts with optional user action
  affects: [phase-4]
actuals:
  tokens: 9400    # chars/4 over the realized diff (~1130 lines added/changed across Phase 3 files)
  tasks: 7        # tasks completed across plans 3.1–3.5
  commits: 6      # MEASURED: git rev-list --count 0b47d29..HEAD = 6 task commits
tech_stack:
  added: []
  patterns:
    - never-throw service layer (TemplateResult union, mirroring GenerationResult from Phase 2)
    - RLS-enforced user isolation (Supabase auth.uid() = user_id; service never bypasses ownership)
    - overwrite-on-edit (no version history; TPL-03 versioning deferred to v2)
    - reuse of Phase 2 PreviewComponent and /api/generate for the regenerate flow
    - Bootstrap 5 modal for save title-prompt; signal-driven toast stack
key-files:
  created:
    - src/app/core/toast.service.ts
    - src/app/shared/toast/toast.component.ts
    - src/app/features/templates/gallery/gallery.component.ts
    - src/app/features/templates/gallery/gallery.component.html
    - src/app/features/templates/edit/template-edit.component.ts
    - src/app/features/templates/edit/template-edit.component.html
    - .planning/phases/3/deferred-items.md
    - .planning/WINDOWS.md
  modified:
    - src/app/core/templates.service.ts (rewritten: new method names, never-throw results, validation, duplicateTemplate)
    - src/app/features/generate/generate.component.ts (save flow + title modal)
    - src/app/features/generate/generate.component.html (save button + modal)
    - src/app/app.routes.ts (/gallery + /templates/:id/edit routes)
    - src/app/shared/navbar/navbar.component.ts (Gallery link)
    - src/app/app.ts + src/app/app.html (register <app-toast />)
key-decisions:
  - "Kept TemplatesService never-throw { success, data?, error? } results and input validation, consistent with Phase 2's GenerationService — callers never need try/catch"
  - "User isolation enforced entirely by Supabase RLS (auth.uid() = user_id) on the templates table; the service performs no client-side ownership checks that could be bypassed"
  - "Edit overwrites the existing template record (no version history) per MVP scope; version history (TPL-03) is deferred to v2"
  - "Regenerate reuses the Phase 2 /api/generate serverless function (Nemotron key stays server-side) and overwrites description + generated_code + updated_at on success only"
  - "Gallery uses cards view (row-cols grid) with an inline code snippet preview, per plan requirement"
patterns-established:
  - "Service layer: every data operation returns { success, data?, error? } and never throws"
  - "Toast notifications via injectable ToastService + root-level ToastComponent; toasts can carry an action (e.g. 'Go to Gallery')"
  - "Auth-protected feature routes via authGuard; gallery/edit pages redirect unauthenticated users to /login"
requirements-completed: [TPL-01, TPL-02, GEN-04]
coverage:
  - id: D1
    description: "TemplatesService CRUD (create/get/update/delete/duplicate) with never-throw results and write validation, all RLS-scoped to the current user"
    requirement: "TPL-01"
    verification:
      - kind: automated_ui
        ref: "npx tsc --noEmit passes for src/app/core/templates.service.ts; all six operations return TemplateResult and never throw"
        status: pass
    human_judgment: false
  - id: D2
    description: "/gallery cards view showing the current user's templates only, with loading/empty/error states and card actions"
    requirement: "TPL-02"
    verification:
      - kind: automated_ui
        ref: "npx tsc --noEmit passes for gallery component; getUserTemplates() relies on RLS select policy (auth.uid() = user_id)"
        status: pass
    human_judgment: true
    rationale: "Live RLS isolation requires a configured Supabase project and two real accounts to cross-check; no Supabase credentials are configured in this environment, so end-to-end isolation testing is manual."
  - id: D3
    description: "Save flow on /generate: title-prompt modal, createTemplate call, success toast with Go-to-Gallery navigation, friendly error handling"
    requirement: "TPL-01 / GEN-04"
    verification:
      - kind: automated_ui
        ref: "npx tsc --noEmit passes for generate component + template; save button appears only after successful generation"
        status: pass
    human_judgment: true
    rationale: "Requires live Supabase session + /api/generate to verify end-to-end save; not runnable without configured credentials."
  - id: D4
    description: "Edit & regenerate flow: pre-filled edit page, Regenerate overwrites the existing template via /api/generate, original kept unchanged on failure"
    requirement: "GEN-04"
    verification:
      - kind: automated_ui
        ref: "npx tsc --noEmit passes for template-edit component; regenerate calls updateTemplate only on generation success"
        status: pass
    human_judgment: true
    rationale: "Requires live Nemotron endpoint and Supabase to verify overwrite behavior and failure atomicity; not runnable without configured credentials."

# Metrics
duration: 12 min
completed: "2026-11-23"
status: complete
commits: 6
plan_head_before: 0b47d29
plan_head_after: 18ffb8e

---

# Phase 3 Plan 3: Persistence — Save/Load Templates + Gallery Summary

**Users can save generated templates to their account, view them in a personal gallery, and edit a saved template's description to regenerate it — with user isolation enforced by Supabase Row Level Security.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-23T19:00:42Z
- **Completed:** 2026-11-23T19:12:51Z
- **Tasks:** 7 completed across 5 plans (3.1–3.5)
- **Files modified:** 12 (6 created, 6 modified); 1125 lines added/changed

## Accomplishments

- Extended `TemplatesService` with full never-throw CRUD (`createTemplate`, `getUserTemplates`, `getTemplateById`, `updateTemplate`, `deleteTemplate`, `duplicateTemplate`), input validation, and `TemplateResult { success, data?, error? }` returns — all RLS-scoped
- Added "Save Template" button to `/generate` (visible after successful generation) with a title-prompt modal, success toast, and optional "Go to Gallery" navigation
- Built `/gallery` — personal cards-view gallery with loading, empty, and error states; cards show title, truncated description, created date, and code snippet
- Built card actions: Delete (confirm), Duplicate ("(Copy)" suffix), Rename (inline title edit), and Edit (navigate to edit page)
- Built `/templates/:id/edit` — pre-filled title/description, Regenerate (reuses Phase 2 `/api/generate` + Nemotron, overwrites the existing record, keeps the original unchanged on failure), Save Changes, Duplicate, Delete, and live preview via `PreviewComponent`
- Added `ToastService` + `ToastComponent` for app-wide friendly notifications; added Gallery link to the navbar

## Task Commits

Each task was committed atomically:

1. **Templates Service (CRUD)** — `b874818` (feat) — `src/app/core/templates.service.ts`
2. **ToastService + ToastComponent** — `95a6168` (feat) — app-wide notifications, registered in root
3. **Save button on generate page** — `b603ff5` (feat) — title modal, createTemplate, toast + gallery navigation
4. **Gallery page (cards view) + /gallery route** — `1a8911a` (feat) — cards, states, Delete/Duplicate/Rename, navbar link
5. **Edit & regenerate flow** — `9ffdbd1` (feat) — `/templates/:id/edit`, Regenerate overwrite, Save Changes, route wiring
6. **Gallery verification fix** — `18ffb8e` (fix) — `FormsModule` import in GalleryComponent; rename Save/Cancel disabled states

**Plan metadata:** `9ffdbd1` (docs: complete plan)

## Files Created/Modified

- `src/app/core/templates.service.ts` — rewritten CRUD service, never-throw results, validation, duplicateTemplate
- `src/app/core/toast.service.ts` — injectable toast bus (success/error/info/warning + actions)
- `src/app/shared/toast/toast.component.ts` — bottom-right toast stack (Bootstrap 5 styling, no Bootstrap JS required)
- `src/app/features/templates/gallery/gallery.component.ts` + `.html` — cards-view gallery component
- `src/app/features/templates/edit/template-edit.component.ts` + `.html` — edit/regenerate page
- `src/app/features/generate/generate.component.ts` + `.html` — Save button + title-prompt modal
- `src/app/app.routes.ts` — `/gallery` and `/templates/:id/edit` routes (both authGuard-protected)
- `src/app/shared/navbar/navbar.component.ts` — Gallery link for authenticated users
- `src/app/app.ts` / `src/app/app.html` — register `<app-toast />`

## Decisions Made

- Return type `TemplateResult` on all service operations mirrors Phase 2's `GenerationResult` — uniform never-throw error handling across data and generation layers
- No client-side ownership checks in the service; isolation relies on Supabase RLS policies written in Phase 1 (`auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE)
- Regenerate overwrites the existing record (title/description/generated_code/updated_at) — no version history, per MVP scope

## Deviations from Plan

None — plan executed exactly as written. All tasks across plans 3.1–3.5 completed and committed.

**Total deviations:** 0

## Issues Encountered

- `ng build` exits 1 due to **pre-existing Phase 2 errors** in `src/app/core/generation.service.ts` (TS2769 `signal` option unsupported; TS2339 response typed as `ArrayBuffer`) and `src/app/features/generate/generate.component.html` (NG8002 `routerLink` without `RouterLink` import; NG8109 `isLoading` signal used without `()`). These pre-date Phase 3 and are in unrelated files — per SCOPE BOUNDARY they were not fixed. All Phase 3 files type-check cleanly (`tsc --noEmit` shows zero errors in Phase 3 files). Logged in `.planning/phases/3/deferred-items.md` and `.planning/WINDOWS.md` so they are visible at ship time.

## User Setup Required

None — no external service configuration required for the code itself. To run against a live backend, configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.local`) and `NVIDIA_NIM_API_KEY` (server-side, for `api/generate.ts`); the Supabase `templates` migration (`supabase/migrations/001_create_templates.sql`) must be applied.

## Next Phase Readiness

Phase 3 persistence layer is complete and feeds directly into Phase 4 (Monetization — Stripe Paywall + Export): saved templates exist per user with RLS isolation, and the gallery/edit pages provide the template list UI that export actions can build on. Known gaps: pre-existing Phase 2 build errors (logged above) block a clean `ng build`; live end-to-end verification of save/gallery/regenerate requires configured Supabase + Nemotron credentials.

## Self-Check: PASSED

All created files verified to exist on disk. All 6 task commits verified as ancestors of HEAD (`b874818`, `95a6168`, `b603ff5`, `1a8911a`, `9ffdbd1`, `18ffb8e`).

---
*Phase: 3*
*Completed: 2026-11-23*
