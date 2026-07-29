# Project Agent Instructions

## Required Project Context

Before starting work, every AI agent and developer must:

1. Read `AI_RULES.md`.
2. Read `skills-lock.json` and use every installed skill relevant to the task.
3. Read canonical documents relevant to the task and recent related notes in
   `docs/agent-notes/`.
4. Verify current code and schema before relying on an older note.
5. Run `/impeccable init` before continuing when either `PRODUCT.md` or
   `DESIGN.md` does not exist.

## Required Task Note

Before finishing a task that changes files or project decisions:

1. Update canonical documentation when a permanent behavior or decision
   changed.
2. Create one note from `docs/agent-notes/TEMPLATE.md`.
3. Name it `docs/agent-notes/YYYY-MM-DD-HHMM-<task>.md` using Asia/Jakarta
   time.

Read-only exploration, status checks, and unchanged investigations do not
require a task note. Task notes must not include secrets, credentials, raw SQL
output, personal data, or production records.

## Local Commit Enforcement

Run this once after cloning the repository:

```powershell
pnpm setup:git-hooks
```

It configures `.githooks/pre-commit` for every local branch. Normal commits
that stage substantive changes without a dated task note are blocked.
`git commit --no-verify` is strictly prohibited because it bypasses this
required guard.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
