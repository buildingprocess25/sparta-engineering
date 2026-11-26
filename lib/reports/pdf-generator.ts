import { PDFDocument, StandardFonts, rgb, PDFPage, PDFImage } from "pdf-lib"
import fs from "node:fs"
import path from "node:path"

export type PdfReportPhoto = {
  itemNo: number
  label: string
  condition: string
  notes?: string
  fileId?: string
  imageBytes?: Buffer | Uint8Array | null
}

import { getChecklistConditionDisplay } from "@/lib/checklists/condition-display"
import {
  FORM_014,
  FORM_065,
  FORM_065_LABEL,
  getReportItems,
  hasCostEstimateFollowUp,
  hasForm065FollowUp,
  hasRepairWithoutCost,
  REPAIR_TANPA_BIAYA,
  requiresRequesterReview,
} from "@/lib/reports/checklist-follow-up"
import {
  readStoredCompletionEvidence,
  type ReportCompletionEvidence,
} from "@/lib/reports/completion-evidence"
import {
  normalizeApprovalHistory,
  normalizeExecutionHistory,
} from "@/lib/reports/report-display"

export function formatPdfCondition(condition?: string | null, formCode?: string | null) {
  if ((condition || "").toUpperCase() === "BUKTI_SELESAI") {
    return { text: "BUKTI SELESAI", color: rgb(0.1, 0.45, 0.7), isBad: false }
  }
  const baseCode = (formCode || "").replace(/_REPAIR$/i, "").toUpperCase()
  const isV7Form = baseCode === "FRM_TS_041" || baseCode === "FRM_TS_028"
  const display = getChecklistConditionDisplay(condition, {
    noneLabel: isV7Form ? "NONE (N)" : "TIDAK ADA",
  })

  switch (display.tone) {
    case "danger":
      return { text: "RUSAK (X)", color: rgb(0.8, 0.15, 0.15), isBad: true }
    case "urgent":
      return { text: "URGENT (U)", color: rgb(0.72, 0.08, 0.12), isBad: true }
    case "warning":
      return {
        text: display.code === "A" ? "ADJUST (A)" : "REPAIR (R)",
        color: display.code === "A" ? rgb(0.7, 0.35, 0.1) : rgb(0.9, 0.4, 0.05),
        isBad: true,
      }
    case "info":
      return { text: "CLEAN (C)", color: rgb(0.1, 0.45, 0.7), isBad: false }
    case "neutral":
      return {
        text: display.code === "N" ? (isV7Form ? "NONE (N)" : "TIDAK ADA") : display.label,
        color: rgb(0.45, 0.5, 0.55),
        isBad: false,
      }
    case "ok":
      return { text: "BAIK (V)", color: rgb(0.1, 0.55, 0.2), isBad: false }
  }
}

export type ApprovalHistoryRecord = {
  reviewerId?: string
  reviewerName?: string
  reviewerRole?: string
  accountRole?: string
  approvalRole?: string
  stage?: string
  decision?: string
  notes?: string
  decidedAt?: string | Date
}

export type PdfReportData = {
  reportCode: string
  formCode: string
  formName: string
  periodKey: string
  periodLabel: string
  createdAt: Date | string
  branchName: string
  areaName: string
  roomName?: string | null
  equipmentName?: string | null
  equipmentCode?: string | null
  equipmentSerial?: string | null
  equipmentBrand?: string | null
  authorName: string
  authorNik: string
  isSafe: boolean
  status?: string | null
  approvalHistory?: ApprovalHistoryRecord[] | unknown[] | null
  executionHistory?: unknown[] | null
  checklistPayload?: unknown
  completionEvidence?: ReportCompletionEvidence | null
  generalNotes?: string | null
  items: Array<{
    id: string
    label: string
    condition: string
    actionCode?: string
    notes?: string
    handler?: string
    photosCount?: number
  }>
  photos?: PdfReportPhoto[]
}

export function isSparePartProposal(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false
  const p = payload as Record<string, unknown>
  const items = Array.isArray(p.items) ? (p.items as Array<Record<string, unknown>>) : []
  for (const item of items) {
    const f065 = item.followUp065 as Record<string, unknown> | undefined
    const fData = item.followUpData as Record<string, unknown> | undefined
    if (f065?.jenis === "PENGGANTIAN_SPARE_PART" || fData?.jenis === "PENGGANTIAN_SPARE_PART") return true
  }
  return false
}

export function isReportFinal(data: {
  status?: string | null
  approvalHistory?: unknown
  checklistPayload?: unknown
}): boolean {
  if (data.status !== "COMPLETED") return false
  const history = normalizeApprovalHistory(data.approvalHistory)
  if (history.length === 0) return false

  const lastRevIdx = history.map((h) => h.decision).lastIndexOf("reject_revision")
  const activeCycle = lastRevIdx >= 0 ? history.slice(lastRevIdx + 1) : history

  const hasCoord = activeCycle.some(
    (h) => h.decision === "approve" && (h.role === "COORD" || h.stage === "PENDING_COORD")
  )
  const hasManager = activeCycle.some(
    (h) => h.decision === "approve" && (h.role === "MANAGER" || h.stage === "PENDING_MANAGER")
  )

  if (requiresRequesterReview(data.checklistPayload) || isSparePartProposal(data.checklistPayload)) {
    const hasRequester = activeCycle.some(
      (h) => h.decision === "approve" && (h.role === "REQUESTER" || h.stage === "PENDING_REQUESTER")
    )
    return hasCoord && hasManager && hasRequester
  }

  return hasCoord && hasManager
}

export function getStatusLabel(status?: string | null): string {
  switch (status) {
    case "COMPLETED":
      return "Selesai"
    case "PENDING_COORD":
      return "Menunggu Review Coord"
    case "PENDING_MANAGER":
      return "Menunggu Review Manager"
    case "PENDING_REQUESTER":
      return "Menunggu Review Requester"
    case "NEEDS_REVISION":
      return "Perlu Revisi"
    case "REJECTED":
      return "Ditolak"
    case "WAITING_PJU":
      return "Menunggu PJU"
    case "WAITING_PB":
      return "Menunggu Proses PB"
    case "WAITING_PARTS":
      return "Menunggu Alokasi Part"
    case "IN_PROGRESS":
      return "Sedang Dikerjakan"
    case "DRAFT":
      return "Draft"
    default:
      return status || "Menunggu Review"
  }
}

export function formatWib(dateInput: Date | string | undefined | null): string {
  if (!dateInput) return "-"
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return "-"
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const parts = formatter.formatToParts(d)
  const p = (type: string) => parts.find((x) => x.type === type)?.value || ""
  return `${p("day")}/${p("month")}/${p("year")} ${p("hour")}:${p("minute")} WIB`
}

export function getNraForForm(formCode: string): { nra: string; refNra: string } {
  const code = (formCode || "").toUpperCase()
  if (code.includes("FRM_TS_016")) {
    return {
      nra: "SAT/FRM/TS/016_Rev: 02_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  if (code.includes("FRM_TS_029")) {
    return {
      nra: "SAT/FRM/TS/029_Rev : 02_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  if (code.includes("FRM_TS_022")) {
    return {
      nra: "SAT/FRM/TS/022_Rev : 01_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  if (code.includes("FRM_TSM_013")) {
    return {
      nra: "SAT/FRM/TSM/013_Rev_000_100123",
      refNra: "SAT/KEB/TSM/007 Kebijakan Perawatan Peralatan Water Recycle Branch/Depo/Bulky",
    }
  }
  if (code.includes("FRM_TS_064")) {
    return {
      nra: "SAT/FRM/TS/064_Rev : 00_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  if (code.includes("FRM_TSM_008")) {
    return {
      nra: "SAT/FRM/TSM/008_Rev_000_111122",
      refNra: "SAT/KEB/TSM/004 Kebijakan Pemeliharaan Peralatan Unit Sewa di Warehouse/Depo/Bulky",
    }
  }
  if (code.includes("FRM_TSM_002")) {
    return {
      nra: "SAT/FRM/TSM/002_Rev: 01_150821",
      refNra: "SAT/SOP/TSM/002 Prosedur Pemeliharaan Gedung Gudang",
    }
  }
  if (code.includes("FRM_TSM_003")) {
    return {
      nra: "SAT/FRM/TSM/003_Rev: 01_150821",
      refNra: "SAT/SOP/TSM/003 Prosedur Pemeliharaan ME Office",
    }
  }
  if (code.includes("FRM_TSM_005")) {
    return {
      nra: "SAT/FRM/TSM/005_Rev: 01_150821",
      refNra: "SAT/SOP/TSM/005 Prosedur Pemeliharaan Fisik Bangunan",
    }
  }
  if (code.includes("FRM_TS_062")) {
    return {
      nra: "SAT/FRM/TS/062_Rev: 01_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Hand Pallet",
    }
  }
  if (code.includes("FRM_TS_063")) {
    return {
      nra: "SAT/FRM/TS/063_Rev : 00_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  if (code.includes("FRM_TS_041")) {
    return {
      nra: "SAT/FRM/TS/041_Rev:01_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  if (code.includes("FRM_TS_068") || code.includes("TS/068")) {
    return {
      nra: "SAT/FRM/TS/068",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  if (code.includes("FRM_TS_028") || code.includes("TS/028")) {
    return {
      nra: "SAT/FRM/TS/028_Rev:002_161020",
      refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH",
    }
  }
  return {
    nra: `SAT/FRM/${code || "ENG"}_Rev: 01`,
    refNra: "SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment",
  }
}

export async function generateReportPdfBuffer(data: PdfReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Embed header logos if available
  let alfamartLogoImg: PDFImage | null = null
  let spartaLogoImg: PDFImage | null = null

  try {
    const alfaPath = path.join(process.cwd(), "public/assets/Alfamart-Emblem.png")
    if (fs.existsSync(alfaPath)) {
      const alfaBytes = fs.readFileSync(alfaPath)
      alfamartLogoImg = await pdfDoc.embedPng(alfaBytes)
    }
  } catch (err) {
    console.warn("Could not embed Alfamart logo:", err)
  }

  try {
    const spartaPath = path.join(process.cwd(), "public/assets/sparta-engineering-logo.png")
    if (fs.existsSync(spartaPath)) {
      const spartaBytes = fs.readFileSync(spartaPath)
      spartaLogoImg = await pdfDoc.embedPng(spartaBytes)
    }
  } catch (err) {
    console.warn("Could not embed Sparta logo:", err)
  }

  const nraInfo = getNraForForm(data.formCode)

  const marginX = 36
  const pageWidth = 595.28 // A4 width
  const pageHeight = 841.89 // A4 height
  const contentWidth = pageWidth - marginX * 2

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let currentY = pageHeight - 36

  function drawHeader(p: PDFPage) {
    // SAT Header Left
    p.drawText("PT Sumber Alfaria Trijaya Tbk", {
      x: marginX,
      y: pageHeight - 28,
      size: 9,
      font: fontBold,
      color: rgb(0.05, 0.08, 0.15),
    })
    p.drawText("Division : Property & Development", {
      x: marginX,
      y: pageHeight - 40,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    })
    p.drawText("Department : Building & Maintenance", {
      x: marginX,
      y: pageHeight - 50,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    })

    // Logos Top Right
    const spartaW = 28
    const spartaH = 28
    const alfaH = 24
    const alfaW = Math.round((alfaH * 16) / 9) // 43pt

    if (spartaLogoImg) {
      p.drawImage(spartaLogoImg, {
        x: pageWidth - marginX - spartaW,
        y: pageHeight - 53,
        width: spartaW,
        height: spartaH,
      })
    }

    if (alfamartLogoImg) {
      const rightOffset = spartaLogoImg ? spartaW + 10 : 0
      p.drawImage(alfamartLogoImg, {
        x: pageWidth - marginX - rightOffset - alfaW,
        y: pageHeight - 51,
        width: alfaW,
        height: alfaH,
      })
    }

    // Title Center - Diberi jarak yang lebih lega (agak ke bawah)
    const isFinal = isReportFinal(data)
    const docTypeLabel = isFinal ? "Laporan Final" : "Laporan Pemeriksaan"
    const statusText = getStatusLabel(data.status)
    const statusLine = `${docTypeLabel} · Status: ${statusText}`
    const statusLineWidth = fontBold.widthOfTextAtSize(statusLine, 7.5)
    p.drawText(statusLine, {
      x: (pageWidth - statusLineWidth) / 2,
      y: pageHeight - 68,
      size: 7.5,
      font: fontBold,
      color: isFinal ? rgb(0.1, 0.5, 0.2) : rgb(0.85, 0.45, 0.05),
    })

    const formTitle = data.formName || `FORM CHECKLIST ${data.formCode}`
    const titleWidth = fontBold.widthOfTextAtSize(formTitle.toUpperCase(), 10.5)
    p.drawText(formTitle.toUpperCase(), {
      x: (pageWidth - titleWidth) / 2,
      y: pageHeight - 82,
      size: 10.5,
      font: fontBold,
      color: rgb(0.05, 0.08, 0.15),
    })

    // Top horizontal separator line
    p.drawLine({
      start: { x: marginX, y: pageHeight - 94 },
      end: { x: pageWidth - marginX, y: pageHeight - 94 },
      thickness: 1,
      color: rgb(0.8, 0.82, 0.85),
    })
  }

  // Draw initial header
  drawHeader(page)
  currentY = pageHeight - 106

  // Draw Metadata Box
  const metaBoxHeight = 54
  page.drawRectangle({
    x: marginX,
    y: currentY - metaBoxHeight,
    width: contentWidth,
    height: metaBoxHeight,
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.8,
    color: rgb(0.98, 0.98, 0.99),
  })

  const col1X = marginX + 8
  const col2X = marginX + contentWidth * 0.52

  const dCreated = new Date(data.createdAt)
  const formattedDate = dCreated.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  // Left metadata
  page.drawText("Lokasi", { x: col1X, y: currentY - 14, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  page.drawText(`: ${data.areaName}${data.roomName ? ` (${data.roomName})` : ""}`, {
    x: col1X + 75,
    y: currentY - 14,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.1, 0.12, 0.15),
  })

  page.drawText("No. Unit / Serial", { x: col1X, y: currentY - 26, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  page.drawText(`: ${data.equipmentSerial || data.equipmentCode || data.equipmentName || "-"}`, {
    x: col1X + 75,
    y: currentY - 26,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.1, 0.12, 0.15),
  })

  page.drawText("Merk Unit", { x: col1X, y: currentY - 38, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  page.drawText(`: ${data.equipmentBrand || data.equipmentName || "-"}`, {
    x: col1X + 75,
    y: currentY - 38,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.1, 0.12, 0.15),
  })

  page.drawText("Branch", { x: col1X, y: currentY - 50, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  page.drawText(`: ${data.branchName || "HEAD OFFICE"}`, {
    x: col1X + 75,
    y: currentY - 50,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.1, 0.12, 0.15),
  })

  // Right metadata
  page.drawText("No. Laporan", { x: col2X, y: currentY - 14, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  page.drawText(`: ${data.reportCode}`, {
    x: col2X + 65,
    y: currentY - 14,
    size: 7.5,
    font: fontBold,
    color: rgb(0.9, 0.4, 0.05),
  })

  const INDO_MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]

  // Right metadata: Periode with bold month name
  page.drawText("Periode", { x: col2X, y: currentY - 26, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  const periodMatch = (data.periodKey || "").match(/^(\d{4})-(\d{2})/)
  if (periodMatch) {
    const pYear = periodMatch[1]
    const pMonthIdx = parseInt(periodMatch[2], 10) - 1
    const pMonthName = INDO_MONTHS[pMonthIdx] || periodMatch[2]

    let pX = col2X + 65
    page.drawText(": ", { x: pX, y: currentY - 26, size: 7.5, font: fontRegular, color: rgb(0.1, 0.12, 0.15) })
    pX += fontRegular.widthOfTextAtSize(": ", 7.5)

    page.drawText(pMonthName, { x: pX, y: currentY - 26, size: 7.5, font: fontBold, color: rgb(0.08, 0.1, 0.15) })
    pX += fontBold.widthOfTextAtSize(pMonthName, 7.5)

    page.drawText(` ${pYear}`, { x: pX, y: currentY - 26, size: 7.5, font: fontRegular, color: rgb(0.1, 0.12, 0.15) })
  } else {
    page.drawText(`: ${data.periodKey || data.periodLabel || "-"}`, {
      x: col2X + 65,
      y: currentY - 26,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.1, 0.12, 0.15),
    })
  }

  // Right metadata: Tanggal Submit with bold month name
  page.drawText("Tanggal Submit", { x: col2X, y: currentY - 38, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  const submitDayStr = `: ${String(dCreated.getDate()).padStart(2, "0")} `
  const submitMonthName = INDO_MONTHS[dCreated.getMonth()] || ""
  const submitYearStr = ` ${dCreated.getFullYear()}`

  let sX = col2X + 65
  page.drawText(submitDayStr, { x: sX, y: currentY - 38, size: 7.5, font: fontRegular, color: rgb(0.1, 0.12, 0.15) })
  sX += fontRegular.widthOfTextAtSize(submitDayStr, 7.5)

  page.drawText(submitMonthName, { x: sX, y: currentY - 38, size: 7.5, font: fontBold, color: rgb(0.08, 0.1, 0.15) })
  sX += fontBold.widthOfTextAtSize(submitMonthName, 7.5)

  page.drawText(submitYearStr, { x: sX, y: currentY - 38, size: 7.5, font: fontRegular, color: rgb(0.1, 0.12, 0.15) })

  page.drawText("Teknisi ES", { x: col2X, y: currentY - 50, size: 7.5, font: fontBold, color: rgb(0.2, 0.25, 0.3) })
  page.drawText(`: ${data.authorName} (${data.authorNik})`, {
    x: col2X + 65,
    y: currentY - 50,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.1, 0.12, 0.15),
  })

  currentY -= metaBoxHeight + 14

  // Table Column Definitions
  const colWidthId = 40
  const colWidthTindakan = 50
  const colWidthKondisi = 65
  const colWidthCatatan = 110
  const colWidthItem = contentWidth - (colWidthId + colWidthTindakan + colWidthKondisi + colWidthCatatan)

  function drawTableHeader(p: PDFPage, y: number) {
    p.drawRectangle({
      x: marginX,
      y: y - 16,
      width: contentWidth,
      height: 16,
      color: rgb(0.04, 0.09, 0.16),
    })

    let curX = marginX + 4
    p.drawText("NO / ID", { x: curX, y: y - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) })

    curX = marginX + colWidthId + 4
    p.drawText("ITEM PEMERIKSAAN", { x: curX, y: y - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) })

    curX = marginX + colWidthId + colWidthItem + 4
    p.drawText("TINDAKAN", { x: curX, y: y - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) })

    curX = marginX + colWidthId + colWidthItem + colWidthTindakan + 4
    p.drawText("KONDISI", { x: curX, y: y - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) })

    curX = marginX + colWidthId + colWidthItem + colWidthTindakan + colWidthKondisi + 4
    p.drawText("CATATAN / TEMUAN", { x: curX, y: y - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) })
  }

  drawTableHeader(page, currentY)
  currentY -= 16

  const items = data.items || []
  const rowHeight = 16

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    // Check if new page needed
    if (currentY - rowHeight < 100) {
      drawPageFooter(page, nraInfo)
      page = pdfDoc.addPage([pageWidth, pageHeight])
      drawHeader(page)
      currentY = pageHeight - 106
      drawTableHeader(page, currentY)
      currentY -= 16
    }

    const isEven = i % 2 === 0
    if (isEven) {
      page.drawRectangle({
        x: marginX,
        y: currentY - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.97, 0.98, 0.99),
      })
    }

    // Border bottom
    page.drawLine({
      start: { x: marginX, y: currentY - rowHeight },
      end: { x: pageWidth - marginX, y: currentY - rowHeight },
      thickness: 0.5,
      color: rgb(0.88, 0.9, 0.93),
    })

    // NO / ID: Always use consistent sequential number (1, 2, 3...) to avoid string ids like "pintu"
    const displayNo = String(i + 1)
    page.drawText(displayNo, {
      x: marginX + 4,
      y: currentY - 11,
      size: 7,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    })

    // Item Name
    let label = item.label || ""
    if (label.length > 58) {
      label = label.slice(0, 55) + "..."
    }
    page.drawText(label, {
      x: marginX + colWidthId + 4,
      y: currentY - 11,
      size: 7,
      font: fontRegular,
      color: rgb(0.08, 0.1, 0.15),
    })

    // Tindakan (Action Code)
    const action = item.actionCode || "Ch"
    page.drawText(action, {
      x: marginX + colWidthId + colWidthItem + 4,
      y: currentY - 11,
      size: 7,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    })

    // Kondisi
    const { text: condText, color: condColor } = formatPdfCondition(
      item.condition || "BAIK",
      data.formCode
    )

    page.drawText(condText, {
      x: marginX + colWidthId + colWidthItem + colWidthTindakan + 4,
      y: currentY - 11,
      size: 7,
      font: fontBold,
      color: condColor,
    })

    // Catatan / Temuan
    let notes = item.notes || "-"
    if (item.photosCount && item.photosCount > 0) {
      notes += ` [${item.photosCount} foto]`
    }
    if (notes.length > 25) {
      notes = notes.slice(0, 22) + "..."
    }
    page.drawText(notes, {
      x: marginX + colWidthId + colWidthItem + colWidthTindakan + colWidthKondisi + 4,
      y: currentY - 11,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.25, 0.3, 0.35),
    })

    currentY -= rowHeight
  }

  // General Notes & Legend
  currentY -= 6
  const legendBoxHeight = 18
  page.drawRectangle({
    x: marginX,
    y: currentY - legendBoxHeight,
    width: contentWidth,
    height: legendBoxHeight,
    color: rgb(0.95, 0.96, 0.98),
    borderWidth: 0.5,
    borderColor: rgb(0.85, 0.88, 0.92),
  })

  page.drawText(
    "Ket Tindakan: In = Interview, Cl = Clean, W = Write, Td = Test Drive, A = Adjust, Ch = Check, L = Lubricant | V = OK / X = NOK",
    {
      x: marginX + 6,
      y: currentY - 12,
      size: 6.2,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    }
  )

  currentY -= legendBoxHeight + 14

  // ==========================================
  // SECTION: BUKTI FOTO DOKUMENTASI PEMERIKSAAN
  // (Diletakkan tepat di ATAS kotak tanda tangan)
  // ==========================================
  const photos = data.photos || []
  if (photos.length > 0) {
    // Check if new page is needed for photos section
    if (currentY < 180) {
      drawPageFooter(page, nraInfo)
      page = pdfDoc.addPage([pageWidth, pageHeight])
      drawHeader(page)
      currentY = pageHeight - 106
    }

    // Section Title Header
    const photoHeaderHeight = 16
    page.drawRectangle({
      x: marginX,
      y: currentY - photoHeaderHeight,
      width: contentWidth,
      height: photoHeaderHeight,
      color: rgb(0.04, 0.09, 0.16), // Dark Deep Navy (#0b1728)
    })
    page.drawText("BUKTI FOTO DOKUMENTASI PEMERIKSAAN LAPANGAN", {
      x: marginX + 6,
      y: currentY - 11,
      size: 7,
      font: fontBold,
      color: rgb(1, 1, 1),
    })

    currentY -= photoHeaderHeight + 10

    // Render photos in 2-column grid
    const photoCols = 2
    const photoGap = 14
    const photoW = (contentWidth - photoGap) / photoCols
    const photoH = 115
    const cardH = photoH + 28

    for (let pIdx = 0; pIdx < photos.length; pIdx += photoCols) {
      // Check space for current photo row
      if (currentY - cardH < 90) {
        drawPageFooter(page, nraInfo)
        page = pdfDoc.addPage([pageWidth, pageHeight])
        drawHeader(page)
        currentY = pageHeight - 106
      }

      for (let c = 0; c < photoCols; c++) {
        const photo = photos[pIdx + c]
        if (!photo) continue

        const photoX = marginX + c * (photoW + photoGap)

        // Card frame
        page.drawRectangle({
          x: photoX,
          y: currentY - cardH,
          width: photoW,
          height: cardH,
          borderWidth: 0.8,
          borderColor: rgb(0.85, 0.88, 0.92),
          color: rgb(0.99, 0.99, 1),
        })

        // Try to draw embedded image if available
        let imageDrawn = false
        if (photo.imageBytes && photo.imageBytes.length > 0) {
          try {
            let embeddedImg: PDFImage | null = null
            try {
              embeddedImg = await pdfDoc.embedJpg(photo.imageBytes)
            } catch {
              try {
                embeddedImg = await pdfDoc.embedPng(photo.imageBytes)
              } catch {
                // Not a recognized jpg or png
              }
            }

            if (embeddedImg) {
              page.drawImage(embeddedImg, {
                x: photoX + 2,
                y: currentY - photoH - 2,
                width: photoW - 4,
                height: photoH,
              })
              imageDrawn = true
            }
          } catch {
            imageDrawn = false
          }
        }

        // Fallback placeholder box if image could not be embedded
        if (!imageDrawn) {
          page.drawRectangle({
            x: photoX + 2,
            y: currentY - photoH - 2,
            width: photoW - 4,
            height: photoH,
            color: rgb(0.93, 0.95, 0.97),
          })
          page.drawText("[ Foto Pemeriksaan Lapangan ]", {
            x: photoX + (photoW - 130) / 2,
            y: currentY - photoH / 2 - 4,
            size: 7,
            font: fontRegular,
            color: rgb(0.4, 0.45, 0.5),
          })
          if (photo.fileId) {
            page.drawText(`ID: ${photo.fileId.slice(0, 16)}`, {
              x: photoX + (photoW - 100) / 2,
              y: currentY - photoH / 2 - 16,
              size: 6,
              font: fontRegular,
              color: rgb(0.5, 0.55, 0.6),
            })
          }
        }

        // Photo info text below image
        let itemLabel = `Item #${photo.itemNo}: ${photo.label}`
        if (itemLabel.length > 38) {
          itemLabel = itemLabel.slice(0, 35) + "..."
        }
        page.drawText(itemLabel, {
          x: photoX + 4,
          y: currentY - cardH + 16,
          size: 7,
          font: fontBold,
          color: rgb(0.08, 0.1, 0.15),
        })

        const condDisplay = formatPdfCondition(photo.condition || "BAIK", data.formCode)
        const condClr = condDisplay.isBad ? condDisplay.color : rgb(0.1, 0.55, 0.2)
        const noteStr = photo.notes ? ` - ${photo.notes.slice(0, 24)}` : ""
        page.drawText(`Kondisi: ${condDisplay.text}${noteStr}`, {
          x: photoX + 4,
          y: currentY - cardH + 6,
          size: 6.5,
          font: fontBold,
          color: condClr,
        })
      }

      currentY -= cardH + 10
    }
  }

  // ==========================================
  // SECTION: TINDAK LANJUT, HISTORI PELAKSANAAN & BUKTI PENYELESAIAN
  // ==========================================
  const ensureSectionSpace = (needed: number) => {
    if (currentY - needed < 65) {
      drawPageFooter(page, nraInfo)
      page = pdfDoc.addPage([pageWidth, pageHeight])
      drawHeader(page)
      currentY = pageHeight - 106
    }
  }

  const drawBandHeader = (title: string) => {
    ensureSectionSpace(42)
    page.drawRectangle({
      x: marginX,
      y: currentY - 15,
      width: contentWidth,
      height: 15,
      color: rgb(0.04, 0.09, 0.16),
    })
    page.drawText(title, {
      x: marginX + 6,
      y: currentY - 10.5,
      size: 7,
      font: fontBold,
      color: rgb(1, 1, 1),
    })
    currentY -= 20
  }

  const formatPdfCurrency = (val: number) =>
    `Rp ${Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`

  const payloadItems = getReportItems(data.checklistPayload)
  const needs014Summary = hasCostEstimateFollowUp(data.checklistPayload)
  const needs065Summary = hasForm065FollowUp(data.checklistPayload)
  const hasNoCostRepair = hasRepairWithoutCost(data.checklistPayload)

  if (needs014Summary || needs065Summary || hasNoCostRepair) {
    drawBandHeader("RINGKASAN TINDAK LANJUT & KEPUTUSAN PERBAIKAN")

    const summaryLines: string[] = []
    for (const item of payloadItems) {
      const rec = item as Record<string, unknown>
      if (item.repairForm === REPAIR_TANPA_BIAYA) {
        summaryLines.push(`- ${item.label}: Repair Tanpa Biaya (diselesaikan internal ES)`)
      } else if (item.repairForm === FORM_014) {
        const f014 = (rec.followUp014 ?? rec.followUpData) as Record<string, unknown> | undefined
        const cost = Number(f014?.totalCost ?? 0)
        const mats = Array.isArray(f014?.materials) ? f014.materials.length : 0
        summaryLines.push(
          `- ${item.label}: Form 014 (${mats} item material, Estimasi ${Number.isFinite(cost) ? formatPdfCurrency(cost) : "-"})`,
        )
      } else if (item.repairForm === FORM_065) {
        const f065 = (rec.followUp065 ?? rec.followUpData) as Record<string, unknown> | undefined
        const jenis = f065?.jenis === "PENGGANTIAN_SPARE_PART" ? "Penggantian Spare Part" : "Perbaikan"
        const partsCount = Array.isArray(f065?.parts) ? f065.parts.length : 0
        const unitLabel = [f065?.namaUnit, f065?.merk, f065?.nomorUnit].filter(Boolean).join(" / ")
        summaryLines.push(
          `- ${item.label}: ${FORM_065_LABEL} | Jenis: ${jenis}${unitLabel ? ` | Unit: ${unitLabel}` : ""}${partsCount > 0 ? ` (${partsCount} spare part)` : ""}`,
        )
      }
    }

    for (const line of summaryLines) {
      ensureSectionSpace(14)
      page.drawText(line.slice(0, 108), {
        x: marginX + 4,
        y: currentY,
        size: 6.8,
        font: fontRegular,
        color: rgb(0.15, 0.2, 0.28),
      })
      currentY -= 11
    }
    currentY -= 6
  }

  const normalizedExecution = normalizeExecutionHistory(data.executionHistory)
  if (normalizedExecution.length > 0) {
    drawBandHeader("HISTORI PELAKSANAAN PEKERJAAN (TIMESTAMP SERVER)")
    for (const entry of normalizedExecution) {
      ensureSectionSpace(16)
      const refPart = entry.referenceNo ? ` | Ref: ${entry.referenceNo}` : ""
      const notePart = entry.notes ? ` | Catatan: ${entry.notes}` : ""
      const line = `${formatWib(entry.performedAt)} - ${entry.actionLabel} oleh ${entry.actorName} (${entry.actorNik})${refPart}${notePart}`
      page.drawText(line.slice(0, 110), {
        x: marginX + 4,
        y: currentY,
        size: 6.6,
        font: fontRegular,
        color: rgb(0.15, 0.2, 0.28),
      })
      currentY -= 11
    }
    currentY -= 6
  }

  const evidence = data.completionEvidence ?? readStoredCompletionEvidence(data.checklistPayload)
  if (evidence && (evidence.form014 || evidence.form065)) {
    drawBandHeader("BUKTI PENYELESAIAN PEKERJAAN")
    const evLines: string[] = []
    if (evidence.form014) {
      evLines.push(
        `Form 014 - Actual Pembelian: ${formatPdfCurrency(evidence.form014.actualPurchaseAmount)} | Foto Kerja: ${evidence.form014.workPhotos.length} | Foto Bon: ${evidence.form014.receiptPhotos.length} | Bukti Transfer: ${evidence.form014.refundTransferPhotos.length}`,
      )
    }
    if (evidence.form065) {
      evLines.push(
        `Form 065 - Serah Terima: ${evidence.form065.handoverConfirmed ? "Dikonfirmasi" : "Belum"} (Penerima: ${evidence.form065.handoverRecipient}) | Foto Unit: ${evidence.form065.repairWithUnitPhotos.length} | Selfie User: ${evidence.form065.selfieWithUserPhotos.length}`,
      )
      if (evidence.form065.handoverNotes) {
        evLines.push(`Catatan Serah Terima: ${evidence.form065.handoverNotes}`)
      }
    }
    if (evidence.submittedByName || evidence.submittedAt) {
      evLines.push(
        `Dilaporkan oleh: ${evidence.submittedByName || evidence.submittedByNik || "-"} (${formatWib(evidence.submittedAt)})`,
      )
    }
    if (evidence.notes) {
      evLines.push(`Catatan Penyelesaian: ${evidence.notes}`)
    }

    for (const line of evLines) {
      ensureSectionSpace(14)
      page.drawText(line.slice(0, 110), {
        x: marginX + 4,
        y: currentY,
        size: 6.8,
        font: fontRegular,
        color: rgb(0.12, 0.18, 0.24),
      })
      currentY -= 11
    }
    currentY -= 8
  }

  // ==========================================
  // SECTION: KOTAK TANDA TANGAN 3 TINGKAT
  // (Diletakkan di BAWAH section foto)
  // ==========================================
  const sigTableHeight = 80
  const sigColWidth = contentWidth / 3
  const needsRequesterBox =
    requiresRequesterReview(data.checklistPayload) || isSparePartProposal(data.checklistPayload)
  const requiredSigHeight = needsRequesterBox ? sigTableHeight + 52 : sigTableHeight

  // Ensure enough space for signature table, otherwise add new page
  if (currentY - requiredSigHeight < 60) {
    drawPageFooter(page, nraInfo)
    page = pdfDoc.addPage([pageWidth, pageHeight])
    drawHeader(page)
    currentY = pageHeight - 106
  }

  // Date of execution above signature table with bold month name
  let sigDateX = marginX
  page.drawText("Tanggal pelaksanaan : ", {
    x: sigDateX,
    y: currentY - 8,
    size: 7,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  })
  sigDateX += fontRegular.widthOfTextAtSize("Tanggal pelaksanaan : ", 7)

  const sigDayStr = `${String(dCreated.getDate()).padStart(2, "0")} `
  page.drawText(sigDayStr, { x: sigDateX, y: currentY - 8, size: 7, font: fontRegular, color: rgb(0.2, 0.25, 0.3) })
  sigDateX += fontRegular.widthOfTextAtSize(sigDayStr, 7)

  page.drawText(submitMonthName, { x: sigDateX, y: currentY - 8, size: 7, font: fontBold, color: rgb(0.08, 0.1, 0.15) })
  sigDateX += fontBold.widthOfTextAtSize(submitMonthName, 7)

  page.drawText(` ${dCreated.getFullYear()}`, { x: sigDateX, y: currentY - 8, size: 7, font: fontRegular, color: rgb(0.2, 0.25, 0.3) })

  currentY -= 14

  page.drawRectangle({
    x: marginX,
    y: currentY - sigTableHeight,
    width: contentWidth,
    height: sigTableHeight,
    borderWidth: 0.8,
    borderColor: rgb(0.8, 0.83, 0.87),
    color: rgb(1, 1, 1),
  })

  // Vertical dividers
  page.drawLine({
    start: { x: marginX + sigColWidth, y: currentY },
    end: { x: marginX + sigColWidth, y: currentY - sigTableHeight },
    thickness: 0.8,
    color: rgb(0.8, 0.83, 0.87),
  })
  page.drawLine({
    start: { x: marginX + sigColWidth * 2, y: currentY },
    end: { x: marginX + sigColWidth * 2, y: currentY - sigTableHeight },
    thickness: 0.8,
    color: rgb(0.8, 0.83, 0.87),
  })

  // Signature Header Row
  const sigHeaderH = 16
  page.drawLine({
    start: { x: marginX, y: currentY - sigHeaderH },
    end: { x: pageWidth - marginX, y: currentY - sigHeaderH },
    thickness: 0.8,
    color: rgb(0.8, 0.83, 0.87),
  })

  // Dibuat oleh (Teknisi ES)
  page.drawText("Dibuat oleh :", {
    x: marginX + 8,
    y: currentY - 11,
    size: 7,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  })
  page.drawText("Branch Maintenance Support", {
    x: marginX + 8,
    y: currentY - 24,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  })
  page.drawText(`${data.authorName} (${data.authorNik})`, {
    x: marginX + 8,
    y: currentY - 48,
    size: 7,
    font: fontBold,
    color: rgb(0.08, 0.1, 0.15),
  })

  const history = normalizeApprovalHistory(data.approvalHistory)
  const lastRevSigIdx = history.map((h) => h.decision).lastIndexOf("reject_revision")
  const activeSigCycle =
    lastRevSigIdx >= 0
      ? data.status === "NEEDS_REVISION" || data.status === "REJECTED"
        ? history
        : history.slice(lastRevSigIdx + 1)
      : history
  const coordApproval = activeSigCycle
    .filter((h) => h.role === "COORD" || h.stage === "PENDING_COORD")
    .slice(-1)[0]
  const mgrApproval = activeSigCycle
    .filter((h) => h.role === "MANAGER" || h.stage === "PENDING_MANAGER")
    .slice(-1)[0]
  const reqApproval = activeSigCycle
    .filter((h) => h.role === "REQUESTER" || h.stage === "PENDING_REQUESTER")
    .slice(-1)[0]

  // Diperiksa oleh (Coordinator)
  page.drawText("Diperiksa oleh :", {
    x: marginX + sigColWidth + 8,
    y: currentY - 11,
    size: 7,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  })
  page.drawText("Branch Maintenance Coordinator", {
    x: marginX + sigColWidth + 8,
    y: currentY - 24,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  })

  if (coordApproval) {
    const decText =
      coordApproval.decision === "approve"
        ? "Disetujui"
        : coordApproval.decision === "reject_revision"
          ? "Minta Revisi"
          : "Ditolak"
    const dateText = formatWib(coordApproval.decidedAt)
    page.drawText(`${coordApproval.actorName}`, {
      x: marginX + sigColWidth + 8,
      y: currentY - 36,
      size: 7,
      font: fontBold,
      color: rgb(0.08, 0.1, 0.15),
    })
    page.drawText(`${coordApproval.role || "COORD"} · ${decText}`, {
      x: marginX + sigColWidth + 8,
      y: currentY - 47,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.15, 0.2, 0.25),
    })
    page.drawText(dateText, {
      x: marginX + sigColWidth + 8,
      y: currentY - 58,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    })
    if (coordApproval.notes) {
      page.drawText(coordApproval.notes.slice(0, 35), {
        x: marginX + sigColWidth + 8,
        y: currentY - 69,
        size: 6,
        font: fontRegular,
        color: coordApproval.decision === "approve" ? rgb(0.22, 0.28, 0.36) : rgb(0.7, 0.2, 0.1),
      })
    }
  } else if (data.status === "COMPLETED") {
    page.drawText("( Belum tercatat )", {
      x: marginX + sigColWidth + 8,
      y: currentY - 48,
      size: 7,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    })
  } else {
    page.drawText("( ................................................ )", {
      x: marginX + sigColWidth + 8,
      y: currentY - sigTableHeight + 8,
      size: 7,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    })
  }

  // Disetujui oleh (Manager)
  page.drawText("Disetujui oleh :", {
    x: marginX + sigColWidth * 2 + 8,
    y: currentY - 11,
    size: 7,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  })
  page.drawText("Branch Building & Maintenance Manager", {
    x: marginX + sigColWidth * 2 + 8,
    y: currentY - 24,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  })

  if (mgrApproval) {
    const decText =
      mgrApproval.decision === "approve"
        ? "Disetujui"
        : mgrApproval.decision === "reject_revision"
          ? "Minta Revisi"
          : "Ditolak"
    const dateText = formatWib(mgrApproval.decidedAt)
    page.drawText(`${mgrApproval.actorName}`, {
      x: marginX + sigColWidth * 2 + 8,
      y: currentY - 36,
      size: 7,
      font: fontBold,
      color: rgb(0.08, 0.1, 0.15),
    })
    page.drawText(`${mgrApproval.role || "MANAGER"} · ${decText}`, {
      x: marginX + sigColWidth * 2 + 8,
      y: currentY - 47,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.15, 0.2, 0.25),
    })
    page.drawText(dateText, {
      x: marginX + sigColWidth * 2 + 8,
      y: currentY - 58,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
    })
    if (mgrApproval.notes) {
      page.drawText(mgrApproval.notes.slice(0, 35), {
        x: marginX + sigColWidth * 2 + 8,
        y: currentY - 69,
        size: 6,
        font: fontRegular,
        color: mgrApproval.decision === "approve" ? rgb(0.22, 0.28, 0.36) : rgb(0.7, 0.2, 0.1),
      })
    }
  } else if (data.status === "COMPLETED") {
    page.drawText("( Belum tercatat )", {
      x: marginX + sigColWidth * 2 + 8,
      y: currentY - 48,
      size: 7,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    })
  } else {
    page.drawText("( ................................................ )", {
      x: marginX + sigColWidth * 2 + 8,
      y: currentY - sigTableHeight + 8,
      size: 7,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    })
  }

  if (needsRequesterBox || reqApproval) {
    const reqTopY = currentY - sigTableHeight - 8
    const reqBoxH = 40
    page.drawRectangle({
      x: marginX,
      y: reqTopY - reqBoxH,
      width: contentWidth,
      height: reqBoxH,
      borderWidth: 0.8,
      borderColor: rgb(0.8, 0.83, 0.87),
      color: rgb(0.99, 0.99, 1),
    })
    page.drawText("Persetujuan Requester (Form 014 / Form 065) :", {
      x: marginX + 8,
      y: reqTopY - 12,
      size: 7,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.2),
    })
    if (reqApproval) {
      const decText =
        reqApproval.decision === "approve"
          ? "Disetujui"
          : reqApproval.decision === "reject_revision"
            ? "Minta Revisi"
            : "Ditolak"
      page.drawText(
        `${reqApproval.actorName} (${reqApproval.role || "REQUESTER"}) · ${decText} · ${formatWib(reqApproval.decidedAt)}${reqApproval.notes ? ` · ${reqApproval.notes.slice(0, 40)}` : ""}`,
        {
          x: marginX + 8,
          y: reqTopY - 26,
          size: 6.8,
          font: fontRegular,
          color: rgb(0.15, 0.2, 0.25),
        },
      )
    } else {
      page.drawText("( Menunggu persetujuan Requester )", {
        x: marginX + 8,
        y: reqTopY - 26,
        size: 6.8,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6),
      })
    }
  }

  // Final footer on last page
  drawPageFooter(page, nraInfo)

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

function drawPageFooter(p: PDFPage, nraInfo: { nra: string; refNra: string }) {
  const marginX = 36
  p.drawText(`NRA : ${nraInfo.nra}`, {
    x: marginX,
    y: 26,
    size: 6.5,
    color: rgb(0.4, 0.45, 0.5),
  })
  p.drawText(`REF NRA : ${nraInfo.refNra}`, {
    x: marginX,
    y: 16,
    size: 6.5,
    color: rgb(0.4, 0.45, 0.5),
  })
}
