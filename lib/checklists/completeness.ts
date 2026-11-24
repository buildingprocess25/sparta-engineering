import { HYDRANT_CATEGORIES } from "./frm-tsm-006"
import { PLTS_CATEGORIES } from "./frm-tsm-007"
import type { ChecklistPayload } from "./payload"
import { getChecklistConfig } from "./registry"

function getExpectedItemIds(payload: ChecklistPayload): {
  validIds: Set<string>
  requiredIds: string[]
  error?: string
} {
  const config = getChecklistConfig(payload.formCode)
  if (!config) {
    return {
      validIds: new Set(),
      requiredIds: [],
      error: "Konfigurasi form tidak ditemukan.",
    }
  }

  const baseCode = payload.formCode.replace(/_REPAIR$/, "")
  const validIds = new Set(config.items.map((item) => item.id))

  if (payload.formCode.endsWith("_REPAIR")) {
    return { validIds, requiredIds: [] }
  }

  if (baseCode === "FRM_TSM_006") {
    const mode = payload.jenisPerawatan
    const cats =
      mode === "GENERAL_MINGGUAN"
        ? HYDRANT_CATEGORIES.filter((c) => c.frequencyBadge === "MINGGUAN")
        : mode === "BULANAN"
          ? HYDRANT_CATEGORIES.filter((c) => c.frequencyBadge === "BULANAN")
          : mode === "ENAM_BULANAN"
            ? HYDRANT_CATEGORIES.filter((c) => c.frequencyBadge === "6 BULANAN")
            : []
    if (cats.length === 0) {
      return {
        validIds,
        requiredIds: [],
        error: "Jenis perawatan Hydrant tidak valid atau belum dipilih.",
      }
    }
    return {
      validIds,
      requiredIds: cats.flatMap((c) => c.items.map((i) => i.id)),
    }
  }

  if (baseCode === "FRM_TSM_007") {
    const mode = (payload.jenisPerawatan || "").toUpperCase()
    const cats =
      mode === "1_BULANAN" || mode.includes("1 (SATU)")
        ? PLTS_CATEGORIES.filter((c) => c.frequencyBadge === "BULANAN")
        : mode === "3_BULANAN" || mode.includes("3 (TIGA)")
          ? PLTS_CATEGORIES.filter((c) => c.frequencyBadge === "3 BULANAN")
          : []
    if (cats.length === 0) {
      return {
        validIds,
        requiredIds: [],
        error: "Jenis perawatan PLTS tidak valid atau belum dipilih.",
      }
    }
    return {
      validIds,
      requiredIds: cats.flatMap((c) => c.items.map((i) => i.id)),
    }
  }

  return {
    validIds,
    requiredIds: config.items.map((item) => item.id),
  }
}

/** Validate item completeness and item IDs for a submitted checklist payload on the backend. */
export function validateChecklistCompleteness(payload: ChecklistPayload): {
  valid: boolean
  errors: string[]
} {
  const { validIds, requiredIds, error } = getExpectedItemIds(payload)
  if (error) {
    return { valid: false, errors: [error] }
  }

  const errors: string[] = []
  const submittedIds = new Set<string>()
  for (const item of payload.items) {
    if (!validIds.has(item.id)) {
      errors.push(`Item checklist tidak dikenali (${item.id}).`)
      continue
    }
    submittedIds.add(item.id)
  }

  if (payload.formCode.endsWith("_REPAIR")) {
    if (payload.items.length === 0) {
      errors.push("Minimal 1 item temuan wajib diisi pada laporan perbaikan/temuan.")
    }
    return { valid: errors.length === 0, errors }
  }

  const missingIds = requiredIds.filter((id) => !submittedIds.has(id))
  if (missingIds.length > 0) {
    errors.push(
      `Kelengkapan item checklist belum terpenuhi (${submittedIds.size} dari ${requiredIds.length} item wajib terisi).`,
    )
  }

  return { valid: errors.length === 0, errors }
}
