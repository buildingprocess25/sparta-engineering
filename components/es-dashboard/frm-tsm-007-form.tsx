"use client"

import * as React from "react"
import Image from "next/image"
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Send,
  Sun,
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
} from "@/components/ui/select"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type JenisPerawatanPLTSOption = "BULANAN" | "TIGA_BULANAN"

export type FrmTsm007FormProps = {
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

const FOLLOW_UP_OPTIONS = [
  { id: "SAT/FRM/TS/065_REV:00_161020", label: "Form Penggantian Spare Part (065)" },
  { id: "SAT/FRM/TSM/014_REV:000_060423", label: "Form Estimasi Biaya ME (014)" },
  { id: "REPAIR_TANPA_BIAYA", label: "Perbaikan Tanpa Biaya (Internal)" },
]

type ItemState = {
  condition: ChecklistCondition
  photos: ChecklistPhoto[]
  notes: string
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string | null
  voltageValue?: string
  uploading?: boolean
}

export function FrmTsm007Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = "FRM_TSM_007",
  isRepairMode = false,
  submitAction,
}: FrmTsm007FormProps) {
  const currentYear = new Date().getFullYear()
  const [daya, setDaya] = React.useState("")
  const [tahun, setTahun] = React.useState(String(currentYear))
  const [jenisPerawatan, setJenisPerawatan] = React.useState<JenisPerawatanPLTSOption | "">("")
  const [generalNotes, setGeneralNotes] = React.useState("")
  const [itemStates, setItemStates] = React.useState<Record<string, ItemState>>({})
  const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({})
  const [uploadNotice, setUploadNotice] = React.useState<{ tone: "loading" | "success" | "error"; message: string } | null>(null)
  const [errors, setErrors] = React.useState<string[]>([])
  const [isPending, startTransition] = React.useTransition()

  const activeCategories = React.useMemo(() => {
    if (!jenisPerawatan) return []
    if (jenisPerawatan === "BULANAN") return PLTS_CATEGORIES.filter((c) => ["cat-1","cat-2","cat-3","cat-4","cat-5"].includes(c.id))
    if (jenisPerawatan === "TIGA_BULANAN") return PLTS_CATEGORIES.filter((c) => ["cat-6","cat-7"].includes(c.id))
    return []
  }, [jenisPerawatan])

  const activeItems = React.useMemo(() => activeCategories.flatMap((c) => c.items), [activeCategories])
  const totalItemsCount = activeItems.length
  const evaluatedCount = activeItems.filter((item) => itemStates[item.id]?.condition !== undefined).length
  const damagedCount = activeItems.filter((item) => itemStates[item.id]?.condition === "RUSAK").length

  function updateItem(itemId: string, patch: Partial<ItemState>) {
    setItemStates((prev) => {
      const current = prev[itemId] || { condition: "BAIK" as ChecklistCondition, photos: [], notes: "", handler: "BES" as const, repairForm: "SAT/FRM/TS/065_REV:00_161020" }
      return { ...prev, [itemId]: { ...current, ...patch } }
    })
  }

  async function uploadPhoto(itemId: string, file: File) {
    updateItem(itemId, { uploading: true })
    setUploadNotice({ tone: "loading", message: "Sedang mengunggah foto bukti..." })
    setErrors([])
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("context", JSON.stringify({ kind: "CHECKLIST_ITEM", reportCode, formCode, itemId, sequence: (itemStates[itemId]?.photos?.length || 0) + 1 }))
      const response = await fetch("/api/photos/upload", { method: "POST", body: formData })
      const payload = await response.json()
      if (!response.ok || !payload?.ok || !payload?.photo) throw new Error(payload?.error || "Gagal mengupload foto")
      setItemStates((prev) => {
        const current = prev[itemId] || { condition: "RUSAK" as ChecklistCondition, photos: [], notes: "", handler: "BES" as const, repairForm: "SAT/FRM/TS/065_REV:00_161020" }
        return { ...prev, [itemId]: { ...current, photos: [...current.photos, payload.photo], uploading: false } }
      })
      setUploadNotice({ tone: "success", message: "Foto berhasil diunggah." })
      setTimeout(() => setUploadNotice(null), 3000)
    } catch (err) {
      updateItem(itemId, { uploading: false })
      setUploadNotice({ tone: "error", message: err instanceof Error ? err.message : "Gagal mengunggah foto." })
      setTimeout(() => setUploadNotice(null), 4000)
    }
  }

  function handleRemovePhoto(itemId: string, photoIndex: number) {
    setItemStates((prev) => {
      const current = prev[itemId]
      if (!current) return prev
      return { ...prev, [itemId]: { ...current, photos: current.photos.filter((_, idx) => idx !== photoIndex) } }
    })
  }

  function toggleCategory(catId: string) {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  function buildPayload(): ChecklistPayload {
    return {
      formCode,
      formName: "Checklist Pembangkit Listrik Tenaga Surya (PLTS)",
      areaCode,
      period: "MONTHLY",
      periodKey,
      generalNotes,
      dayaPLTS: daya,
      tahunPLTS: tahun,
      jenisPerawatan: jenisPerawatan || undefined,
      subPeriod: jenisPerawatan || undefined,
      subPeriodLabel: jenisPerawatan === "BULANAN" ? "1 Bulanan" : "3 Bulanan",
      items: activeItems.map((item) => {
        const state = itemStates[item.id]
        const cond = state?.condition || ("BAIK" as ChecklistCondition)
        return {
          id: item.id,
          label: `${item.code} ${item.label}`,
          condition: cond,
          photos: state?.photos || [],
          value: item.hasVoltageInput ? state?.voltageValue : undefined,
          notes: state?.notes?.trim() || (cond === "RUSAK" ? state?.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ? "Form Estimasi Biaya ME (014)" : state?.repairForm === "REPAIR_TANPA_BIAYA" ? "Repair Tanpa Biaya" : "Form Penggantian Spare Part (065)" : ""),
          handler: state?.handler,
          repairForm: state?.repairForm === "REPAIR_TANPA_BIAYA" ? undefined : state?.repairForm || undefined,
          repairFormName: state?.repairForm === "SAT/FRM/TS/065_REV:00_161020" ? "Form Penggantian Spare Part (065)" : state?.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ? "Form Estimasi Biaya ME (014)" : state?.repairForm === "REPAIR_TANPA_BIAYA" ? "Repair Tanpa Biaya" : undefined,
        }
      }),
    }
  }

  function handleSubmit() {
    setErrors([])
    if (!jenisPerawatan) { setErrors(["Silakan pilih Jenis Perawatan terlebih dahulu."]); return }
    if (!isRepairMode && evaluatedCount < totalItemsCount) { setErrors([`Seluruh item wajib dievaluasi (${evaluatedCount} dari ${totalItemsCount} terisi).`]); return }
    const payload = buildPayload()
    const validation = validateChecklistPayload(payload)
    if (!validation.valid) { setErrors(validation.errors); return }
    startTransition(async () => {
      try {
        const result = await submitAction({ reportCode, payload })
        if (!result.ok) { setErrors(result.errors); return }
        const needsFollowUp = payload.items.some((item) => item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" || item.repairForm === "SAT/FRM/TS/065_REV:00_161020")
        if (needsFollowUp) { window.location.assign(`/dashboard/reports/${reportCode}/follow-up`) } else { window.location.assign("/dashboard/reports") }
      } catch (err) { setErrors([err instanceof Error ? err.message : "Terjadi kesalahan saat submit."]) }
    })
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {uploadNotice ? (
        <div className={cn("fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.16)]", uploadNotice.tone === "loading" && "border-[#dedede] text-[#111111]", uploadNotice.tone === "success" && "border-[#c9ead2] bg-[#f0fbf3] text-[#1f6b35]", uploadNotice.tone === "error" && "border-[#ffc9a3] bg-[#fff4ec] text-[#8a3d00]")} role="status">
          {uploadNotice.tone === "loading" ? <Loader2 className="size-4 animate-spin text-[#e6a800]" /> : uploadNotice.tone === "success" ? <Check className="size-4 text-emerald-600" /> : <X className="size-4 text-rose-600" />}
          <span>{uploadNotice.message}</span>
        </div>
      ) : null}

      {/* CARD: Identitas Unit PLTS */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-[#f0eee9] pb-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff7e0] text-[#e6a800]">
            <Sun className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111111] sm:text-lg">Identitas Unit PLTS &amp; Lokasi</h2>
            <p className="text-xs text-[#707784]">{areaName} • SAT/FRM/TSM/007_Rev_000_111122</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">Daya Total PLTS <span className="text-[#e6a800]">*</span></label>
            <div className="flex items-center gap-2">
              <Input placeholder="mis. 198" value={daya} onChange={(e) => setDaya(e.target.value)} className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm font-semibold focus-visible:border-[#e6a800] focus-visible:ring-[#e6a800]/20" />
              <span className="shrink-0 text-xs font-semibold text-[#707784]">KWp</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">Tahun</label>
            <Input placeholder={String(currentYear)} value={tahun} onChange={(e) => setTahun(e.target.value)} className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm font-semibold focus-visible:border-[#e6a800] focus-visible:ring-[#e6a800]/20" />
          </div>
        </div>

        <div className="mt-3.5">
          <label className="mb-1.5 block text-xs font-bold text-[#111111]">Jenis Perawatan <span className="text-[#e6a800]">*</span></label>
          <Select value={jenisPerawatan} onValueChange={(val) => setJenisPerawatan(val as JenisPerawatanPLTSOption)}>
            <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#e6a800] focus:ring-offset-0">
              <span className={cn("flex-1 text-left truncate", !jenisPerawatan && "text-[#707784]")}>
                {jenisPerawatan === "BULANAN" ? "1 (satu) Bulanan" : jenisPerawatan === "TIGA_BULANAN" ? "3 (tiga) Bulanan" : "-- Pilih Jenis Perawatan --"}
              </span>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="rounded-xl border-[#dedede] bg-white shadow-lg">
              <SelectItem value="BULANAN" className="text-[#111111] hover:bg-[#fffbeb] focus:bg-[#fffbeb] focus:text-[#b45309] data-[state=checked]:bg-[#fffbeb] data-[state=checked]:text-[#b45309] font-medium py-2.5 cursor-pointer text-xs">1 (satu) Bulanan</SelectItem>
              <SelectItem value="TIGA_BULANAN" className="text-[#111111] hover:bg-[#fffbeb] focus:bg-[#fffbeb] focus:text-[#b45309] data-[state=checked]:bg-[#fffbeb] data-[state=checked]:text-[#b45309] font-medium py-2.5 cursor-pointer text-xs">3 (tiga) Bulanan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {jenisPerawatan === "BULANAN" && (
          <div className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3.5">
            <div className="flex items-center gap-2 font-bold text-[#111111] text-xs"><Calendar className="size-4 text-amber-600" /><span>Pemeriksaan 1 Bulanan</span></div>
            <p className="mt-1 text-[11px] text-[#666]">Mencakup: Panel Surya Atap, Panel DC Protection, Panel Inverter, Panel Combiner, Panel Communication &amp; Modem Wi-Fi (Kategori 1–5).</p>
          </div>
        )}
        {jenisPerawatan === "TIGA_BULANAN" && (
          <div className="mt-4 rounded-xl border border-sky-200/70 bg-sky-50/40 p-3.5">
            <div className="flex items-center gap-2 font-bold text-[#111111] text-xs"><Calendar className="size-4 text-sky-600" /><span>Pemeriksaan 3 Bulanan</span></div>
            <p className="mt-1 text-[11px] text-[#666]">Mencakup: Pembersihan Panel Surya dan Jalur Kabel &amp; Tray Metal Kabel (Kategori 6–7).</p>
          </div>
        )}

        <div className="mt-3.5 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-md bg-[#f0eee9] px-2 py-0.5 font-medium text-[#555]">Reff: SAT/KEB/TSM/003 Kebijakan Perawatan PLTS di HO/Branch/Depo</span>
        </div>
      </section>

      {!jenisPerawatan ? (
        <section className="rounded-2xl border border-dashed border-[#dcd7d2] bg-[#fbfbfa] p-8 text-center sm:p-10 shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#fff7e0] text-[#e6a800]"><Sun className="size-6" /></div>
          <h3 className="mt-3 text-base font-bold text-[#111111]">Checklist PLTS Siap Digunakan</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[#707784]">Silakan pilih <strong>Jenis Perawatan</strong> di atas (1 Bulanan atau 3 Bulanan) untuk menampilkan daftar item checklist.</p>
        </section>
      ) : (
        <>
          {/* Progress */}
          <section className="rounded-2xl border border-[#e6e2de] bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#707784]">Status Evaluasi Item</span>
              <span className="text-[#111111]">{evaluatedCount} / {totalItemsCount} Dievaluasi</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f0eee9]">
              <div className="h-full bg-[#e6a800] transition-all duration-300" style={{ width: `${totalItemsCount > 0 ? (evaluatedCount / totalItemsCount) * 100 : 0}%` }} />
            </div>
            {damagedCount > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <AlertCircle className="size-3.5" />
                <span>{damagedCount} item dilaporkan bermasalah (wajib bukti foto &amp; tindak lanjut)</span>
              </div>
            )}
          </section>

          {activeCategories.map((cat) => {
            const isCollapsed = collapsedCategories[cat.id]
            const catItemsEvaluated = cat.items.filter((item) => itemStates[item.id]?.condition).length
            const catItemsDamaged = cat.items.filter((item) => itemStates[item.id]?.condition === "RUSAK").length
            const catIconBg = cat.frequencyTone === "sky" ? "bg-[#e0f2fe] text-[#0284c7]" : "bg-[#fff7e0] text-[#e6a800]"
            return (
              <section key={cat.id} className="rounded-2xl border border-[#e6e2de] bg-white shadow-[0_4px_16px_rgba(17,17,17,0.04)] overflow-hidden">
                <button type="button" onClick={() => toggleCategory(cat.id)} className="flex w-full items-center justify-between border-b border-[#f0eee9] p-4 text-left hover:bg-[#fafaf9] transition-colors sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", catIconBg)}>
                      {cat.frequencyTone === "sky" ? <Wrench className="size-4" /> : <Zap className="size-4" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#111111] sm:text-base">{cat.title}</h3>
                        <span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline-block", cat.frequencyTone === "sky" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700")}>{cat.frequencyBadge}</span>
                      </div>
                      <p className="text-xs text-[#707784]">{cat.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#707784]">{catItemsEvaluated}/{cat.items.length}</span>
                    {catItemsDamaged > 0 && <span className="grid size-5 place-items-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">{catItemsDamaged}</span>}
                    {isCollapsed ? <ChevronDown className="size-5 text-[#707784]" /> : <ChevronUp className="size-5 text-[#707784]" />}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="flex flex-col gap-3 p-3 sm:p-4 bg-[#fafaf9]/60">
                    {cat.items.map((item) => {
                      const state = itemStates[item.id]
                      const isDamaged = state?.condition === "RUSAK"
                      const isGood = state?.condition === "BAIK"
                      return (
                        <div key={item.id} className="rounded-xl border border-[#e6e2de] bg-white p-3.5 transition-all shadow-[0_2px_8px_rgba(17,17,17,0.02)]">
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#111111]">{item.code}</span>
                                <span className="text-xs font-semibold text-[#111111]">{item.label}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="rounded bg-[#f0eee9] px-1.5 py-0.5 text-[10px] font-semibold text-[#666]">Tindakan: {item.action}</span>
                                {item.hint && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">{item.hint}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => updateItem(item.id, { condition: "BAIK", photos: [], notes: "", handler: undefined, repairForm: undefined })} className={cn("flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none", isGood ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs" : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]")}>Baik (V)</button>
                              <button type="button" onClick={() => updateItem(item.id, { condition: "RUSAK", handler: state?.handler || "BES", repairForm: state?.repairForm || "SAT/FRM/TS/065_REV:00_161020" })} className={cn("flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all sm:flex-none", isDamaged ? "border-red-500 bg-red-50 text-red-700 shadow-xs" : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]")}>Rusak (X)</button>
                            </div>
                          </div>

                          {item.hasVoltageInput && (
                            <div className="mt-2.5 rounded-lg border border-[#f0eee9] bg-[#fafafa] p-2.5">
                              <label className="mb-1 block text-[11px] font-bold text-[#111111]">Hasil Ukur Tegangan</label>
                              <div className="flex items-center gap-2">
                                <Input placeholder={item.id.startsWith("2") ? "mis. 850" : "mis. 220"} value={state?.voltageValue || ""} onChange={(e) => updateItem(item.id, { voltageValue: e.target.value })} className="h-8 max-w-[140px] border-[#e6e2de] text-xs font-bold" />
                                <span className="text-xs font-semibold text-[#707784]">{item.id.startsWith("2") ? "V DC" : "V AC"}</span>
                              </div>
                            </div>
                          )}

                          {isDamaged && (
                            <div className="mt-4 border-t border-[#eeeeec] pt-4 flex flex-col gap-4">
                              <div>
                                <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">AKAN DIHANDLE <span className="text-red-500">*</span></p>
                                <div className="flex rounded-xl bg-[#f5f5f3] p-1">
                                  <button type="button" onClick={() => updateItem(item.id, { handler: "BES" })} className={cn("flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all", state?.handler === "BES" ? "bg-[#e6a800] text-white shadow" : "text-[#707784] hover:text-[#111111]")}>BES</button>
                                  <button type="button" onClick={() => updateItem(item.id, { handler: "EKSTERNAL" })} className={cn("flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all", state?.handler === "EKSTERNAL" ? "bg-[#e6a800] text-white shadow" : "text-[#707784] hover:text-[#111111]")}>Eksternal</button>
                                </div>
                              </div>
                              <div className="border-t border-[#eeeeec] pt-4">
                                <p className="mb-2 text-xs font-bold text-[#707784]">Foto bukti <span className="text-red-500">*</span></p>
                                {(!state?.photos || state.photos.length === 0) && <CameraCaptureButton disabled={state?.uploading} uploading={state?.uploading} watermarkLines={buildChecklistPhotoWatermarkLines({ areaName: `${areaName} (PLTS - ${item.code})`, userLabel: watermarkUserLabel, userRole: watermarkUserRole })} onCapture={(file) => void uploadPhoto(item.id, file)} />}
                                {state?.photos && state.photos.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {state.photos.map((photo, pIdx) => (
                                      <div key={photo.fileId} className="relative">
                                        <div className="block overflow-hidden rounded-xl border border-[#e8e8e6] bg-[#111111]">
                                          <Image src={photo.url} alt={`Foto ${item.label}`} width={80} height={80} className="size-20 object-cover" />
                                        </div>
                                        <button type="button" onClick={() => handleRemovePhoto(item.id, pIdx)} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white shadow" title="Hapus foto"><Trash2 className="size-3" /></button>
                                      </div>
                                    ))}
                                    <CameraCaptureButton disabled={state?.uploading} uploading={state?.uploading} watermarkLines={buildChecklistPhotoWatermarkLines({ areaName: `${areaName} (PLTS - ${item.code})`, userLabel: watermarkUserLabel, userRole: watermarkUserRole })} onCapture={(file) => void uploadPhoto(item.id, file)} />
                                  </div>
                                )}
                              </div>
                              <div className="border-t border-[#eeeeec] pt-4">
                                <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">TINDAK LANJUT <span className="text-red-500">*</span></p>
                                <Select value={state?.repairForm || "SAT/FRM/TS/065_REV:00_161020"} onValueChange={(val) => updateItem(item.id, { repairForm: val || undefined, notes: val === "SAT/FRM/TS/065_REV:00_161020" ? "Form Penggantian Spare Part (065)" : val === "SAT/FRM/TSM/014_REV:000_060423" ? "Form Estimasi Biaya ME (014)" : "Repair Tanpa Biaya" })}>
                                  <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#e6a800] focus:ring-offset-0">
                                    <span className={cn("flex-1 text-left truncate", !state?.repairForm && "text-[#707784]")}>
                                      {state?.repairForm ? FOLLOW_UP_OPTIONS.find((o) => o.id === state.repairForm)?.label || state.repairForm : "Pilih form tindak lanjut"}
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent alignItemWithTrigger={false} className="rounded-xl border-[#dedede] bg-white shadow-lg">
                                    {FOLLOW_UP_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.id} value={opt.id} className="text-[#111111] hover:bg-[#fffbeb] focus:bg-[#fffbeb] focus:text-[#b45309] data-[state=checked]:bg-[#fffbeb] data-[state=checked]:text-[#b45309] font-medium py-2.5 cursor-pointer text-xs">{opt.label}</SelectItem>
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
        </>
      )}

      {/* Catatan */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <label className="mb-2 block text-xs font-bold text-[#111111]">Catatan &amp; Keterangan Pelaksanaan</label>
        <textarea rows={3} placeholder="Tuliskan catatan teknis atau rangkuman hasil inspeksi sistem PLTS..." value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} className="w-full rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-xs leading-relaxed text-[#111111] placeholder:text-[#999] focus-visible:border-[#e6a800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6a800]/20" />
      </section>

      {/* Verifikasi */}
      <section className="rounded-2xl border border-[#e6e2de] bg-[#fbfbfa] p-4 text-xs text-[#707784] sm:p-5">
        <div className="flex items-center gap-2 font-bold text-[#111111]"><Info className="size-4 text-[#e6a800]" /><span>Verifikasi &amp; Pelaksana Inspeksi</span></div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-[#e6e2de] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Dibuat oleh</span>
            <span className="font-bold text-[#111111]">{watermarkUserLabel}</span>
            <span className="block text-[10px] text-[#999]">Branch Engineering Support</span>
          </div>
          <div className="rounded-xl border border-[#e6e2de] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Diperiksa oleh</span>
            <span className="font-bold text-[#555]">Branch Engineering Coord.</span>
          </div>
          <div className="rounded-xl border border-[#e6e2de] bg-white p-2.5">
            <span className="block text-[10px] font-semibold text-[#888]">Diketahui oleh</span>
            <span className="font-bold text-[#555]">Branch B&amp;M MGR</span>
          </div>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <div className="mb-1 flex items-center gap-1.5 font-bold"><AlertCircle className="size-4 text-rose-600" /><span>Terdapat kendala sebelum submit:</span></div>
          <ul className="list-inside list-disc space-y-0.5">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      <div className="pt-2">
        <Button type="button" onClick={handleSubmit} disabled={isPending} className="h-12 w-full rounded-2xl bg-[#e6a800] text-sm font-bold text-white shadow-lg shadow-[#e6a800]/25 transition-all hover:bg-[#c99200] disabled:opacity-50">
          {isPending ? (
            <div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /><span>Menyimpan Laporan PLTS...</span></div>
          ) : (
            <div className="flex items-center gap-2"><Send className="size-4" /><span>Simpan &amp; Kirim Checklist PLTS</span></div>
          )}
        </Button>
      </div>
    </div>
  )
}
