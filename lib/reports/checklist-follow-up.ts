import type { ChecklistPayloadItem } from "@/lib/checklists/payload"
import { isFrmTsm001Payload } from "@/lib/checklists/payload-001"

export const FORM_014 = "SAT/FRM/TSM/014_REV:000_060423"
export const FORM_065 = "SAT/FRM/TS/065_REV:00_161020"

type Material = {
  id: string
  namaBarang: string
  satuan: string
  jumlah: number
  hargaUnit: number
  total: number
}
type Part = {
  id: string
  namaPart: string
  nomorPart: string
  asalPart: "STOCK" | "PB"
  jumlahPart: number
}
type Details014 = { materials: Material[]; catatan?: string; totalCost?: number }
type Details065 = {
  jenis: "PERBAIKAN" | "PENGGANTIAN_SPARE_PART"
  namaUnit: string
  merk: string
  nomorUnit: string
  nomorTiketProblem: string
  analisa: string
  tindakan: string
  parts: Part[]
}

export type FollowUpItem = ChecklistPayloadItem & {
  followUp014?: Details014
  followUp065?: Details065
  followUpData?: Partial<Details014 & Details065 & Material & Part>
}

export function asPayloadRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function followUpForm(item: FollowUpItem) {
  return item.repairForm === FORM_014 || item.repairForm === FORM_065 ? item.repairForm : null
}

export function getReportItems(value: unknown): FollowUpItem[] {
  const { items } = asPayloadRecord(value)
  if (isFrmTsm001Payload(value)) {
    const ats = value.atsTest
    const stored = Array.isArray(items) ? items.find((item) => item.id === "system_ats_test") : undefined
    return [{
      ...stored,
      id: "system_ats_test",
      label: "Fungsi ATS",
      condition: ats.systemAtsStatus === "NOK" ? "RUSAK" : "BAIK",
      photos: ats.photos ?? [],
      notes: ats.notes,
      handler: ats.handler,
      repairForm: ats.systemAtsStatus === "NOK" ? ats.repairForm : undefined,
      repairFormName: ats.repairFormName,
    }]
  }
  return Array.isArray(items) ? items : []
}

export function needsChecklistFollowUp(payload: unknown) {
  const data = asPayloadRecord(payload)
  return data.followUpCompleted !== true && getReportItems(payload).some(followUpForm)
}

function itemKey(item: FollowUpItem) {
  return JSON.stringify([item.id, item.unitNo || ""])
}

export function retainChecklistFollowUp(previous: unknown, next: unknown) {
  const payload = { ...asPayloadRecord(next) }
  delete payload.followUpCompleted
  delete payload.followUpCompletedAt
  delete payload.followUp014Summary
  delete payload.followUp065Summary
  if (isFrmTsm001Payload(next)) delete payload.items
  const nextItems = getReportItems(payload)
  if (!Array.isArray(payload.items) && !nextItems.some(followUpForm)) return payload

  const byUnit = new Map<string, FollowUpItem[]>()
  for (const item of getReportItems(previous)) {
    const key = itemKey(item)
    const group = byUnit.get(key) ?? []
    group.push(item)
    byUnit.set(key, group)
  }

  return {
    ...payload,
    items: nextItems.map((item) => {
      const previousItem = byUnit.get(itemKey(item))?.shift()
      const form = followUpForm(item)
      const answer = withoutFollowUpDetails(item)
      if (!form || !previousItem || form !== followUpForm(previousItem)) return answer
      return form === FORM_014
        ? { ...answer, followUp014: previousItem.followUp014, followUpData: previousItem.followUpData }
        : { ...answer, followUp065: previousItem.followUp065, followUpData: previousItem.followUpData }
    }),
  }
}

function withoutFollowUpDetails(item: FollowUpItem) {
  const answer = { ...item }
  delete answer.followUp014
  delete answer.followUp065
  delete answer.followUpData
  return answer
}

export function hasSparePartReplacement(payload: unknown): boolean {
  const items = getReportItems(payload)
  return items.some((item) => {
    const f065 = (item.followUp065 ?? (item.repairForm === FORM_065 ? item.followUpData : undefined)) as Details065 | undefined
    return item.repairForm === FORM_065 && f065?.jenis === "PENGGANTIAN_SPARE_PART"
  })
}

export function needsPbProcurement(payload: unknown): boolean {
  const items = getReportItems(payload)
  return items.some((item) => {
    const f065 = (item.followUp065 ?? (item.repairForm === FORM_065 ? item.followUpData : undefined)) as Details065 | undefined
    if (item.repairForm !== FORM_065 || f065?.jenis !== "PENGGANTIAN_SPARE_PART") return false
    return Array.isArray(f065.parts) && f065.parts.some((part) => part.asalPart === "PB")
  })
}

export function completeChecklistFollowUp(payload: unknown, submitted: unknown, completedAt: Date) {
  const items = getReportItems(payload)
  if (!Array.isArray(submitted) || submitted.length !== items.length || !needsChecklistFollowUp(payload)) return null

  let totalCost = 0
  let itemCount = 0
  let has014 = false
  const updatedItems: FollowUpItem[] = []
  for (const [index, item] of items.entries()) {
    const input = submitted[index] as FollowUpItem | null
    if (!input || itemKey(input) !== itemKey(item) || input.repairForm !== item.repairForm) return null

    const answer = withoutFollowUpDetails(item)
    const form = followUpForm(item)
    if (form === FORM_014) {
      const details = input.followUp014
      if (!details || !Array.isArray(details.materials) || details.materials.length === 0) return null
      const materials: Material[] = []
      for (const material of details.materials) {
        if (!material || !Number.isFinite(material.jumlah) || material.jumlah <= 0 ||
          !Number.isFinite(material.hargaUnit) || material.hargaUnit < 0) return null
        const total = material.jumlah * material.hargaUnit
        if (!Number.isFinite(total)) return null
        materials.push({ ...material, total })
      }
      const subtotal = materials.reduce((sum, material) => sum + material.total, 0)
      has014 = true
      totalCost += subtotal
      if (!Number.isFinite(totalCost)) return null
      updatedItems.push({ ...answer, followUp014: { ...details, materials }, followUpData: { ...details, materials, totalCost: subtotal } })
    } else if (form === FORM_065) {
      const details = input.followUp065
      if (!details || !Array.isArray(details.parts) ||
        (details.jenis !== "PERBAIKAN" && details.jenis !== "PENGGANTIAN_SPARE_PART") ||
        (details.jenis === "PENGGANTIAN_SPARE_PART" && details.parts.length === 0)) return null
      const parts = details.jenis === "PERBAIKAN" ? [] : details.parts
      if (parts.some((part) => !part || !Number.isFinite(part.jumlahPart) || part.jumlahPart <= 0)) return null
      itemCount++
      updatedItems.push({ ...answer, followUp065: { ...details, parts }, followUpData: { ...details, parts } })
    } else {
      updatedItems.push(answer)
    }
  }

  return {
    ...asPayloadRecord(payload),
    items: updatedItems,
    followUpCompleted: true,
    followUpCompletedAt: completedAt.toISOString(),
    followUp014Summary: has014 ? { totalCost } : null,
    followUp065Summary: itemCount ? { itemCount } : null,
  }
}
