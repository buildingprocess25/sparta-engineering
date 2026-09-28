"use client"

import * as React from "react"
import Image from "next/image"
import {
  Activity,
  AlertCircle,
  BatteryCharging,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Droplet,
  Flame,
  Info,
  Loader2,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wrench,
  X,
  Zap,
} from "lucide-react"

import { CameraCaptureButton } from "@/components/es-dashboard/camera-capture-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTsm006FormProps = {
  reportCode: string
  areaCode: string
  areaName: string
  periodKey: string
  watermarkUserLabel: string
  watermarkUserRole: string
  formCode?: string
  isRepairMode?: boolean
  submitAction(input: {
    reportCode: string
    payload: ChecklistPayload
  }): Promise<{ ok: true; isSafe?: boolean } | { ok: false; errors: string[] }>
}

export type HydrantCategory = {
  id: string
  title: string
  subtitle: string
  frequencyBadge: string
  frequencyTone: "sky" | "amber" | "indigo"
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
    frequencyTone: "indigo",
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

const ALL_ITEMS = HYDRANT_CATEGORIES.flatMap((c) => c.items)

const FOLLOW_UP_OPTIONS = [
  {
    id: "SAT/FRM/TS/065_REV:00_161020",
    label: "Form Penggantian Spare Part (065)",
    badge: "065",
  },
  {
    id: "SAT/FRM/TSM/014_REV:000_060423",
    label: "Form Estimasi Biaya ME (014)",
    badge: "014",
  },
  {
    id: "REPAIR_TANPA_BIAYA",
    label: "Perbaikan Tanpa Biaya (Internal)",
    badge: "Internal",
  },
]

type ItemState = {
  condition: ChecklistCondition
  photos: ChecklistPhoto[]
  notes: string
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string | null
  value?: string
  uploading?: boolean
}

export function FrmTsm006Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = "FRM_TSM_006",
  isRepairMode = false,
  submitAction,
}: FrmTsm006FormProps) {
  const [jenisHydrant, setJenisHydrant] = React.useState("IHB - OHB")
  const [jenisPerawatan, setJenisPerawatan] = React.useState("General")
  const [generalNotes, setGeneralNotes] = React.useState("")

  const [itemStates, setItemStates] = React.useState<Record<string, ItemState>>({})
  const [battery1Volt, setBattery1Volt] = React.useState("")
  const [battery2Volt, setBattery2Volt] = React.useState("")

  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({})
  const [uploadNotice, setUploadNotice] = React.useState<{
    tone: "loading" | "success" | "error"
    message: string
  } | null>(null)
  const [errors, setErrors] = React.useState<string[]>([])
  const [isPending, startTransition] = React.useTransition()

  // Track progress
  const totalItemsCount = ALL_ITEMS.length
  const evaluatedCount = Object.keys(itemStates).filter(
    (k) => itemStates[k]?.condition !== undefined
  ).length
  const damagedCount = Object.values(itemStates).filter(
    (s) => s?.condition === "RUSAK"
  ).length

  function updateItem(itemId: string, patch: Partial<ItemState>) {
    setItemStates((prev) => {
      const current = prev[itemId] || {
        condition: "BAIK",
        photos: [],
        notes: "",
        handler: "BES" as const,
        repairForm: "SAT/FRM/TS/065_REV:00_161020",
      }

      return {
        ...prev,
        [itemId]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  function setCondition(itemId: string, condition: ChecklistCondition) {
    updateItem(itemId, { condition })
  }

  async function uploadPhoto(itemId: string, file: File) {
    updateItem(itemId, { uploading: true })
    setUploadNotice({ tone: "loading", message: "Sedang mengunggah foto bukti..." })
    setErrors([])

    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set(
        "context",
        JSON.stringify({
          kind: "CHECKLIST_ITEM",
          reportCode,
          formCode,
          itemId,
          sequence: (itemStates[itemId]?.photos?.length || 0) + 1,
        })
      )

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok || !payload?.ok || !payload?.photo) {
        throw new Error(payload?.error || "Gagal mengupload foto")
      }

      setItemStates((prev) => {
        const current = prev[itemId] || {
          condition: "RUSAK",
          photos: [],
          notes: "",
          handler: "BES" as const,
          repairForm: "SAT/FRM/TS/065_REV:00_161020",
        }
        return {
          ...prev,
          [itemId]: {
            ...current,
            photos: [...current.photos, payload.photo],
            uploading: false,
          },
        }
      })
      setUploadNotice({ tone: "success", message: "Foto berhasil diunggah." })
      setTimeout(() => setUploadNotice(null), 3000)
    } catch (err) {
      updateItem(itemId, { uploading: false })
      setUploadNotice({
        tone: "error",
        message: err instanceof Error ? err.message : "Gagal mengunggah foto.",
      })
      setTimeout(() => setUploadNotice(null), 4000)
    }
  }

  function handleRemovePhoto(itemId: string, photoIndex: number) {
    setItemStates((prev) => {
      const current = prev[itemId]
      if (!current) return prev

      return {
        ...prev,
        [itemId]: {
          ...current,
          photos: current.photos.filter((_, idx) => idx !== photoIndex),
        },
      }
    })
  }

  function toggleCategory(catId: string) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  function buildPayload(): ChecklistPayload {
    return {
      formCode,
      formName: "Checklist Hydrant",
      areaCode,
      period: "MONTHLY",
      periodKey,
      generalNotes,
      jenisHydrant,
      jenisPerawatan,
      items: ALL_ITEMS.map((item) => {
        const state = itemStates[item.id]
        const fallbackCondition: ChecklistCondition = isRepairMode ? "BAIK" : "BAIK"
        const cond = state?.condition || fallbackCondition

        let itemValue: string | undefined = undefined
        if (item.id === "5.I") itemValue = battery1Volt
        if (item.id === "5.J") itemValue = battery2Volt

        return {
          id: item.id,
          label: `${item.code} ${item.label}`,
          condition: cond,
          photos: state?.photos || [],
          value: itemValue,
          notes:
            state?.notes?.trim() ||
            (cond === "RUSAK"
              ? state?.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
                ? "Form Estimasi Biaya ME (014)"
                : state?.repairForm === "REPAIR_TANPA_BIAYA"
                ? "Repair Tanpa Biaya"
                : "Form Penggantian Spare Part (065)"
              : ""),
          handler: state?.handler,
          repairForm:
            state?.repairForm === "REPAIR_TANPA_BIAYA"
              ? undefined
              : state?.repairForm || undefined,
          repairFormName:
            state?.repairForm === "SAT/FRM/TS/065_REV:00_161020"
              ? "Form Penggantian Spare Part (065)"
              : state?.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
              ? "Form Estimasi Biaya ME (014)"
              : state?.repairForm === "REPAIR_TANPA_BIAYA"
              ? "Repair Tanpa Biaya"
              : undefined,
        }
      }),
    }
  }

  function handleSubmit() {
    setErrors([])

    if (!isRepairMode && evaluatedCount < totalItemsCount) {
      setErrors([
        `Seluruh item wajib dievaluasi (${evaluatedCount} dari ${totalItemsCount} terisi). Silakan cek kategori yang belum terisi.`,
      ])
      return
    }

    const payload = buildPayload()
    const validation = validateChecklistPayload(payload)

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    startTransition(async () => {
      try {
        const result = await submitAction({ reportCode, payload })
        if (!result.ok) {
          setErrors(result.errors)
          return
        }

        const needsFollowUp = payload.items.some(
          (item) =>
            item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
            item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
        )

        if (needsFollowUp) {
          window.location.assign(`/dashboard/reports/${reportCode}/follow-up`)
        } else {
          window.location.assign("/dashboard/reports")
        }
      } catch (err) {
        setErrors([err instanceof Error ? err.message : "Terjadi kesalahan saat submit."])
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Toast Notification */}
      {uploadNotice ? (
        <div
          className={cn(
            "fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.16)]",
            uploadNotice.tone === "loading" && "border-[#dedede] text-[#111111]",
            uploadNotice.tone === "success" && "border-[#c9ead2] bg-[#f0fbf3] text-[#1f6b35]",
            uploadNotice.tone === "error" && "border-[#ffc9a3] bg-[#fff4ec] text-[#8a3d00]"
          )}
          role="status"
        >
          {uploadNotice.tone === "loading" ? (
            <Loader2 className="size-4 animate-spin text-[#ff8a2a]" />
          ) : uploadNotice.tone === "success" ? (
            <Check className="size-4 text-emerald-600" />
          ) : (
            <X className="size-4 text-rose-600" />
          )}
          <span>{uploadNotice.message}</span>
        </div>
      ) : null}

      {/* CARD 1: Identitas Unit Hydrant & Lokasi */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-[#f0eee9] pb-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
            <Droplet className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111111] sm:text-lg">
              Identitas Unit Hydrant & Lokasi
            </h2>
            <p className="text-xs text-[#707784]">
              {areaName} • SAT/FRM/TSM/006_Rev_000_261022
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Jenis Hydrant <span className="text-[#ff8a2a]">*</span>
            </label>
            <Input
              placeholder="mis. IHB - OHB"
              value={jenisHydrant}
              onChange={(e) => setJenisHydrant(e.target.value)}
              className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm font-semibold focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Jenis Perawatan <span className="text-[#ff8a2a]">*</span>
            </label>
            <Input
              placeholder="mis. General / Rutin"
              value={jenisPerawatan}
              onChange={(e) => setJenisPerawatan(e.target.value)}
              className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Periode / Tahun
            </label>
            <div className="flex h-10 items-center rounded-lg border border-[#e6e2de] bg-[#fbfbfa] px-3 text-sm font-semibold text-[#111111]">
              {periodKey}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#707784]">
          <span className="rounded-md bg-[#f0eee9] px-2 py-0.5 font-medium text-[#555]">
            Reff: SAT/KEB/TSM/002 Kebijakan Perawatan Hydrant
          </span>
        </div>
      </section>

      {/* Progress Floating Summary */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#707784]">Status Evaluasi Item</span>
          <span className="text-[#111111]">
            {evaluatedCount} / {totalItemsCount} Dievaluasi
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0eee9]">
          <div
            className="h-full bg-[#ff8a2a] transition-all duration-300"
            style={{ width: `${(evaluatedCount / totalItemsCount) * 100}%` }}
          />
        </div>
        {damagedCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <AlertCircle className="size-3.5" />
            <span>{damagedCount} item dilaporkan rusak (wajib bukti foto & tindak lanjut)</span>
          </div>
        )}
      </section>

      {/* 12 KATEGORI CHECKLIST */}
      {HYDRANT_CATEGORIES.map((cat) => {
        const isCollapsed = collapsedCategories[cat.id]
        const catItemsEvaluated = cat.items.filter((item) => itemStates[item.id]?.condition).length
        const catItemsDamaged = cat.items.filter(
          (item) => itemStates[item.id]?.condition === "RUSAK"
        ).length

        return (
          <section
            key={cat.id}
            className="rounded-2xl border border-[#e6e2de] bg-white shadow-[0_4px_16px_rgba(17,17,17,0.04)] overflow-hidden"
          >
            {/* Header Kategori */}
            <button
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className="flex w-full items-center justify-between border-b border-[#f0eee9] p-4 text-left hover:bg-[#fafaf9] transition-colors sm:p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
                  {cat.frequencyTone === "sky" ? (
                    <Activity className="size-4.5" />
                  ) : cat.frequencyTone === "indigo" ? (
                    <Flame className="size-4.5" />
                  ) : (
                    <Wrench className="size-4.5" />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#111111] sm:text-base">
                      {cat.title}
                    </h3>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        cat.frequencyTone === "sky" && "bg-sky-100 text-sky-700",
                        cat.frequencyTone === "amber" && "bg-amber-100 text-amber-700",
                        cat.frequencyTone === "indigo" && "bg-indigo-100 text-indigo-700"
                      )}
                    >
                      {cat.frequencyBadge}
                    </span>
                  </div>
                  <p className="text-xs text-[#707784]">{cat.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#707784]">
                  {catItemsEvaluated}/{cat.items.length}
                </span>
                {catItemsDamaged > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">
                    {catItemsDamaged}
                  </span>
                )}
                {isCollapsed ? (
                  <ChevronDown className="size-5 text-[#707784]" />
                ) : (
                  <ChevronUp className="size-5 text-[#707784]" />
                )}
              </div>
            </button>

            {/* List Item dalam Kategori */}
            {!isCollapsed && (
              <div className="divide-y divide-[#f5f4f2] p-2 sm:p-3">
                {cat.items.map((item) => {
                  const state = itemStates[item.id]
                  const isDamaged = state?.condition === "RUSAK"
                  const isGood = state?.condition === "BAIK"

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl p-3 transition-colors",
                        isDamaged ? "bg-[#fffafa]" : "hover:bg-[#fafaf9]"
                      )}
                    >
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111111]">
                              {item.code}
                            </span>
                            <span className="text-xs font-semibold text-[#111111]">
                              {item.label}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="rounded bg-[#f0eee9] px-1.5 py-0.5 text-[10px] font-semibold text-[#666]">
                              Tindakan: {item.action}
                            </span>
                          </div>
                        </div>

                        {/* Opsi Kondisi (Baik / Rusak) */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCondition(item.id, "BAIK")}
                            className={cn(
                              "flex h-9 min-w-20 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all",
                              isGood
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                : "border-[#e6e2de] bg-white text-[#707784] hover:bg-[#f5f5f3]"
                            )}
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>Baik</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCondition(item.id, "RUSAK")}
                            className={cn(
                              "flex h-9 min-w-20 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all",
                              isDamaged
                                ? "border-red-500 bg-red-50 text-red-600 shadow-sm"
                                : "border-[#e6e2de] bg-white text-[#707784] hover:bg-[#f5f5f3]"
                            )}
                          >
                            <AlertCircle className="size-3.5" />
                            <span>Rusak</span>
                          </button>
                        </div>
                      </div>

                      {/* Khusus Item 5.I & 5.J (Input Nilai Tegangan Baterai 1 & 2) */}
                      {item.hasVoltageInput && (
                        <div className="mt-2.5 rounded-lg border border-[#f0eee9] bg-white p-2.5">
                          <label className="mb-1 block text-[11px] font-bold text-[#111111]">
                            Hasil Ukur Tegangan (Volt)
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="mis. 13.2"
                              value={item.id === "5.I" ? battery1Volt : battery2Volt}
                              onChange={(e) => {
                                if (item.id === "5.I") setBattery1Volt(e.target.value)
                                if (item.id === "5.J") setBattery2Volt(e.target.value)
                              }}
                              className="h-8 max-w-[140px] border-[#e6e2de] text-xs font-bold"
                            />
                            <span className="text-xs font-semibold text-[#707784]">Volt DC</span>
                          </div>
                        </div>
                      )}

                      {/* Detail Temuan Kerusakan Jika Rusak */}
                      {isDamaged && (
                        <div className="mt-3.5 space-y-3 rounded-xl border border-red-200 bg-white p-3 shadow-xs">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                            <ShieldAlert className="size-4" />
                            <span>Detail Temuan Kerusakan & Tindak Lanjut</span>
                          </div>

                          {/* Foto Bukti Temuan */}
                          <div>
                            <label className="mb-1 block text-xs font-bold text-[#111111]">
                              Foto Bukti Temuan <span className="text-rose-600">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {state.photos.map((photo, pIdx) => (
                                <div
                                  key={photo.fileId}
                                  className="group relative size-20 overflow-hidden rounded-xl border border-[#dedede]"
                                >
                                  <Image
                                    src={photo.url}
                                    alt={`Foto bukti temuan ${item.code}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(item.id, pIdx)}
                                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              ))}

                                <CameraCaptureButton
                                  disabled={state.uploading}
                                  uploading={state.uploading}
                                  watermarkLines={buildChecklistPhotoWatermarkLines({
                                    areaName: `${areaName} (Hydrant - ${item.code})`,
                                    userLabel: watermarkUserLabel,
                                    userRole: watermarkUserRole,
                                  })}
                                  onCapture={(file) => void uploadPhoto(item.id, file)}
                                />
                              </div>
                            </div>

                            {/* Penanggung Jawab (Akan Dihandle) */}
                            <div>
                              <label className="mb-1 block text-xs font-bold text-[#111111]">
                                Akan Dihandle Oleh <span className="text-rose-600">*</span>
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { handler: "BES" })}
                                  className={cn(
                                    "rounded-xl border py-2 text-xs font-bold transition-all",
                                    state.handler === "BES"
                                      ? "border-[#ff8a2a] bg-[#fff0e3] text-[#c75f00]"
                                      : "border-[#e6e2de] bg-[#fbfbfa] text-[#707784] hover:bg-[#f5f5f3]"
                                  )}
                                >
                                  BES (Internal)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { handler: "EKSTERNAL" })}
                                  className={cn(
                                    "rounded-xl border py-2 text-xs font-bold transition-all",
                                    state.handler === "EKSTERNAL"
                                      ? "border-[#ff8a2a] bg-[#fff0e3] text-[#c75f00]"
                                      : "border-[#e6e2de] bg-[#fbfbfa] text-[#707784] hover:bg-[#f5f5f3]"
                                  )}
                                >
                                  Eksternal / Vendor
                                </button>
                              </div>
                            </div>

                            {/* Form Tindak Lanjut */}
                            <div>
                              <label className="mb-1 block text-xs font-bold text-[#111111]">
                                Tindak Lanjut <span className="text-rose-600">*</span>
                              </label>
                              <Select
                                value={state.repairForm || "SAT/FRM/TS/065_REV:00_161020"}
                                onValueChange={(val) => updateItem(item.id, { repairForm: val || undefined })}
                              >
                              <SelectTrigger className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-xs font-semibold">
                                <SelectValue placeholder="Pilih alur tindak lanjut..." />
                              </SelectTrigger>
                              <SelectContent>
                                {FOLLOW_UP_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.id} value={opt.id} className="text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="rounded bg-[#f0eee9] px-1.5 py-0.5 text-[10px] font-bold text-[#555]">
                                        {opt.badge}
                                      </span>
                                      <span>{opt.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}

      {/* CARD: Catatan dan Keterangan Pelaksanaan */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <label className="mb-2 block text-xs font-bold text-[#111111]">
          Catatan & Keterangan Pelaksanaan
        </label>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan teknis atau rangkuman hasil pengujian sistem hydrant..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className="w-full rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-xs leading-relaxed text-[#111111] placeholder:text-[#999] focus-visible:border-[#ff8a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/20"
        />
      </section>

      {/* CARD: Identitas Pelaksana & Verifikasi */}
      <section className="rounded-2xl border border-[#e6e2de] bg-[#fbfbfa] p-4 text-xs text-[#707784] sm:p-5">
        <div className="flex items-center gap-2 font-bold text-[#111111]">
          <Info className="size-4 text-[#ff8a2a]" />
          <span>Verifikasi & Pelaksana Inspeksi</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e6e2de] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Dibuat oleh (ES)</span>
            <span className="font-bold text-[#111111]">{watermarkUserLabel}</span>
          </div>
          <div className="rounded-xl border border-[#e6e2de] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Diperiksa oleh</span>
            <span className="font-bold text-[#555]">Branch Engineering Coord</span>
          </div>
          <div className="rounded-xl border border-[#e6e2de] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Diketahui oleh</span>
            <span className="font-bold text-[#555]">Branch B&M Mgr</span>
          </div>
        </div>
      </section>

      {/* Error Notices */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <div className="mb-1 flex items-center gap-1.5 font-bold">
            <AlertCircle className="size-4 text-rose-600" />
            <span>Terdapat kendala sebelum submit:</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="h-12 w-full rounded-2xl bg-[#ff8a2a] text-sm font-bold text-white shadow-lg shadow-[#ff8a2a]/25 transition-all hover:bg-[#e67519] disabled:opacity-50"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Menyimpan Laporan Hydrant...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="size-4" />
              <span>Simpan & Kirim Checklist Hydrant</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
