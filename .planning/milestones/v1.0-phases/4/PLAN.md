# PLAN.md — Phase 4: Monetization — Stripe Paywall + Export

**Project:** AI Template Generator  
**Phase:** 4 — Monetization — Stripe Paywall + Export  
**Mode:** MVP  
**Requirements:** EXP-01, EXP-02, EXP-03, EXP-04  
**Success Criteria:**
1. Free users can generate and preview templates without paying
2. Export actions are blocked for free users with a paywall upsell
3. Paid users can download a generated template as a ZIP file
4. Paid users can download deployable Angular project code
5. Paywall is enforced server-side — cannot be bypassed via frontend flags

---

## Plan 4.1 — Stripe Integration & Customer Management

**Goal:** Set up Stripe for subscriptions + one-time payments, with customer and subscription records in Supabase.

**Tasks:**
- [ ] Install `stripe` Node SDK (server-side only)
- [ ] Store `STRIPE_SECRET_KEY` as server-only env var; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for frontend Elements
- [ ] Create Supabase `subscriptions` table: `id`, `user_id` (references auth.users), `stripe_customer_id`, `stripe_subscription_id`, `status` (active/past_due/canceled), `plan_type` (subscription|one_time), `price_id`, `current_period_end`, `created_at`, `updated_at`
- [ ] Enable RLS on `subscriptions` (user can only see their own)
- [ ] Create Stripe customer on user signup (hook into Phase 1 AuthService or on first payment)
- [ ] Webhook endpoint `/api/stripe/webhook` to handle: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Webhook updates `subscriptions` table on payment events
- [ ] Idempotency key handling on webhook processing

**Definition of Done:** Stripe SDK installed, subscriptions table with RLS, webhook endpoint processes Stripe events and updates Supabase.

---

## Plan 4.2 — Entitlement Middleware (Server-Side Paywall)

**Goal:** All export endpoints check paid status server-side via Supabase; frontend flags are UX only.

**Tasks:**
- [ ] Create `checkEntitlement(userId)` server function — queries `subscriptions` table for active status
- [ ] Active = `status = 'active'` AND (`current_period_end` is null for one-time OR `current_period_end` > now for subscription)
- [ ] Export endpoints (`/api/export/zip`, `/api/export/project`) call `checkEntitlement` before returning anything
- [ ] Return 403 with paywall message if not entitled
- [ ] Never trust frontend `isPaid` flag — always verify server-side
- [ ] Cache entitlement briefly (short TTL) to reduce Supabase queries, but always re-verify on export

**Definition of Done:** Export endpoints return 403 for non-paid users; entitlement checked server-side only.

---

## Plan 4.3 — ZIP Export

**Goal:** Paid users can download a generated template as a ZIP file.

**Tasks:**
- [ ] Install `jszip` (or use server-side `archiver`) — server-side preferred for large bundles
- [ ] Create `/api/export/zip` endpoint: authenticated + entitled, accepts template ID, returns ZIP download
- [ ] ZIP contents: `index.html` (or the generated Angular component), `README.txt`, metadata
- [ ] Frontend: "Download ZIP" button on generate/edit pages — disabled for free users, shows paywall upsell
- [ ] Handle ZIP generation errors gracefully (friendly message)

**Definition of Done:** Paid users can download template as ZIP; free users see paywall upsell instead.

---

## Plan 4.4 — Deployable Angular Project Export

**Goal:** Paid users can download a full runnable Angular project bundle.

**Tasks:**
- [ ] Create `/api/export/project` endpoint: authenticated + entitled, accepts template ID, returns ZIP download
- [ ] ZIP contents: `package.json` (Angular 22 deps), `angular.json`, `tsconfig.json`, `src/main.ts`, `src/app/app.component.ts` (generated code), `src/app/app.config.ts`, `src/styles.css` (Bootstrap 5), `README.md` with `npm install` + `ng serve` instructions
- [ ] Code is valid Angular standalone component structure (matches Nemotron system prompt from Phase 2)
- [ ] Frontend: "Download Angular Project" button — disabled for free users, shows paywall upsell
- [ ] Verify ZIP extracts and structure is valid (basic validation)

**Definition of Done:** Paid users can download a runnable Angular project; free users see paywall upsell.

---

## Plan 4.5 — Paywall UI & Pricing

**Goal:** Free users see upgrade prompts; paid users see export buttons.

**Tasks:**
- [ ] Pricing page: subscription tier (monthly) + one-time export tier
- [ ] Stripe Elements payment form (embedded, not redirect) — card element, payment intent creation server-side
- [ ] "Upgrade" button on generate page when free user clicks export
- [ ] "Export" buttons show paywall overlay/modal for free users (not hidden — visible but gated)
- [ ] After successful payment, webhook updates Supabase, frontend refreshes entitlement, export buttons become active
- [ ] Customer portal link (Stripe) for managing subscription/cancel
- [ ] All payment UI shows friendly errors, never stack traces

**Definition of Done:** Free users blocked from export with clear upsell; paid users can subscribe/pay and export immediately after.

---

## Coverage

| Requirement | Plan(s) | Success Criteria Covered |
|-------------|---------|-------------------------|
| EXP-01 | 4.5 | 1 |
| EXP-02 | 4.2, 4.5 | 2 |
| EXP-03 | 4.3, 4.2 | 3 |
| EXP-04 | 4.4, 4.2 | 4 |
| (server-side enforcement) | 4.2 | 5 |

---

*Plans ready for execution.*