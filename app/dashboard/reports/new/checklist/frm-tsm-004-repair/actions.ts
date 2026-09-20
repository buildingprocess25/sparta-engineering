import { revalidatePath } from "next/cache"

import type { FrmTsm004Payload } from "../../../../../../lib/checklists/payload-004"
import { validateFrmTsm004Payload } from "../../../../../../lib/checklists/payload-004"
import { getPrisma } from "../../../../../../lib/prisma"
import { getSession } from "../../../../../../lib/session"

export function buildFrmTsm004Submission(input: FrmTsm004Payload):
  | {
      ok: true
      payload: FrmTsm004Payload
      isSafe: boolean
    }
  | {
      ok: false
      errors: string[]
    } {
  const validation = validateFrmTsm004Payload(input)
  if (!validation.valid) {
    return { ok: false, errors: validation.errors }
  }

  // Sesuai requirement, isSafe selalu true (atau bisa dikembangkan lebih lanjut)
  // Tidak ada input manual yang menyatakan berbahaya, status ini hanya untuk mencatat data tegangan
  return {
    ok: true,
    payload: input,
    isSafe: true, 
  }
}

export async function submitFrmTsm004Checklist(input: {
  reportCode: string
  payload: FrmTsm004Payload
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

  if (input.payload.formCode !== "FRM_TSM_004_REPAIR") {
    return { ok: false, errors: ["Kode form tidak sesuai."] }
  }

  const submission = buildFrmTsm004Submission(input.payload)
  if (!submission.ok) {
    return submission
  }

  await getPrisma().checklistReport.updateMany({
    where: {
      reportCode: input.reportCode,
      authorId: session.userId,
      status: "DRAFT",
    },
    data: {
      // TypeScript compiler expects Json for checklistPayload
      checklistPayload: submission.payload as any,
      drivePhotoFileIds: [], // Tidak ada foto
      isSafe: submission.isSafe,
      status: "PENDING_COORD",
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reports")

  return { ok: true as const, isSafe: submission.isSafe }
}
