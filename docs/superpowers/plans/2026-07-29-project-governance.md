# Project Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce safe, documented AI work and provide a GHCR-to-Dokploy deployable Next.js/Prisma project template.

**Architecture:** Root agent instructions point to one detailed rule document and dated task notes. A small Node pre-commit checker enforces note creation. Prisma is configured without database mutation; Docker and GitHub Actions deliver the image and notify Dokploy.

**Tech Stack:** Next.js 16, Node.js, Prisma 7, PostgreSQL, pnpm, Docker, GitHub Actions, GHCR, Dokploy.

## Global Constraints

- Read `skills-lock.json` and use every installed skill relevant to the task.
- Run `/impeccable init` when `PRODUCT.md` or `DESIGN.md` is missing; use Impeccable for every UI change.
- Prefer shadcn/ui; do not use `git commit --no-verify`.
- Ask whether the target database is development or production before database-affecting Prisma commands.
- Never run `prisma db push`, `prisma migrate dev`, or `prisma migrate deploy`.
- Keep credentials only in environment variables or GitHub secrets.

---

### Task 1: Add task-note guard and governance documents

**Files:**
- Create: `AI_RULES.md`, `docs/agent-notes/README.md`, `docs/agent-notes/TEMPLATE.md`, `.githooks/pre-commit`, `scripts/check-agent-task-note.mjs`, `scripts/check-agent-task-note.spec.mjs`
- Modify: `AGENTS.md`, `package.json`, `README.md`
- Test: `scripts/check-agent-task-note.spec.mjs`

- [x] **Step 1: Write the failing task-note test**

Assert that a substantive staged path without `docs/agent-notes/YYYY-MM-DD-HHMM-<task>.md` returns `1`.

- [x] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-agent-task-note.spec.mjs`

Expected: failure because the checker module does not exist.

- [x] **Step 3: Implement the minimal checker and documentation**

Export `checkAgentTaskNote(paths)` from the checker, add the tracked pre-commit hook, setup/test scripts, agent rules, and note contract.

- [x] **Step 4: Run the checker test**

Run: `node scripts/check-agent-task-note.spec.mjs`

Expected: exit code `0` and assertion success output.

### Task 2: Add safe Prisma starter configuration

**Files:**
- Create: `prisma/schema.prisma`, `prisma.config.ts`, `.env.example`
- Modify: `package.json`, `pnpm-lock.yaml`, `.gitignore`, `README.md`

- [x] **Step 1: Install Prisma dependencies without touching a database**

Run: `pnpm add @prisma/client && pnpm add -D prisma dotenv`

- [x] **Step 2: Configure the PostgreSQL schema and Prisma config**

Use the Prisma 7 `prisma-client` generator with output `../generated/prisma`, PostgreSQL datasource, and `DATABASE_URL` loaded through `prisma.config.ts`.

- [x] **Step 3: Validate the schema without a database connection**

Run: `pnpm prisma validate`

Expected: schema validates with no database mutation.

### Task 3: Add container delivery and deployment automation

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `.github/workflows/deploy.yml`
- Modify: `next.config.ts`, `README.md`

- [x] **Step 1: Configure standalone Next.js output**

Set `output: "standalone"` in `next.config.ts` so the runtime Docker stage only copies the production server and static assets.

- [x] **Step 2: Add multi-stage Docker build**

Install locked pnpm dependencies, run `pnpm build`, copy `.next/standalone` plus static assets into a non-root Node runtime, expose `3000`, and set `HOSTNAME=0.0.0.0`.

- [x] **Step 3: Add GitHub Actions deployment workflow**

On `main` and `master` pushes, build and push the image to GHCR using `GITHUB_TOKEN`, then call the `DOKPLOY_WEBHOOK_URL` secret with `curl --fail --show-error --silent --request POST`.

- [x] **Step 4: Verify workflow and production build**

Run: `pnpm lint && pnpm typecheck && pnpm build`

Expected: exit code `0`; inspect the workflow for `packages: write`, immutable SHA tag, `latest` tag, and the webhook secret.

### Task 4: Record durable project context

**Files:**
- Create: `docs/agent-notes/2026-07-29-<time>-project-governance.md`

- [x] **Step 1: Create the dated task note**

Use the template and record every changed file, commands run, generated artifacts, the no-migration boundary, and any verification limitation.

- [x] **Step 2: Verify the staged-change guard**

Run: `pnpm check:agent-note`

Expected: exit code `0` once the dated note is staged with substantive changes.
