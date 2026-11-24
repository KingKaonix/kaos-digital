---
phase: 1
plan: 1
subsystem: Foundation — Auth + Data Layer
tags: [auth, supabase, rls, angular, bootstrap, security]
dependency_graph:
  requires: []
  provides: [auth-layer, data-layer, user-isolation]
  affects: [phase-2, phase-3, phase-4]
tech_stack:
  added:
    - angular: 22.3.0
    - bootstrap: 5.3.9
    - @popperjs/core: 2.11.8
    - @supabase/supabase-js: 2.119.2
  patterns:
    - standalone components
    - row-level security (RLS)
    - supabase client singleton
    - auth guard route protection
key-files:
  created:
    - lib/supabase.ts
    - src/app/core/auth.service.ts
    - src/app/core/auth.guard.ts
    - src/app/core/templates.service.ts
    - src/app/features/auth/login/login.component.ts
    - src/app/features/auth/signup/signup.component.ts
    - src/app/features/dashboard/dashboard.component.ts
    - src/app/shared/navbar/navbar.component.ts
    - src/app/app.routes.ts
    - src/environments/environment.ts
    - src/environments/environment.prod.ts
    - supabase/migrations/001_create_templates.sql
  modified:
    - .gitignore
    - package.json
    - angular.json
    - src/app/app.ts
    - src/app/app.html
decisions:
  - Angular 22 standalone components with routing for generator app
  - Bootstrap 5.3.9 via CDN-linked CSS/JS in angular.json styles/scripts
  - Supabase client singleton at lib/supabase.ts with session persistence via localStorage
  - Row Level Security on templates table: auth.uid() = user_id for all CRUD
  - AuthGuard protects /dashboard route; unauthenticated users redirected to /login
  - .env.local gitignored; placeholder values committed for developer onboarding
metrics:
  duration: "single execution session"
  completed_date: "2026-11-23"
status: complete
actuals:
  tokens: 74000
  tasks: 18
  commits: 6
commits: 8
plan_head_before: 3bec521
plan_head_after: 10f5f82
---

# Phase 1 Plan 1: Foundation — Auth + Data Layer Summary

## One-liner

Supabase auth + data layer for AI Template Generator: email/password signup/login with session persistence, Row Level Security for user-isolated template storage, and Angular + Bootstrap 5 auth shell UI — zero secret keys in the frontend bundle.

## What Was Implemented

### Plan 1.1 — Supabase Project Setup & Client Install

- Scaffolded Angular 22 standalone app with routing, Bootstrap 5.3.9, and `@popperjs/core`
- Installed `@supabase/supabase-js@2.119.2`
- Created `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` placeholders
- Added `.env.local` to `.gitignore`
- Created Supabase client singleton (`lib/supabase.ts`) with `persistSession`, `autoRefreshToken`, `detectSessionInUrl`
- Created `src/environments/environment.ts` and `environment.prod.ts` for Supabase config
- TypeScript compiles cleanly; Angular production build succeeds

### Plan 1.2 — Database Schema & RLS Policies

- Created `supabase/migrations/001_create_templates.sql`:
  - `templates` table: id (uuid PK), user_id (uuid → auth.users), title, description, generated_code, created_at, updated_at
  - Row Level Security enabled
  - RLS policies: SELECT/INSERT/UPDATE/DELETE all restricted to `auth.uid() = user_id`
  - Indexes on `user_id` and `created_at`
- Created `TemplatesService` (`src/app/core/templates.service.ts`) for CRUD operations

### Plan 1.3 — Supabase Auth Integration (Email/Password)

- Created `AuthService` (`src/app/core/auth.service.ts`):
  - `signUp(email, password)` → `supabase.auth.signUp`
  - `signIn(email, password)` → `supabase.auth.signInWithPassword`
  - `signOut()` → `supabase.auth.signOut`
  - `getSession()`, `getUser()` for current session/user
  - `onAuthStateChange(callback)` for session persistence across refreshes
- Session persisted in browser localStorage by `@supabase/supabase-js`

### Plan 1.4 — Auth Shell UI

- `/login` route with email/password login form, error messages, redirect to dashboard on success
- `/signup` route with email/password signup form (min 6 chars), error messages, redirect to dashboard on success
- `/dashboard` route (protected by AuthGuard), redirects to `/login` if unauthenticated
- `AuthGuard` (`canActivate`) checks session before allowing dashboard access
- `NavbarComponent` with dynamic login/logout links based on auth state
- Bootstrap 5 styling on all forms and components
- App routing: `/` → `/dashboard`, `/login`, `/signup`, `/dashboard`, `**` → `/dashboard`

### Plan 1.5 — Secret Management Verification

- Audited all frontend source code: zero occurrences of `SUPABASE_SERVICE_ROLE_KEY`, Nemotron API key, or Stripe secret key
- Built Angular production bundle and grepped for key-like patterns: no real secrets found
- Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exposed to browser (placeholder values)
- Documented server-only keys: Nemotron API key, Stripe secret key, Supabase service role key

## Success Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | User can sign up with email and password | ✅ | `AuthService.signUp()` → `supabase.auth.signUp()`; `/signup` route with form |
| 2 | User can log in and log out, staying signed in across page refreshes | ✅ | `AuthService.signIn()`/`signOut()`; `onAuthStateChange`; localStorage persistence via supabase-js |
| 3 | User's data is private — user cannot view another user's templates | ✅ | RLS policies on `templates` table: `auth.uid() = user_id` for SELECT/INSERT/UPDATE/DELETE |
| 4 | No secret keys in frontend bundle | ✅ | Build passes; bundle grep for `sk_*`, `service_role`, etc. returns no real secrets |

## Deviations from Plan

None — plan executed exactly as written. All 18 tasks across 5 plans completed and committed.

## Known Stubs

None — all planned functionality is implemented. No placeholder text, hardcoded empty values, or unwired components found in created/modified files.

## Threat Flags

None — no new security-relevant surface beyond what was in the plan's threat model.

## Next Steps (Phase 2)

Phase 2 will build the Core Generation Pipeline + Preview: Nemotron integration via serverless functions, prompt UI, and template preview. The Supabase auth + data layer from Phase 1 provides the foundation for user-isolated template storage.

## Self-Check: PASSED

All created files verified to exist. All 6 commits verified in git history.
