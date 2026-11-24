# PLAN.md — Phase 1: Foundation — Auth + Data Layer

**Project:** AI Template Generator  
**Phase:** 1 — Foundation — Auth + Data Layer  
**Mode:** MVP  
**Requirements:** AUTH-01, AUTH-02  
**Success Criteria:**
1. User can sign up with email and password
2. User can log in and log out, staying signed in across page refreshes
3. User's data is private — a user cannot view another user's templates or account data
4. No secret keys (Nemotron, Stripe, Supabase service role) are exposed in the frontend bundle

---

## Plan 1.1 — Supabase Project Setup & Client Install

**Goal:** Provision Supabase project, install client SDK, configure environment variables.

**Tasks:**
- [ ] Create Supabase project (free tier)
- [ ] Install `@supabase/supabase-js` (v2.119.2 per research)
- [ ] Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `.env.local` to `.gitignore`
- [ ] Create Supabase client singleton (`lib/supabase.ts`)
- [ ] Verify client initializes without errors

**Definition of Done:** Supabase client is importable across the app; env vars are loaded and not committed.

---

## Plan 1.2 — Database Schema & RLS Policies

**Goal:** Create templates table with user isolation via Row Level Security.

**Tasks:**
- [ ] Create `templates` table migration:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, not null)
  - `title` (text)
  - `description` (text) — the natural-language prompt
  - `generated_code` (text) — Angular + Bootstrap 5 code
  - `created_at` (timestamp, default now)
  - `updated_at` (timestamp, default now)
- [ ] Enable RLS on `templates` table
- [ ] Create RLS policy: users can only SELECT their own templates (`auth.uid() = user_id`)
- [ ] Create RLS policy: users can only INSERT their own templates
- [ ] Create RLS policy: users can only UPDATE their own templates
- [ ] Create RLS policy: users can only DELETE their own templates
- [ ] Verify cross-user isolation (user A cannot query user B's templates)

**Definition of Done:** Templates table exists with RLS; user isolation enforced at database level.

---

## Plan 1.3 — Supabase Auth Integration (Email/Password)

**Goal:** Users can sign up, log in, log out; session persists across refreshes.

**Tasks:**
- [ ] Implement signup form (email + password)
- [ ] Implement login form (email + password)
- [ ] Implement logout action
- [ ] Wire Supabase Auth `signUp`, `signInWithPassword`, `signOut`
- [ ] Handle auth state changes (`onAuthStateChange`)
- [ ] Store session in browser (Supabase handles this via localStorage)
- [ ] Display auth UI conditionally based on session state
- [ ] Show error messages for failed signup/login

**Definition of Done:** A new user can sign up, log in, log out, and remain logged in after page refresh.

---

## Plan 1.4 — Auth Shell UI

**Goal:** Login/signup screens and protected route shell.

**Tasks:**
- [ ] Create `/login` route with login form
- [ ] Create `/signup` route with signup form
- [ ] Create `/dashboard` route (protected, redirects to login if unauthenticated)
- [ ] Create auth guard / middleware to protect dashboard routes
- [ ] Add navigation (login/logout links based on auth state)
- [ ] Style with Bootstrap 5 (consistent with project stack)

**Definition of Done:** Unauthenticated users see login/signup; authenticated users see dashboard.

---

## Plan 1.5 — Secret Management Verification

**Goal:** Confirm no secret keys leak to the frontend bundle.

**Tasks:**
- [ ] Audit all env vars — only `NEXT_PUBLIC_*` prefixed vars exposed to browser
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is NOT in frontend code
- [ ] Confirm Nemotron API key is NOT in frontend code
- [ ] Confirm Stripe secret key is NOT in frontend code
- [ ] Build app and grep bundle for key-like strings
- [ ] Document which keys must be server-only

**Definition of Done:** Build passes; zero secret keys in client-side bundle.

---

## Coverage

| Requirement | Plan(s) | Success Criteria Covered |
|-------------|---------|-------------------------|
| AUTH-01 | 1.1, 1.2, 1.3, 1.4 | 1 |
| AUTH-02 | 1.1, 1.2, 1.3, 1.4 | 2 |
| (data isolation) | 1.2 | 3 |
| (no secrets in frontend) | 1.5 | 4 |

---

*All 5 plans (1.1–1.5) executed and committed. Phase 1 is complete.*