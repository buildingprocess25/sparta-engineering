export type ChecklistConditionTone =
  | "ok"
  | "danger"
  | "urgent"
  | "warning"
  | "neutral"
  | "info"

export type ChecklistConditionDisplay = {
  code: string
  label: string
  shortLabel: string
  tone: ChecklistConditionTone
  isFinding: boolean
  isUnsafe: boolean
}

/** Map a stored checklist condition value to its exact display code, label, and semantic tone. */
export function getChecklistConditionDisplay(
  condition?: string | null,
  options?: { noneLabel?: string },
): ChecklistConditionDisplay {
  const raw = typeof condition === "string" ? condition.trim() : ""
  const upper = raw.toUpperCase()

  if (!upper) {
    return {
      code: "",
      label: "-",
      shortLabel: "-",
      tone: "neutral",
      isFinding: false,
      isUnsafe: false,
    }
  }

  if (upper === "BAIK" || upper === "OK") {
    return {
      code: "V",
      label: "OK (V)",
      shortLabel: "Baik",
      tone: "ok",
      isFinding: false,
      isUnsafe: false,
    }
  }

  if (upper === "RUSAK" || upper === "NOK") {
    return {
      code: "X",
      label: "Not Good (X)",
      shortLabel: "Rusak",
      tone: "danger",
      isFinding: true,
      isUnsafe: true,
    }
  }

  if (upper === "URGENT") {
    return {
      code: "U",
      label: "Urgent (U)",
      shortLabel: "Urgent (U)",
      tone: "urgent",
      isFinding: true,
      isUnsafe: true,
    }
  }

  if (upper === "REPAIR") {
    return {
      code: "R",
      label: "Repair (R)",
      shortLabel: "Repair (R)",
      tone: "warning",
      isFinding: true,
      isUnsafe: false,
    }
  }

  if (upper === "ADJUST_OR_ADD" || upper === "ADJUST") {
    return {
      code: "A",
      label: "Adjust (A)",
      shortLabel: "Adjust (A)",
      tone: "warning",
      isFinding: true,
      isUnsafe: false,
    }
  }

  if (upper === "TIDAK_ADA" || upper === "NONE") {
    return {
      code: "N",
      label: options?.noneLabel ?? "None (N)",
      shortLabel: options?.noneLabel ?? "Tidak ada",
      tone: "neutral",
      isFinding: false,
      isUnsafe: false,
    }
  }

  if (upper === "CLEAN") {
    return {
      code: "C",
      label: "Clean (C)",
      shortLabel: "Clean (C)",
      tone: "info",
      isFinding: true,
      isUnsafe: false,
    }
  }

  return {
    code: raw,
    label: raw,
    shortLabel: raw,
    tone: "neutral",
    isFinding: false,
    isUnsafe: false,
  }
}
