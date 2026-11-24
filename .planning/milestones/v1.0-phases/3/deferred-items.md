# Deferred Items — Phase 3 (Persistence)

## Pre-existing build errors (out of scope — discovered during Phase 3 verification, not caused by Phase 3 changes)

These errors pre-date Phase 3 (present on `agent-phase-2`, commit `0b47d29`) and live in Phase 2 files. Per the SCOPE BOUNDARY, they were NOT fixed as part of this phase.

1. `src/app/core/generation.service.ts` (Phase 2)
   - TS2769: HttpClient `signal` option not available in this @angular/common version.
   - TS2339: HTTP response typed as `ArrayBuffer` — `.error` / `.code` properties don't exist.
   - Effect: `tsc --noEmit` and `ng build` fail on this file regardless of Phase 3.

2. `src/app/features/generate/generate.component.html` (Phase 2)
   - NG8002: `routerLink` bound on `<a>` but `RouterLink` not imported in GenerateComponent.
   - NG8109: `isLoading` is a signal (`this.generation.generating`) used in template without `()`.

**Impact:** `ng build` exits 1 due to these pre-existing errors. All Phase 3 files type-check cleanly (`tsc --noEmit` shows zero errors in Phase 3 files; the only remaining errors are the two Phase 2 files above).

**Recommended fix:** Phase 4 or a dedicated cleanup task — import `RouterLink` in GenerateComponent, invoke `isLoading()` in its template, and type the HttpClient response in generation.service.ts.
  status: acknowledged
