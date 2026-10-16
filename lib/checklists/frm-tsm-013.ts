import {
  Activity,
  Beaker,
  CheckCircle2,
  Cpu,
  Droplet,
  Droplets,
  Filter,
  Gauge,
  Layers,
  Pipette,
  Power,
  ShieldCheck,
  Sparkles,
  Waves,
  Wrench,
  Zap,
} from "lucide-react"

import type { ChecklistConfig, ChecklistItemConfig } from "@/components/es-dashboard/shared-checklist-form"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"

export const FRM_TSM_013_FORM_CODE = "FRM_TSM_013"
export const FRM_TSM_013_NRA = "SAT/FRM/TSM/013_Rev_000_100123"
export const FRM_TSM_013_REF_NRA =
  "SAT/KEB/TSM/007 Kebijakan Perawatan Peralatan Water Recycle Branch/Depo/Bulky"

export type WaterRecycleChecklistItem = {
  id: string
  label: string
  conditionDesc: string
  activity: "Cek" | "Cek/Kuras" | "Cek/Ganti" | "Tes" | "Catat"
  categoryId: string
  isMeterInput?: boolean
  isChemical?: boolean
}

export type WaterRecycleCategory = {
  id: string
  number: number
  title: string
  icon: React.ElementType
  items: WaterRecycleChecklistItem[]
}

export const WATER_RECYCLE_CATEGORIES: WaterRecycleCategory[] = [
  {
    id: "konstruksi_sipil_filtrasi",
    number: 1,
    title: "1. KONSTRUKSI / SIPIL & FILTRASI",
    icon: Filter,
    items: [
      {
        id: "wr_ruang_filterisasi",
        label: "Ruang Filterisasi",
        conditionDesc: "bersih / tidak bocor",
        activity: "Cek/Kuras",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_material_filter_ijuk",
        label: "Material Filter Ijuk",
        conditionDesc: "bersih / tidak berlumut / tidak tersumbat",
        activity: "Cek/Ganti",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_material_filter_arang",
        label: "Material Filter Arang",
        conditionDesc: "bersih / tidak berlumut / tidak tersumbat",
        activity: "Cek/Ganti",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_material_filter_batu_koral",
        label: "Material Filter Batu Koral",
        conditionDesc: "bersih / tidak berlumut / tidak tersumbat",
        activity: "Cek/Ganti",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_ground_tank",
        label: "Ground Tank",
        conditionDesc: "bersih / tidak berlumut / tidak bocor",
        activity: "Cek/Kuras",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_toren_tandon_air",
        label: "Toren / Tandon Air",
        conditionDesc: "bersih / tidak berlumut / tidak bocor",
        activity: "Cek/Kuras",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_rangka_dudukan_toren",
        label: "Rangka Dudukan Toren / Tandon",
        conditionDesc: "tidak berkarat / tidak patah",
        activity: "Cek",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_instalasi_pipa",
        label: "Instalasi Pipa",
        conditionDesc: "tidak bocor / tidak pecah / tidak tersumbat",
        activity: "Cek",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_stop_kran",
        label: "Stop Kran",
        conditionDesc: "tidak patah / tidak pecah / tidak tersumbat",
        activity: "Cek",
        categoryId: "konstruksi_sipil_filtrasi",
      },
      {
        id: "wr_selang_jet_shower",
        label: "Selang + Jet Shower + Kran",
        conditionDesc: "tidak bocor / tidak patah / tidak tersumbat",
        activity: "Cek",
        categoryId: "konstruksi_sipil_filtrasi",
      },
    ],
  },
  {
    id: "mekanikal_elektrikal",
    number: 2,
    title: "2. MEKANIKAL & ELEKTRIKAL",
    icon: Power,
    items: [
      {
        id: "wr_pompa_air",
        label: "Pompa Air",
        conditionDesc: "hidup dan berfungsi",
        activity: "Tes",
        categoryId: "mekanikal_elektrikal",
      },
      {
        id: "wr_automatis_pompa_radar",
        label: "Automatis Pompa / Radar",
        conditionDesc: "tidak pecah / tidak patah / tidak terbakar",
        activity: "Tes",
        categoryId: "mekanikal_elektrikal",
      },
      {
        id: "wr_instalasi_listrik",
        label: "Instalasi Listrik",
        conditionDesc: "tidak terbakar / tidak putus / tidak konslet",
        activity: "Cek",
        categoryId: "mekanikal_elektrikal",
      },
      {
        id: "wr_meteran_air",
        label: "Meteran Air",
        conditionDesc: "berfungsi + angka terbaca",
        activity: "Catat",
        categoryId: "mekanikal_elektrikal",
        isMeterInput: true,
      },
    ],
  },
  {
    id: "chemical_treatment",
    number: 3,
    title: "3. CHEMICAL TREATMENT",
    icon: Beaker,
    items: [
      {
        id: "wr_tawas_kaporite",
        label: "Tawas + Kaporite (Ratio 1:1)",
        conditionDesc: "Pada keranjang jgn sampai habis, tambah bila perlu",
        activity: "Cek/Ganti",
        categoryId: "chemical_treatment",
        isChemical: true,
      },
    ],
  },
]

export const WATER_RECYCLE_ALL_ITEMS: WaterRecycleChecklistItem[] =
  WATER_RECYCLE_CATEGORIES.flatMap((c) => c.items)

const CHECKLIST_ITEMS: ChecklistItemConfig[] = WATER_RECYCLE_ALL_ITEMS.map((item) => ({
  id: item.id,
  label: item.label,
  icon: item.isChemical ? Beaker : item.isMeterInput ? Gauge : Wrench,
}))

export const FRM_TSM_013_CONFIG: ChecklistConfig = {
  formCode: FRM_TSM_013_FORM_CODE,
  formName: "Form Checklist Water Recycle",
  items: CHECKLIST_ITEMS,
  conditionOptions: [
    "BAIK",
    "RUSAK",
    "CLEAN",
    "ADJUST_OR_ADD",
    "TIDAK_ADA",
    "REPAIR",
    "URGENT",
  ],
  conditionLabels: {
    BAIK: "OK (V)",
    RUSAK: "Nok (X)",
    CLEAN: "Kuras",
    ADJUST_OR_ADD: "Ganti",
    TIDAK_ADA: "Tidak Ada (T)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
  },
  conditionRequiresPhoto,
}
