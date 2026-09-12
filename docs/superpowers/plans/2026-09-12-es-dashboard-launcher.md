# ES Dashboard Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first mobile-first ES dashboard launcher for SPARTA.

**Architecture:** Use Next.js App Router with a static Server Component route at `/dashboard`. Keep Phase 1 UI data local and illustrative. Preserve DDD by updating product/design/spec docs before UI code.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn Button, lucide-react.

## Global Constraints

- Mobile-first design is required.
- Palette: black, silver, orange, white.
- Style: luxury, elegant, glassmorphism.
- Phase 1 must not add database mutations.
- The local Excel file under `data/` must stay ignored and out of commits.

---

### Task 1: Product and Design Context

**Files:**
- Create: `PRODUCT.md`
- Create: `DESIGN.md`
- Create: `docs/02_Features/ESDashboard/00_Spec.md`
- Create: `docs/superpowers/plans/2026-09-12-es-dashboard-launcher.md`

**Interfaces:**
- Produces durable product and visual rules for later UI work.

- [x] **Step 1: Record product context**

Write `PRODUCT.md` with users, purpose, operating flow, constraints, and brand commitments.

- [x] **Step 2: Record design context**

Write `DESIGN.md` with the black/silver/orange/white glassmorphism system.

- [x] **Step 3: Record Phase 1 spec**

Write `docs/02_Features/ESDashboard/00_Spec.md` with scope, flow, and acceptance criteria.

### Task 2: Dashboard Route

**Files:**
- Modify: `app/page.tsx`
- Create: `app/dashboard/page.tsx`

**Interfaces:**
- Produces `/dashboard` as the ES launcher route.

- [x] **Step 1: Redirect root route**

Update `app/page.tsx` to redirect to `/dashboard`.

- [x] **Step 2: Build static dashboard**

Create `app/dashboard/page.tsx` with the ES launcher flow:
- Form Ijin Kerja decision.
- Checklist and Perbaikan by AHO / Temuan ES choices.
- Area choices.
- Monthly/Weekly signals.

- [x] **Step 3: Use installed UI primitives**

Use `Button` from `@/components/ui/button` and `lucide-react` icons. Avoid adding registry components in this phase.

### Task 3: Verification

**Files:**
- No new files.

**Interfaces:**
- Produces verified Phase 1 baseline.

- [x] **Step 1: Run lint**

Run: `pnpm lint`
Expected: exit code 0.

- [x] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: exit code 0.

- [x] **Step 3: Run build**

Run: `pnpm build`
Expected: exit code 0.

- [x] **Step 4: Review git status**

Run: `git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering status --short --branch --ignored`
Expected: tracked changes only for Phase 1; `data/` remains ignored.
