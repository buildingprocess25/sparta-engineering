import assert from "node:assert/strict";
import { checkAgentTaskNote } from "./check-agent-task-note.mjs";

assert.equal(
  checkAgentTaskNote(["app/page.tsx"]),
  1,
  "substantive changes require a dated task note",
);

assert.equal(
  checkAgentTaskNote([
    "app/page.tsx",
    "docs/agent-notes/2026-07-29-1200-update-home.md",
  ]),
  0,
  "a dated task note allows substantive changes",
);

assert.equal(
  checkAgentTaskNote(["docs/superpowers/plans/example.md"]),
  0,
  "process documentation is exempt",
);

assert.equal(
  checkAgentTaskNote([".githooks/pre-commit"]),
  1,
  "hook changes require a dated task note",
);

console.log("agent task note assertions passed");
