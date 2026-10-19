import {
  Activity,
  Battery,
  BatteryCharging,
  CircleDot,
  Disc,
  Droplet,
  Gauge,
  Monitor,
  RotateCw,
  Sliders,
  Wrench,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TSM_008_FORM_CODE = "FRM_TSM_008"
export const FRM_TSM_008_NRA = "SAT/FRM/TSM/008_Rev_000_111122"
export const FRM_TSM_008_REF_NRA =
  "SAT/KEB/TSM/004 Kebijakan Pemeliharaan Peralatan Unit Sewa di Warehouse/Depo/Bulky"

export type EquipmentSewaItem = {
  id: string
  label: string
  actionCode: "CH" | "CL" | "DO IT"
  actionName: string
  categoryId: string
}

export type EquipmentSewaCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: EquipmentSewaItem[]
}

export const EQUIPMENT_SEWA_CATEGORIES: EquipmentSewaCategory[] = [
  {
    id: "load_wheel",
    number: 1,
    title: "1. LOAD WHEEL",
    icon: Disc,
    items: [
      {
        id: "lw_permukaan",
        label: "A. Cek kondisi Permukaan lapisan roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "load_wheel",
      },
      {
        id: "lw_as_roda",
        label: "B. Cek dan bersihkan AS roda dari tali plastik dan sampah",
        actionCode: "CL",
        actionName: "Clean",
        categoryId: "load_wheel",
      },
      {
        id: "lw_bearing",
        label: "C. Cek kondisi bearing pada roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "load_wheel",
      },
    ],
  },
  {
    id: "drive_wheel",
    number: 2,
    title: "2. DRIVE WHEEL",
    icon: RotateCw,
    items: [
      {
        id: "dw_permukaan",
        label: "A. Cek kondisi Permukaan lapisan roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "drive_wheel",
      },
      {
        id: "dw_as_roda",
        label: "B. Cek dan bersihkan AS roda dari tali plastik dan sampah",
        actionCode: "CL",
        actionName: "Clean",
        categoryId: "drive_wheel",
      },
      {
        id: "dw_bearing",
        label: "C. Cek kondisi bearing pada roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "drive_wheel",
      },
    ],
  },
  {
    id: "caster_wheel",
    number: 3,
    title: "3. CASTER WHEEL",
    icon: CircleDot,
    items: [
      {
        id: "cw_permukaan",
        label: "A. Cek kondisi Permukaan lapisan roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "caster_wheel",
      },
      {
        id: "cw_as_roda",
        label: "B. Cek dan bersihkan AS roda dari tali plastik dan sampah",
        actionCode: "CL",
        actionName: "Clean",
        categoryId: "caster_wheel",
      },
      {
        id: "cw_bearing",
        label: "C. Cek kondisi bearing pada roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "caster_wheel",
      },
    ],
  },
  {
    id: "supporting_wheel",
    number: 4,
    title: "4. SUPPORTING WHEEL",
    icon: Disc,
    items: [
      {
        id: "sw_permukaan",
        label: "A. Cek kondisi Permukaan lapisan roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "supporting_wheel",
      },
      {
        id: "sw_as_roda",
        label: "B. Cek dan bersihkan AS roda dari tali plastik dan sampah",
        actionCode: "CL",
        actionName: "Clean",
        categoryId: "supporting_wheel",
      },
      {
        id: "sw_bearing",
        label: "C. Cek kondisi bearing pada roda",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "supporting_wheel",
      },
    ],
  },
  {
    id: "ruang_kemudi",
    number: 5,
    title: "5. RUANG KEMUDI",
    icon: Gauge,
    items: [
      {
        id: "rk_kebersihan",
        label: "A. Cek kebersihan ruang kemudi",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "ruang_kemudi",
      },
      {
        id: "rk_panel",
        label: "B. Cek kebersihan panel monitor",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "ruang_kemudi",
      },
      {
        id: "rk_keamanan",
        label: "C. Cek kondisi system keamanan dan pengendali",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "ruang_kemudi",
      },
    ],
  },
  {
    id: "system_hydraulic",
    number: 6,
    title: "6. SYSTEM HYDRAULIC",
    icon: Droplet,
    items: [
      {
        id: "sh_fungsi",
        label: "A. Test semua fungsi hydraulic",
        actionCode: "DO IT",
        actionName: "Lakukan",
        categoryId: "system_hydraulic",
      },
      {
        id: "sh_kebocoran",
        label: "B. Cek secara visual kebocoran oli hydraulic",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "system_hydraulic",
      },
    ],
  },
  {
    id: "display_monitor",
    number: 7,
    title: "7. DISPLAY MONITOR",
    icon: Monitor,
    items: [
      {
        id: "dm_tampilan",
        label: "A. Cek Tampilan display monitor",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "display_monitor",
      },
      {
        id: "dm_kode_error",
        label: "B. Cek kode error pada display monitor",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "display_monitor",
      },
      {
        id: "dm_test_performa",
        label: "C. Test performa semua fungsi unit",
        actionCode: "DO IT",
        actionName: "Lakukan",
        categoryId: "display_monitor",
      },
    ],
  },
  {
    id: "battery",
    number: 8,
    title: "8. BATTERY",
    icon: Battery,
    items: [
      {
        id: "bat_kebersihan",
        label: "A. Cek kebersihan kondisi battery",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "battery",
      },
      {
        id: "bat_performa",
        label: "B. Cek kondisi dan performa battery",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "battery",
      },
    ],
  },
  {
    id: "charger_battery",
    number: 9,
    title: "9. CHARGER BATTERY",
    icon: BatteryCharging,
    items: [
      {
        id: "chg_kebersihan",
        label: "A. Cek kebersihan dan kondisi charger battery",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "charger_battery",
      },
      {
        id: "chg_fungsi",
        label: "B. Cek fungsi dan performa charger battery",
        actionCode: "CH",
        actionName: "Check",
        categoryId: "charger_battery",
      },
    ],
  },
]

export const ALL_EQUIPMENT_SEWA_ITEMS: EquipmentSewaItem[] =
  EQUIPMENT_SEWA_CATEGORIES.flatMap((c) => c.items)

const CHECKLIST_ITEMS: ChecklistItemConfig[] = ALL_EQUIPMENT_SEWA_ITEMS.map(
  (item) => ({
    id: item.id,
    label: item.label,
    icon: Wrench,
  })
)

export const FRM_TSM_008_CONFIG: ChecklistConfig = {
  formCode: FRM_TSM_008_FORM_CODE,
  formName: "Checklist Perawatan Peralatan Unit Sewa",
  items: CHECKLIST_ITEMS,
  conditionOptions: [
    "BAIK",
    "RUSAK",
    "REPAIR",
    "TIDAK_ADA",
    "ADJUST_OR_ADD",
    "CLEAN",
    "URGENT",
  ],
  conditionLabels: {
    BAIK: "Baik (V)",
    RUSAK: "Rusak (X)",
    REPAIR: "Repair (R)",
    TIDAK_ADA: "Tidak Ada (T)",
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
    URGENT: "Urgent (U)",
  },
  conditionRequiresPhoto,
}
