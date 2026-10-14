"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  Flame,
  HardHat,
  Plus,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FrmMed003FormProps = {
  defaultUserName?: string
  defaultUserBranch?: string
  nextPath?: string
}

export function FrmMed003Form({
  defaultUserName = "",
  defaultUserBranch = "",
  nextPath,
}: FrmMed003FormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const targetNext = nextPath || searchParams.get("next") || "checklist"

  // 1. Data Pokok Pekerjaan (default dikosongkan)
  const [kegiatan, setKegiatan] = React.useState("")
  const [lokasi, setLokasi] = React.useState("")
  const [picSat, setPicSat] = React.useState("")
  const [kontraktor, setKontraktor] = React.useState("")
  const [tanggal, setTanggal] = React.useState("")
  const [lamaPekerjaan, setLamaPekerjaan] = React.useState("")

  // 2. Daftar Pekerja (1 s.d. 5, default dikosongkan)
  const [workers, setWorkers] = React.useState<string[]>([""])

  const addWorker = () => {
    if (workers.length < 5) {
      setWorkers([...workers, ""])
    }
  }

  const updateWorker = (index: number, val: string) => {
    const updated = [...workers]
    updated[index] = val
    setWorkers(updated)
  }

  const removeWorker = (index: number) => {
    if (workers.length > 1) {
      setWorkers(workers.filter((_, i) => i !== index))
    }
  }

  // 3. Persyaratan Administrasi
  const [adminReqs, setAdminReqs] = React.useState<Record<string, boolean>>({
    sertifikat: false,
    safetyInduction: false,
    jsa: false,
    mentalPhobia: false,
    lainnya: false,
  })
  const [adminLainnyaText, setAdminLainnyaText] = React.useState("")

  const toggleAdminReq = (key: string) => {
    setAdminReqs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // 4. Jenis Pekerjaan Berisiko (Default muncul semua)
  // Hot Work
  const [hotWorkActive, setHotWorkActive] = React.useState(true)
  const [hotWorkItems, setHotWorkItems] = React.useState<Record<string, boolean>>({})
  const [hotWorkLainnya, setHotWorkLainnya] = React.useState("")

  // Work Height & Excavation
  const [heightActive, setHeightActive] = React.useState(true)
  const [heightItems, setHeightItems] = React.useState<Record<string, boolean>>({})
  const [heightLainnya, setHeightLainnya] = React.useState("")

  // Confine Space
  const [confineActive, setConfineActive] = React.useState(true)
  const [confineItems, setConfineItems] = React.useState<Record<string, boolean>>({})
  const [confineLainnya, setConfineLainnya] = React.useState("")

  // High Voltage Electrical
  const [electricalActive, setElectricalActive] = React.useState(true)
  const [electricalItems, setElectricalItems] = React.useState<Record<string, boolean>>({})
  const [electricalLainnya, setElectricalLainnya] = React.useState("")

  // 5. APD & Fire Protection
  const [apdItems, setApdItems] = React.useState<Record<string, boolean>>({
    topiHelm: true,
    kacamata: true,
    masker: true,
    safetyShoes: true,
    safetyVest: true,
  })
  const [apdLainnya, setApdLainnya] = React.useState("")

  const [fireProtectionItems, setFireProtectionItems] = React.useState<
    Record<string, boolean>
  >({
    aparPowder: true,
    aparCo2: false,
    aparFoam: false,
    air: false,
    pasir: false,
  })
  const [fireLainnya, setFireLainnya] = React.useState("")

  // 6. Catatan Pasca Pekerjaan
  const [catatanPasca, setCatatanPasca] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Save permit to sessionStorage for report binding
    const permitData = {
      formNo: "SAT/FRM/MED/003_Rev:000_180225",
      kegiatan,
      lokasi,
      picSat,
      kontraktor,
      tanggal,
      lamaPekerjaan,
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
      submittedAt: new Date().toISOString(),
    }

    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("sparta_work_permit", JSON.stringify(permitData))
      }
    } catch {
      // ignore session storage error
    }

    // Redirect to the chosen destination (checklist, repair, select flow, or dashboard)
    if (targetNext === "repair") {
      router.push("/dashboard/reports/new/repair/area?workPermit=fill")
    } else if (targetNext === "select" || targetNext === "new") {
      router.push("/dashboard/reports/new?permit=done")
    } else if (targetNext === "dashboard") {
      router.push("/dashboard")
    } else {
      router.push("/dashboard/reports/new/checklist/area?workPermit=fill")
    }
  }

  // Standard input class with subtle light grey border
  const inputClass =
    "h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-sm text-[#111111] placeholder:text-[#94a3b8] focus:border-[#ff8a2a] focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Top Banner (Clean without Wajib/Mandatory badge) */}
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
              value={kegiatan}
              onChange={(e) => setKegiatan(e.target.value)}
              placeholder="Contoh: Checklist & Pemeliharaan Panel Listrik"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Lokasi Pekerjaan <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="Contoh: HEAD OFFICE / Warehouse Balaraja"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              PIC / Pengawas SAT <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={picSat}
              onChange={(e) => setPicSat(e.target.value)}
              placeholder="Nama PIC SAT"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Internal / Rekanan / Kontraktor <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={kontraktor}
              onChange={(e) => setKontraktor(e.target.value)}
              placeholder="Internal ES / Nama Vendor"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Tanggal Pekerjaan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Lama Pekerjaan / Jam <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={lamaPekerjaan}
              onChange={(e) => setLamaPekerjaan(e.target.value)}
              placeholder="Contoh: 1 Hari (08.00 - 17.00)"
              className={inputClass}
            />
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
            {workers.length < 5 && (
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
                  value={worker}
                  onChange={(e) => updateWorker(idx, e.target.value)}
                  placeholder={`Nama pekerja ke-${idx + 1}`}
                  className={inputClass}
                />
                {workers.length > 1 && (
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
                  "flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition-colors",
                  adminReqs[item.id]
                    ? "border-[#ff8a2a] bg-[#fff5ec] text-[#111111]"
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                )}
              >
                <input
                  type="checkbox"
                  checked={Boolean(adminReqs[item.id])}
                  onChange={() => toggleAdminReq(item.id)}
                  className="size-4 rounded accent-[#ff8a2a]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] shrink-0">
              <input
                type="checkbox"
                checked={Boolean(adminReqs.lainnya)}
                onChange={() => toggleAdminReq("lainnya")}
                className="size-4 rounded accent-[#ff8a2a]"
              />
              <span>Lainnya:</span>
            </label>
            <input
              disabled={!adminReqs.lainnya}
              value={adminLainnyaText}
              onChange={(e) => setAdminLainnyaText(e.target.value)}
              placeholder="Sebutkan persyaratan administrasi lainnya"
              className={cn(
                "h-9 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 text-xs text-[#111111] placeholder:text-[#94a3b8] focus:border-[#ff8a2a] outline-none disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]"
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
          Aktifkan kategori pekerjaan di bawah ini jika terdapat pekerjaan khusus, dan
          centang APD/APK yang diwajibkan:
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
                onClick={() => setHotWorkActive(!hotWorkActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
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
                      className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(hotWorkItems[it])}
                        onChange={(e) =>
                          setHotWorkItems({
                            ...hotWorkItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a]"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
                  value={hotWorkLainnya}
                  onChange={(e) => setHotWorkLainnya(e.target.value)}
                  placeholder="Lainnya (Hot Work)..."
                  className={cn("mt-2.5 h-8 text-xs", inputClass)}
                />
              </div>
            )}
          </div>

          {/* 2. Work Height & Excavation (Icon ORANGE) */}
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
                onClick={() => setHeightActive(!heightActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
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
                      className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(heightItems[it])}
                        onChange={(e) =>
                          setHeightItems({
                            ...heightItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a]"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
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
                onClick={() => setConfineActive(!confineActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
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
                      className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(confineItems[it])}
                        onChange={(e) =>
                          setConfineItems({
                            ...confineItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a]"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
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
                onClick={() => setElectricalActive(!electricalActive)}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-semibold transition-colors shadow-xs",
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
                      className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(electricalItems[it])}
                        onChange={(e) =>
                          setElectricalItems({
                            ...electricalItems,
                            [it]: e.target.checked,
                          })
                        }
                        className="size-3.5 rounded accent-[#ff8a2a]"
                      />
                      <span>{it}</span>
                    </label>
                  ))}
                </div>
                <input
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
                  "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium cursor-pointer transition-colors",
                  apdItems[apd.id]
                    ? "border-[#ff8a2a] bg-[#fff5ec] text-[#111111]"
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                )}
              >
                <input
                  type="checkbox"
                  checked={Boolean(apdItems[apd.id])}
                  onChange={(e) =>
                    setApdItems({ ...apdItems, [apd.id]: e.target.checked })
                  }
                  className="size-3.5 rounded accent-[#ff8a2a]"
                />
                <span className="truncate">{apd.label}</span>
              </label>
            ))}
          </div>
          <input
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
                  "flex items-center gap-2 rounded-xl border p-2 text-xs font-medium cursor-pointer transition-colors",
                  fireProtectionItems[fp.id]
                    ? "border-[#ff8a2a] bg-[#fff5ec] text-[#111111]"
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                )}
              >
                <input
                  type="checkbox"
                  checked={Boolean(fireProtectionItems[fp.id])}
                  onChange={(e) =>
                    setFireProtectionItems({
                      ...fireProtectionItems,
                      [fp.id]: e.target.checked,
                    })
                  }
                  className="size-3.5 rounded accent-[#ff8a2a]"
                />
                <span>{fp.label}</span>
              </label>
            ))}
          </div>
          <input
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

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
            Catatan Hasil Pemeriksaan Pasca Pekerjaan:
          </label>
          <textarea
            rows={3}
            value={catatanPasca}
            onChange={(e) => setCatatanPasca(e.target.value)}
            placeholder="Catatan kondisi area setelah pekerjaan selesai, kebersihan, isolasi, dan keselamatan..."
            className="w-full rounded-xl border border-[#e2e8f0] bg-white p-3 text-sm text-[#111111] placeholder:text-[#94a3b8] focus:border-[#ff8a2a] focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all resize-y"
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

      {/* Submit Button (Full Width se-form) */}
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
    </form>
  )
}
