# Checklist Maintenance-Style Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ES checklist flow match the approved Sparta Maintenance-style layout and interactions while fixing in-progress report completion state.

**Architecture:** Keep route files thin. Put completion logic in a pure helper inside `lib/es-dashboard-data.ts`, keep report navigation in a small Client Component, and keep camera capture isolated in a reusable client component consumed by `FrmTsm003Form`.

**Tech Stack:** Next.js App Router, React 19 Client Components for browser APIs, Prisma-backed report data, existing `/api/photos/upload` endpoint, shadcn/ui where installed or added.

## Global Constraints

- Update `docs/02_Features/Checklist/00_Spec.md` before substantive code changes.
- Preserve SPARTA Engineering black/silver/orange/white identity.
- Camera evidence starts from `navigator.mediaDevices.getUserMedia`, not file storage.
- `DRAFT` reports never count as completed area/period reports.
- Bottom navigation is hidden during `/dashboard/reports/new/**` report creation flows.

---

### Task 1: Completion State Regression

**Files:**
- Modify: `lib/es-dashboard-data.ts`
- Test: `lib/es-dashboard-data.spec.ts`

**Interfaces:**
- Produces: `getCompletedChecklistPeriods(reports): Array<{ areaId: string; period: "MONTHLY" | "WEEKLY" }>`

- [ ] Write a failing test proving `DRAFT` reports are excluded and submitted reports are included.
- [ ] Run `pnpm exec tsx lib/es-dashboard-data.spec.ts` and confirm the expected failure.
- [ ] Implement the helper and use it in `getEsDashboardFlowOptions`.
- [ ] Re-run the focused test.

### Task 2: Report Flow Chrome

**Files:**
- Create: `components/es-dashboard/report-back-button.tsx`
- Modify: `components/es-dashboard/report-flow-shell.tsx`
- Modify: `app/dashboard/reports/new/checklist/frm-tsm-003/page.tsx`
- Modify: `app/dashboard/reports/new/page.tsx`
- Modify: `app/dashboard/reports/new/checklist/area/page.tsx`
- Modify: `app/dashboard/reports/new/repair/area/page.tsx`

**Interfaces:**
- Produces: `ReportBackButton({ fallbackHref, label })`

- [ ] Replace the hardcoded dashboard link with a client back button that calls `router.back()`.
- [ ] Keep a fallback href for direct entry and invalid states.
- [ ] Remove bottom navigation from report creation pages.

### Task 3: Checklist Form Interaction

**Files:**
- Modify: `components/es-dashboard/frm-tsm-003-form.tsx`
- Create: `components/es-dashboard/camera-capture-button.tsx`

**Interfaces:**
- Produces: `CameraCaptureButton({ disabled, uploading, onCapture })`

- [ ] Add direct camera preview and capture using `navigator.mediaDevices.getUserMedia`.
- [ ] Convert the captured canvas output into a JPEG `File`.
- [ ] Send the file through the existing `uploadPhoto` flow.
- [ ] Reshape the checklist UI into progress, search, category accordion, segmented controls, photo evidence, and sticky save action.

### Task 4: Verification

**Files:**
- Existing affected files only.

- [ ] Run focused TypeScript specs for changed logic.
- [ ] Run `pnpm run typecheck`.
- [ ] Run `pnpm run lint`.
- [ ] Report any command that cannot run with exact output.
