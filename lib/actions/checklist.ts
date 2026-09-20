"use server"

import { revalidatePath } from "next/cache"

import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

import type { ChecklistPayload, ChecklistPayloadItem, ChecklistPhoto } from "@/lib/checklists/payload"
import { validateChecklistPayload, calculateChecklistIsSafe } from "@/lib/checklists/payload"
import type { FrmTsm004Payload } from "@/lib/checklists/payload-004"
import { validateFrmTsm004Payload } from "@/lib/checklists/payload-004"

export async function submitChecklistAction(input: {
  reportCode: string
  payload: ChecklistPayload | FrmTsm004Payload
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

  if (baseFormId === "FRM_TSM_002" || baseFormId === "FRM_TSM_003" || baseFormId === "FRM_TSM_005") {
    validationResult = validateChecklistPayload(input.payload)
    isSafe = calculateChecklistIsSafe(input.payload)
    photoFileIds = ((input.payload as ChecklistPayload).items || []).flatMap((item: ChecklistPayloadItem) => 
      (item.photos || []).map((photo: ChecklistPhoto) => photo.fileId)
    )
  } else if (baseFormId === "FRM_TSM_004") {
    validationResult = validateFrmTsm004Payload(input.payload)
    isSafe = true // Form 004 is purely data entry
  } else {
    return { ok: false as const, errors: ["Form ID tidak valid."] }
  }

  if (!validationResult.valid) {
    return { ok: false as const, errors: validationResult.errors }
  }

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

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reports")

  return { ok: true as const, isSafe }
}
