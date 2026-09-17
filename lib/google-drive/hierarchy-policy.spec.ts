import assert from "node:assert/strict"

import {
  buildChecklistEvidenceRelativePath,
  buildChecklistPhotoName,
  buildChecklistReportRelativePath,
  buildFinalPdfName,
  sanitizeDriveSegment,
} from "./hierarchy-policy"

assert.equal(sanitizeDriveSegment(" Dinding / partisi\\utama "), "Dinding - partisi-utama")
assert.equal(sanitizeDriveSegment("   "), "-")

assert.deepEqual(
  buildChecklistReportRelativePath({
    branchName: "BANJARMASIN",
    areaName: "Office",
    periodKey: "2026-09",
    reportCode: "ENG-OFFICE-202609-001",
  }),
  ["BANJARMASIN", "Engineering", "Checklist", "Office", "2026-09", "ENG-OFFICE-202609-001"],
)

assert.deepEqual(
  buildChecklistEvidenceRelativePath({
    formCode: "FRM_TSM_003",
    itemId: "air_conditioner",
    itemName: "Air Conditioner",
  }),
  ["02 - Foto Checklist", "FRM_TSM_003", "air_conditioner - Air Conditioner"],
)

assert.equal(
  buildChecklistPhotoName({ sequence: 1, randomSuffix: "abc123ef", extension: "jpg" }),
  "checklist-001-abc123ef.jpg",
)

assert.equal(
  buildFinalPdfName("ENG-OFFICE-202609-001"),
  "ENG-OFFICE-202609-001 - Laporan Final.pdf",
)
