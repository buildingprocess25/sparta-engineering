# Project Governance and Deployment Template

## Scope

Add mandatory AI workflow rules, durable task notes, a local task-note commit
guard, safe Prisma starter configuration, and GHCR-to-Dokploy delivery files.
Runtime deployment, database connection, migration execution, and Dokploy
configuration are intentionally outside this task.

## Context and Sources

- `AGENTS.md`, `skills-lock.json`, `package.json`, and `components.json`.
- `docs/superpowers/specs/2026-07-29-project-governance-design.md`.
- `docs/superpowers/plans/2026-07-29-project-governance.md`.
- Sparta Maintenance `AGENTS.md`, `AI_RULES.md`, and `docs/agent-notes/`
  contract, used as the requested reference.

## Changed Files

- `AGENTS.md`: required agent context, Impeccable initialization, notes, and
  hook policy.
- `AI_RULES.md`: skills, UI/shadcn, Prisma safety, and Git safety rules.
- `docs/agent-notes/*`: required note contract and this task record.
- `scripts/check-agent-task-note.*`, `.githooks/pre-commit`, `package.json`:
  local task-note enforcement and commands.
- `prisma/schema.prisma`, `prisma.config.ts`, `.env.example`: PostgreSQL Prisma
  starter configuration without a database connection.
- `Dockerfile`, `.dockerignore`, `.github/workflows/deploy.yml`,
  `next.config.ts`: standalone Next.js image and GHCR-to-Dokploy automation.
- `README.md`, `.gitignore`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`: setup and
  dependency support.
- `eslint.config.mjs`: excludes agent-skill tooling from application linting.
- `.claude/settings.local.json`: configures the committed Impeccable hooks for
  Claude-based agents.

## Decisions

- Agents use every installed skill relevant to their task; unrelated or
  mutually exclusive skills are not invoked merely for coverage.
- The local hook enforces task notes for normal commits. `--no-verify` is
  explicitly prohibited, although Git itself permits this bypass flag.
- Changes to the hook and governance rules require a task note too, so the
  guard cannot be weakened without leaving a durable record.
- Prisma commands that mutate a database are prohibited. Validation and client
  generation use a synthetic local connection string and do not connect to a
  database.
- The Docker image targets Node 24 because Prisma 7 supports Node 24; the
  developer workstation currently uses Node 26, which Prisma warns is outside
  its supported range.
- Dokploy receives a webhook after a successful GHCR image push. It owns VPS
  limits, networking, domain, and TLS configuration.
- The workflow supports both `main` and the template's current `master` branch
  so a newly configured repository deploys without an initial branch rename.

## Verification

- `node scripts/check-agent-task-note.spec.mjs`: passed after first failing for
  the absent checker module; it also proves hook changes require a dated note.
- `pnpm test:agent-note`: passed.
- `pnpm prisma:validate` and `pnpm prisma:generate` with a synthetic localhost
  `DATABASE_URL`: passed.
- `pnpm lint`: passed with one existing unused-import warning in `app/layout.tsx`.
- `pnpm typecheck`: passed.
- `pnpm build`: passed with network access after the sandbox could not fetch the
  existing Google Fonts.
- Static workflow/Dockerfile inspection found the standalone output, Prisma
  generation, port `3000`, GHCR package permission, SHA/latest tags, and
  `DOKPLOY_WEBHOOK_URL` secret.

## Remaining Work and Risks

- Configure the repository secret `DOKPLOY_WEBHOOK_URL` and GHCR access in
  Dokploy before production deployment.
- Local Docker image build could not run because Docker Desktop's Linux daemon
  is stopped; verify `docker build --tag project-template:verify .` once it is
  available.
- The current working tree has pre-existing user changes in `app/globals.css`
  and untracked agent configuration folders; this task does not modify them.
