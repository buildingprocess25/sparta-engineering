# DB-Backed ES Dashboard Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded ES dashboard flow choices with database-backed area and checklist period options while preserving the enterprise dashboard shell.

**Architecture:** Global area definitions live in PostgreSQL via Prisma, not in UI arrays as source of truth. The dashboard remains an enterprise home screen with welcome illustration, stats, and bottom navigation, while `Buat Laporan Baru` opens a guided client flow that reads server-provided options. Area records are global across all branches, with each area carrying a form family and allowed checklist periods.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7, PostgreSQL, Tailwind CSS 4, shadcn Button, lucide-react.

## Global Constraints

- Never use `prisma db push`.
- Use Prisma migrations so schema history is recorded consistently.
- Before any database-affecting Prisma command, identify whether the target connection is development or production.
- Current `AI_RULES.md` conflicts with the desired migration workflow because it says never run `prisma migrate dev` or `prisma migrate deploy`; update that rule before running migration commands.
- Area definitions are global for all branches.
- The ES dashboard must keep welcome illustration, stats laporan, and bottom navigation.
- Dashboard action flow must support Form Ijin Kerja fill/skip, report type, specific area, and checklist period.
- The local Excel file under `data/` must stay ignored and out of commits.

---

## File Structure

- Modify `AI_RULES.md` and `docs/00_Project/30_Project_Rules.md` to align database policy with migration-based development.
- Modify `docs/01_Architecture/10_Data_Models.md` to document area/form availability models.
- Modify `docs/02_Features/ESDashboard/00_Spec.md` to make the ES flow database-backed and specific-area aware.
- Modify `prisma/schema.prisma` to add checklist period and form availability schema.
- Create `prisma/migrations/<timestamp>_area_form_availability/migration.sql` via Prisma migration workflow after environment confirmation.
- Create `prisma/seed.ts` to seed global area and form availability data.
- Modify `prisma.config.ts` to configure seeding if needed.
- Create `lib/es-dashboard-flow.ts` for typed domain constants/helpers shared by server and client.
- Create `lib/es-dashboard-data.ts` for Prisma-backed server query functions.
- Create `components/es-dashboard/report-flow.tsx` as a focused client component for the guided flow.
- Modify `app/dashboard/page.tsx` to fetch server data and render the client flow inside the existing enterprise dashboard shell.

---

### Task 1: Align Migration Policy

**Files:**
- Modify: `AI_RULES.md`
- Modify: `docs/00_Project/30_Project_Rules.md`

**Interfaces:**
- Produces project rules that allow migration-based schema evolution while still blocking unsafe DB sync commands.

- [ ] **Step 1: Update AI rules**

Replace the Prisma safety section in `AI_RULES.md` with this policy:

```markdown
## Prisma and Database Safety

- Use Prisma ORM for persistence; do not introduce a second ORM.
- Never run `prisma db push`.
- Schema changes must be recorded as Prisma migrations.
- Before any database-affecting Prisma command, ask whether the current connection is development or production and identify the target environment.
- `prisma migrate dev --create-only` is permitted only for development connections after environment confirmation.
- Applying migrations (`prisma migrate dev` without `--create-only` or `prisma migrate deploy`) requires explicit environment confirmation and must never target production unless the user explicitly confirms the production deployment workflow.
- `prisma validate`, `prisma format`, and `prisma generate` are permitted because they do not mutate the configured database.
```

- [ ] **Step 2: Update project rules doc**

Mirror the same policy in `docs/00_Project/30_Project_Rules.md`, preserving the DDD and Git sections.

- [ ] **Step 3: Verify docs guard still passes**

Run: `pnpm test:docs`

Expected: exit code 0 and `DDD docs-update assertions passed`.

---

### Task 2: Document DB-Backed Area Flow

**Files:**
- Modify: `docs/01_Architecture/10_Data_Models.md`
- Modify: `docs/02_Features/ESDashboard/00_Spec.md`

**Interfaces:**
- Produces a documented contract for schema and UI work.

- [ ] **Step 1: Update data model docs**

Add these concepts to `docs/01_Architecture/10_Data_Models.md`:

```markdown
### ChecklistPeriod
Enum values: MONTHLY, WEEKLY.

### Area
Area records are global across all branches. `type` determines the form family:
- OFFICE -> office checklist family
- WAREHOUSE -> shared warehouse checklist family for WHC, WH, Depo, Bulky, Store Hub, and Gudang Anak

Additional field:
| Field | Tipe | Keterangan |
|---|---|---|
| isActive | Boolean | Area tampil di flow ES jika `true` |

### AreaChecklistAvailability
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| areaId | String | Relasi ke Area |
| period | ChecklistPeriod | MONTHLY atau WEEKLY |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Constraint: `@@unique([areaId, period])`.
```

- [ ] **Step 2: Update ES dashboard spec**

Revise `docs/02_Features/ESDashboard/00_Spec.md`:

```markdown
## Data & API

Phase berikutnya menggunakan data database:
- Area diambil dari model `Area` dengan `isActive = true`.
- Opsi period diambil dari relasi `AreaChecklistAvailability`.
- Area berlaku global untuk semua cabang.
- UI tidak menjadikan array hardcoded sebagai source of truth.

## UI & Alur Pengguna

1. ES melihat dashboard enterprise shell.
2. ES menekan `Buat Laporan Baru`.
3. Guided flow tampil.
4. ES memilih `Isi Form Ijin Kerja` atau `Lewati`.
5. ES memilih `Checklist` atau `Perbaikan by AHO / Temuan ES`.
6. ES memilih area spesifik: Office, WHC, WH, Depo, Bulky, Store Hub, Gudang Anak.
7. Jika report type adalah Checklist:
   - Office hanya menampilkan Monthly.
   - Area warehouse-family menampilkan Monthly dan Weekly.
8. CTA `Lanjutkan` aktif setelah pilihan wajib lengkap.
```

- [ ] **Step 3: Verify docs guard**

Run: `pnpm test:docs`

Expected: exit code 0.

---

### Task 3: Extend Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces Prisma model types consumed by server queries and seed script.

- [ ] **Step 1: Update schema**

Modify `prisma/schema.prisma`:

```prisma
enum ChecklistPeriod {
  MONTHLY
  WEEKLY
}

model Area {
  id        String   @id @default(cuid())
  name      String
  type      AreaType
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)

  reports                 ChecklistReport[]
  checklistAvailabilities AreaChecklistAvailability[]

  @@index([type])
  @@index([isActive])
}

model AreaChecklistAvailability {
  id        String          @id @default(cuid())
  areaId    String
  period    ChecklistPeriod
  createdAt DateTime        @default(now()) @db.Timestamptz(3)
  updatedAt DateTime        @updatedAt @db.Timestamptz(3)

  area Area @relation(fields: [areaId], references: [id])

  @@unique([areaId, period])
  @@index([period])
}
```

- [ ] **Step 2: Format schema**

Run: `pnpm prisma format`

Expected: schema formatted with no errors.

- [ ] **Step 3: Validate schema**

Run: `pnpm prisma:validate`

Expected: `The schema at prisma\schema.prisma is valid`.

---

### Task 4: Create Recorded Migration

**Files:**
- Create: `prisma/migrations/<timestamp>_area_form_availability/migration.sql`

**Interfaces:**
- Produces recorded schema migration; no `db push`.

- [ ] **Step 1: Confirm environment**

Ask the user:

```text
Before creating/applying a Prisma migration, is DATABASE_URL pointing to a development database or production database?
```

Proceed only if the user confirms development.

- [ ] **Step 2: Create migration file**

Run this only after development confirmation:

```powershell
pnpm prisma migrate dev --name area_form_availability --create-only
```

Expected:
- A new migration directory is created under `prisma/migrations/`.
- The command does not apply the migration because of `--create-only`.
- No `prisma db push` is used.

- [ ] **Step 3: Inspect migration SQL**

Open the generated `migration.sql` and verify it contains:

```sql
CREATE TYPE "ChecklistPeriod" AS ENUM ('MONTHLY', 'WEEKLY');
ALTER TABLE "Area" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE "AreaChecklistAvailability" ...
CREATE UNIQUE INDEX "AreaChecklistAvailability_areaId_period_key" ...
ALTER TABLE "AreaChecklistAvailability" ADD CONSTRAINT ...
```

- [ ] **Step 4: Validate migration status**

Run only after development confirmation:

```powershell
pnpm prisma migrate status
```

Expected: Prisma reports pending migration status without applying unexpected database changes.

---

### Task 5: Seed Global Areas and Availability

**Files:**
- Create: `prisma/seed.ts`
- Modify: `prisma.config.ts`

**Interfaces:**
- Produces repeatable seed data for global area choices.

- [ ] **Step 1: Configure seed command**

Update `prisma.config.ts`:

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

If `tsx` is not installed, add a package script instead using the existing runtime approach. Do not install new packages without checking current dependencies first.

- [ ] **Step 2: Write seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

const areaSeeds = [
  { name: "Office", type: "OFFICE" as const, periods: ["MONTHLY"] as const },
  { name: "WHC", type: "WAREHOUSE" as const, periods: ["MONTHLY", "WEEKLY"] as const },
  { name: "WH", type: "WAREHOUSE" as const, periods: ["MONTHLY", "WEEKLY"] as const },
  { name: "Depo", type: "WAREHOUSE" as const, periods: ["MONTHLY", "WEEKLY"] as const },
  { name: "Bulky", type: "WAREHOUSE" as const, periods: ["MONTHLY", "WEEKLY"] as const },
  { name: "Store Hub", type: "WAREHOUSE" as const, periods: ["MONTHLY", "WEEKLY"] as const },
  { name: "Gudang Anak", type: "WAREHOUSE" as const, periods: ["MONTHLY", "WEEKLY"] as const },
]

async function main() {
  for (const seed of areaSeeds) {
    const area = await prisma.area.upsert({
      where: { name: seed.name },
      update: {
        type: seed.type,
        isActive: true,
      },
      create: {
        name: seed.name,
        type: seed.type,
        isActive: true,
      },
    })

    for (const period of seed.periods) {
      await prisma.areaChecklistAvailability.upsert({
        where: {
          areaId_period: {
            areaId: area.id,
            period,
          },
        },
        update: {},
        create: {
          areaId: area.id,
          period,
        },
      })
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Note: this requires `Area.name` to be unique. If `Area.name` is not unique, update the schema with `@unique` on `name` or use a stable `code` field. Prefer adding `code String @unique` for enterprise robustness.

- [ ] **Step 3: Prefer stable area code**

If adding `code`, update `Area`:

```prisma
model Area {
  id       String @id @default(cuid())
  code     String @unique
  name     String
  type     AreaType
  isActive Boolean @default(true)
  // ...
}
```

Then seed with codes:

```ts
{ code: "office", name: "Office", type: "OFFICE", periods: ["MONTHLY"] }
```

- [ ] **Step 4: Run seed only after environment confirmation**

Ask for development/production confirmation before running:

```powershell
pnpm prisma db seed
```

Expected: global areas and availability records exist in the development database.

---

### Task 6: Add Server Data Query

**Files:**
- Create: `lib/es-dashboard-data.ts`
- Create: `lib/prisma.ts` if no Prisma singleton exists

**Interfaces:**
- Produces: `getEsDashboardFlowOptions(): Promise<EsDashboardFlowOptions>`

- [ ] **Step 1: Create Prisma singleton if missing**

Create `lib/prisma.ts`:

```ts
import { PrismaClient } from "@/generated/prisma"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 2: Create query module**

Create `lib/es-dashboard-data.ts`:

```ts
import { prisma } from "@/lib/prisma"

export type EsAreaOption = {
  id: string
  code: string
  name: string
  type: "OFFICE" | "WAREHOUSE"
  periods: Array<"MONTHLY" | "WEEKLY">
}

export type EsDashboardFlowOptions = {
  areas: EsAreaOption[]
}

export async function getEsDashboardFlowOptions(): Promise<EsDashboardFlowOptions> {
  const areas = await prisma.area.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      checklistAvailabilities: {
        orderBy: { period: "asc" },
      },
    },
  })

  return {
    areas: areas.map((area) => ({
      id: area.id,
      code: area.code,
      name: area.name,
      type: area.type,
      periods: area.checklistAvailabilities.map((availability) => availability.period),
    })),
  }
}
```

- [ ] **Step 3: Validate TypeScript**

Run: `pnpm typecheck`

Expected: no TypeScript errors.

---

### Task 7: Build Guided Report Flow Component

**Files:**
- Create: `components/es-dashboard/report-flow.tsx`
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `areas: EsAreaOption[]`
- Produces: client-side selection state and final `Lanjutkan` CTA enabled state.

- [ ] **Step 1: Create client component**

Create `components/es-dashboard/report-flow.tsx`:

```tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import type { EsAreaOption } from "@/lib/es-dashboard-data"

type WorkPermitChoice = "fill" | "skip"
type ReportType = "checklist" | "repair"
type Period = "MONTHLY" | "WEEKLY"

type ReportFlowProps = {
  areas: EsAreaOption[]
}

export function ReportFlow({ areas }: ReportFlowProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [workPermit, setWorkPermit] = React.useState<WorkPermitChoice>()
  const [reportType, setReportType] = React.useState<ReportType>()
  const [areaId, setAreaId] = React.useState<string>()
  const [period, setPeriod] = React.useState<Period>()

  const selectedArea = areas.find((area) => area.id === areaId)
  const availablePeriods = selectedArea?.periods ?? []
  const requiresPeriod = reportType === "checklist"
  const canContinue = Boolean(
    workPermit &&
      reportType &&
      selectedArea &&
      (!requiresPeriod || period),
  )

  function chooseArea(nextAreaId: string) {
    const nextArea = areas.find((area) => area.id === nextAreaId)
    setAreaId(nextAreaId)
    setPeriod(nextArea?.periods.length === 1 ? nextArea.periods[0] : undefined)
  }

  return (
    <section className="mt-5">
      <Button
        className="h-14 w-full rounded-lg bg-[#ff8a2a] text-base font-semibold text-black shadow-lg shadow-[#ff8a2a]/20 hover:bg-[#ff9c48]"
        onClick={() => setIsOpen((value) => !value)}
      >
        Buat Laporan Baru
      </Button>

      {isOpen ? (
        <div className="mt-4 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
          {/* Implement four sections: work permit, report type, area, period */}
          {/* Keep all sections visible; disable later sections until prior choices exist */}
          <Button disabled={!canContinue} className="mt-4 h-11 w-full">
            Lanjutkan
          </Button>
        </div>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 2: Replace static CTA/flow sections**

In `app/dashboard/page.tsx`:

```tsx
import { ReportFlow } from "@/components/es-dashboard/report-flow"
import { getEsDashboardFlowOptions } from "@/lib/es-dashboard-data"

export default async function DashboardPage() {
  const { areas } = await getEsDashboardFlowOptions()

  return (
    // keep header, welcome illustration, stats, bottom nav
    <ReportFlow areas={areas} />
  )
}
```

- [ ] **Step 3: Remove hardcoded area source of truth**

Delete static `areaChoices` from `app/dashboard/page.tsx`. Static UI arrays for non-domain display, such as dashboard nav labels, are allowed. Area source of truth must come from DB.

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`

Expected: no errors.

---

### Task 8: Verification and Commit

**Files:**
- All changed files from prior tasks.

**Interfaces:**
- Produces verified implementation ready for review.

- [ ] **Step 1: Run Prisma validation**

Run: `pnpm prisma:validate`

Expected: schema valid.

- [ ] **Step 2: Generate Prisma Client**

Run: `pnpm prisma:generate`

Expected: generated client updates successfully.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`

Expected: exit code 0.

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`

Expected: exit code 0.

- [ ] **Step 5: Run build**

Run: `pnpm build`

Expected: exit code 0.

- [ ] **Step 6: Check ignored files**

Run:

```powershell
git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering status --short --branch --ignored
```

Expected:
- `data/` remains ignored.
- No Excel file is staged.
- Prisma migration and docs are tracked.

- [ ] **Step 7: Commit**

Stage only intended files:

```powershell
git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering add AI_RULES.md docs/00_Project/30_Project_Rules.md docs/01_Architecture/10_Data_Models.md docs/02_Features/ESDashboard/00_Spec.md prisma/schema.prisma prisma/migrations prisma/seed.ts prisma.config.ts lib/prisma.ts lib/es-dashboard-data.ts components/es-dashboard/report-flow.tsx app/dashboard/page.tsx
git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering commit -m "feat: back ES dashboard flow with database"
```

Expected: commit succeeds and pre-commit docs guard passes.

---

## Self-Review

- Spec coverage: covers global area configuration, checklist period availability, DB-backed dashboard options, and migration policy.
- Placeholder scan: no TODO/TBD placeholders; code snippets define concrete interfaces and commands.
- Type consistency: `EsAreaOption`, `ChecklistPeriod`, and UI period state use `MONTHLY | WEEKLY` consistently.

