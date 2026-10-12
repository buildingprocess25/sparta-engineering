export type ChecklistDraftPeriod = "MONTHLY" | "WEEKLY" | "QUARTERLY" | "SEMESTER"

export type ChecklistDraft = {
  reportCode: string
  areaId: string
  roomId?: string | null
  periodKey: string
  formCode: string
  taskId?: string | null
  equipmentId?: string | null
}

export type ReserveChecklistDraftInput = {
  authorId: string
  areaId: string
  roomId?: string | null
  areaCode: string
  formCode: string
  period: ChecklistDraftPeriod
  periodKey: string
  taskId?: string | null
  equipmentId?: string | null
}


export type CreateChecklistDraftInput = ReserveChecklistDraftInput & {
  reportCode: string
}

export interface ChecklistDraftRepository {
  findDraftByUser(authorId: string): Promise<ChecklistDraft | null>
  generateReportCode(input: {
    areaCode: string
    periodKey: string
  }): Promise<string>
  createDraft(input: CreateChecklistDraftInput): Promise<void>
  deleteDraft(reportCode: string): Promise<void>
}

function matchesDraft(
  draft: ChecklistDraft,
  input: ReserveChecklistDraftInput
): boolean {
  return (
    draft.areaId === input.areaId &&
    (draft.roomId ?? null) === (input.roomId ?? null) &&
    draft.periodKey === input.periodKey &&
    draft.formCode === input.formCode
  )
}

export async function reserveChecklistDraft(
  repository: ChecklistDraftRepository,
  input: ReserveChecklistDraftInput
): Promise<{ reportCode: string }> {
  const existingDraft = await repository.findDraftByUser(input.authorId)

  if (existingDraft && matchesDraft(existingDraft, input)) {
    return { reportCode: existingDraft.reportCode }
  }

  if (existingDraft) {
    await repository.deleteDraft(existingDraft.reportCode)
  }

  const reportCode = await repository.generateReportCode({
    areaCode: input.areaCode,
    periodKey: input.periodKey,
  })
  await repository.createDraft({ ...input, reportCode })

  return { reportCode }
}

export async function promoteChecklistDraft(
  repository: {
    promoteDraft(input: { reportCode: string; authorId: string }): Promise<void>
  },
  input: { reportCode: string; authorId: string }
): Promise<void> {
  await repository.promoteDraft(input)
}
