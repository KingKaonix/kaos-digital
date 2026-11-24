# Broken-Windows Ledger — AI Template Generator

Cross-phase defect register. Entries block `/gsd:ship` while `open`. Populated per phase during SUMMARY creation (broken-windows ledger, issue #1950).

| # | Kind | Phase | File | Line | Description | Status |
|---|------|-------|------|------|-------------|--------|
| 1 | lint-warning | 2 | src/app/core/generation.service.ts | 68-81 | HttpClient `signal` option unsupported in this @angular/common version; response typed as `ArrayBuffer` so `.error`/`.code` don't exist. Pre-dates Phase 3. `tsc`/`ng build` fail on this file. | open |
| 2 | lint-warning | 2 | src/app/features/generate/generate.component.html | 64 | `routerLink` used but `RouterLink` not imported in GenerateComponent; `isLoading` signal used in template without `()`. Pre-dates Phase 3. | open |
