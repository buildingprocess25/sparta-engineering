"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Flame,
  HardHat,
  Plus,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { submitWorkPermitAction } from "@/lib/actions/work-permit"

export type WorkPermitFullData = {
  id: string
  permitCode: string
  formCode: string
  kegiatan: string
  lokasi: string
  picSat: string
  kontraktor: string | null
  workDate: string
  duration: string
  workers: any
  safetyPayload: any
  catatanPasca: string | null
  status: "PENDING_MANAGER" | "APPROVED" | "REJECTED" | "COMPLETED"
  applicantNik: string
  applicantSignedAt: string
  managerNik: string | null
  managerSignedAt: string | null
  managerNotes: string | null
  applicant?: {
    name: string
    NIK: string
    branchName: string
  } | null
  manager?: {
    name: string
    NIK: string
  } | null
  createdAt: string
}

type FrmMed003FormProps = {
  userNik?: string
  defaultUserName?: string
  defaultUserBranch?: string
  defaultKegiatan?: string
  defaultLokasi?: string
  defaultJamMulai?: string
  defaultJamSelesai?: string
  nextPath?: string
  isReadOnly?: boolean
  initialData?: WorkPermitFullData | null
}

function parseBooleanMap(raw: any, defaults: Record<string, boolean> = {}): Record<string, boolean> {
  if (!raw) return { ...defaults }
  if (Array.isArray(raw)) {
    const res: Record<string, boolean> = { ...defaults }
    for (const k of raw) {
      if (typeof k === "string") res[k] = true
    }
    return res
  }
  if (typeof raw === "object") {
    return { ...defaults, ...raw }
  }
  return { ...defaults }
}

export function FrmMed003Form({
  userNik = "",
  defaultUserName = "",
  defaultUserBranch = "",
  defaultKegiatan = "",
  defaultLokasi = "",
  defaultJamMulai = "",
  defaultJamSelesai = "",
  nextPath,
  isReadOnly = false,
  initialData,
}: FrmMed003FormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const targetNext = nextPath || searchParams.get("next") || "checklist"

  const searchSource = searchParams.get("source") || ""
  const isFromTodo = searchSource === "todo" || targetNext === "dashboard"
  const isFromNonRoutine = searchSource === "non-routine" || targetNext === "select"

  const initialKegiatan =
    initialData?.kegiatan ||
    defaultKegiatan ||
    searchParams.get("kegiatan") ||
    (isFromTodo ? "Checklist Rutinan" : isFromNonRoutine ? "Checklist & Pemeliharaan Non-Rutin" : "")

  const initialArea = searchParams.get("area") || searchParams.get("areaName") || ""
  const initialRoom = searchParams.get("room") || searchParams.get("roomName") || ""
  const queryLokasi = searchParams.get("lokasi") || ""

  let initialLokasi = initialData?.lokasi || defaultLokasi || queryLokasi
  if (!initialLokasi) {
    const parts: string[] = []
    if (defaultUserBranch) parts.push(defaultUserBranch)
    if (initialArea && !parts.some((p) => p.toLowerCase().includes(initialArea.toLowerCase()))) {
      parts.push(initialArea)
    }
    if (initialRoom) parts.push(initialRoom)
    initialLokasi = parts.join(" - ") || defaultUserBranch || ""
  }

  const safety = initialData?.safetyPayload || {}

  let parsedJamMulai = defaultJamMulai
  let parsedJamSelesai = defaultJamSelesai
  if (initialData?.duration && initialData.duration.includes(" - ")) {
    const parts = initialData.duration.split(" - ")
    if (parts[0]) parsedJamMulai = parts[0].trim()
    if (parts[1]) parsedJamSelesai = parts[1].trim()
  }

  // 1. Data Pokok Pekerjaan (default auto-fill sesuai konteks)
  const [kegiatan, setKegiatan] = React.useState(initialKegiatan)
  const [lokasi, setLokasi] = React.useState(initialLokasi)
  const [picSat, setPicSat] = React.useState(
    initialData?.picSat || defaultUserName || searchParams.get("pic") || ""
  )
  const [kontraktor, setKontraktor] = React.useState(initialData?.kontraktor || "Internal")
  const [tanggal, setTanggal] = React.useState(() => {
    if (initialData?.workDate) {
      try {
        return new Date(initialData.workDate).toISOString().split("T")[0]
      } catch {}
    }
    return new Date().toISOString().split("T")[0]
  })

  // Format jam: Jam Mulai & Jam Selesai
  const [jamMulai, setJamMulai] = React.useState(parsedJamMulai)
  const [jamSelesai, setJamSelesai] = React.useState(parsedJamSelesai)

  // 2. Daftar Pekerja (1 s.d. 5, default diisi teknisi pemohon)
  const [workers, setWorkers] = React.useState<string[]>(() => {
    if (initialData?.workers && Array.isArray(initialData.workers) && initialData.workers.length > 0) {
      return initialData.workers
    }
    return [defaultUserName || ""]
  })

  // Sinkronisasi saat server props masuk setelah client hydration
  React.useEffect(() => {
    if (initialData) return
    if (defaultUserName && !picSat) {
      setPicSat(defaultUserName)
    }
    if (defaultUserName && workers.length === 1 && workers[0] === "") {
      setWorkers([defaultUserName])
    }
  }, [defaultUserName, initialData])

  React.useEffect(() => {
    if (initialData) return
    if (defaultKegiatan && !kegiatan) {
      setKegiatan(defaultKegiatan)
    }
  }, [defaultKegiatan, initialData])

  React.useEffect(() => {
    if (initialData) return
    if (defaultLokasi && !lokasi) {
      setLokasi(defaultLokasi)
    }
  }, [defaultLokasi, initialData])

  const addWorker = () => {
    if (isReadOnly) return
    if (workers.length < 5) {
      setWorkers([...workers, ""])
    }
  }

  const updateWorker = (index: number, val: string) => {
    if (isReadOnly) return
    const updated = [...workers]
    updated[index] = val
    setWorkers(updated)
  }

  const removeWorker = (index: number) => {
    if (isReadOnly) return
    if (workers.length > 1) {
      setWorkers(workers.filter((_, i) => i !== index))
    }
  }

  // 3. Persyaratan Administrasi
  const [adminReqs, setAdminReqs] = React.useState<Record<string, boolean>>(() =>
    parseBooleanMap(safety.adminReqs, {
      sertifikat: false,
      safetyInduction: false,
      jsa: false,
      mentalPhobia: false,
      lainnya: false,
    })
  )
  const [adminLainnyaText, setAdminLainnyaText] = React.useState(safety.adminLainnyaText || "")

  const toggleAdminReq = (key: string) => {
    if (isReadOnly) return
    setAdminReqs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // 4. Jenis Pekerjaan Berisiko (Default muncul semua)
  // Hot Work
  const [hotWorkActive, setHotWorkActive] = React.useState(
    safety.hotWork ? Boolean(safety.hotWork.active) : true
  )
  const [hotWorkItems, setHotWorkItems] = React.useState<Record<string, boolean>>(() =>
    parseBooleanMap(safety.hotWork?.items)
  )
  const [hotWorkLainnya, setHotWorkLainnya] = React.useState(safety.hotWork?.lainnya || "")

  // Work Height & Excavation
  const [heightActive, setHeightActive] = React.useState(
    safety.workHeight ? Boolean(safety.workHeight.active) : true
  )
  const [heightItems, setHeightItems] = React.useState<Record<string, boolean>>(() =>
    parseBooleanMap(safety.workHeight?.items)
  )
  const [heightLainnya, setHeightLainnya] = React.useState(safety.workHeight?.lainnya || "")

  // Confine Space
  const [confineActive, setConfineActive] = React.useState(
    safety.confinedSpace ? Boolean(safety.confinedSpace.active) : true
  )
  const [confineItems, setConfineItems] = React.useState<Record<string, boolean>>(() =>
    parseBooleanMap(safety.confinedSpace?.items)
  )
  const [confineLainnya, setConfineLainnya] = React.useState(safety.confinedSpace?.lainnya || "")

  // High Voltage Electrical
  const [electricalActive, setElectricalActive] = React.useState(
    safety.electrical ? Boolean(safety.electrical.active) : true
  )
  const [electricalItems, setElectricalItems] = React.useState<Record<string, boolean>>(() =>
    parseBooleanMap(safety.electrical?.items)
  )
  const [electricalLainnya, setElectricalLainnya] = React.useState(safety.electrical?.lainnya || "")

  // 5. APD & Fire Protection
  const [apdItems, setApdItems] = React.useState<Record<string, boolean>>(() =>
    parseBooleanMap(safety.apd?.items, {
      topiHelm: true,
      kacamata: true,
      masker: true,
      safetyShoes: true,
      safetyVest: true,
    })
  )
  const [apdLainnya, setApdLainnya] = React.useState(safety.apd?.lainnya || "")

  const [fireProtectionItems, setFireProtectionItems] = React.useState<
    Record<string, boolean>
  >(() =>
    parseBooleanMap(safety.fireProtection?.items, {
      aparPowder: true,
      aparCo2: false,
      aparFoam: false,
      air: false,
      pasir: false,
    })
  )
  const [fireLainnya, setFireLainnya] = React.useState(safety.fireProtection?.lainnya || "")

  // 6. Catatan Pasca Pekerjaan
  const [catatanPasca, setCatatanPasca] = React.useState(initialData?.catatanPasca || "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return
    setIsSubmitting(true)

    const durationText =
      jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai}` : jamMulai || jamSelesai || "1 Hari"

    // Save permit to database
    const result = await submitWorkPermitAction({
      kegiatan,
      lokasi,
      picSat,
      kontraktor,
      workDate: tanggal,
      duration: durationText,
      workers: workers.filter((w) => w.trim().length > 0),
      adminReqs,
      adminLainnyaText,
      hotWork: { active: hotWorkActive, items: hotWorkItems, lainnya: hotWorkLainnya },
      workHeight: { active: heightActive, items: heightItems, lainnya: heightLainnya },
      confinedSpace: { active: confineActive, items: confineItems, lainnya: confineLainnya },
      electrical: { active: electricalActive, items: electricalItems, lainnya: electricalLainnya },
      apd: { items: apdItems, lainnya: apdLainnya },
      fireProtection: { items: fireProtectionItems, lainnya: fireLainnya },
      catatanPasca,
    })

    // Also sync permit to sessionStorage for immediate client availability
    const permitData = {
      userNik,
      permitCode: result.ok ? result.workPermit?.permitCode : undefined,
      formNo: "SAT/FRM/MED/003_Rev:000_180225",
      kegiatan,
      lokasi,
      picSat,
      kontraktor,
      tanggal,
      lamaPekerjaan: durationText,
      duration: durationText,
      jamMulai,
      jamSelesai,
      workers: workers.filter((w) => w.trim().length > 0),
      status: result.ok ? result.workPermit?.status : "PENDING_MANAGER",
      submittedAt: new Date().toISOString(),
    }

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("sparta_work_permit", JSON.stringify(permitData))
        if (userNik) {
          window.sessionStorage.setItem(`sparta_work_permit_${userNik}`, JSON.stringify(permitData))
        }
      }
    } catch {
      // ignore session storage error
    }

    // Redirect back based on entry context
    if (isFromNonRoutine || targetNext === "select") {
      router.push("/dashboard/reports/new?permit=done")
    } else {
      router.push("/dashboard?permitSubmitted=true")
    }
  }

  // Standard input class with subtle light grey border
  const inputClass = isReadOnly
    ? "h-10 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm text-[#1e293b] cursor-not-allowed select-none font-medium"
    : "h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-[#111111] placeholder:text-[#94a3b8] focus:border-[#ff8a2a] focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Top Banner */}
      {isReadOnly && initialData ? (
        <div
          className={cn(
            "rounded-2xl border p-4 shadow-xs",
            initialData.status === "APPROVED"
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : initialData.status === "PENDING_MANAGER"
              ? "border-amber-200 bg-amber-50/70 text-amber-950"
              : initialData.status === "REJECTED"
              ? "border-rose-200 bg-rose-50/70 text-rose-950"
              : "border-slate-200 bg-slate-50 text-slate-900"
          )}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={cn(
                "size-5 shrink-0 mt-0.5",
                initialData.status === "APPROVED"
                  ? "text-emerald-600"
                  : initialData.status === "REJECTED"
                  ? "text-rose-600"
                  : "text-[#ff8a2a]"
              )}
            />
            <div className="text-sm flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">
                  Form Izin Kerja (SAT/FRM/MED/003)
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border",
                    initialData.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : initialData.status === "PENDING_MANAGER"
                      ? "bg-amber-100 text-amber-900 border-amber-200"
                      : initialData.status === "REJECTED"
                      ? "bg-rose-100 text-rose-900 border-rose-200"
                      : "bg-slate-100 text-slate-800 border-slate-200"
                  )}
                >
                  {initialData.status === "APPROVED"
                    ? "Disetujui Manager (Izin Aktif)"
                    : initialData.status === "PENDING_MANAGER"
                    ? "Menunggu Approval Manager"
                    : initialData.status === "REJECTED"
                    ? "Ditolak / Perlu Revisi"
                    : "Read-Only"}
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {initialData.permitCode}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {initialData.status === "APPROVED"
                  ? `Izin kerja disahkan oleh ${initialData.manager?.name || "Manager"}${
                      initialData.managerSignedAt
                        ? ` pada ${new Date(initialData.managerSignedAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`
                        : ""
                    }. Tampilan ini berstatus Read-Only.`
                  : "Dokumen formulir izin kerja K3 tersimpan (Mode Read-Only)."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 shrink-0 text-[#ff8a2a] mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-amber-950 block">
                Form Izin Kerja (SAT/FRM/MED/003)
              </span>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Reff: SAT/KEB/MED/001 Kebijakan Persyaratan Kerja Aman (SMK3). Setiap pekerjaan inspeksi & perbaikan non-rutin wajib melengkapi form izin kerja ini.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bagian 1: Informasi Pokok Pekerjaan */}
      <section className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#f0f0f0] pb-3">
          <span className="grid size-6 place-items-center rounded-full bg-[#111111] text-xs font-bold text-white">
            1
          </span>
          <h2 className="font-semibold text-[#111111]">Informasi Pokok Pekerjaan</h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Kegiatan / Pekerjaan <span className="text-red-500">*</span>
            </label>
            <input
              required
              readOnly
              disabled={isReadOnly}
              value={kegiatan}
              placeholder="Contoh: Checklist & Pemeliharaan Panel Listrik"
              className={cn(inputClass, "bg-[#f8fafc] text-[#475569] cursor-not-allowed select-none")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              PIC / Pengawas SAT <span className="text-red-500">*</span>
            </label>
            <input
              required
              readOnly
              disabled={isReadOnly}
              value={picSat}
              placeholder="Nama PIC SAT"
              className={cn(inputClass, "bg-[#f8fafc] text-[#475569] cursor-not-allowed select-none")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Lokasi Pekerjaan <span className="text-red-500">*</span>
            </label>
            <input
              required
              readOnly={isReadOnly}
              disabled={isReadOnly}
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Contoh: HEAD OFFICE / Warehouse Balaraja"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Internal / Rekanan / Kontraktor <span className="text-red-500">*</span>
            </label>
            <Select
              disabled={isReadOnly}
              value={kontraktor}
              onValueChange={(val) => setKontraktor(val || "Internal")}
            >
              <SelectTrigger
                className={cn(
                  "w-full !h-10 h-10 rounded-xl border border-[#e2e8f0] px-3 text-sm focus:border-[#ff8a2a] focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all font-medium",
                  isReadOnly
                    ? "bg-[#f8fafc] text-[#1e293b] cursor-not-allowed select-none"
                    : "bg-white text-[#111111] cursor-pointer"
                )}
              >
                <span className="flex-1 text-left font-medium">
                  {kontraktor || "Pilih"}
                </span>
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="rounded-xl border border-[#e2e8f0] bg-white p-1 shadow-lg"
              >
                <SelectItem
                  value="Internal"
                  className="rounded-lg text-sm font-medium text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] py-2 px-3 cursor-pointer"
                >
                  Internal
                </SelectItem>
                <SelectItem
                  value="Eksternal"
                  className="rounded-lg text-sm font-medium text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] py-2 px-3 cursor-pointer"
                >
                  Eksternal
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Tanggal Pekerjaan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              readOnly={isReadOnly}
              disabled={isReadOnly}
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Lama Pekerjaan / Jam <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="time"
                  required
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  onClick={(e) => {
                    if (isReadOnly) return
                    try {
                      e.currentTarget.showPicker?.()
                    } catch {}
                  }}
                  className={cn(
                    inputClass,
                    isReadOnly ? "cursor-not-allowed" : "cursor-pointer",
                    !jamMulai &&
                      "text-transparent [&::-webkit-datetime-edit]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                  )}
                />
                {!jamMulai && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8]">
                    Jam Mulai
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="time"
                  required
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={jamSelesai}
                  onChange={(e) => setJamSelesai(e.target.value)}
                  onClick={(e) => {
                    if (isReadOnly) return
                    try {
                      e.currentTarget.showPicker?.()
                    } catch {}
                  }}
                  className={cn(
                    inputClass,
                    isReadOnly ? "cursor-not-allowed" : "cursor-pointer",
                    !jamSelesai &&
                      "text-transparent [&::-webkit-datetime-edit]:opacity-0 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                  )}
                />
                {!jamSelesai && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8]">
                    Jam Selesai
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 2: Pekerja & Persyaratan Administrasi */}
      <section className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#f0f0f0] pb-3">
          <span className="grid size-6 place-items-center rounded-full bg-[#111111] text-xs font-bold text-white">
            2
          </span>
          <h2 className="font-semibold text-[#111111]">
            Informasi Pekerja & Persyaratan Administrasi
          </h2>
        </div>

        {/* Daftar Pekerja */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#475569]">
              Nama Pekerja Pelaksana (Maks. 5 orang)
            </label>
            {!isReadOnly && workers.length < 5 && (
              <button
                type="button"
                onClick={addWorker}
                className="h-7 px-2.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-semibold text-[#111111] hover:bg-[#f8fafc] hover:border-[#cbd5e1] flex items-center gap-1 transition-colors shadow-xs"
              >
                <Plus className="size-3 text-[#ff8a2a]" /> Tambah Pekerja
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {workers.map((worker, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 text-center text-xs font-semibold text-[#94a3b8]">
                  {idx + 1}.
                </span>
                <input
                  required
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={worker}
                  onChange={(e) => updateWorker(idx, e.target.value)}
                  placeholder={`Nama pekerja ke-${idx + 1}`}
                  className={inputClass}
                />
                {!isReadOnly && workers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeWorker(idx)}
                    className="h-10 w-10 shrink-0 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"
                    title="Hapus pekerja"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Persyaratan Administrasi */}
        <div className="mt-5 border-t border-[#f0f0f0] pt-4">
          <label className="mb-2 block text-xs font-semibold text-[#475569]">
            Persyaratan Kompetensi & Administrasi:
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              { id: "sertifikat", label: "Sertifikat Kompetensi" },
              { id: "safetyInduction", label: "Safety Induction" },
              { id: "jsa", label: "Job Safety Analysis (JSA)" },
              {
                id: "mentalPhobia",
                label: "Konfirmasi Kondisi Mental Pekerja (Phobia)",
              },
            ].map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium transition-colors",
                  isReadOnly ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                  adminReqs[item.id]
                    ? "border-[#ff8a2a] bg-[#fff5ec] text-[#111111]"
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                )}
              >
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(adminReqs[item.id])}
                  onChange={() => toggleAdminReq(item.id)}
                  className="size-4 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] shrink-0">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={Boolean(adminReqs.lainnya)}
                onChange={() => toggleAdminReq("lainnya")}
                className="size-4 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
              />
              <span>Lainnya:</span>
            </label>
            <input
              disabled={isReadOnly || !adminReqs.lainnya}
              readOnly={isReadOnly}
              value={adminLainnyaText}
              onChange={(e) => setAdminLainnyaText(e.target.value)}
              placeholder="Sebutkan persyaratan administrasi lainnya"
              className={cn(
                "h-9 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs text-[#111111] placeholder:text-[#94a3b8] focus:border-[#ff8a2a] outline-none disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]",
                isReadOnly && "cursor-not-allowed select-none bg-[#f8fafc] text-[#1e293b]"
              )}
            />
          </div>
        </div>
      </section>

      {/* Bagian 3: Jenis Pekerjaan Berisiko & APD/APK Khusus */}
      <section className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#f0f0f0] pb-3">
          <span className="grid size-6 place-items-center rounded-full bg-[#111111] text-xs font-bold text-white">
            3
          </span>
          <h2 className="font-semibold text-[#111111]">
            Jenis Pekerjaan Berisiko (Hot Work, Ketinggian, Listrik, dsb)
          </h2>
        </div>

        <p className="mt-2 text-xs text-[#64748b]">
          {isReadOnly
            ? "Status kategori pekerjaan khusus dan APD/APK yang diverifikasi:"
            : "Aktifkan kategori pekerjaan di bawah ini jika terdapat pekerjaan khusus, dan centang APD/APK yang diwajibkan:"}
        </p>

        <div className="mt-4 space-y-3.5">
          {/* 1. Hot Work */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-[#ff8a2a]" />
                <span className="text-sm font-semibold text-[#111111]">
                  Hot Work (Kerja Api)
                </span>
              </div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => !isReadOnly && setHotWorkActive(!hotWorkActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
                  isReadOnly && "cursor-not-allowed opacity-90",
                  hotWorkActive
                    ? "bg-[#ff8a2a] text-white hover:bg-[#e0751d]"
                    : "border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#111111]"
                )}
              >
                {hotWorkActive ? "Aktif" : "Tidak Ada"}
              </button>
            </div>

            {hotWorkActive && (
              <div className="mt-3 border-t border-[#f0f0f0] pt-3">
                <span className="mb-2 block text-xs font-semibold text-[#475569]">
                  APD / Peralatan yang Digunakan:
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    "Lock Out",
                    "Barikade",
                    "Ventilasi",
                    "Welding Cutting Torch",
                    "Acetylene",
                    "Grinding Machine",
                    "Cutting Disk",
                    "Fire Blanket",
                    "Oxygen",
                  ].map((it) => (
                    <label
                      key={it}
                      className={cn(
                        "flex items-center gap-2 text-xs text-[#334155]",
                        isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={Boolean(hotWorkItems[it])}
                        onChange={(e) =>
                          !isReadOnly &&
                          setHotWorkItems({
                            ...hotWorkItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={hotWorkLainnya}
                  onChange={(e) => setHotWorkLainnya(e.target.value)}
                  placeholder="Lainnya (Hot Work)..."
                  className={cn("mt-2.5 h-8 text-xs", inputClass)}
                />
              </div>
            )}
          </div>

          {/* 2. Work Height & Excavation */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="size-4 text-[#ff8a2a]" />
                <span className="text-sm font-semibold text-[#111111]">
                  Work Height & Excavation (Kerja Ketinggian & Galian)
                </span>
              </div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => !isReadOnly && setHeightActive(!heightActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
                  isReadOnly && "cursor-not-allowed opacity-90",
                  heightActive
                    ? "bg-[#ff8a2a] text-white hover:bg-[#e0751d]"
                    : "border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#111111]"
                )}
              >
                {heightActive ? "Aktif" : "Tidak Ada"}
              </button>
            </div>

            {heightActive && (
              <div className="mt-3 border-t border-[#f0f0f0] pt-3">
                <span className="mb-2 block text-xs font-semibold text-[#475569]">
                  APD / Peralatan yang Digunakan:
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    "Handrail",
                    "Platform/Alas",
                    "Alat Komunikasi",
                    "Scaffolding",
                    "Lampu Penerangan",
                    "Crane",
                    "Safety Line",
                    "Safety Sign",
                    "Safety Net",
                  ].map((it) => (
                    <label
                      key={it}
                      className={cn(
                        "flex items-center gap-2 text-xs text-[#334155]",
                        isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={Boolean(heightItems[it])}
                        onChange={(e) =>
                          !isReadOnly &&
                          setHeightItems({
                            ...heightItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={heightLainnya}
                  onChange={(e) => setHeightLainnya(e.target.value)}
                  placeholder="Lainnya (Ketinggian/Galian)..."
                  className={cn("mt-2.5 h-8 text-xs", inputClass)}
                />
              </div>
            )}
          </div>

          {/* 3. Confined Space */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-[#ff8a2a]" />
                <span className="text-sm font-semibold text-[#111111]">
                  Confine Space Area (Area Terbatas)
                </span>
              </div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => !isReadOnly && setConfineActive(!confineActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
                  isReadOnly && "cursor-not-allowed opacity-90",
                  confineActive
                    ? "bg-[#ff8a2a] text-white hover:bg-[#e0751d]"
                    : "border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#111111]"
                )}
              >
                {confineActive ? "Aktif" : "Tidak Ada"}
              </button>
            </div>

            {confineActive && (
              <div className="mt-3 border-t border-[#f0f0f0] pt-3">
                <span className="mb-2 block text-xs font-semibold text-[#475569]">
                  APK yang Digunakan:
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    "Ventilasi Udara",
                    "Proteksi Area",
                    "Oxygen",
                    "Breathing Apparatus",
                    "Log Out",
                  ].map((it) => (
                    <label
                      key={it}
                      className={cn(
                        "flex items-center gap-2 text-xs text-[#334155]",
                        isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={Boolean(confineItems[it])}
                        onChange={(e) =>
                          !isReadOnly &&
                          setConfineItems({
                            ...confineItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={confineLainnya}
                  onChange={(e) => setConfineLainnya(e.target.value)}
                  placeholder="Lainnya (Confined Space)..."
                  className={cn("mt-2.5 h-8 text-xs", inputClass)}
                />
              </div>
            )}
          </div>

          {/* 4. High Voltage Electrical */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-[#ff8a2a]" />
                <span className="text-sm font-semibold text-[#111111]">
                  High Voltage Electrical (Listrik Tegangan Tinggi)
                </span>
              </div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => !isReadOnly && setElectricalActive(!electricalActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
                  isReadOnly && "cursor-not-allowed opacity-90",
                  electricalActive
                    ? "bg-[#ff8a2a] text-white hover:bg-[#e0751d]"
                    : "border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#111111]"
                )}
              >
                {electricalActive ? "Aktif" : "Tidak Ada"}
              </button>
            </div>

            {electricalActive && (
              <div className="mt-3 border-t border-[#f0f0f0] pt-3">
                <span className="mb-2 block text-xs font-semibold text-[#475569]">
                  APK yang Digunakan:
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    "Instalasi Listrik",
                    "Proteksi Terminal",
                    "Proteksi Arus",
                    "Proteksi Tegangan",
                    "Alat Komunikasi",
                    "Ampere Meter",
                    "Lock Out",
                    "Proteksi Area",
                    "Proteksi Panel",
                  ].map((it) => (
                    <label
                      key={it}
                      className={cn(
                        "flex items-center gap-2 text-xs text-[#334155]",
                        isReadOnly ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={Boolean(electricalItems[it])}
                        onChange={(e) =>
                          !isReadOnly &&
                          setElectricalItems({
                            ...electricalItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  value={electricalLainnya}
                  onChange={(e) => setElectricalLainnya(e.target.value)}
                  placeholder="Lainnya (Tegangan Tinggi)..."
                  className={cn("mt-2.5 h-8 text-xs", inputClass)}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bagian 4: Standar APD & Fire Protection */}
      <section className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#f0f0f0] pb-3">
          <span className="grid size-6 place-items-center rounded-full bg-[#111111] text-xs font-bold text-white">
            4
          </span>
          <h2 className="font-semibold text-[#111111]">
            Standar APD & Proteksi Kebakaran (Fire Protection)
          </h2>
        </div>

        {/* APD Grid */}
        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold text-[#475569]">
            Alat Pelindung Diri (APD) Wajib:
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { id: "topiHelm", label: "Topi / Helm" },
              { id: "kacamata", label: "Kacamata" },
              { id: "masker", label: "Masker" },
              { id: "faceshield", label: "Faceshield" },
              { id: "weldingFacer", label: "Welding Facer" },
              { id: "apron", label: "Apron" },
              { id: "earPlug", label: "Ear Plug / Muff" },
              { id: "safetyVest", label: "Safety Vest" },
              { id: "sarungBahan", label: "Sarung Tangan Bahan" },
              { id: "sarungKulit", label: "Sarung Tangan Kulit" },
              { id: "sarungKaret", label: "Sarung Tangan Karet" },
              { id: "safetyShoes", label: "Safety Shoes" },
              { id: "weldingGloves", label: "Welding Gloves" },
              { id: "dustMask", label: "Dust Mask" },
              { id: "bodyHarness", label: "Body Harness" },
            ].map((apd) => (
              <label
                key={apd.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition-colors",
                  isReadOnly ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                  apdItems[apd.id]
                    ? "border-[#ff8a2a] bg-[#fff5ec] text-[#111111]"
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                )}
              >
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(apdItems[apd.id])}
                  onChange={(e) =>
                    !isReadOnly &&
                    setApdItems({ ...apdItems, [apd.id]: e.target.checked })
                  }
                  className="size-3.5 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
                />
                <span className="truncate">{apd.label}</span>
              </label>
            ))}
          </div>
          <input
            readOnly={isReadOnly}
            disabled={isReadOnly}
            value={apdLainnya}
            onChange={(e) => setApdLainnya(e.target.value)}
            placeholder="APD lainnya..."
            className={cn("mt-2.5 h-8 text-xs", inputClass)}
          />
        </div>

        {/* Fire Protection Grid */}
        <div className="mt-5 border-t border-[#f0f0f0] pt-4">
          <label className="mb-2 block text-xs font-semibold text-[#475569]">
            Peralatan Fire Protection yang Standby:
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { id: "aparPowder", label: "APAR Dry Chemical Powder" },
              { id: "aparCo2", label: "APAR CO2" },
              { id: "aparFoam", label: "APAR Foam" },
              { id: "air", label: "Air" },
              { id: "pasir", label: "Pasir" },
            ].map((fp) => (
              <label
                key={fp.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium transition-colors",
                  isReadOnly ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                  fireProtectionItems[fp.id]
                    ? "border-[#ff8a2a] bg-[#fff5ec] text-[#111111]"
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                )}
              >
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(fireProtectionItems[fp.id])}
                  onChange={(e) =>
                    !isReadOnly &&
                    setFireProtectionItems({
                      ...fireProtectionItems,
                      [fp.id]: e.target.checked,
                    })
                  }
                  className="size-3.5 rounded accent-[#ff8a2a] disabled:cursor-not-allowed"
                />
                <span>{fp.label}</span>
              </label>
            ))}
          </div>
          <input
            readOnly={isReadOnly}
            disabled={isReadOnly}
            value={fireLainnya}
            onChange={(e) => setFireLainnya(e.target.value)}
            placeholder="Fire protection lainnya..."
            className={cn("mt-2.5 h-8 text-xs", inputClass)}
          />
        </div>
      </section>

      {/* Bagian 5: Pengesahan & Catatan Pasca Pekerjaan */}
      <section className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-[#f0f0f0] pb-3">
          <span className="grid size-6 place-items-center rounded-full bg-[#111111] text-xs font-bold text-white">
            5
          </span>
          <h2 className="font-semibold text-[#111111]">
            Catatan Pemeriksaan Pasca Pekerjaan & Pengesahan
          </h2>
        </div>

        {initialData?.managerNotes && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
            <span className="font-bold block mb-1">Catatan / Arahan Manager:</span>
            <p className="leading-relaxed">{initialData.managerNotes}</p>
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
            Catatan Hasil Pemeriksaan Pasca Pekerjaan:
          </label>
          <textarea
            rows={3}
            readOnly={isReadOnly}
            disabled={isReadOnly}
            value={catatanPasca}
            onChange={(e) => setCatatanPasca(e.target.value)}
            placeholder="Catatan kondisi area setelah pekerjaan selesai, kebersihan, isolasi, dan keselamatan..."
            className={cn(
              "w-full rounded-xl border border-[#e2e8f0] p-3 text-sm resize-y outline-none transition-all",
              isReadOnly
                ? "bg-[#f8fafc] text-[#1e293b] cursor-not-allowed select-none font-medium"
                : "bg-white text-[#111111] placeholder:text-[#94a3b8] focus:border-[#ff8a2a] focus:ring-2 focus:ring-[#ff8a2a]/20"
            )}
          />
        </div>

        <div className="mt-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-3 text-xs text-[#64748b]">
          <p className="font-semibold text-[#1e293b]">Alur Persetujuan (Approval):</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            <li>Pemohon: Branch Engineering Support ({picSat || "ES"})</li>
            <li>Penyetujui 1: Branch Building & Maintenance Manager</li>
            <li>Penyetujui 2: P2K3 / Delegate*</li>
            <li>Penyetujui 3: Sekretaris P2K3</li>
          </ul>
          <p className="mt-2 text-[11px] italic text-[#94a3b8]">
            * Diisi / disetujui apabila pekerjaan dilakukan di Branch (Office, Warehouse, Depo, Bulky).
          </p>
        </div>
      </section>

      {/* Action Buttons */}
      {isReadOnly ? (
        <div className="flex flex-col gap-2.5 pt-2">
          <Link
            href={isFromNonRoutine ? "/dashboard/reports/new" : "/dashboard"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="size-4" /> Kembali ke Dashboard
          </Link>
          <Link
            href="/dashboard/reports/new/work-permit?mode=new"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Ajukan Izin Kerja Baru (Jika Berganti Pekerjaan)
          </Link>
        </div>
      ) : (
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full bg-[#ff8a2a] hover:bg-[#e0751d] text-white font-semibold rounded-xl gap-2 shadow-sm text-sm"
          >
            {isSubmitting ? (
              "Menyimpan Izin Kerja..."
            ) : (
              <>
                Simpan & Lanjut ke Pilih Area <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  )
}
