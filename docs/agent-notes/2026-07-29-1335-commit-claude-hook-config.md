# Commit Claude Hook Configuration

## Scope

Commit the previously ignored Claude Impeccable hook configuration after the
user explicitly requested that every remaining change be committed.

## Context and Sources

- `.claude/settings.local.json`
- `AGENTS.md` and `AI_RULES.md`
- `docs/agent-notes/2026-07-29-1319-project-governance.md`

## Changed Files

- `.claude/settings.local.json`: enables existing committed Impeccable hooks
  for Claude-based agents.
- `docs/agent-notes/2026-07-29-1335-commit-claude-hook-config.md`: records the
  explicit decision to commit this normally ignored configuration.

## Decisions

The file is normally ignored because of its `settings.local.json` name, but it
contains no credentials and is required to activate the committed Impeccable
hook scripts. It is force-added only because the user explicitly requested all
remaining changes in the repository.

## Verification

- `pnpm check:agent-note`: will run before the amended commit.

## Remaining Work and Risks

None.
