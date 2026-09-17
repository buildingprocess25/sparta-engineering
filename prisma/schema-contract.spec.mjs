import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("./schema.prisma", import.meta.url), "utf8");

assert.match(schema, /DRAFT/);
assert.match(schema, /reportCode\s+String\?\s+@unique/);
assert.match(schema, /formCode\s+String\?/);
assert.match(schema, /checklistPayload\s+Json\s+@default\("\{\}"\)/);
assert.match(schema, /drivePhotoFileIds\s+Json\s+@default\("\[\]"\)/);
assert.match(schema, /finalPdfDriveUrl\s+String\?/);
assert.match(schema, /finalPdfFolderUrl\s+String\?/);
assert.match(schema, /model GoogleDriveFolderCache/);
