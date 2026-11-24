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

test("FRM_TS_041 and FRM_TS_028 PDFs render all V7 condition codes accurately without showing URGENT or ADJUST as BAIK", async () => {
  const conveyorPdf = await renderedText({
    ...report,
    reportCode: "ENG-WH-202611-041",
    formCode: "FRM_TS_041",
    formName: "Checklist Conveyor",
    isSafe: false,
    items: [
      { id: "i1", label: "Item OK", condition: "BAIK" },
      { id: "i2", label: "Item NG", condition: "RUSAK", notes: "Belt sobek", photosCount: 1 },
      { id: "i3", label: "Item Adj", condition: "ADJUST_OR_ADD", notes: "Setel ketegangan", photosCount: 1 },
      { id: "i4", label: "Item Rep", condition: "REPAIR", notes: "Las dudukan", photosCount: 1 },
      { id: "i5", label: "Item Urg", condition: "URGENT", notes: "Sensor mati total", photosCount: 1 },
      { id: "i6", label: "Item None", condition: "TIDAK_ADA" },
    ],
  })
  assert.match(conveyorPdf, /BAIK \(V\)/)
  assert.match(conveyorPdf, /RUSAK \(X\)/)
  assert.match(conveyorPdf, /ADJUST \(A\)/)
  assert.match(conveyorPdf, /REPAIR \(R\)/)
  assert.match(conveyorPdf, /URGENT \(U\)/)
  assert.match(conveyorPdf, /NONE \(N\)/)
  assert.match(conveyorPdf, /TS\/041/)

  const urgentOnlyPdf = await renderedText({
    ...report,
    reportCode: "ENG-WH-202611-028",
    formCode: "FRM_TS_028",
    formName: "Form Monthly Checklist Battery",
    isSafe: false,
    items: [
      { id: "b1", label: "Kabel baterai", condition: "URGENT", notes: "Kabel panas", photosCount: 1 },
      { id: "b2", label: "Tray", condition: "TIDAK_ADA" },
    ],
  })
  assert.match(urgentOnlyPdf, /URGENT \(U\)/)
  assert.match(urgentOnlyPdf, /NONE \(N\)/)
  assert.doesNotMatch(urgentOnlyPdf, /BAIK \(V\)/)

  const forkliftBatteryPdf = await renderedText({
    ...report,
    reportCode: "ENG-WH-202611-068",
    formCode: "FRM_TS_068",
    formName: "Form Monthly Checklist Battery",
    items: [{ id: "b3", label: "Soket", condition: "TIDAK_ADA" }],
  })
  assert.match(forkliftBatteryPdf, /TS\/068/)
  assert.match(forkliftBatteryPdf, /TIDAK ADA/)
})
