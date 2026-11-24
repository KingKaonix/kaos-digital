# PLAN.md — Phase 3: Persistence — Save/Load Templates + Gallery

**Project:** AI Template Generator  
**Phase:** 3 — Persistence — Save/Load Templates + Gallery  
**Mode:** MVP  
**Requirements:** TPL-01, TPL-02, GEN-04  
**Success Criteria:**
1. User can save a generated template to their account
2. User can view their saved templates in a personal gallery
3. User can edit a saved template's description and regenerate the code
4. User only sees their own templates in the gallery (user isolation)

---

## Plan 3.1 — Templates Service (CRUD)

**Goal:** Full CRUD operations on saved templates, backed by Supabase with RLS from Phase 1.

**Tasks:**
- [ ] Extend `TemplatesService` (from Phase 1.2) with: `createTemplate`, `getUserTemplates`, `getTemplateById`, `updateTemplate`, `deleteTemplate`, `duplicateTemplate`
- [ ] All queries filtered by `auth.uid()` (RLS enforcement at database level already in place)
- [ ] Template record: `id`, `user_id`, `title`, `description` (the prompt), `generated_code`, `created_at`, `updated_at`
- [ ] Error handling — all operations return `{ success, data?, error? }`, never throw
- [ ] Validate template data before write (title non-null, description non-null, code non-null)

**Definition of Done:** All template CRUD operations work against Supabase with RLS; user isolation enforced.

---

## Plan 3.2 — Save Button on Generation Page

**Goal:** Users can save a generated template directly from the Phase 2 generate page.

**Tasks:**
- [ ] Add "Save template" button to the generate page (visible after successful generation)
- [ ] Prompt for template title (default: "Untitled Template" or derived from description)
- [ ] Call `TemplatesService.createTemplate()` with title, description, generated_code
- [ ] Show success/toast confirmation after save
- [ ] Navigate to gallery or stay on generate page (user choice via toast action)
- [ ] Handle save errors gracefully (friendly message, never throw)

**Definition of Done:** User can save a generated template from the generate page with a title.

---

## Plan 3.3 — Gallery Page (Cards View)

**Goal:** Personal gallery of saved templates displayed as cards.

**Tasks:**
- [ ] Create `/gallery` route (protected, requires auth)
- [ ] Fetch user's templates via `TemplatesService.getUserTemplates()`
- [ ] Display as cards: title, description (truncated), created date, preview thumbnail (iframe or code snippet)
- [ ] Empty state when no templates exist
- [ ] Loading state while fetching
- [ ] Error state with friendly message
- [ ] Cards link to template detail/edit view

**Definition of Done:** Gallery page shows user's templates as cards; empty/loading/error states handled.

---

## Plan 3.4 — Template Actions (Edit/Delete/Duplicate/Rename)

**Goal:** Full action set on each saved template card.

**Tasks:**
- [ ] **Edit:** Click card → edit description → regenerate code → overwrite existing template
- [ ] **Delete:** Delete button on card → confirm dialog → `TemplatesService.deleteTemplate()` → refresh gallery
- [ ] **Duplicate:** Duplicate button → create copy with "(Copy)" suffix → refresh gallery
- [ ] **Rename:** Rename button → edit title inline → `TemplatesService.updateTemplate()` → refresh
- [ ] All actions respect RLS (user can only modify their own templates)
- [ ] All actions show success/error toasts

**Definition of Done:** All four actions (edit/overwrite, delete, duplicate, rename) work on gallery cards.

---

## Plan 3.5 — Edit & Regenerate Flow

**Goal:** Edit a saved template's description and regenerate the code (overwriting the original).

**Tasks:**
- [ ] Edit page: load existing template, pre-fill description field
- [ ] User modifies description, clicks "Regenerate"
- [ ] Call Nemotron serverless function (reuse Phase 2 `/api/generate`) with new description
- [ ] On success: overwrite template record with new code + updated description + new `updated_at`
- [ ] On failure: keep original template unchanged, show friendly error
- [ ] Preview updated code in iframe (reuse Phase 2 preview component)
- [ ] Save button also available on edit page

**Definition of Done:** User can edit description, regenerate code, and the original template is overwritten with the new version.

---

## Coverage

| Requirement | Plan(s) | Success Criteria Covered |
|-------------|---------|-------------------------|
| TPL-01 | 3.1, 3.2 | 1 |
| TPL-02 | 3.1, 3.3 | 2 |
| GEN-04 | 3.4, 3.5 | 3 |
| (user isolation) | 3.1 (RLS) | 4 |

---

*Plans ready for execution.*