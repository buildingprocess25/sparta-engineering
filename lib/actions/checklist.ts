"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getPrisma } from "@/lib/prisma"
import { ACTIVE_WORK_PERMIT_REQUIRED, getActiveWorkPermit } from "@/lib/work-permits/active-permit"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"

import type { ChecklistPayload, ChecklistPayloadItem, ChecklistPhoto } from "@/lib/checklists/payload"
import { validateChecklistPayload, calculateChecklistIsSafe } from "@/lib/checklists/payload"
import type { FrmTsm004Payload } from "@/lib/checklists/payload-004"
import { validateFrmTsm004Payload } from "@/lib/checklists/payload-004"
import type { FrmTsm001Payload } from "@/lib/checklists/payload-001"
import { validateFrmTsm001Payload } from "@/lib/checklists/payload-001"
import { generateAndUploadReportPdf } from "@/lib/reports/drive-pdf-service"
import { saveChecklistSubmission } from "@/lib/reports/checklist-submission"

type SubmitChecklistInput = {
  reportCode: string
  payload: ChecklistPayload | FrmTsm004Payload | FrmTsm001Payload
}

export async function submitChecklistAction(input: SubmitChecklistInput) {
  return submitChecklist(input)
}

export async function submitChecklistRevisionAction(reportCode: string, version: string, input: SubmitChecklistInput) {
  if (input?.reportCode !== reportCode || typeof version !== "string") {
    return { ok: false as const, errors: ["Versi revisi laporan tidak valid."] }
  }
  return submitChecklist(input, version)
}

async function submitChecklist(input: SubmitChecklistInput, revisionVersion?: string) {
  const user = await getWorkPermitUser()
  if (user?.role !== "ES") {
    return { ok: false as const, errors: ["Sesi tidak valid."] }
  }
  if (typeof input?.reportCode !== "string" || !input.reportCode.trim()) {
    return { ok: false as const, errors: ["Nomor laporan tidak valid."] }
  }

  let validationResult: { valid: boolean; errors: string[] } = { valid: false, errors: [] }
  let isSafe = false
  let photoFileIds: string[] = []

  // Clean formCode to get baseFormId
  const baseFormId = typeof input.payload?.formCode === "string" ? input.payload.formCode.replace(/_REPAIR$/, "") : ""

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
    baseFormId === "FRM_TS_063" ||
    baseFormId === "FRM_TS_041" ||
    baseFormId === "FRM_TS_028" ||
    baseFormId === "FRM_TS_068"
  ) {
    validationResult = validateChecklistPayload(input.payload)
    isSafe = calculateChecklistIsSafe(input.payload)
    if (validationResult.valid) {
      photoFileIds = (input.payload as ChecklistPayload).items.flatMap((item: ChecklistPayloadItem) =>
        item.photos.map((photo: ChecklistPhoto) => photo.fileId)
      )
    }
  } else if (baseFormId === "FRM_TSM_004") {
    validationResult = validateFrmTsm004Payload(input.payload)
    isSafe = true // Form 004 is purely data entry
  } else if (baseFormId === "FRM_TSM_001") {
    validationResult = validateFrmTsm001Payload(input.payload)
    const p = input.payload as FrmTsm001Payload
    isSafe = p.atsTest?.systemAtsStatus !== "NOK"
    if (validationResult.valid) photoFileIds = (p.atsTest.photos || []).map((photo) => photo.fileId)
  } else {
    return { ok: false as const, errors: ["Form ID tidak valid."] }
  }

  if (!validationResult.valid) {
    return { ok: false as const, errors: validationResult.errors }
  }

  const permit = await getActiveWorkPermit(user)
  if (!permit) {
    return { ok: false as const, errors: [ACTIVE_WORK_PERMIT_REQUIRED] }
  }

  const submittedReport = await saveChecklistSubmission(getPrisma(), {
    ...input,
    authorId: user.NIK,
    permitId: permit.id,
    isSafe,
    photoFileIds,
    revisionVersion,
  })

  if (!submittedReport) {
    return { ok: false as const, errors: ["Laporan tidak tersedia atau sudah berubah. Muat ulang halaman."] }
  }

  // Automatic PDF generation & Google Drive upload
  if (!submittedReport.pendingFollowUp) {
    try {
      await generateAndUploadReportPdf(input.reportCode)
    } catch (pdfErr) {
      console.error(`[PDF Auto-Generate Error] on report ${input.reportCode}:`, pdfErr)
    }
  }

  revalidatePath("/dashboard", "page")
  revalidatePath("/dashboard/reports")
  revalidatePath("/dashboard/activity")
  revalidatePath(`/dashboard/reports/${input.reportCode}`)
  revalidatePath(`/dashboard/reports/${input.reportCode}/follow-up`)

  if (submittedReport.pendingFollowUp && revisionVersion === undefined) {
    redirect(`/dashboard/reports/${encodeURIComponent(input.reportCode)}/follow-up`)
  }

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
