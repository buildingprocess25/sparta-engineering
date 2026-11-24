export type ChecklistDraftPeriod = "MONTHLY" | "WEEKLY" | "QUARTERLY" | "SEMESTER"

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

export type ChecklistDraft = {
  id: string
  authorId: string
  areaId: string
  roomId: string | null
  category?: "PREVENTIVE" | "INCIDENTAL"
  period: ChecklistDraftPeriod | null
  periodKey: string | null
  formCode: string | null
  taskId: string | null
  equipmentId: string | null
  reportCode: string | null
  status: string
  updatedAt: Date
  canRebind: boolean
  pendingFollowUp: boolean
}

function isRoutineDraft(draft: ChecklistDraft): boolean {
  if (draft.category === "INCIDENTAL") return false
  if (typeof draft.formCode === "string" && draft.formCode.toUpperCase().endsWith("_REPAIR")) {
    return false
  }
  return true
}

export type CreateChecklistDraftInput = ReserveChecklistDraftInput & {
  reportCode: string
}

export interface ChecklistDraftRepository {
  findCandidates(input: ReserveChecklistDraftInput): Promise<ChecklistDraft[]>
  generateReportCode(input: {
    areaCode: string
    periodKey: string
  }): Promise<string>
  createDraft(input: CreateChecklistDraftInput): Promise<boolean>
  rebindDraft(draft: ChecklistDraft, input: CreateChecklistDraftInput): Promise<boolean>
}

type ReservationResult =
  | { reportCode: string }
  | { unavailable: "follow-up"; existingReportCode: string }
  | { unavailable: "submitted"; existingReportCode: string | null }
  | { unavailable: "conflict" | "legacy" }

function matchesLocationAndPeriod(draft: ChecklistDraft, input: ReserveChecklistDraftInput) {
  return draft.areaId === input.areaId &&
    draft.roomId === (input.roomId ?? null) &&
    draft.period === input.period &&
    draft.periodKey === input.periodKey &&
    draft.formCode === input.formCode
}

export async function reserveChecklistDraft(
  repository: ChecklistDraftRepository,
  input: ReserveChecklistDraftInput,
): Promise<ReservationResult> {
  const wantsRoutine = !input.formCode.toUpperCase().endsWith("_REPAIR")

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidates = await repository.findCandidates(input)
    const matchingKindCandidates = wantsRoutine
      ? candidates.filter(isRoutineDraft)
      : candidates.filter((report) => !isRoutineDraft(report))

    const taskReport = input.taskId ? candidates.find((report) => report.taskId === input.taskId) : undefined
    const roomReport = input.roomId
      ? matchingKindCandidates.find((report) => matchesLocationAndPeriod(report, input))
      : undefined
    const slotOccupied = Boolean(
      input.roomId && candidates.some((report) => matchesLocationAndPeriod(report, input)),
    )

    if (input.taskId && !taskReport) {
      if (
        roomReport &&
        roomReport.taskId === null &&
        roomReport.status === "DRAFT" &&
        roomReport.authorId === input.authorId
      ) {
        const matchesEquipment = roomReport.equipmentId === (input.equipmentId ?? null)
        if (roomReport.reportCode && matchesEquipment) {
          if (await repository.rebindDraft(roomReport, { ...input, reportCode: roomReport.reportCode })) {
            return { reportCode: roomReport.reportCode }
          }
          continue
        }
      }

      const reportCode = await repository.generateReportCode(input)
      if (
        await repository.createDraft({
          ...input,
          roomId: slotOccupied ? null : input.roomId,
          reportCode,
        })
      ) {
        return { reportCode }
      }
      continue
    }

    const existing = taskReport ?? roomReport
    if (!existing) {
      const reportCode = await repository.generateReportCode(input)
      if (
        await repository.createDraft({
          ...input,
          roomId: slotOccupied ? null : input.roomId,
          reportCode,
        })
      ) {
        return { reportCode }
      }
      continue
    }

    if (existing.authorId !== input.authorId) return { unavailable: "conflict" }
    if (existing.pendingFollowUp && existing.reportCode) {
      return { unavailable: "follow-up", existingReportCode: existing.reportCode }
    }
    if (existing.status !== "DRAFT") return { unavailable: "submitted", existingReportCode: existing.reportCode }

    const matchesEquipment = existing.equipmentId === (input.equipmentId ?? null)
    const matchesTask = !input.taskId || existing.taskId === input.taskId
    const matchesContext = matchesLocationAndPeriod(existing, input) && matchesEquipment
    if (existing.reportCode && matchesContext && matchesTask) return { reportCode: existing.reportCode }

    if (taskReport && roomReport && roomReport.id !== taskReport.id) return { unavailable: "conflict" }
    if (!taskReport && (!matchesContext || (input.taskId && existing.taskId))) return { unavailable: "conflict" }
    if (!existing.canRebind) return { unavailable: "legacy" }

    const reportCode = existing.reportCode ?? await repository.generateReportCode(input)
    if (await repository.rebindDraft(existing, { ...input, taskId: input.taskId ?? existing.taskId, reportCode })) {
      return { reportCode }
    }
  }

  return { unavailable: "conflict" }
}

export async function promoteChecklistDraft(
  repository: {
    promoteDraft(input: { reportCode: string; authorId: string }): Promise<void>
  },
  input: { reportCode: string; authorId: string }
): Promise<void> {
  await repository.promoteDraft(input)
}
