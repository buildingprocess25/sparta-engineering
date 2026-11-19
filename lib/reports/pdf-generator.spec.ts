import assert from "node:assert/strict"
import { test } from "node:test"
import { PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib"
import { generateReportPdfBuffer, getNraForForm, type PdfReportData } from "./pdf-generator"

const coordinator = {
  reviewerId: "C001", reviewerName: "Rina Coordinator", reviewerRole: "COORD",
  decision: "approve", stage: "PENDING_COORD", decidedAt: "2026-11-17T01:30:00.000Z",
}
const manager = {
  reviewerId: "M001", reviewerName: "Budi Manager", reviewerRole: "MANAGER",
  decision: "approve", stage: "PENDING_MANAGER", decidedAt: "2026-11-17T02:30:00.000Z",
}
const report = {
  reportCode: "ENG-WH-202611-001", formCode: "FRM_TS_028", formName: "CHECKLIST BATERAI PALLET MOVER",
  periodKey: "2026-11", periodLabel: "MONTHLY", createdAt: "2026-11-17T00:00:00.000Z",
  branchName: "HEAD OFFICE", areaName: "Warehouse", authorName: "Teknisi BES", authorNik: "E001",
  isSafe: true, items: [], status: "PENDING_COORD", approvalHistory: [], checklistPayload: {},
} satisfies PdfReportData

async function renderedText(data: PdfReportData) {
  const doc = await PDFDocument.load(await generateReportPdfBuffer(data))
  return doc.context.enumerateIndirectObjects()
    .filter(([, object]) => object instanceof PDFRawStream && !object.dict.has("Subtype" as never))
    .map(([, object]) => {
      try {
        const stream = Buffer.from(decodePDFRawStream(object as PDFRawStream).decode()).toString("latin1")
        return [...stream.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)]
          .map((match) => Buffer.from(match[1], "hex").toString("latin1")).join("\n")
      } catch { return "" }
    }).join("\n")
}

test("submitted checklist PDF identifies pending review instead of final", async () => {
  const text = await renderedText(report)
  assert.match(text, /Laporan Pemeriksaan/)
  assert.match(text, /Menunggu Review Coord/)
  assert.doesNotMatch(text, /Laporan Final/)
})

test("regenerated PDF contains current status and recorded reviewer decisions", async () => {
  const reviewed = { ...report, status: "COMPLETED", approvalHistory: [coordinator, manager] }
  const text = await renderedText(reviewed)
  assert.match(text, /Laporan Final/)
  assert.match(text, /Selesai/)
  assert.match(text, /Rina Coordinator/)
  assert.match(text, /Budi Manager/)
  assert.match(text, /COORD/)
  assert.match(text, /MANAGER/)
  assert.match(text, /17\/11\/2026.*08[.:]30.*WIB/)
  assert.match(text, /Disetujui/)
})

test("completed legacy PDF without recorded approvals is not labeled final", async () => {
  const text = await renderedText({ ...report, status: "COMPLETED" })
  assert.doesNotMatch(text, /Laporan Final/)
  assert.match(text, /Belum tercatat/)
})

test("a revision PDF retains the actual revision decision without claiming approval", async () => {
  const text = await renderedText({ ...report, status: "NEEDS_REVISION", approvalHistory: [
    coordinator, { ...manager, decision: "reject_revision", notes: "Periksa ulang baterai" },
  ] })
  assert.match(text, /Perlu Revisi/)
  assert.match(text, /Minta Revisi/)
  assert.match(text, /Periksa ulang baterai/)
  assert.doesNotMatch(text, /Laporan Final/)
})

test("battery PDFs retain distinct official form numbers", () => {
  assert.match(getNraForForm("FRM_TS_028").nra, /TS\/028/)
  assert.match(getNraForForm("FRM_TS_068").nra, /TS\/068/)
})

test("a report waiting for PJU is marked as pending, even after Requester approval", async () => {
  const text = await renderedText({
    ...report, status: "WAITING_PJU",
    approvalHistory: [coordinator, manager, { decision: "approve", stage: "PENDING_REQUESTER" }],
  })
  assert.match(text, /Menunggu PJU/)
  assert.doesNotMatch(text, /Laporan Final/)
})
