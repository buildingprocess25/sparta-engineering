export const FRM_TSM_003_FORM_CODE = "FRM_TSM_003"

export type FrmTsm003Item = {
  id: string
  label: string
}

export const FRM_TSM_003_ITEMS: FrmTsm003Item[] = [
  { id: "air_conditioner", label: "Air Conditioner" },
  { id: "exhaust_fan", label: "Exhaust Fan" },
  { id: "saklar", label: "Saklar" },
  { id: "lampu", label: "Lampu" },
  { id: "panel_listrik", label: "Panel Listrik" },
  { id: "stop_kontak", label: "Stop kontak" },
  { id: "dinding_partisi", label: "Dinding/partisi" },
  { id: "lantai", label: "Lantai" },
  { id: "pintu", label: "Pintu" },
  { id: "plafon", label: "Plafon" },
  { id: "closet", label: "Closet" },
  { id: "keran", label: "Keran" },
  { id: "saluran_air_kotor", label: "Saluran air kotor (Drainase)" },
]

export function getFrmTsm003Item(itemId: string): FrmTsm003Item | null {
  return FRM_TSM_003_ITEMS.find((item) => item.id === itemId) ?? null
}
