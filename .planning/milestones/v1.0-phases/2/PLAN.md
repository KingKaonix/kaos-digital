# PLAN.md — Phase 2: Core — Generation Pipeline + Preview

**Project:** AI Template Generator  
**Phase:** 2 — Core — Generation Pipeline + Preview  
**Mode:** MVP  
**Requirements:** GEN-01, GEN-02, GEN-03  
**Success Criteria:**
1. User can enter a natural-language description and submit it for generation
2. User receives generated Angular + Bootstrap 5 code from Nemotron
3. User can preview the generated template in a sandboxed iframe
4. Generated code is valid Angular (standalone components, Bootstrap 5.3)
5. Zero client-facing errors — graceful fallback on any failure

---

## Plan 2.1 — Nemotron Serverless Function

**Goal:** Expose a serverless endpoint that calls NVIDIA NIM REST API with the Nemotron model, keeping the API key secret.

**Tasks:**
- [ ] Create serverless function `api/generate.ts` (Vercel/Netlify compatible)
- [ ] Store `NVIDIA_NIM_API_KEY` as server-only environment variable (never in frontend)
- [ ] Implement POST handler accepting `{ description: string }`
- [ ] Call NVIDIA NIM REST API with Nemotron model (confirm model ID at build.nvidia.com)
- [ ] System prompt enforces: Angular standalone components, Bootstrap 5.3 classes only, no external dependencies
- [ ] Validate response contains code block; extract and return clean Angular code
- [ ] Implement retry with exponential backoff on NIM API failure
- [ ] Return structured response: `{ code: string, error?: string }`
- [ ] Add CORS / auth check — only authenticated users can call (reuse Supabase session from Phase 1)

**Definition of Done:** Serverless function returns generated Angular code from a natural-language prompt; API key never exposed to client.

---

## Plan 2.2 — Generation Client Service

**Goal:** Frontend service that calls the serverless generate endpoint with proper error handling.

**Tasks:**
- [ ] Create `GenerationService` with `generate(description: string)` method
- [ ] Call `/api/generate` via HTTP POST
- [ ] Implement loading state (generation in progress)
- [ ] Implement error handling — catch all errors, return fallback message, never throw to UI
- [ ] Implement timeout (NIM can be slow; abort after reasonable window)
- [ ] Return `{ success: boolean, code?: string, error?: string }` — never throw

**Definition of Done:** Client service handles all error cases gracefully; zero unhandled errors reach the UI.

---

## Plan 2.3 — Prompt UI with Templates & Examples

**Goal:** User interface for entering descriptions, with prompt templates and examples.

**Tasks:**
- [ ] Create `/generate` route (protected, requires auth from Phase 1)
- [ ] Textarea for natural-language description input
- [ ] Prompt templates gallery (pre-written templates: landing page, dashboard, profile page, contact form, etc.)
- [ ] Example descriptions (clickable examples that fill the textarea)
- [ ] "Generate" button (disabled during loading, enabled otherwise)
- [ ] Display generated code in a code editor/preview pane (Monaco or simple `<pre><code>`)
- [ ] Copy-to-clipboard button for generated code
- [ ] Error state UI — friendly message when generation fails (no stack traces, no raw errors)

**Definition of Done:** User can enter a prompt, pick a template/example, click generate, and see code or a friendly error.

---

## Plan 2.4 — Preview (Sandboxed Iframe)

**Goal:** Render generated Angular + Bootstrap 5 code in a sandboxed iframe.

**Tasks:**
- [ ] Create preview component with iframe
- [ ] Serve generated code as a standalone HTML page inside the iframe (Angular standalone component + Bootstrap 5 CDN)
- [ ] Inject generated Angular code into the iframe's document
- [ ] Handle iframe load errors gracefully (show fallback message)
- [ ] Auto-refresh preview when new code is generated
- [ ] Responsive preview (mobile/desktop toggle optional)
- [ ] Ensure iframe cannot access parent page data (sandbox attributes)

**Definition of Done:** Generated template renders inside iframe; iframe errors never propagate to parent UI.

---

## Plan 2.5 — Zero-Client-Error Guarantee

**Goal:** Ensure no client-facing errors under any failure condition.

**Tasks:**
- [ ] Wrap all async generation calls in try/catch; convert errors to user-friendly messages
- [ ] Add global error boundary for the `/generate` route
- [ ] Fallback UI when Nemotron is unavailable ("Generation service temporarily unavailable — try again later")
- [ ] Fallback UI when preview fails ("Preview unavailable — you can still copy the code below")
- [ ] Validate generated code before rendering (basic sanity check: contains `<` or `component` keywords; if empty/invalid, show fallback)
- [ ] Test failure scenarios: NIM API down, network offline, malformed response, empty code
- [ ] Confirm zero console errors visible to user in any failure scenario

**Definition of Done:** Under all failure conditions, user sees a friendly message — never a stack trace, raw error, or blank screen.

---

## Coverage

| Requirement | Plan(s) | Success Criteria Covered |
|-------------|---------|-------------------------|
| GEN-01 | 2.3 | 1 |
| GEN-02 | 2.1, 2.2 | 2 |
| GEN-03 | 2.4 | 3 |
| (valid Angular code) | 2.1 (system prompt), 2.5 | 4 |
| (zero client errors) | 2.2, 2.5 | 5 |

---

*Plans ready for execution.*