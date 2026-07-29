# Project Governance and Deployment Template Design

## Goal

Make this template enforce a consistent AI workflow, durable task notes, safe Prisma use, and a repeatable GHCR-to-Dokploy deployment path.

## Scope

This change adds process documentation, a local commit guard, a Prisma starter configuration, and container deployment files. It does not connect to a database, create a migration, deploy an image, or configure a real Dokploy webhook.

## Agent Workflow

`AGENTS.md` is the mandatory entry point. Before working, an agent must read `AI_RULES.md`, inspect `skills-lock.json`, use every installed skill relevant to the task, read the canonical documents and recent relevant task notes, and verify current code before relying on a note.

When either `PRODUCT.md` or `DESIGN.md` is absent, the agent must run `/impeccable init` before work continues. Every UI creation, revision, or redesign must use the Impeccable skill. `AI_RULES.md` keeps the shadcn-first policy, reusable custom-component rule, and calibrated-spacing rule supplied for this template.

## Durable Notes

The template adopts the Sparta Maintenance task-note contract exactly: substantive file or project-decision changes require one dated Asia/Jakarta note in `docs/agent-notes/`; read-only and unchanged investigations are exempt. The note records scope, sources, changed files, decisions, verification, and remaining risks, without secrets or production data.

A tracked pre-commit hook runs a small Node checker. It rejects substantive staged changes without a dated task note. `git commit --no-verify` is explicitly prohibited in the agent rules and note documentation because it bypasses this guard.

## Prisma Safety

The template provides Prisma 7 with a PostgreSQL schema, generated client output, and `prisma.config.ts`. Agents must use Prisma for persistence. Before any database-affecting command, agents must ask whether the configured environment is development or production and identify the target connection. `prisma db push`, `prisma migrate dev`, and `prisma migrate deploy` are prohibited; this template only permits non-mutating validation and generation unless the user explicitly changes the policy.

## Delivery

The image is built from a multi-stage Next.js Dockerfile. The GitHub Actions workflow runs on pushes to `main` and the template's current `master` branch, logs in to GHCR, builds and pushes `ghcr.io/${{ github.repository }}`, then posts to the `DOKPLOY_WEBHOOK_URL` repository secret. Dokploy owns deployment configuration and the VPS runtime; the image exposes port 3000 and uses `HOSTNAME=0.0.0.0`.

The workflow does not contain credentials. The repository owner must set `DOKPLOY_WEBHOOK_URL` and configure Dokploy to pull the emitted GHCR tag. The target VPS is expected to have 8 CPU and 8 GB RAM, but the repository does not impose a container CPU or memory limit because that belongs to Dokploy runtime configuration.

## Verification

The task-note checker has an assertion-based Node test that covers rejected substantive changes, accepted changes with a dated note, and exempt process documents. Verification also runs Prisma schema validation, TypeScript checking, linting, production build, and a static inspection of the workflow and Docker build context.
