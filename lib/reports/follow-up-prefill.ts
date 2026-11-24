export type EquipmentIdentityMaster = {
  name?: string | null
  unitNo?: number | null
  code?: string | null
}

export type Form065PrefillInput = {
  existing?: {
    jenis?: "PERBAIKAN" | "PENGGANTIAN_SPARE_PART"
    namaUnit?: string
    merk?: string
    nomorUnit?: string
    nomorTiketProblem?: string
    analisa?: string
    tindakan?: string
    parts?: Array<{
      id: string
      namaPart: string
      nomorPart: string
      asalPart: "STOCK" | "PB"
      jumlahPart: number
    }>
    namaPart?: string
    nomorPart?: string
    asalPart?: "STOCK" | "PB"
    jumlahPart?: number
  }
  itemUnitNo?: string
  itemLabel: string
  itemNotes?: string
  payloadUnitModel?: string
  payloadUnitBrand?: string
  payloadUnitNo?: string
  equipment?: EquipmentIdentityMaster | null
}

/** Prefill Form 065 identity fields from existing details, checklist payload, or master Equipment. */
export function buildInitialForm065State(input: Form065PrefillInput) {
  const { existing, equipment } = input
  const masterUnitNo =
    equipment?.unitNo !== undefined && equipment?.unitNo !== null
      ? String(equipment.unitNo)
      : equipment?.code || ""

  return {
    jenis: (existing?.jenis || "PENGGANTIAN_SPARE_PART") as
      | "PERBAIKAN"
      | "PENGGANTIAN_SPARE_PART",
    namaUnit:
      existing?.namaUnit ||
      equipment?.name ||
      input.payloadUnitModel ||
      input.itemLabel,
    merk: existing?.merk || input.payloadUnitBrand || "",
    nomorUnit:
      existing?.nomorUnit ||
      input.itemUnitNo ||
      input.payloadUnitNo ||
      masterUnitNo ||
      "",
    nomorTiketProblem: existing?.nomorTiketProblem || "",
    analisa: existing?.analisa ?? input.itemNotes ?? "",
    tindakan: existing?.tindakan ?? "",
    parts:
      existing?.parts && Array.isArray(existing.parts) && existing.parts.length > 0
        ? existing.parts
        : [
            {
              id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              namaPart: existing?.namaPart || "",
              nomorPart: existing?.nomorPart || "",
              asalPart: (existing?.asalPart || "STOCK") as "STOCK" | "PB",
              jumlahPart: existing?.jumlahPart ? Number(existing.jumlahPart) : 1,
            },
          ],
  }
}
