# AI Coding Rules

These rules are mandatory for every AI agent and developer working in this
repository.

## Skills and Product Context

- Read `skills-lock.json` before starting and use every installed skill that
  matches the task. Do not invoke unrelated or mutually exclusive skills just
  to satisfy this rule.
- If either `PRODUCT.md` or `DESIGN.md` is missing, run `/impeccable init`
  before continuing.
- Every UI creation, revision, redesign, or visual polish must use the
  Impeccable skill and follow its current project context.

## UI Components

### 1. Prioritize shadcn/ui

- Always use shadcn/ui components before writing custom markup.
- Before creating, revising, or redesigning UI, check the shadcn registry:

  ```powershell
  npx shadcn@latest list '@shadcn'
  npx shadcn@latest search '@shadcn' -q "<component-need>"
  ```

- In PowerShell, quote `'@shadcn'` so it is not interpreted as syntax.
- When a user supplies a UI reference, analyze its structure first, then find
  an equivalent with `npx shadcn@latest search` or `npx shadcn@latest docs`.
- If shadcn provides the component, import and use it; do not rebuild it from
  scratch. Custom components are allowed only when no suitable shadcn
  component exists.

### 2. Custom Components Must Be Reusable

- Custom components must accept props and must not hardcode one screen's data.
- Put them in the appropriate `@/components/` path with a descriptive name.
- Do not create one-off components that cannot be reused.

### 3. Do Not Add Manual Spacing to shadcn Components

- Do not add padding, gap, margin, or other spacing styles inside or between
  shadcn/ui components such as `Card`, `CardHeader`, `CardContent`,
  `CardFooter`, `Button`, `Input`, `Dialog`, or `Sheet`.
- Use a layout wrapper, for example `flex flex-col gap-4`, when sibling
  elements need separation. Do not override calibrated component spacing.

## Prisma and Database Safety

- Use Prisma ORM for persistence; do not introduce a second ORM.
- Never run `prisma db push`.
- Schema changes must be recorded as Prisma migrations.
- Before any database-affecting Prisma command, ask whether the current
  connection is development or production and identify the target environment.
- `prisma migrate dev --create-only` is permitted only for development
  connections after environment confirmation.
- Applying migrations (`prisma migrate dev` without `--create-only` or
  `prisma migrate deploy`) requires explicit environment confirmation and must
  never target production unless the user explicitly confirms the production
  deployment workflow.
- `prisma validate`, `prisma format`, and `prisma generate` are permitted
  because they do not mutate the configured database.

## Git Safety

- Never run `git commit --no-verify` to bypass a required documentation update.
  Fix the missing or outdated spec in `docs/` instead.
- `git commit --no-verify` is **permitted only for minor fixes**: typos,
  non-behavioral CSS tweaks, or trivial bug corrections that do not change
  feature behavior or architecture. Document this exception in the commit
  message (e.g. `fix: typo in button label`).
- Do not bypass or disable Git hooks for substantive changes.
