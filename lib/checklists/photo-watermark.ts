type ChecklistPhotoWatermarkInput = {
  areaName: string
  userLabel: string
  userRole: string
  capturedAt?: Date
}

export type ChecklistPhotoWatermarkLine = {
  text: string
  weight: 400 | 700
}

function formatCapturedAt(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(value)
    .replaceAll(".", ":")
}

export function buildChecklistPhotoWatermarkLines({
  areaName,
  userLabel,
  userRole,
  capturedAt = new Date(),
}: ChecklistPhotoWatermarkInput): ChecklistPhotoWatermarkLine[] {
  return [
    { text: "SPARTA Engineering", weight: 700 },
    { text: formatCapturedAt(capturedAt), weight: 400 },
    { text: `Oleh: ${userLabel} - ${userRole}`, weight: 400 },
    { text: `Area: ${areaName}`, weight: 400 },
  ]
}
