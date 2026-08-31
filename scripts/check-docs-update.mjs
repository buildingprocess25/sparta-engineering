import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Directories that require a matching docs/ update when changed.
 */
const SUBSTANTIVE_DIRS = [
  "app/",
  "components/",
  "lib/",
  "hooks/",
  "prisma/",
];

/**
 * Paths inside docs/ that are exempt from counting as a valid docs update
 * (templates are not "live" documentation).
 */
const DOCS_EXEMPT = ["docs/99_Templates/"];

const isSubstantive = (path) =>
  SUBSTANTIVE_DIRS.some((dir) => path.startsWith(dir));

const isDocsUpdate = (path) =>
  path.startsWith("docs/") &&
  !DOCS_EXEMPT.some((exempt) => path.startsWith(exempt));

/**
 * Returns 0 (ok) or 1 (blocked).
 *
 * Rules:
 *  - If staged paths contain no substantive code changes → allow (e.g. pure
 *    config or tooling commits).
 *  - If staged paths contain substantive changes AND at least one docs/ file
 *    is also staged → allow.
 *  - Otherwise → block and print a helpful message.
 */
export function checkDocsUpdate(paths) {
  const changedPaths = paths.filter(Boolean);

  if (!changedPaths.some(isSubstantive)) return 0;
  if (changedPaths.some(isDocsUpdate)) return 0;

  return 1;
}

function getStagedPaths() {
  return execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = checkDocsUpdate(getStagedPaths());

  if (result) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║              Documentation Driven Development                ║
╠══════════════════════════════════════════════════════════════╣
║  Commit blocked: substantive code changes detected but no    ║
║  documentation was updated.                                  ║
║                                                              ║
║  Before committing, update or create the relevant spec:      ║
║    docs/02_Features/<FeatureName>/00_Spec.md                 ║
║    docs/01_Architecture/                                     ║
║                                                              ║
║  For minor fixes (typos, CSS tweaks, non-behavioral bugs)    ║
║  you may bypass this guard with:                             ║
║    git commit --no-verify -m "fix: <description>"            ║
╚══════════════════════════════════════════════════════════════╝
`);
  }

  process.exitCode = result;
}
