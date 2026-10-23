import { Activity } from "lucide-react"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"
import type { ChecklistConfig } from "@/components/es-dashboard/shared-checklist-form"

export type HydrantCategory = {
  id: string
  title: string
  subtitle: string
  frequencyBadge: string
  frequencyTone: "sky" | "amber" | "indigo" | "orange"
  items: {
    id: string
    code: string
    label: string
    action: string
    hasVoltageInput?: boolean
  }[]
}

export const HYDRANT_CATEGORIES: HydrantCategory[] = [
  {
    id: "cat-1",
    title: "1. TEST HYDRANT INDICATOR",
    subtitle: "Pengecekan rutin setiap 1 minggu",
    frequencyBadge: "MINGGUAN",
    frequencyTone: "sky",
    items: [
      { id: "1.A", code: "1.A", label: "Aktifkan Main electrik main pump 2 detik", action: "Lakukan" },
      { id: "1.B", code: "1.B", label: "Aktifkan electrik Jockie pump 2 detik", action: "Lakukan" },
      { id: "1.C", code: "1.C", label: "Aktifkan Diesel pump 5 menit", action: "Lakukan" },
      { id: "1.D", code: "1.D", label: "Indicator pressure gauge", action: "CH" },
      { id: "1.E", code: "1.E", label: "Indikasi kebocoran", action: "CH" },
    ],
  },
  {
    id: "cat-2",
    title: "2. KONDISI PANEL",
    subtitle: "Pemeriksaan fisik panel pompa utama & jockey",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "2.A", code: "2.A", label: "Panel electrik Main pump luar dan dalam", action: "CH & CL" },
      { id: "2.B", code: "2.B", label: "Panel electrik Jockie pump luar dan dalam", action: "CH & CL" },
      { id: "2.C", code: "2.C", label: "Panel electrik Diesel pump luar dan dalam", action: "CH & CL" },
    ],
  },
  {
    id: "cat-3",
    title: "3. INDICATOR PADA PANEL",
    subtitle: "Pemeriksaan instrumen display & selector",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "3.A", code: "3.A", label: "Display panel", action: "CH" },
      { id: "3.B", code: "3.B", label: "Selector switch", action: "CH" },
      { id: "3.C", code: "3.C", label: "Pressure switch", action: "CH" },
      { id: "3.D", code: "3.D", label: "Tombol tombol", action: "CH" },
    ],
  },
  {
    id: "cat-4",
    title: "4. KABEL KONEKSI",
    subtitle: "Integritas instalasi kabel & sensor",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "4.A", code: "4.A", label: "Kabel incoming ke panel", action: "CH" },
      { id: "4.B", code: "4.B", label: "Kabel koneksi dalam panel", action: "CH" },
      { id: "4.C", code: "4.C", label: "Kabel koneksi ke electrik main motor pump", action: "CH" },
      { id: "4.D", code: "4.D", label: "Kabel koneksi ke electrik motor jockie pump", action: "CH" },
      { id: "4.E", code: "4.E", label: "Kabel koneksi ke diesel pump", action: "CH" },
      { id: "4.F", code: "4.F", label: "Kabel koneksi ke sensors", action: "CH" },
    ],
  },
  {
    id: "cat-5",
    title: "5. PANEL PADA MESIN DIESEL PUMP",
    subtitle: "Panel diesel, contactor, baterai starter & charger",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "5.A", code: "5.A", label: "Kondisi luar dan dalam panel", action: "CH & CL" },
      { id: "5.B", code: "5.B", label: "Indicator panel", action: "CH" },
      { id: "5.C", code: "5.C", label: "Tombol pada panel", action: "CH" },
      { id: "5.D", code: "5.D", label: "Selector switch pada panel", action: "CH" },
      { id: "5.E", code: "5.E", label: "Contactor", action: "CH" },
      { id: "5.F", code: "5.F", label: "Relays", action: "CH" },
      { id: "5.G", code: "5.G", label: "Kabel koneksi", action: "CH" },
      { id: "5.H", code: "5.H", label: "Charger battery alternator & electronic charging", action: "CH" },
      { id: "5.I", code: "5.I", label: "Volted battery 1", action: "CH & INSP", hasVoltageInput: true },
      { id: "5.J", code: "5.J", label: "Volted battery 2", action: "CH & INSP", hasVoltageInput: true },
      { id: "5.K", code: "5.K", label: "Kunci starter engine", action: "CH" },
    ],
  },
  {
    id: "cat-6",
    title: "6. KONDISI MESIN DIESEL PUMP",
    subtitle: "Pelumasan, filter udara, dan separator",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "6.A", code: "6.A", label: "Level oli", action: "CH" },
      { id: "6.B", code: "6.B", label: "Kondisi oli", action: "CH" },
      { id: "6.C", code: "6.C", label: "Filter udara", action: "CH" },
      { id: "6.D", code: "6.D", label: "Water separator", action: "CH" },
      { id: "6.E", code: "6.E", label: "Filter oli", action: "CH" },
    ],
  },
  {
    id: "cat-7",
    title: "7. PEMIPAAN",
    subtitle: "Pipa intake, discharge, dan saluran bypass",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "7.A", code: "7.A", label: "Pipa tekanan rendah / Intake", action: "CH" },
      { id: "7.B", code: "7.B", label: "Pipa tekanan tinggi / discharge", action: "CH" },
      { id: "7.C", code: "7.C", label: "Pipa bypass", action: "CH" },
      { id: "7.D", code: "7.D", label: "Pipa bypass drain / saluran buang", action: "CH" },
    ],
  },
  {
    id: "cat-8",
    title: "8. GATE VALVE",
    subtitle: "Katup pembagi & pembuangan",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "8.A", code: "8.A", label: "Gate valve tekanan rendah / Intake", action: "CH" },
      { id: "8.B", code: "8.B", label: "Gate valve tekanan tinggi / discharge", action: "CH" },
      { id: "8.C", code: "8.C", label: "Gate valve bypass", action: "CH" },
      { id: "8.D", code: "8.D", label: "Gate valve drain / pembuangan", action: "CH" },
    ],
  },
  {
    id: "cat-9",
    title: "9. POMPA - POMPA",
    subtitle: "Kondisi fisik pompa main, jockey, dan diesel",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "9.A", code: "9.A", label: "Main pump Centrifugal", action: "CH & CL" },
      { id: "9.B", code: "9.B", label: "Jockie pump multi impeler", action: "CH & CL" },
      { id: "9.C", code: "9.C", label: "Diesel pump centrifugal", action: "CH & CL" },
    ],
  },
  {
    id: "cat-10",
    title: "10. MOUNTING BODY PUMP",
    subtitle: "Pondasi dan baut pengikat unit pompa",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "10.A", code: "10.A", label: "Mounting body main Pump", action: "CH" },
      { id: "10.B", code: "10.B", label: "Mounting body Jockie Pump", action: "CH" },
      { id: "10.C", code: "10.C", label: "Mounting body Diesel pump", action: "CH" },
    ],
  },
  {
    id: "cat-11",
    title: "11. WATER RESERVOIR",
    subtitle: "Kapasitas air dan pipa tandon",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "11.A", code: "11.A", label: "Level air", action: "CH" },
      { id: "11.B", code: "11.B", label: "Saluran pipa inlet", action: "CH" },
      { id: "11.C", code: "11.C", label: "Saluran pipa outlet", action: "CH" },
      { id: "11.D", code: "11.D", label: "Saluran pipa bypass / Return", action: "CH" },
    ],
  },
  {
    id: "cat-12",
    title: "12. TEST TEKANAN HYDRANT ACTUAL",
    subtitle: "Pengujian semburan air dan tekanan aktual (setiap 6 bulan)",
    frequencyBadge: "6 BULANAN",
    frequencyTone: "orange",
    items: [
      { id: "12.A", code: "12.A", label: "Fungsi panel otomatis", action: "MS" },
      { id: "12.B", code: "12.B", label: "Pilar hydrant", action: "CH" },
      { id: "12.C", code: "12.C", label: "Selang flexible, Nozel dan open valve", action: "R" },
      { id: "12.D", code: "12.D", label: "Semburan tekanan air", action: "MS" },
      { id: "12.E", code: "12.E", label: "Electrik main pump aktif", action: "MS" },
      { id: "12.F", code: "12.F", label: "Electrik Jockie pump aktif", action: "MS" },
      { id: "12.G", code: "12.G", label: "Diesel pump aktif", action: "MS" },
      { id: "12.H", code: "12.H", label: "Indicator pressure gauge", action: "CH" },
      { id: "12.I", code: "12.I", label: "Turn off engine diesel pump after 15 second", action: "Lakukan" },
    ],
  },
]

export const FRM_TSM_006_CONFIG: ChecklistConfig = {
  formCode: "FRM_TSM_006",
  formName: "Checklist Hydrant",
  items: HYDRANT_CATEGORIES.flatMap((c) =>
    c.items.map((item) => ({
      id: item.id,
      label: item.label,
      icon: Activity,
    }))
  ),
  conditionOptions: ["BAIK", "RUSAK"],
  conditionLabels: {
    BAIK: "Baik (V)",
    RUSAK: "Rusak (X)",
    TIDAK_ADA: "Tidak Ada (T)",
    ADJUST_OR_ADD: "Adjust/Add (A)",
    CLEAN: "Clean (C)",
    REPAIR: "Repair (R)",
    URGENT: "Urgent (U)",
  },
  conditionRequiresPhoto,
}
