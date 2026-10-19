"use server"

import { revalidatePath } from "next/cache"

import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

import type { ChecklistPayload, ChecklistPayloadItem, ChecklistPhoto } from "@/lib/checklists/payload"
import { validateChecklistPayload, calculateChecklistIsSafe } from "@/lib/checklists/payload"
import type { FrmTsm004Payload } from "@/lib/checklists/payload-004"
import { validateFrmTsm004Payload } from "@/lib/checklists/payload-004"
import type { FrmTsm001Payload } from "@/lib/checklists/payload-001"
import { validateFrmTsm001Payload } from "@/lib/checklists/payload-001"
import { generateAndUploadReportPdf } from "@/lib/reports/drive-pdf-service"

export async function submitChecklistAction(input: {
  reportCode: string
  payload: ChecklistPayload | FrmTsm004Payload | FrmTsm001Payload
}) {
  const session = await getSession()
  if (
    typeof session?.userId !== "string" ||
    typeof session.role !== "string" ||
    session.role !== "ES"
  ) {
    return { ok: false as const, errors: ["Sesi tidak valid."] }
  }

  let validationResult: { valid: boolean; errors: string[] } = { valid: false, errors: [] }
  let isSafe = false
  let photoFileIds: string[] = []

  // Clean formCode to get baseFormId
  const baseFormId = (input.payload.formCode || "").replace("_REPAIR", "")

  if (
    baseFormId === "FRM_TSM_002" ||
    baseFormId === "FRM_TSM_003" ||
    baseFormId === "FRM_TSM_005" ||
    baseFormId === "FRM_TS_016" ||
    baseFormId === "FRM_TS_029" ||
    baseFormId === "FRM_TSM_006" ||
    baseFormId === "FRM_TS_062" ||
    baseFormId === "FRM_TSM_007" ||
    baseFormId === "FRM_TS_043" ||
    baseFormId === "FRM_TS_045" ||
    baseFormId === "FRM_TS_022" ||
    baseFormId === "FRM_TSM_013" ||
    baseFormId === "FRM_TS_064" ||
    baseFormId === "FRM_TSM_008" ||
    baseFormId === "FRM_TS_063"
  ) {
    validationResult = validateChecklistPayload(input.payload)
    isSafe = calculateChecklistIsSafe(input.payload)
    photoFileIds = ((input.payload as ChecklistPayload).items || []).flatMap((item: ChecklistPayloadItem) => 
      (item.photos || []).map((photo: ChecklistPhoto) => photo.fileId)
    )
  } else if (baseFormId === "FRM_TSM_004") {
    validationResult = validateFrmTsm004Payload(input.payload)
    isSafe = true // Form 004 is purely data entry
  } else if (baseFormId === "FRM_TSM_001") {
    validationResult = validateFrmTsm001Payload(input.payload)
    const p = input.payload as FrmTsm001Payload
    isSafe = p.atsTest?.systemAtsStatus !== "NOK"
    photoFileIds = (p.atsTest?.photos || []).map((photo) => photo.fileId)
  } else {
    return { ok: false as const, errors: ["Form ID tidak valid."] }
  }

  if (!validationResult.valid) {
    return { ok: false as const, errors: validationResult.errors }
  }

  const existingReport = await getPrisma().checklistReport.findFirst({
    where: {
      reportCode: input.reportCode,
      authorId: session.userId,
      status: "DRAFT",
    },
    select: {
      id: true,
      taskId: true,
    },
  })

  await getPrisma().checklistReport.updateMany({
    where: {
      reportCode: input.reportCode,
      authorId: session.userId,
      status: "DRAFT",
    },
    data: {
      checklistPayload: input.payload,
      drivePhotoFileIds: photoFileIds,
      isSafe: isSafe,
      status: "PENDING_COORD",
    },
  })

  if (existingReport?.taskId) {
    await getPrisma().checklistTask.update({
      where: { id: existingReport.taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    })
  }

  // Automatic PDF generation & Google Drive upload
  try {
    await generateAndUploadReportPdf(input.reportCode)
  } catch (pdfErr) {
    console.error(`[PDF Auto-Generate Error] on report ${input.reportCode}:`, pdfErr)
  }

  revalidatePath("/dashboard", "page")
  revalidatePath("/dashboard/reports")
  revalidatePath(`/dashboard/reports/${input.reportCode}`)

  return { ok: true as const, isSafe }
}

export async function triggerReportPdfUploadAction(reportCode: string) {
  try {
    const res = await generateAndUploadReportPdf(reportCode)
    revalidatePath(`/dashboard/reports/${reportCode}`)
    revalidatePath("/dashboard/reports")
    return res
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, reportCode, error: message }
  }
}
