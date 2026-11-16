import { asPayloadRecord } from "./checklist-follow-up"

export type RevisionChange = { field: string; before: string; after: string }
export type ChecklistRevisionHistory = {
  id: string
  reason: string | null
  reviewerId: string | null
  reviewerName: string | null
  reviewStage: string | null
  requestedAt: string | null
  resubmittedAt: string | null
  changes: RevisionChange[]
}

const fieldLabels: Record<string, string> = {
  items: "Item checklist", generalNotes: "Catatan umum", notes: "Catatan", condition: "Kondisi",
  photos: "Foto", handler: "Penanggung jawab", repairForm: "Form tindak lanjut",
  followUp014: "Form 014", followUp065: "Form 065", materials: "Material", parts: "Spare part",
  jumlah: "Jumlah", hargaUnit: "Harga satuan", total: "Subtotal", unitNo: "Nomor unit",
  unitBrand: "Merek unit", atsTest: "Uji ATS", runningLog: "Log genset", panels: "Panel",
  systemAtsStatus: "Status ATS", keterangan: "Keterangan", catatanKeterangan: "Catatan genset",
  measurements: "Pengukuran", rn: "R–N", sn: "S–N", tn: "T–N", rs: "R–S", st: "S–T", tr: "T–R",
}

const hiddenFields = new Set([
  "id", "label", "url", "formName", "repairFormName", "followUpCompleted", "followUpCompletedAt",
  "followUp014Summary", "followUp065Summary",
])

export function describeRevisionChanges(previous: unknown, current: unknown): RevisionChange[] {
  const changes: RevisionChange[] = []

  function compare(before: unknown, after: unknown, path: string[]) {
    if (JSON.stringify(before) === JSON.stringify(after)) return
    const key = path.at(-1)
    if (key === "Foto") {
      const oldIds = Array.isArray(before) ? before.map((photo) => photo.fileId) : []
      const newIds = Array.isArray(after) ? after.map((photo) => photo.fileId) : []
      const kept = oldIds.filter((id) => newIds.includes(id)).length
      if (kept !== oldIds.length || kept !== newIds.length) {
        changes.push({ field: path.join(" / "), before: `${oldIds.length} foto`, after: `${newIds.length} foto (${newIds.length - kept} ditambahkan, ${oldIds.length - kept} dilepas)` })
      }
      return
    }
    if (Array.isArray(before) || Array.isArray(after)) {
      function byIdentity(value: unknown) {
        const entries = new Map<string, { entry: unknown; label: string }>()
        const counts = new Map<string, number>()
        if (!Array.isArray(value)) return entries
        for (const [index, entry] of value.entries()) {
          const row = asPayloadRecord(entry)
          const id = JSON.stringify([row.id ?? index, row.unitNo ?? ""])
          const occurrence = (counts.get(id) ?? 0) + 1
          counts.set(id, occurrence)
          const label = row.label || row.namaBarang || row.namaPart || index + 1
          const unit = row.unitNo ? ` (Unit ${row.unitNo})` : occurrence > 1 ? ` (${occurrence})` : ""
          entries.set(`${id}:${occurrence}`, { entry, label: `${label}${unit}` })
        }
        return entries
      }
      const oldRows = byIdentity(before)
      const newRows = byIdentity(after)
      for (const id of new Set([...oldRows.keys(), ...newRows.keys()])) {
        const oldRow = oldRows.get(id)
        const newRow = newRows.get(id)
        compare(oldRow?.entry, newRow?.entry, [...path, newRow?.label ?? oldRow?.label ?? ""])
      }
      return
    }
    const oldRecord = asPayloadRecord(before)
    const newRecord = asPayloadRecord(after)
    const fields = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)])
    if (fields.size) {
      for (const field of fields) {
        if (hiddenFields.has(field)) continue
        if (field === "followUpData" && (oldRecord.followUp014 || oldRecord.followUp065 || newRecord.followUp014 || newRecord.followUp065)) continue
        compare(oldRecord[field], newRecord[field], [...path, fieldLabels[field] ?? field])
      }
    } else if (typeof before !== "object" || typeof after !== "object") {
      const oldValue = String(before ?? "—")
      const newValue = String(after ?? "—")
      if (oldValue !== newValue) changes.push({ field: path.join(" / "), before: oldValue, after: newValue })
    }
  }

  compare(previous, current, [])
  return changes
}

export function getChecklistRevisionUrl(reportCode: string, formCode: string | null) {
  if (!formCode || !/^FRM_TSM?_\d{3}(?:_REPAIR)?$/.test(formCode)) return null
  const isRepair = formCode.endsWith("_REPAIR")
  const slug = formCode.replace(/_REPAIR$/, "").replaceAll("_", "-").toLowerCase()
  return `/dashboard/reports/new/${isRepair ? "repair" : "checklist"}/${slug}?revision=${encodeURIComponent(reportCode)}`
}
