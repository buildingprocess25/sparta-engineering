# Project Agent Instructions

## Required Project Context

Before starting work, every AI agent and developer must:

1. Read `AI_RULES.md`.
2. Read `skills-lock.json` and use every installed skill relevant to the task.
3. Read the relevant spec in `docs/02_Features/` and architecture docs in
   `docs/01_Architecture/` before touching any code.
4. Verify current code and schema before relying on any documentation.
5. Run `/impeccable init` before continuing when either `PRODUCT.md` or
   `DESIGN.md` does not exist.

## Documentation Driven Development (DDD) Workflow

This project follows a strict **Documentation Driven Development** discipline.
The `docs/` folder is the Single Source of Truth. Follow this order for every
feature or non-trivial change:

```
DISCUSS → DOCUMENT → CODE → COMMIT
```

1. **Discuss** — Agree on design, data flow, and UI approach with the team or
   user before writing any code.
2. **Document** — Create or update the relevant spec before touching
   implementation:
   - Feature work → `docs/02_Features/<FeatureName>/00_Spec.md`
   - Schema or data changes → `docs/01_Architecture/10_Data_Models.md`
   - Architectural decisions → `docs/03_Decisions/`
3. **Code** — Implement against the spec. If the spec needs adjusting, update
   the doc first, then the code.
4. **Commit** — Stage the updated doc file together with the code. The
   pre-commit hook (`pnpm check:docs`) enforces that substantive code changes
   include a `docs/` update.

### Bypass Policy

`git commit --no-verify` is **permitted exclusively for minor fixes** such as
typos, non-behavioral CSS tweaks, or trivial bug corrections that require no
documentation change. It must **not** be used to skip a required spec update
for a real feature or architectural change.

## Local Commit Enforcement

Run this once after cloning the repository:

```powershell
pnpm setup:git-hooks
```

It configures `.githooks/pre-commit` for every local branch. Commits that
stage substantive code changes without a matching `docs/` update are blocked.


<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
