import assert from "node:assert/strict";
import { checkDocsUpdate } from "./check-docs-update.mjs";

assert.equal(
  checkDocsUpdate(["app/page.tsx"]),
  1,
  "substantive changes without docs update should be blocked",
);

assert.equal(
  checkDocsUpdate(["app/page.tsx", "docs/02_Features/Home/00_Spec.md"]),
  0,
  "substantive changes with a feature spec update should be allowed",
);

assert.equal(
  checkDocsUpdate(["app/page.tsx", "docs/01_Architecture/00_Overview.md"]),
  0,
  "substantive changes with an architecture doc update should be allowed",
);

assert.equal(
  checkDocsUpdate(["docs/99_Templates/feature_spec.md"]),
  0,
  "template-only changes should not be blocked",
);

assert.equal(
  checkDocsUpdate([".githooks/pre-commit", "eslint.config.mjs"]),
  0,
  "non-substantive tooling changes should not be blocked",
);

assert.equal(
  checkDocsUpdate(["prisma/schema.prisma"]),
  1,
  "prisma schema changes require a docs update",
);

assert.equal(
  checkDocsUpdate([
    "prisma/schema.prisma",
    "docs/01_Architecture/10_Data_Models.md",
  ]),
  0,
  "prisma schema changes with architecture doc update should be allowed",
);

console.log("DDD docs-update assertions passed");
