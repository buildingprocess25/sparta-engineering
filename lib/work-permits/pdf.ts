import { PDFDocument, PageSizes, StandardFonts, rgb } from "pdf-lib"
import type { WorkPermit } from "@/generated/prisma"
import { getWorkPermitPeriod } from "./active-period"
import type { getFinalWorkPermitApproval } from "./final-approval"

type Approval = NonNullable<ReturnType<typeof getFinalWorkPermitApproval>>
type PdfPermit = WorkPermit & {
  applicant: { name: string; branchName: string }
}

const workDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "UTC",
})
const approvalDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})
const periodDate = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

const safetyLabels: Record<string, string> = {
  sertifikat: "Sertifikat Kompetensi",
  safetyInduction: "Safety Induction",
  jsa: "Job Safety Analysis (JSA)",
  mentalPhobia: "Konfirmasi kondisi mental pekerja",
  helm: "Helm",
  topiHelm: "Topi / Helm",
  sepatu: "Sepatu keselamatan",
  safetyShoes: "Sepatu keselamatan",
  sarungTangan: "Sarung tangan",
  sarungBahan: "Sarung tangan bahan",
  sarungKulit: "Sarung tangan kulit",
  sarungKaret: "Sarung tangan karet",
  earPlug: "Ear Plug / Muff",
  aparPowder: "APAR Dry Chemical Powder",
  aparCo2: "APAR CO2",
  aparFoam: "APAR Foam",
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function selectedItems(value: unknown) {
  const fields = record(value)
  const selected = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : Object.keys(fields).filter((key) => fields[key] === true)
  return selected.map(
    (key) =>
      safetyLabels[key] ||
      key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (initial) => initial.toUpperCase())
  )
}

function extraText(value: unknown) {
  return typeof value === "string" && value.trim() ? [value.trim()] : []
}

export async function generateWorkPermitPdf(
  permit: PdfPermit,
  final: Approval
) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Izin Kerja K3 - ${permit.permitCode}`)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.07, 0.11, 0.17)
  const muted = rgb(0.27, 0.33, 0.41)
  const accent = rgb(0.94, 0.46, 0.12)
  const rule = rgb(0.84, 0.87, 0.91)
  const margin = 46
  const [width, height] = PageSizes.A4
  const contentWidth = width - 2 * margin
  let page = pdf.addPage(PageSizes.A4)
  let y = height - margin

  function safeText(value: string) {
    return Array.from(value.normalize("NFC"), (character) => {
      if (character === "\n") return character
      try {
        regular.encodeText(character)
        return character
      } catch {
        return "?"
      }
    }).join("")
  }

  function drawHeader() {
    page.drawRectangle({
      x: margin,
      y: height - 47,
      width: 22,
      height: 3,
      color: accent,
    })
    page.drawText("SPARTA ENGINEERING", {
      x: margin + 29,
      y: height - 50,
      size: 10,
      font: bold,
      color: ink,
    })
    page.drawLine({
      start: { x: margin, y: height - 62 },
      end: { x: width - margin, y: height - 62 },
      thickness: 0.65,
      color: rule,
    })
    y = height - 85
  }

  function ensureSpace(space: number) {
    if (y - space >= 58) return
    page = pdf.addPage(PageSizes.A4)
    drawHeader()
  }

  function drawText(
    value: string,
    size = 11,
    font = regular,
    color = ink,
    x = margin,
    availableWidth = contentWidth
  ) {
    const wraps = safeText(value.replace(/\r/g, ""))
      .split("\n")
      .flatMap((paragraph) => {
        const lines: string[] = []
        let line = ""
        for (const word of paragraph.split(/\s+/)) {
          const candidate = line ? line + " " + word : word
          if (font.widthOfTextAtSize(candidate, size) <= availableWidth) {
            line = candidate
            continue
          }
          if (line) lines.push(line)
          line = ""
          for (const character of word) {
            if (
              font.widthOfTextAtSize(line + character, size) > availableWidth
            ) {
              lines.push(line)
              line = ""
            }
            line += character
          }
        }
        return [...lines, line]
      })

    for (const line of wraps) {
      ensureSpace(size + 5)
      page.drawText(line, { x, y: y - size, size, font, color })
      y -= size + 5
    }
  }

  function section(title: string) {
    ensureSpace(62)
    y -= 12
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.65,
      color: rule,
    })
    y -= 8
    drawText(title, 13, bold)
  }

  function field(label: string, value?: string | null) {
    ensureSpace(44)
    const labelWidth = 162
    const startPage = page
    const startY = y
    drawText(label, 10, bold, muted, margin, labelWidth - 12)
    const labelEnd = y
    y = startY
    drawText(
      value?.trim() || "-",
      11,
      regular,
      ink,
      margin + labelWidth,
      contentWidth - labelWidth
    )
    if (page === startPage) y = Math.min(y, labelEnd)
    y -= 5
  }

  drawHeader()
  drawText("Izin Kerja K3", 26, bold)
  drawText(permit.formCode, 10, regular, muted)
  drawText(permit.permitCode, 14, bold)
  drawText(
    `Disetujui lengkap pada ${approvalDate.format(new Date(final.decidedAt))} WIB`,
    10,
    regular,
    muted
  )

  section("Informasi pekerjaan")
  const period = getWorkPermitPeriod(permit)
  const periodStart = new Date(`${period}-01T00:00:00Z`)
  field(
    "Periode izin",
    Number.isFinite(periodStart.getTime())
      ? periodDate.format(periodStart)
      : period
  )
  field(
    "Pemohon",
    `${permit.applicantName || permit.applicant.name} (${permit.applicantNik})`
  )
  field(
    "Cabang dan lokasi",
    `${permit.applicant.branchName} / ${permit.lokasi}`
  )
  field("Kegiatan", permit.kegiatan)
  field(
    "Tanggal pelaksanaan dan durasi",
    `${workDate.format(permit.workDate)} / ${permit.duration}`
  )
  field(
    "PIC SAT dan kontraktor",
    `${permit.picSat} / ${permit.kontraktor || "-"}`
  )
  const workers = Array.isArray(permit.workers)
    ? permit.workers.filter(
        (value): value is string => typeof value === "string"
      )
    : []
  field("Daftar pekerja", workers.join(", "))

  section("Persyaratan keselamatan")
  const safety = record(permit.safetyPayload)
  field(
    "Administrasi",
    [
      ...selectedItems(safety.adminReqs),
      ...extraText(safety.adminLainnyaText),
    ].join(", ")
  )
  const formSections = [
    ["hotWork", "Pekerjaan panas"],
    ["workHeight", "Kerja di ketinggian dan galian"],
    ["confinedSpace", "Pekerjaan di ruang terbatas"],
    ["electrical", "Pekerjaan listrik tegangan tinggi"],
    ["apd", "Alat pelindung diri"],
    ["fireProtection", "Alat proteksi kebakaran"],
  ] as const
  for (const [key, label] of formSections) {
    const condition = record(safety[key])
    const values = [
      ...selectedItems(condition.items),
      ...extraText(condition.lainnya),
    ]
    if (condition.active === false)
      field(label, "Tidak ditandai sebagai bagian pekerjaan")
    else
      field(
        label,
        values.join(", ") ||
          (condition.active === true
            ? "Ditandai, peralatan belum dicantumkan"
            : undefined)
      )
  }
  if (permit.catatanPasca)
    field("Catatan pemeriksaan pasca pekerjaan", permit.catatanPasca)

  ensureSpace(110)
  section("Riwayat persetujuan di SPARTA")
  for (const approval of final.approvals) {
    field(
      approval.label,
      `${approval.name} / ${approvalDate.format(new Date(approval.decidedAt))} WIB`
    )
  }

  const pages = pdf.getPages()
  pages.forEach((pdfPage, index) => {
    pdfPage.drawLine({
      start: { x: margin, y: 45 },
      end: { x: width - margin, y: 45 },
      thickness: 0.65,
      color: rule,
    })
    const footer = `Halaman ${index + 1} dari ${pages.length}`
    pdfPage.drawText(footer, {
      x: width - margin - regular.widthOfTextAtSize(footer, 9),
      y: 28,
      size: 9,
      font: regular,
      color: muted,
    })
  })
  return pdf.save()
}
