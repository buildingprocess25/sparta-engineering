import { Activity } from "lucide-react"
import { conditionRequiresPhoto } from "@/lib/checklists/photo-state"
import type { ChecklistConfig } from "@/components/es-dashboard/shared-checklist-form"

export type PLTSCategory = {
  id: string
  title: string
  subtitle: string
  frequencyBadge: string
  frequencyTone: "amber" | "sky"
  items: {
    id: string
    code: string
    label: string
    action: string
    hint?: string
    hasVoltageInput?: boolean
  }[]
}

export const PLTS_CATEGORIES: PLTSCategory[] = [
  {
    id: "cat-1",
    title: "1. PANEL SURYA ATAP",
    subtitle: "Pemeriksaan fisik panel surya di atap",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "1.A", code: "1.A", label: "Cek Permukaan panel", action: "CH" },
      { id: "1.B", code: "1.B", label: "Cek Kabel DC", action: "CH" },
      { id: "1.C", code: "1.C", label: "Cek Tray kabel DC", action: "CH" },
      { id: "1.D", code: "1.D", label: "Cek Konektor sambungan kabel DC", action: "CH" },
      { id: "1.E", code: "1.E", label: "Cek kondisi sensor weather report Rainwaise", action: "CH" },
      { id: "1.F", code: "1.F", label: "Cek dan Pastikan sensor terkoneksi dengan baik", action: "CH" },
      { id: "1.G", code: "1.G", label: "Cek dan pastikan walkway aman dan kuat", action: "CH" },
      { id: "1.H", code: "1.H", label: "Cek dan pastikan water taping atau kran air berfungsi", action: "CH" },
    ],
  },
  {
    id: "cat-2",
    title: "2. PANEL DC PROTECTION",
    subtitle: "Pemeriksaan panel DC dan tegangan string",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "2.A", code: "2.A", label: "Cek Input konektor string kabel", action: "CH" },
      { id: "2.B", code: "2.B", label: "Ukur tegangan listrik tiap string", action: "DO IT", hint: "Range 700 s/d 1000V DC", hasVoltageInput: true },
      { id: "2.C", code: "2.C", label: "Cek semua fuse", action: "CH" },
      { id: "2.D", code: "2.D", label: "Cek konektor dan kabel output panel DC", action: "CH" },
      { id: "2.E", code: "2.E", label: "Cek semua arester masih berfungsi dengan baik", action: "CH" },
    ],
  },
  {
    id: "cat-3",
    title: "3. PANEL INVERTER",
    subtitle: "Pemeriksaan inverter, fan, dan koneksi output",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "3.A", code: "3.A", label: "Cek Input kabel inverter dari output panel DC", action: "CH" },
      { id: "3.B", code: "3.B", label: "Bersihkan sirkulasi udara pada inverter", action: "CL" },
      { id: "3.C", code: "3.C", label: "Cek dan pastikan cooling fan berfungsi", action: "CH" },
      { id: "3.D", code: "3.D", label: "Cek dan pastikan bracket inverter kuat menempel", action: "CH" },
      { id: "3.E", code: "3.E", label: "Cek kabel koneksi pada tiap output inverter", action: "CH" },
    ],
  },
  {
    id: "cat-4",
    title: "4. PANEL COMBINER",
    subtitle: "Pemeriksaan panel combiner, busbar, MCCB, MCB, dan energy meter",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "4.A", code: "4.A", label: "Bersihkan luar dan dalam panel Combiner", action: "CL" },
      { id: "4.B", code: "4.B", label: "Ukur tegangan tiap incoming panel Combiner", action: "DO IT", hint: "Tiap phase +/- : 220V AC", hasVoltageInput: true },
      { id: "4.C", code: "4.C", label: "Pastikan sambungan antar busbar kuat", action: "CH" },
      { id: "4.D", code: "4.D", label: "Cek dan pastikan power meter berfungsi dengan benar", action: "CH" },
      { id: "4.E", code: "4.E", label: "Cek semua kondisi MCCB dan MCB", action: "CH" },
      { id: "4.F", code: "4.F", label: "Cek dan pastikan energy meter pada panel LVMDP berfungsi dengan benar", action: "CH" },
    ],
  },
  {
    id: "cat-5",
    title: "5. PANEL COMMUNICATION & MODEM WI-FI",
    subtitle: "Pemeriksaan wiring komunikasi dan modem Wi-Fi",
    frequencyBadge: "BULANAN",
    frequencyTone: "amber",
    items: [
      { id: "5.A", code: "5.A", label: "Cek semua wiring pada panel communication", action: "CH" },
      { id: "5.B", code: "5.B", label: "Cek dan pastikan modem Wifi berfungsi dengan benar", action: "CH" },
    ],
  },
  {
    id: "cat-6",
    title: "6. PEMBERSIHAN PANEL SURYA",
    subtitle: "Pembersihan berkala permukaan cell panel surya",
    frequencyBadge: "3 BULANAN",
    frequencyTone: "sky",
    items: [
      { id: "6.A", code: "6.A", label: "Bersihkan permukaan tiap cell panel surya semua", action: "CL" },
      { id: "6.B", code: "6.B", label: "Pastikan tidak ada plag dan jamur yang menempel", action: "CH" },
      { id: "6.C", code: "6.C", label: "Pastikan tidak ada sisa air setelah proses pembersihan", action: "CH" },
      { id: "6.D", code: "6.D", label: "Pastikan permukaan panel kering setelah pembersihan", action: "CH" },
    ],
  },
  {
    id: "cat-7",
    title: "7. JALUR KABEL & TRAY METAL KABEL",
    subtitle: "Pemeriksaan proteksi kabel DC dari sinar matahari dan kondisi tray",
    frequencyBadge: "3 BULANAN",
    frequencyTone: "sky",
    items: [
      { id: "7.A", code: "7.A", label: "Pastikan semua kabel DC dan konektor terlindungi", action: "CH" },
      { id: "7.B", code: "7.B", label: "Pastikan semua kabel terlindungi dari sinar matahari", action: "CH" },
      { id: "7.C", code: "7.C", label: "Pastikan tray kabel tidak ada yang terbuka dan aman", action: "CH" },
    ],
  },
]

export const FRM_TSM_007_CONFIG: ChecklistConfig = {
  formCode: "FRM_TSM_007",
  formName: "Checklist PLTS",
  items: PLTS_CATEGORIES.flatMap((c) =>
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
