# ES Report Multi Page Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the ES report launcher from an inline dashboard flow into a multi-page route flow.

**Architecture:** `/dashboard` remains a thin overview page with a CTA link. Report creation lives under `/dashboard/reports/new`, first collecting Form Ijin Kerja choice and report type, then routing to report-specific area pages. Area pages reuse the existing database-backed area loader and render unavailable states without crashing when the database cannot be reached.

**Tech Stack:** Next.js 16 App Router, React 19 Server/Client Components, TypeScript, Tailwind CSS, shadcn/ui `Button`, lucide-react, Prisma-backed area options.

## Global Constraints

- Follow project DDD workflow: `DISCUSS → DOCUMENT → CODE → COMMIT`.
- Keep route pages thin and move reusable UI into `components/es-dashboard/`.
- Keep database reads in Server Components/data modules.
- Keep interactive click/navigation behavior in Client Components or use `next/link`.
- Preserve Form Ijin Kerja as the first user decision.
- Use Approach A: page-based flow.
- Do not introduce database mutations in this phase.
- Do not run database-affecting Prisma commands.

---

### Task 1: Update ES Dashboard Spec

**Files:**
- Modify: `docs/02_Features/ESDashboard/00_Spec.md`

**Interfaces:**
- Produces documented route flow for `/dashboard/reports/new` and report area pages.

- [ ] Update Phase 1 route list to include `/dashboard/reports/new`, `/dashboard/reports/new/checklist/area`, and `/dashboard/reports/new/repair/area`.
- [ ] Update UI flow so `Buat Laporan Baru` navigates to the new route instead of opening inline dashboard content.
- [ ] Keep Form Ijin Kerja as step 1.

### Task 2: Add Shared Route Flow Components

**Files:**
- Create: `components/es-dashboard/report-flow-shell.tsx`
- Create: `components/es-dashboard/report-choice-card.tsx`
- Create: `components/es-dashboard/report-area-picker.tsx`
- Modify: `components/es-dashboard/report-flow.tsx`

**Interfaces:**
- `ReportFlowShell({ eyebrow, title, description, children })`
- `ReportChoiceCard({ href, title, description, icon, active })`
- `ReportAreaPicker({ areas, areaIssue, reportType, workPermit })`
- `ReportFlow` becomes CTA-only from dashboard to `/dashboard/reports/new`.

### Task 3: Add Route Pages

**Files:**
- Create: `app/dashboard/reports/new/page.tsx`
- Create: `app/dashboard/reports/new/checklist/area/page.tsx`
- Create: `app/dashboard/reports/new/repair/area/page.tsx`
- Create: `app/dashboard/reports/new/loading.tsx`

**Interfaces:**
- `NewReportPage` reads no DB, renders permit choice and report type links.
- Area pages read `searchParams.workPermit` and call `getEsDashboardFlowOptions()`.

### Task 4: Verify

**Files:**
- Review all changed files.

**Verification commands:**
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:docs`

**Manual behavior expectation:**
- `/dashboard` CTA navigates to `/dashboard/reports/new`.
- `/dashboard/reports/new` shows Form Ijin Kerja and report type choices.
- Choosing Checklist routes to `/dashboard/reports/new/checklist/area?workPermit=<fill|skip>`.
- Choosing Perbaikan / Temuan routes to `/dashboard/reports/new/repair/area?workPermit=<fill|skip>`.

