# ES Report Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the `ChecklistReport` database schema to distinguish between `PREVENTIVE` and `INCIDENTAL` reports, enforce unique constraints for preventive reports per period, and update the UI logic to track and limit preventive tasks while allowing unlimited incidental tasks.

**Architecture:** We will add `ReportCategory` enum to Prisma schema and update `ChecklistReport` with `category`, `period`, and `periodKey`. Then we will use Prisma migrations to update the database.

**Tech Stack:** Prisma, PostgreSQL.

## Global Constraints

- Must follow the spec in `docs/superpowers/specs/2026-09-16-es-report-flow-design.md` exactly.
- All database changes must be valid PostgreSQL schema changes.

---

### Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Consumes: None.
- Produces: Updated DB schema.

- [ ] **Step 1: Write the implementation**

Update `prisma/schema.prisma` to include the new enum and fields in `ChecklistReport`.

```prisma
enum ReportCategory {
  PREVENTIVE
  INCIDENTAL
}

model ChecklistReport {
  id        String          @id @default(cuid())
  areaId    String
  authorId  String
  category  ReportCategory  @default(PREVENTIVE)
  period    ChecklistPeriod?
  periodKey String?         // Format: "YYYY-Www" atau "YYYY-MM"
  status    ReportStatus    @default(PENDING_COORD)
  isSafe    Boolean         @default(false)
  createdAt DateTime        @default(now()) @db.Timestamptz(3)
  updatedAt DateTime        @updatedAt @db.Timestamptz(3)

  area   Area            @relation(fields: [areaId], references: [id])
  author User            @relation("ReportAuthor", fields: [authorId], references: [NIK])
  items  ChecklistItem[]

  @@unique([areaId, period, periodKey])
  @@index([authorId])
  @@index([areaId])
  @@index([status])
}
```

- [ ] **Step 2: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add category and period tracking to ChecklistReport"
```

---

### Task 2: Generate and Push Prisma Client

**Files:**
- Modify: Database Schema (via CLI)

**Interfaces:**
- Consumes: Prisma schema from Task 1.
- Produces: Generated Prisma client.

- [ ] **Step 1: Format and Generate**

```bash
npm run prisma:format
npm run prisma:generate
```

- [ ] **Step 2: Database Migration / Push**

```bash
npx prisma db push
```
*(Note: If working in a production-like environment with migrations, use `prisma migrate dev` instead, but for local prototyping `db push` is often used).*
