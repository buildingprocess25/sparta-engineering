import { revalidatePath } from "next/cache"

import type { ChecklistPayload } from "../../../../../../lib/checklists/payload"
import {
  calculateChecklistIsSafe,
  validateChecklistPayload,
} from "../../../../../../lib/checklists/payload"
import { getPrisma } from "../../../../../../lib/prisma"
import { getSession } from "../../../../../../lib/session"

export function buildFrmTsm003Submission(input: ChecklistPayload):
  | {
      ok: true
      payload: ChecklistPayload
      isSafe: boolean
    }
  | {
      ok: false
      errors: string[]
    } {
  const validation = validateChecklistPayload(input)
  if (!validation.valid) {
    return { ok: false, errors: validation.errors }
  }

  return {
    ok: true,
    payload: input,
    isSafe: calculateChecklistIsSafe(input),
  }
}

export async function submitFrmTsm003Checklist(input: {
  reportCode: string
  payload: ChecklistPayload
}) {
  "use server"

  const session = await getSession()
  if (
    typeof session?.userId !== "string" ||
    typeof session.role !== "string" ||
    session.role !== "ES"
  ) {
    return { ok: false as const, errors: ["Sesi tidak valid."] }
  }

  if (input.payload.formCode !== "FRM_TSM_003_REPAIR") {
    return { ok: false as const, errors: ["Kode form tidak sesuai."] }
  }

  const submission = buildFrmTsm003Submission(input.payload)
  if (!submission.ok) {
    return submission
  }

  const photoFileIds = submission.payload.items.flatMap((item) =>
    item.photos.map((photo) => photo.fileId)
  )

  await getPrisma().checklistReport.updateMany({
    where: {
      reportCode: input.reportCode,
      authorId: session.userId,
      status: "DRAFT",
    },
    data: {
      checklistPayload: submission.payload,
      drivePhotoFileIds: photoFileIds,
      isSafe: submission.isSafe,
      status: "PENDING_COORD",
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reports")

  return { ok: true as const, isSafe: submission.isSafe }
}
