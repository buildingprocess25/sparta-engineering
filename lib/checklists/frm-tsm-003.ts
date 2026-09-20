export const FRM_TSM_003_FORM_CODE = "FRM_TSM_003"

export type FrmTsm003Item = {
  id: string
  label: string
  icon: string
}

export const FRM_TSM_003_ITEMS: FrmTsm003Item[] = [
  { id: "air_conditioner", label: "Air Conditioner", icon: "Wind" },
  { id: "exhaust_fan", label: "Exhaust Fan", icon: "Fan" },
  { id: "saklar", label: "Saklar", icon: "ToggleRight" },
  { id: "lampu", label: "Lampu", icon: "Lightbulb" },
  { id: "panel_listrik", label: "Panel Listrik", icon: "Zap" },
  { id: "stop_kontak", label: "Stop kontak", icon: "Plug" },
  { id: "dinding_partisi", label: "Dinding/partisi", icon: "Square" },
  { id: "lantai", label: "Lantai", icon: "Grid" },
  { id: "pintu", label: "Pintu", icon: "DoorClosed" },
  { id: "plafon", label: "Plafon", icon: "ArrowUpToLine" },
  { id: "closet", label: "Closet", icon: "Bath" },
  { id: "keran", label: "Keran", icon: "Droplet" },
  { id: "saluran_air_kotor", label: "Saluran air kotor (Drainase)", icon: "Waves" },
]

export function getFrmTsm003Item(itemId: string): FrmTsm003Item | null {
  return FRM_TSM_003_ITEMS.find((item) => item.id === itemId) ?? null
}
