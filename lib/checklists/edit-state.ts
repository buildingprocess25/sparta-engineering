import type { ChecklistPayload, ChecklistPayloadItem } from "./payload"

export function toEditableChecklistItem(item: ChecklistPayloadItem) {
  return {
    condition: item.condition,
    photos: item.photos ?? [],
    notes: item.notes ?? "",
    handler: item.handler,
    repairForm: item.repairForm ?? (
      item.repairFormName === "Repair Tanpa Biaya" || item.notes === "Repair Tanpa Biaya" ? "REPAIR_TANPA_BIAYA" : undefined
    ),
    followUpCode: item.followUpCode,
    unitNo: item.unitNo,
    value: item.value,
    voltageValue: item.value,
    uploading: false,
  }
}

export function restoreChecklistItems<T>(
  payload: ChecklistPayload | undefined,
  defaults: Record<string, T>,
  restore = toEditableChecklistItem,
) {
  return {
    ...defaults,
    ...Object.fromEntries((payload?.items ?? []).map((item) => [item.id, restore(item)])),
  }
}

export function readWeeklyChecklistNotes(notes?: string) {
  const match = notes?.match(/^\[[^\]]*?\| Tgl: ([^|]*?) \| H1: [^\]]*\](?: ([\s\S]*))?$/)
  return { date: match?.[1], notes: match ? match[2] ?? "" : notes ?? "" }
}

export function restoreChecklistAction(item: ChecklistPayloadItem) {
  const state = toEditableChecklistItem(item)
  const legacyAction = /^Tindakan: (OK|Kuras|Ganti|Tes)$/.exec(state.notes)?.[1]
  const meterPrefix = `Meteran: ${item.value} m³`
  const notes = legacyAction ? ""
    : item.value && state.notes === meterPrefix ? ""
      : item.value && state.notes.startsWith(`${meterPrefix} - `) ? state.notes.slice(meterPrefix.length + 3)
        : state.notes
  return { ...state, notes, meterValue: item.value, actionTaken: item.actionTaken ?? legacyAction }
}
