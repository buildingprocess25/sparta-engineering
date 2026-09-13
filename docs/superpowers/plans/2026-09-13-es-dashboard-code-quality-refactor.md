# ES Dashboard Code Quality Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the ES dashboard code into smaller, reusable, enterprise-ready modules while preserving the current UI and flow behavior.

**Architecture:** Keep `/dashboard` as a thin Server Component responsible for data loading and page composition. Move static dashboard sections, navigation, flow constants, and option-card primitives into focused files under `components/es-dashboard/`, with shared flow types/data access kept in `lib/`. Document these standards so future role-based dashboard work follows the same boundaries.

**Tech Stack:** Next.js 16 App Router, React 19 Server/Client Components, TypeScript, Tailwind CSS, shadcn/ui `Button`, lucide-react, Prisma 7 with `@prisma/adapter-pg`.

## Global Constraints

- Follow project DDD workflow: `DISCUSS → DOCUMENT → CODE → COMMIT`.
- Do not use `prisma db push`.
- Do not run database-affecting Prisma commands without explicit development/production environment confirmation.
- Preserve the current ES dashboard behavior and copy unless the task explicitly changes copy.
- Keep `app/dashboard/page.tsx` as a Server Component.
- Keep interactive state only in Client Components.
- Avoid module-level mutable request state in RSC/SSR.
- Minimize data passed from Server Components to Client Components.
- Prefer small focused files over large files that mix unrelated responsibilities.
- Use direct imports for icons/components; avoid broad barrel imports when possible.
- Do not stage `data/`, generated Prisma client output, `.next/`, `node_modules/`, or unrelated user changes.

---

## File Structure

### Existing Files To Modify

- `app/dashboard/page.tsx`
  - Responsibility after refactor: route-level server composition only.
  - Should import `DashboardShell`, `DashboardHeader`, `WelcomePanel`, `ReportFlow`, `ProgressSummary`, `StatsGrid`, and `BottomNavigation`.

- `components/es-dashboard/report-flow.tsx`
  - Responsibility after refactor: client-only guided report flow state.
  - Should delegate repeated selectable UI to `components/es-dashboard/flow-option-button.tsx`.

- `lib/es-dashboard-data.ts`
  - Responsibility after refactor: server-only data loading and error-to-view-model conversion.
  - Should expose `getEsDashboardFlowOptions(): Promise<EsDashboardFlowOptions>`.

- `docs/02_Features/ESDashboard/00_Spec.md`
  - Add a short “Implementation Boundaries” section for page/component/data split.

- `docs/00_Project/30_Project_Rules.md`
  - Add a “React/Next Code Organization” section so the standard applies beyond this single dashboard.

### New Files To Create

- `components/es-dashboard/dashboard-shell.tsx`
  - Page container and common mobile dashboard frame.

- `components/es-dashboard/dashboard-header.tsx`
  - Header bar with SPARTA label, title, notifications, and role avatar.

- `components/es-dashboard/welcome-panel.tsx`
  - Welcome card and current inline illustration.

- `components/es-dashboard/progress-summary.tsx`
  - Rekap / progress awal section.

- `components/es-dashboard/stats-grid.tsx`
  - Stats section and stat card rendering.

- `components/es-dashboard/bottom-navigation.tsx`
  - Bottom navigation component.

- `components/es-dashboard/section-heading.tsx`
  - Shared section heading primitive.

- `components/es-dashboard/flow-option-button.tsx`
  - Shared selectable option primitive used by the report flow.

- `components/es-dashboard/dashboard-constants.ts`
  - Static display configuration: stats and navigation items.

---

### Task 1: Document The Code Organization Standard

**Files:**
- Modify: `docs/02_Features/ESDashboard/00_Spec.md`
- Modify: `docs/00_Project/30_Project_Rules.md`

**Interfaces:**
- Consumes: Current ES dashboard spec and project rules.
- Produces: Documented standards for route composition, Server/Client boundaries, and reusable components.

- [ ] **Step 1: Update ES Dashboard spec**

Add this section after `## UI & Alur Pengguna`:

```markdown
## Implementation Boundaries

- `app/dashboard/page.tsx` hanya boleh menjadi route-level Server Component untuk mengambil data dan menyusun komponen halaman.
- Komponen visual dashboard ES harus berada di `components/es-dashboard/` dan dipisah berdasarkan tanggung jawab: shell, header, welcome panel, guided flow, progress summary, stats, dan bottom navigation.
- State interaktif flow laporan hanya boleh berada di Client Component `ReportFlow` dan komponen kecil turunannya.
- Data area dan periode checklist harus datang dari `lib/es-dashboard-data.ts`, bukan dari array hardcoded di komponen UI.
- Props yang dikirim dari Server Component ke Client Component harus berupa data serializable minimal.
```

- [ ] **Step 2: Update project rules**

Add this section after `## 2. UI & Komponen`:

```markdown
## 2.1 React & Next Code Organization

- Route files di `app/**/page.tsx` harus tipis: data loading, auth/role guard, dan komposisi layout. Hindari menyimpan banyak section UI langsung di page.
- Pisahkan Server Component dan Client Component secara eksplisit. Data fetching dan akses database berada di server; state, event handler, dan interaksi browser berada di client.
- Komponen role-based dashboard harus dipisah per domain di `components/<domain>/` agar mudah dikembangkan untuk ES, Coord, Manager, Requester, Admin HO, dan Super Admin.
- Hindari duplikasi card/button/section pattern. Buat primitive kecil reusable untuk pilihan, section heading, stats card, dan navigation item.
- Terapkan Vercel React best practices: hindari waterfall yang tidak perlu, minimalkan prop serialization dari server ke client, jangan membuat component inline di dalam component, dan gunakan struktur file yang statically analyzable.
```

- [ ] **Step 3: Verify docs formatting**

Run:

```powershell
pnpm test:docs
```

Expected: `DDD docs-update assertions passed`.

- [ ] **Step 4: Commit docs if executing as a standalone task**

```powershell
git add docs/02_Features/ESDashboard/00_Spec.md docs/00_Project/30_Project_Rules.md
git commit -m "docs: define dashboard code standards"
```

---

### Task 2: Extract Static Dashboard Sections From The Route

**Files:**
- Modify: `app/dashboard/page.tsx`
- Create: `components/es-dashboard/dashboard-shell.tsx`
- Create: `components/es-dashboard/dashboard-header.tsx`
- Create: `components/es-dashboard/welcome-panel.tsx`
- Create: `components/es-dashboard/progress-summary.tsx`
- Create: `components/es-dashboard/stats-grid.tsx`
- Create: `components/es-dashboard/bottom-navigation.tsx`
- Create: `components/es-dashboard/section-heading.tsx`
- Create: `components/es-dashboard/dashboard-constants.ts`

**Interfaces:**
- Consumes: `ReportFlow`, `areas`, `areaIssue`.
- Produces:
  - `DashboardShell({ children }: { children: React.ReactNode })`
  - `DashboardHeader(): JSX.Element`
  - `WelcomePanel(): JSX.Element`
  - `ProgressSummary(): JSX.Element`
  - `StatsGrid(): JSX.Element`
  - `BottomNavigation(): JSX.Element`
  - `SectionHeading({ kicker, title }: { kicker: string; title: string }): JSX.Element`

- [ ] **Step 1: Create constants file**

Create `components/es-dashboard/dashboard-constants.ts`:

```ts
import { Clock3, FileText, LayoutGrid, Shield } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type DashboardStat = {
  value: string
  title: string
  description: string
  tone: "silver" | "orange"
  icon: LucideIcon
}

export type DashboardNavItem = {
  label: string
  icon: LucideIcon
  active?: boolean
}

export const dashboardStats = [
  {
    value: "2",
    title: "Jalur Kerja",
    description: "Checklist dan temuan",
    tone: "silver",
    icon: FileText,
  },
  {
    value: "3",
    title: "Tahap Awal",
    description: "Ijin, jalur, area",
    tone: "orange",
    icon: Clock3,
  },
] satisfies DashboardStat[]

export const dashboardNavigationItems = [
  { label: "Dashboard", icon: LayoutGrid, active: true },
  { label: "Laporan", icon: FileText },
  { label: "Aktivitas", icon: Clock3 },
  { label: "Preventif", icon: Shield },
] satisfies DashboardNavItem[]
```

- [ ] **Step 2: Create section heading**

Create `components/es-dashboard/section-heading.tsx`:

```tsx
type SectionHeadingProps = {
  kicker: string
  title: string
}

export function SectionHeading({ kicker, title }: SectionHeadingProps) {
  return (
    <div>
      <p className="text-sm font-medium text-[#686868]">{kicker}</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#111111] text-pretty">
        {title}
      </h2>
    </div>
  )
}
```

- [ ] **Step 3: Create dashboard shell**

Create `components/es-dashboard/dashboard-shell.tsx`:

```tsx
type DashboardShellProps = {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-[#f5f5f3] pb-24 text-[#111111]"
    >
      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:mb-3 focus:rounded-md focus:bg-[#ff8a2a] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
        >
          Lewati ke konten
        </a>
        {children}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Create dashboard header**

Create `components/es-dashboard/dashboard-header.tsx`:

```tsx
import { Bell } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#747474]">SPARTA</p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative grid size-10 place-items-center rounded-full border border-[#dedede] bg-white text-[#111111] shadow-sm"
        >
          <Bell aria-hidden="true" />
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ff8a2a] text-[10px] font-semibold text-black">
            1
          </span>
        </button>
        <div className="grid size-10 place-items-center rounded-full bg-[#111111] text-sm font-semibold text-white shadow-sm">
          ES
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Create welcome panel**

Create `components/es-dashboard/welcome-panel.tsx`:

```tsx
import { FileSignature } from "lucide-react"

export function WelcomePanel() {
  return (
    <section className="mt-6 overflow-hidden rounded-[1.35rem] bg-[#111111] p-6 text-white shadow-xl shadow-black/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-balance text-2xl font-semibold leading-tight">
            Welcome ES User
          </h2>
          <p className="mt-2 max-w-48 text-sm leading-6 text-[#d9d9d9]">
            Pilih alur kerja untuk area BANJARMASIN.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-[#ffb46f]">
            ENGINEERING SUPPORT
          </div>
        </div>
        <div className="relative mt-1 grid size-28 shrink-0 place-items-center">
          <div className="absolute inset-0 rounded-full bg-[#2a2a2a]" />
          <div className="absolute bottom-1 h-20 w-16 rounded-t-full bg-[#d7d7d7]" />
          <div className="absolute top-3 size-12 rounded-full bg-[#ffb46f]" />
          <div className="absolute right-0 top-14 rounded-xl bg-[#ff8a2a] px-3 py-2 shadow-lg shadow-black/20">
            <FileSignature className="text-black" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Create progress summary**

Create `components/es-dashboard/progress-summary.tsx`:

```tsx
import { ShieldCheck } from "lucide-react"

import { SectionHeading } from "@/components/es-dashboard/section-heading"

export function ProgressSummary() {
  return (
    <section className="mt-8">
      <SectionHeading kicker="Rekap" title="Progress awal" />
      <div className="mt-3 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
            <ShieldCheck className="text-[#ff8a2a]" aria-hidden="true" />
            FLOW ES DASHBOARD
          </div>
          <span className="text-sm text-[#686868]">1 / 4 tahap</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#686868]">
          Mulai dari Form Ijin Kerja, lalu pilih jalur laporan dan area.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9e9e9]">
          <div className="h-full w-1/4 rounded-full bg-[#ff8a2a]" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Create stats grid**

Create `components/es-dashboard/stats-grid.tsx`:

```tsx
import type { LucideIcon } from "lucide-react"

import { dashboardStats } from "@/components/es-dashboard/dashboard-constants"
import { SectionHeading } from "@/components/es-dashboard/section-heading"
import { cn } from "@/lib/utils"

export function StatsGrid() {
  return (
    <section className="mt-8">
      <SectionHeading kicker="Stats Laporan" title="Ringkasan" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {dashboardStats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function StatCard({
  value,
  title,
  description,
  tone,
  icon: Icon,
}: {
  value: string
  title: string
  description: string
  tone: "silver" | "orange"
  icon: LucideIcon
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative min-h-40 overflow-hidden rounded-2xl p-5 text-left shadow-sm",
        tone === "orange" ? "bg-[#fff0e3]" : "bg-white",
      )}
    >
      <div
        className={cn(
          "absolute -right-7 -top-8 size-28 rounded-full",
          tone === "orange" ? "bg-[#ffd0a3]" : "bg-[#eeeeee]",
        )}
      />
      <Icon
        className={cn(
          "absolute right-6 top-6",
          tone === "orange" ? "text-[#d86b0d]" : "text-[#bdbdbd]",
        )}
        aria-hidden="true"
      />
      <p className="text-5xl font-semibold text-[#111111]">{value}</p>
      <p className="mt-6 text-sm font-semibold text-[#111111]">{title}</p>
      <p className="mt-1 text-xs text-[#686868]">{description}</p>
    </button>
  )
}
```

- [ ] **Step 8: Create bottom navigation**

Create `components/es-dashboard/bottom-navigation.tsx`:

```tsx
import { dashboardNavigationItems } from "@/components/es-dashboard/dashboard-constants"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#e9e9e9] bg-white/92 px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {dashboardNavigationItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold",
              active
                ? "bg-[#111111] text-white"
                : "text-[#747474] hover:bg-[#f4f4f4]",
            )}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 9: Replace page body with composition**

Modify `app/dashboard/page.tsx` until it is equivalent to:

```tsx
import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { ProgressSummary } from "@/components/es-dashboard/progress-summary"
import { ReportFlow } from "@/components/es-dashboard/report-flow"
import { StatsGrid } from "@/components/es-dashboard/stats-grid"
import { WelcomePanel } from "@/components/es-dashboard/welcome-panel"
import { getEsDashboardFlowOptions } from "@/lib/es-dashboard-data"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { areas, areaIssue } = await getEsDashboardFlowOptions()

  return (
    <>
      <DashboardShell>
        <DashboardHeader />
        <WelcomePanel />
        <ReportFlow areas={areas} areaIssue={areaIssue} />
        <ProgressSummary />
        <StatsGrid />
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
```

- [ ] **Step 10: Verify route file stayed small**

Run:

```powershell
(Get-Content app/dashboard/page.tsx).Length
```

Expected: under `40`.

- [ ] **Step 11: Verify code**

Run:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all pass. `/dashboard` remains dynamic and server-rendered on demand.

- [ ] **Step 12: Commit if executing as a standalone task**

```powershell
git add app/dashboard/page.tsx components/es-dashboard/dashboard-shell.tsx components/es-dashboard/dashboard-header.tsx components/es-dashboard/welcome-panel.tsx components/es-dashboard/progress-summary.tsx components/es-dashboard/stats-grid.tsx components/es-dashboard/bottom-navigation.tsx components/es-dashboard/section-heading.tsx components/es-dashboard/dashboard-constants.ts
git commit -m "refactor: split ES dashboard sections"
```

---

### Task 3: Refactor Report Flow Into Smaller Reusable Pieces

**Files:**
- Modify: `components/es-dashboard/report-flow.tsx`
- Create: `components/es-dashboard/flow-option-button.tsx`

**Interfaces:**
- Consumes:
  - `EsAreaOption`
  - `EsDashboardFlowIssue`
- Produces:
  - `FlowOptionButton({ title, description, active, disabled, onClick }: FlowOptionButtonProps)`

- [ ] **Step 1: Create shared option button**

Create `components/es-dashboard/flow-option-button.tsx`:

```tsx
import { cn } from "@/lib/utils"

type FlowOptionButtonProps = {
  title: string
  description: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

export function FlowOptionButton({
  title,
  description,
  active,
  disabled,
  onClick,
}: FlowOptionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-20 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        active ? "border-[#ff8a2a] bg-[#fff0e3]" : "border-[#dedede] bg-[#fbfbfb]",
      )}
    >
      <span className="block font-semibold text-[#111111]">{title}</span>
      <span className="mt-1 block text-sm text-[#686868]">{description}</span>
    </button>
  )
}
```

- [ ] **Step 2: Update report flow imports**

In `components/es-dashboard/report-flow.tsx`, add:

```tsx
import { FlowOptionButton } from "@/components/es-dashboard/flow-option-button"
```

- [ ] **Step 3: Replace `OptionButton` usage**

Replace all `<OptionButton ... />` calls with `<FlowOptionButton ... />`.

- [ ] **Step 4: Remove local `OptionButton` function**

Delete the local `function OptionButton(...)` block from `components/es-dashboard/report-flow.tsx`.

- [ ] **Step 5: Confirm no inline component definitions were introduced**

Run:

```powershell
rg "function OptionButton|const OptionButton" components/es-dashboard/report-flow.tsx
```

Expected: no matches.

- [ ] **Step 6: Verify code**

Run:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all pass.

- [ ] **Step 7: Commit if executing as a standalone task**

```powershell
git add components/es-dashboard/report-flow.tsx components/es-dashboard/flow-option-button.tsx
git commit -m "refactor: reuse ES flow option button"
```

---

### Task 4: Add A Dashboard Code Quality Checklist To Documentation

**Files:**
- Modify: `docs/00_Project/30_Project_Rules.md`
- Modify: `docs/02_Features/ESDashboard/00_Spec.md`

**Interfaces:**
- Consumes: Vercel React best practices and current ES dashboard implementation.
- Produces: A reusable checklist for future role-based dashboards.

- [ ] **Step 1: Add checklist to project rules**

Append this subsection under `## 2.1 React & Next Code Organization`:

```markdown
### Dashboard Code Quality Checklist

Sebelum menyelesaikan dashboard role-based:

- Route file `page.tsx` maksimal bertanggung jawab pada data loading, role guard, dan komposisi komponen.
- Setiap section besar dashboard berada di file komponen sendiri.
- Client Component hanya dipakai ketika butuh state, event handler, lifecycle, atau browser API.
- Props dari Server Component ke Client Component harus minimal dan serializable.
- Repeated option/card/button pattern harus memakai primitive reusable.
- Data access harus punya fallback/error state agar kegagalan database tidak membuat halaman crash.
- Jalankan `pnpm lint`, `pnpm typecheck`, dan `pnpm build` sebelum klaim selesai.
```

- [ ] **Step 2: Add ES dashboard implementation note**

Append this subsection to `docs/02_Features/ESDashboard/00_Spec.md`:

```markdown
## Quality Gate

- `app/dashboard/page.tsx` harus tetap tipis dan mudah dibaca.
- Flow pilihan laporan harus tetap data-driven dari database.
- Jika database belum bisa diakses, UI harus menampilkan unavailable state dan tidak crash.
- Refactor visual tidak boleh mengubah business flow tanpa update spec.
```

- [ ] **Step 3: Verify docs**

Run:

```powershell
pnpm test:docs
```

Expected: `DDD docs-update assertions passed`.

- [ ] **Step 4: Commit if executing as a standalone task**

```powershell
git add docs/00_Project/30_Project_Rules.md docs/02_Features/ESDashboard/00_Spec.md
git commit -m "docs: add dashboard quality checklist"
```

---

### Task 5: Final Verification And Commit Hygiene

**Files:**
- Review: all files changed by Tasks 1-4.

**Interfaces:**
- Consumes: Refactored dashboard components and docs.
- Produces: Verified working tree ready for commit or next phase.

- [ ] **Step 1: Run full verification**

Run:

```powershell
pnpm prisma:validate
pnpm typecheck
pnpm lint
pnpm build
pnpm test:docs
```

Expected:
- Prisma schema valid.
- TypeScript has no errors.
- ESLint has no errors.
- Next build succeeds.
- Docs assertions pass.

- [ ] **Step 2: Check route response when dev server is needed**

Start server only if visual/manual check is requested:

```powershell
pnpm dev
```

Then check:

```powershell
Invoke-WebRequest -Uri http://localhost:3000/dashboard -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

Expected: `200`.

- [ ] **Step 3: Inspect changed files**

Run:

```powershell
git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering status --short --ignored
```

Expected:
- Include intended dashboard/docs/package/prisma changes.
- Do not stage `data/`.
- Do not stage `.next/`, `node_modules/`, `generated/`, `.env`, `.pnpm-store/`.
- Do not stage unrelated `skills-lock.json` or `.agents/skills/frontend-design/` unless explicitly requested.

- [ ] **Step 4: Commit the refactor when approved**

Use a scoped commit after reviewing intended files:

```powershell
git add app/dashboard/page.tsx components/es-dashboard docs/00_Project/30_Project_Rules.md docs/02_Features/ESDashboard/00_Spec.md
git commit -m "refactor: organize ES dashboard components"
```

If migration/package/prisma changes are still uncommitted from the previous phase, commit them separately before or after this refactor:

```powershell
git add AI_RULES.md docs/01_Architecture/10_Data_Models.md package.json pnpm-lock.yaml prisma.config.ts prisma/schema.prisma prisma/migrations/20260912102305_area_form_availability prisma/seed.mjs lib/prisma.ts lib/es-dashboard-data.ts lib/es-dashboard-types.ts
git commit -m "feat: back ES dashboard flow with database"
```

---

## Self-Review

**Spec coverage:** The plan preserves the current ES dashboard behavior, DB-backed area flow, mobile-first UI, and project DDD requirements. It adds documentation updates before code refactor tasks.

**Placeholder scan:** No task contains `TBD`, `TODO`, “implement later”, or vague “add appropriate handling” instructions. Each code task includes exact file paths and code blocks.

**Type consistency:** `EsDashboardFlowOptions`, `EsAreaOption`, `EsDashboardFlowIssue`, `ReportFlow`, and the dashboard component names match the current code and planned imports.

