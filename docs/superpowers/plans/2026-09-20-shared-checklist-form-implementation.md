# Shared Checklist Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a generic, configuration-driven SharedChecklistForm to keep checklist forms DRY, and implement FRM_TSM_005 using it.

**Architecture:** We will extract the UI logic from `frm-tsm-003-form.tsx` into `shared-checklist-form.tsx` which accepts `ChecklistConfig` as a prop. Then we'll update FRM_TSM_003 to use it, and create the config and page for FRM_TSM_005.

**Tech Stack:** React, Next.js App Router, TailwindCSS, Prisma.

## Global Constraints

- Must follow TypeScript strict mode.
- Use Lucide-React for icons.
- Avoid repeating UI code across checklist pages.

---

### Task 1: Create Shared Checklist Form Component

**Files:**
- Create/Modify: `components/es-dashboard/shared-checklist-form.tsx` (Rename and refactor from `frm-tsm-003-form.tsx`)

**Interfaces:**
- Produces: `<SharedChecklistForm config={...} submitAction={...} ... />`

- [ ] **Step 1: Define Config Interfaces**
Add interfaces `ChecklistItemConfig`, `ChecklistConfig`, and `SharedChecklistFormProps` at the top of the file.

- [ ] **Step 2: Refactor Component Name and Props**
Rename `FrmTsm003Form` to `SharedChecklistForm`. Replace hardcoded `FRM_TSM_003_ITEMS`, `conditionOptions`, and `conditionLabels` with values from `props.config`.

- [ ] **Step 3: Update Rendering Logic**
Ensure the photo requirement check uses `config.conditionRequiresPhoto(state.condition)`. Ensure icons are dynamically rendered from `config.items`.

- [ ] **Step 4: Commit**
```bash
git add components/es-dashboard/shared-checklist-form.tsx
git commit -m "refactor: extract shared-checklist-form component"
```

---

### Task 2: Create FRM_TSM_003 Configuration

**Files:**
- Modify: `lib/checklists/frm-tsm-003.ts`

**Interfaces:**
- Produces: `FRM_TSM_003_CONFIG`

- [ ] **Step 1: Define Config Object**
Export a `FRM_TSM_003_CONFIG` object of type `ChecklistConfig` containing the `formCode`, `formName`, `items` (which already exist), `conditionOptions`, and `conditionRequiresPhoto` logic.

- [ ] **Step 2: Commit**
```bash
git add lib/checklists/frm-tsm-003.ts
git commit -m "feat: define FRM_TSM_003 config object"
```

---

### Task 3: Update FRM_TSM_003 Page

**Files:**
- Modify: `app/dashboard/reports/new/checklist/frm-tsm-003/page.tsx`

**Interfaces:**
- Consumes: `SharedChecklistForm`, `FRM_TSM_003_CONFIG`

- [ ] **Step 1: Replace Component Import**
Import `SharedChecklistForm` instead of `FrmTsm003Form`. Import `FRM_TSM_003_CONFIG`.

- [ ] **Step 2: Pass Config Prop**
Pass `config={FRM_TSM_003_CONFIG}` to `<SharedChecklistForm>`.

- [ ] **Step 3: Run Typecheck**
Run `pnpm typecheck` to verify no types are broken.

- [ ] **Step 4: Commit**
```bash
git add app/dashboard/reports/new/checklist/frm-tsm-003/page.tsx
git commit -m "refactor: update FRM_TSM_003 page to use shared form"
```

---

### Task 4: Create FRM_TSM_005 Configuration

**Files:**
- Create: `lib/checklists/frm-tsm-005.ts`

**Interfaces:**
- Produces: `FRM_TSM_005_CONFIG`, `FRM_TSM_005_ITEMS`

- [ ] **Step 1: Define Items**
Create `FRM_TSM_005_ITEMS` array with the 13 items specific to FRM_TSM_005 and map appropriate Lucide icons.

- [ ] **Step 2: Define Config Object**
Export `FRM_TSM_005_CONFIG` with `formCode: "FRM_TSM_005"` and the same options/photo rules as 003.

- [ ] **Step 3: Commit**
```bash
git add lib/checklists/frm-tsm-005.ts
git commit -m "feat: create FRM_TSM_005 items and config"
```

---

### Task 5: Create FRM_TSM_005 Server Actions

**Files:**
- Create: `app/dashboard/reports/new/checklist/frm-tsm-005/actions.ts`

**Interfaces:**
- Produces: `submitFrmTsm005Checklist`

- [ ] **Step 1: Create Submission Logic**
Copy the logic from `frm-tsm-003/actions.ts`, renaming the function to `submitFrmTsm005Checklist`.

- [ ] **Step 2: Commit**
```bash
git add app/dashboard/reports/new/checklist/frm-tsm-005/actions.ts
git commit -m "feat: add FRM_TSM_005 server actions"
```

---

### Task 6: Create FRM_TSM_005 Page

**Files:**
- Modify: `app/dashboard/reports/new/checklist/frm-tsm-005/page.tsx` (currently a placeholder)

**Interfaces:**
- Consumes: `SharedChecklistForm`, `FRM_TSM_005_CONFIG`, `submitFrmTsm005Checklist`

- [ ] **Step 1: Build the Page**
Implement `FrmTsm005Page` heavily based on `FrmTsm003Page`, but referencing `FRM_TSM_005` in strings and imports.

- [ ] **Step 2: Run Typecheck**
Run `pnpm typecheck` to verify complete correctness.

- [ ] **Step 3: Commit**
```bash
git add app/dashboard/reports/new/checklist/frm-tsm-005/page.tsx
git commit -m "feat: implement FRM_TSM_005 page using shared form"
```
