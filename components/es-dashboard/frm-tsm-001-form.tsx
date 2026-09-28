"use client"

import * as React from "react"
import Image from "next/image"
import {
  Activity,
  AlertCircle,
  Check,
  Clock,
  Gauge,
  Info,
  Loader2,
  Send,
  Trash2,
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
  FrmTsm001Payload,
  FrmTsm001RunningLog,
  FrmTsm001AtsTest,
} from "@/lib/checklists/payload-001"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTsm001FormProps = {
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
    payload: FrmTsm001Payload
  }): Promise<{ ok: true; isSafe?: boolean } | { ok: false; errors: string[] }>
}

const OPERATIONAL_TYPES = ["Pemanasan", "Pemadaman", "Test ATS"] as const

const FOLLOW_UP_OPTIONS = [
  {
    id: "SAT/FRM/TS/065_REV:00_161020",
    label: "Form Penggantian Spare Part (065)",
    badge: "065",
  },
  {
    id: "SAT/FRM/TSM/014_REV:000_060423",
    label: "Form Estimasi Biaya Sipil & ME (014)",
    badge: "014",
  },
  {
    id: "REPAIR_TANPA_BIAYA",
    label: "Repair Tanpa Biaya (Internal)",
    badge: "Internal",
  },
]

export function FrmTsm001Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = "FRM_TSM_001",
  submitAction,
}: FrmTsm001FormProps) {
  // Genset Metadata
  const [merk, setMerk] = React.useState("")
  const [kva, setKva] = React.useState("")

  // Running Log state
  const [runningLog, setRunningLog] = React.useState<FrmTsm001RunningLog>({
    operationalType: "Test ATS",
    timeStart: "",
    timeOff: "",
    hourMeterStart: "",
    hourMeterOff: "",
    chargerAlternatorVolt: "",
    frequencyHz: "50",
    oilPressureKpa: "",
    voltage3Phase: { rs: "", st: "", tr: "" },
    voltageSinglePhase: { rn: "", sn: "", tn: "" },
    loadAmpere: { r: "", s: "", t: "" },
    fuelConsumptionLiter: "",
  })

  // ATS Test state
  const [atsTest, setAtsTest] = React.useState<FrmTsm001AtsTest>({
    testDate: new Date().toISOString().split("T")[0],
    systemAtsStatus: "OK",
    voltageBatteryCharge: "",
    voltageBatteryLoadStart: "",
    transferDurationMinutes: "",
    photos: [],
    handler: undefined,
    repairForm: undefined,
    notes: "",
  })

  const [catatanKeterangan, setCatatanKeterangan] = React.useState("")
  const [uploading, setUploading] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const [uploadNotice, setUploadNotice] = React.useState<{
    tone: "loading" | "success" | "error"
    message: string
  }>()
  const [previewPhoto, setPreviewPhoto] = React.useState<{ url: string }>()
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!uploadNotice || uploadNotice.tone === "loading") return
    const timer = window.setTimeout(() => setUploadNotice(undefined), 3200)
    return () => window.clearTimeout(timer)
  }, [uploadNotice])

  async function uploadPhoto(file: File) {
    setUploading(true)
    setUploadNotice({ tone: "loading", message: "Foto sedang diupload..." })
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
          itemId: "system_ats_test",
          sequence: (atsTest.photos?.length || 0) + 1,
        })
      )

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok || "error" in payload) {
        throw new Error(payload.error || "Upload foto gagal.")
      }

      setAtsTest((prev) => ({
        ...prev,
        photos: [...(prev.photos || []), payload],
      }))
      setUploadNotice({ tone: "success", message: "Upload foto berhasil tersimpan." })
    } catch (err) {
      setUploadNotice({ tone: "error", message: "Upload foto gagal." })
      setErrors([err instanceof Error ? err.message : "Upload foto gagal."])
    } finally {
      setUploading(false)
    }
  }

  function deletePhoto(fileId: string) {
    setAtsTest((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((p) => p.fileId !== fileId),
    }))
  }

  function handleSubmit() {
    setErrors([])

    if (!merk.trim()) {
      setErrors(["Merk Genset wajib diisi."])
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (!kva.trim()) {
      setErrors(["Kapasitas KVA wajib diisi."])
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (atsTest.systemAtsStatus === "NOK") {
      if (!atsTest.handler) {
        setErrors(["Penanggung jawab (Handler) wajib dipilih saat ATS berstatus NOK."])
        return
      }
      if (!atsTest.photos || atsTest.photos.length === 0) {
        setErrors(["Foto bukti temuan wajib dilampirkan saat ATS berstatus NOK."])
        return
      }
    }

    const payload: FrmTsm001Payload = {
      formCode: "FRM_TSM_001",
      formName: "Form Pemantauan Penggunaan Genset dan Test Fungsi ATS",
      areaCode,
      period: "MONTHLY",
      periodKey,
      branch: areaName,
      merk: merk.trim(),
      kva: kva.trim(),
      bulan: periodKey,
      runningLog,
      atsTest: {
        ...atsTest,
        notes:
          atsTest.notes?.trim() ||
          (atsTest.systemAtsStatus === "NOK"
            ? atsTest.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
              ? "Form Estimasi Biaya Sipil & ME (014)"
              : "Form Penggantian Spare Part (065)"
            : "Sistem ATS Berfungsi Normal"),
      },
      catatanKeterangan: catatanKeterangan.trim(),
    }

    startTransition(async () => {
      try {
        const result = await submitAction({ reportCode, payload })
        if (!result.ok) {
          setErrors(result.errors)
          return
        }

        const needsFollowUp =
          payload.atsTest.systemAtsStatus === "NOK" &&
          (payload.atsTest.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
            payload.atsTest.repairForm === "SAT/FRM/TS/065_REV:00_161020")

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

      {/* CARD 1: Identitas Unit Genset */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-[#f0eee9] pb-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
            <Gauge className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#111111] sm:text-lg">
              Identitas Unit Genset & Lokasi
            </h2>
            <p className="text-xs text-[#707784]">
              {areaName} • SAT/FRM/TSM/001_Rev_000_211022
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Merk Genset <span className="text-[#ff8a2a]">*</span>
            </label>
            <Input
              placeholder="Contoh: Perkins / Cummins / Yanmar"
              value={merk}
              onChange={(e) => setMerk(e.target.value)}
              className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm font-semibold focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Kapasitas (KVA) <span className="text-[#ff8a2a]">*</span>
            </label>
            <Input
              placeholder="Contoh: 250 KVA"
              value={kva}
              onChange={(e) => setKva(e.target.value)}
              className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-sm focus-visible:border-[#ff8a2a] focus-visible:ring-[#ff8a2a]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Periode Bulan
            </label>
            <div className="flex h-10 items-center rounded-lg border border-[#e6e2de] bg-[#fbfbfa] px-3 text-sm font-semibold text-[#111111]">
              {periodKey}
            </div>
          </div>
        </div>
      </section>

      {/* CARD 2: Log Pengoperasian Genset (Running Log) */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-[#f0eee9] pb-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
            <Clock className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#111111]">
              Log Pengoperasian Mesin (Running Log)
            </h3>
            <p className="text-xs text-[#707784]">
              Pencatatan waktu running, hour meter, dan parameter beban listrik
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Tipe Operasional */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Tipe Operasional <span className="text-[#ff8a2a]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {OPERATIONAL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setRunningLog((prev) => ({ ...prev, operationalType: t }))
                  }
                  className={cn(
                    "rounded-xl border py-2.5 text-xs font-bold transition-all",
                    runningLog.operationalType === t
                      ? "border-[#ff8a2a] bg-[#fff0e3] text-[#c75f00] shadow-sm"
                      : "border-[#e6e2de] bg-[#fbfbfa] text-[#707784] hover:bg-[#f5f5f3]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Waktu Mesin */}
          <div className="rounded-xl border border-[#f0eee9] bg-[#fafaf9] p-3.5">
            <span className="text-xs font-bold text-[#111111]">
              Waktu Mesin (Time Engine)
            </span>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">Jam Start</label>
                <Input
                  type="time"
                  value={runningLog.timeStart}
                  onChange={(e) =>
                    setRunningLog((prev) => ({ ...prev, timeStart: e.target.value }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">Jam Off</label>
                <Input
                  type="time"
                  value={runningLog.timeOff}
                  onChange={(e) =>
                    setRunningLog((prev) => ({ ...prev, timeOff: e.target.value }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Hour Meter */}
          <div className="rounded-xl border border-[#f0eee9] bg-[#fafaf9] p-3.5">
            <span className="text-xs font-bold text-[#111111]">
              Hour Meter (Jam Kerja)
            </span>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">HM Start</label>
                <Input
                  placeholder="Contoh: 1520.4"
                  value={runningLog.hourMeterStart}
                  onChange={(e) =>
                    setRunningLog((prev) => ({ ...prev, hourMeterStart: e.target.value }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">HM Off</label>
                <Input
                  placeholder="Contoh: 1520.9"
                  value={runningLog.hourMeterOff}
                  onChange={(e) =>
                    setRunningLog((prev) => ({ ...prev, hourMeterOff: e.target.value }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Parameter Mesin */}
          <div className="rounded-xl border border-[#f0eee9] bg-[#fafaf9] p-3.5">
            <span className="text-xs font-bold text-[#111111]">Parameter Mesin</span>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">
                  Charger Alternator (Volt)
                </label>
                <Input
                  placeholder="Contoh: 27.6"
                  value={runningLog.chargerAlternatorVolt}
                  onChange={(e) =>
                    setRunningLog((prev) => ({
                      ...prev,
                      chargerAlternatorVolt: e.target.value,
                    }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">
                  Frequency (Hz)
                </label>
                <Input
                  placeholder="Contoh: 50"
                  value={runningLog.frequencyHz}
                  onChange={(e) =>
                    setRunningLog((prev) => ({ ...prev, frequencyHz: e.target.value }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">
                  Oil Pressure (Kpa)
                </label>
                <Input
                  placeholder="Contoh: 350"
                  value={runningLog.oilPressureKpa}
                  onChange={(e) =>
                    setRunningLog((prev) => ({
                      ...prev,
                      oilPressureKpa: e.target.value,
                    }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#707784]">
                  Fuel Consumption (Liter)
                </label>
                <Input
                  placeholder="Contoh: 15"
                  value={runningLog.fuelConsumptionLiter}
                  onChange={(e) =>
                    setRunningLog((prev) => ({
                      ...prev,
                      fuelConsumptionLiter: e.target.value,
                    }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Voltage (Baris 1: 2 Card) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Voltage 3 Phase */}
            <div className="rounded-xl border border-[#f0eee9] bg-[#fafaf9] p-3">
              <span className="text-xs font-bold text-[#111111]">
                Voltage (3 Phase)
              </span>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#707784] whitespace-nowrap">
                    R-S:
                  </span>
                  <Input
                    placeholder="Volt (380)"
                    value={runningLog.voltage3Phase.rs}
                    onChange={(e) =>
                      setRunningLog((prev) => ({
                        ...prev,
                        voltage3Phase: { ...prev.voltage3Phase, rs: e.target.value },
                      }))
                    }
                    className="h-8 border-[#e6e2de] bg-white px-2 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#707784] whitespace-nowrap">
                    S-T:
                  </span>
                  <Input
                    placeholder="Volt (380)"
                    value={runningLog.voltage3Phase.st}
                    onChange={(e) =>
                      setRunningLog((prev) => ({
                        ...prev,
                        voltage3Phase: { ...prev.voltage3Phase, st: e.target.value },
                      }))
                    }
                    className="h-8 border-[#e6e2de] bg-white px-2 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#707784] whitespace-nowrap">
                    T-R:
                  </span>
                  <Input
                    placeholder="Volt (380)"
                    value={runningLog.voltage3Phase.tr}
                    onChange={(e) =>
                      setRunningLog((prev) => ({
                        ...prev,
                        voltage3Phase: { ...prev.voltage3Phase, tr: e.target.value },
                      }))
                    }
                    className="h-8 border-[#e6e2de] bg-white px-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Voltage Single Phase */}
            <div className="rounded-xl border border-[#f0eee9] bg-[#fafaf9] p-3">
              <span className="text-xs font-bold text-[#111111]">
                Voltage (Single Phase)
              </span>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#707784] whitespace-nowrap">
                    R-N:
                  </span>
                  <Input
                    placeholder="Volt (220)"
                    value={runningLog.voltageSinglePhase.rn}
                    onChange={(e) =>
                      setRunningLog((prev) => ({
                        ...prev,
                        voltageSinglePhase: {
                          ...prev.voltageSinglePhase,
                          rn: e.target.value,
                        },
                      }))
                    }
                    className="h-8 border-[#e6e2de] bg-white px-2 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#707784] whitespace-nowrap">
                    S-N:
                  </span>
                  <Input
                    placeholder="Volt (220)"
                    value={runningLog.voltageSinglePhase.sn}
                    onChange={(e) =>
                      setRunningLog((prev) => ({
                        ...prev,
                        voltageSinglePhase: {
                          ...prev.voltageSinglePhase,
                          sn: e.target.value,
                        },
                      }))
                    }
                    className="h-8 border-[#e6e2de] bg-white px-2 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#707784] whitespace-nowrap">
                    T-N:
                  </span>
                  <Input
                    placeholder="Volt (220)"
                    value={runningLog.voltageSinglePhase.tn}
                    onChange={(e) =>
                      setRunningLog((prev) => ({
                        ...prev,
                        voltageSinglePhase: {
                          ...prev.voltageSinglePhase,
                          tn: e.target.value,
                        },
                      }))
                    }
                    className="h-8 border-[#e6e2de] bg-white px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Load / Beban Arus (Baris 2: 1 Card Horizontal) */}
          <div className="rounded-xl border border-[#f0eee9] bg-[#fafaf9] p-3.5">
            <span className="text-xs font-bold text-[#111111]">
              Load / Beban Arus (Ampere)
            </span>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label className="mb-1 block text-center text-[11px] font-bold text-[#707784]">
                  R
                </label>
                <Input
                  placeholder="Ampere"
                  value={runningLog.loadAmpere.r}
                  onChange={(e) =>
                    setRunningLog((prev) => ({
                      ...prev,
                      loadAmpere: { ...prev.loadAmpere, r: e.target.value },
                    }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-center text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-center text-[11px] font-bold text-[#707784]">
                  S
                </label>
                <Input
                  placeholder="Ampere"
                  value={runningLog.loadAmpere.s}
                  onChange={(e) =>
                    setRunningLog((prev) => ({
                      ...prev,
                      loadAmpere: { ...prev.loadAmpere, s: e.target.value },
                    }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-center text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-center text-[11px] font-bold text-[#707784]">
                  T
                </label>
                <Input
                  placeholder="Ampere"
                  value={runningLog.loadAmpere.t}
                  onChange={(e) =>
                    setRunningLog((prev) => ({
                      ...prev,
                      loadAmpere: { ...prev.loadAmpere, t: e.target.value },
                    }))
                  }
                  className="h-9 border-[#e6e2de] bg-white text-center text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARD 3: Pengujian Fungsi ATS (Automatic Transfer Switch) */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-[#f0eee9] pb-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#ff8a2a]">
            <Zap className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#111111]">
              Pengujian Fungsi Sistem ATS
            </h3>
            <p className="text-xs text-[#707784]">
              Simulasi dan pengujian transfer switch otomatis beban PLN ke Genset
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Status Sistem ATS */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#111111]">
              Status Sistem ATS <span className="text-[#ff8a2a]">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setAtsTest((prev) => ({
                    ...prev,
                    systemAtsStatus: "OK",
                    photos: [],
                    handler: undefined,
                    repairForm: undefined,
                  }))
                }
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all",
                  atsTest.systemAtsStatus === "OK"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs"
                    : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:bg-[#f0f0ee]"
                )}
              >
                ✓ System ATS (OK)
              </button>
              <button
                type="button"
                onClick={() =>
                  setAtsTest((prev) => ({
                    ...prev,
                    systemAtsStatus: "NOK",
                    handler: prev.handler || "BES",
                    repairForm: prev.repairForm || "SAT/FRM/TS/065_REV:00_161020",
                  }))
                }
                className={cn(
                  "flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all",
                  atsTest.systemAtsStatus === "NOK"
                    ? "border-red-500 bg-red-50 text-red-600 shadow-xs"
                    : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:bg-[#f0f0ee]"
                )}
              >
                ✕ System ATS (NOK)
              </button>
            </div>
          </div>

          {/* IF ATS NOK: Follow-up controls */}
          {atsTest.systemAtsStatus === "NOK" ? (
            <div className="rounded-xl border border-rose-200 bg-white p-4 space-y-4 shadow-sm">
              {/* Akan Dihandle */}
              <div>
                <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                  AKAN DIHANDLE <span className="text-red-500">*</span>
                </p>
                <div className="flex rounded-xl bg-[#f5f5f3] p-1">
                  <button
                    type="button"
                    onClick={() => setAtsTest((prev) => ({ ...prev, handler: "BES" }))}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold transition-all",
                      atsTest.handler === "BES"
                        ? "bg-[#ff8a2a] text-white shadow"
                        : "text-[#707784] hover:text-[#111111]"
                    )}
                  >
                    BES
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAtsTest((prev) => ({ ...prev, handler: "EKSTERNAL" }))
                    }
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold transition-all",
                      atsTest.handler === "EKSTERNAL"
                        ? "bg-[#ff8a2a] text-white shadow"
                        : "text-[#707784] hover:text-[#111111]"
                    )}
                  >
                    Eksternal
                  </button>
                </div>
              </div>

              {/* Foto Bukti */}
              <div className="border-t border-[#eeeeec] pt-4">
                <p className="mb-2 text-xs font-bold text-[#707784]">
                  Foto bukti temuan ATS <span className="text-red-500">*</span>
                </p>
                {(!atsTest.photos || atsTest.photos.length === 0) ? (
                  <CameraCaptureButton
                    disabled={uploading}
                    uploading={uploading}
                    watermarkLines={buildChecklistPhotoWatermarkLines({
                      areaName: `${areaName} (Panel ATS)`,
                      userLabel: watermarkUserLabel,
                      userRole: watermarkUserRole,
                    })}
                    onCapture={(file) => void uploadPhoto(file)}
                  />
                ) : null}

                {atsTest.photos && atsTest.photos.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {atsTest.photos.map((photo) => (
                      <div key={photo.fileId} className="relative group">
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto({ url: photo.url })}
                          className="group block overflow-hidden rounded-xl border border-[#e8e8e6] bg-[#111111]"
                        >
                          <Image
                            src={photo.url}
                            alt="Foto bukti ATS"
                            width={80}
                            height={80}
                            className="size-20 object-cover"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePhoto(photo.fileId)}
                          className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white shadow"
                          title="Hapus foto"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                    <CameraCaptureButton
                      disabled={uploading}
                      uploading={uploading}
                      watermarkLines={buildChecklistPhotoWatermarkLines({
                        areaName: `${areaName} (Panel ATS)`,
                        userLabel: watermarkUserLabel,
                        userRole: watermarkUserRole,
                      })}
                      onCapture={(file) => void uploadPhoto(file)}
                    />
                  </div>
                ) : null}
              </div>

              {/* Form Tindak Lanjut */}
              <div className="border-t border-[#eeeeec] pt-4">
                <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider uppercase">
                  TINDAK LANJUT <span className="text-red-500">*</span>
                </p>
                <Select
                  value={atsTest.repairForm || "SAT/FRM/TS/065_REV:00_161020"}
                  onValueChange={(val) =>
                    setAtsTest((prev) => ({
                      ...prev,
                      repairForm: val || undefined,
                    }))
                  }
                >
                  <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#ff8a2a] focus:ring-offset-0">
                    <SelectValue placeholder="Pilih form tindak lanjut" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="rounded-xl border-[#dedede] bg-white shadow-lg">
                    {FOLLOW_UP_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.id}
                        value={opt.id}
                        className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {/* Parameter Baterai & Durasi */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#111111]">
                Voltage Battery on Charge
              </label>
              <Input
                placeholder="Contoh: 27.2 Volt"
                value={atsTest.voltageBatteryCharge}
                onChange={(e) =>
                  setAtsTest((prev) => ({ ...prev, voltageBatteryCharge: e.target.value }))
                }
                className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-xs font-medium"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#111111]">
                Voltage Battery on Load Start
              </label>
              <Input
                placeholder="Contoh: 24.5 Volt"
                value={atsTest.voltageBatteryLoadStart}
                onChange={(e) =>
                  setAtsTest((prev) => ({
                    ...prev,
                    voltageBatteryLoadStart: e.target.value,
                  }))
                }
                className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-xs font-medium"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#111111]">
                Durasi Waktu Perpindahan Beban
              </label>
              <Input
                placeholder="Contoh: 15 Detik / 1 Menit"
                value={atsTest.transferDurationMinutes}
                onChange={(e) =>
                  setAtsTest((prev) => ({
                    ...prev,
                    transferDurationMinutes: e.target.value,
                  }))
                }
                className="h-10 border-[#e6e2de] bg-[#fbfbfa] text-xs font-medium"
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2">
            <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Catatan SOP:</strong> Durasi waktu perpindahan beban PLN ke Genset
              pada saat Test ATS paling lama <strong>5 Menit</strong>.
            </span>
          </div>
        </div>
      </section>

      {/* CARD 4: Catatan dan Keterangan */}
      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_4px_16px_rgba(17,17,17,0.04)] sm:p-5">
        <label className="mb-1.5 block text-xs font-bold text-[#111111]">
          Catatan dan Keterangan Pelaksanaan
        </label>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan kondisi pengoperasian genset dan hasil pengetesan ATS..."
          value={catatanKeterangan}
          onChange={(e) => setCatatanKeterangan(e.target.value)}
          className="w-full rounded-xl border border-[#e6e2de] bg-[#fbfbfa] p-3 text-xs leading-5 focus-visible:border-[#ff8a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/20"
        />
      </section>

      {/* Error Notification */}
      {errors.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="size-4 shrink-0" />
            <span>Mohon lengkapi data berikut sebelum submit:</span>
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Approver & Footer Information */}
      <section className="rounded-2xl border border-[#f0eee9] bg-[#fbfbfa] p-4 text-xs text-[#707784] space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceae5] pb-2 font-semibold text-[#111111]">
          <span>NRA: SAT/FRM/TSM/001_Rev_000_211022</span>
          <span>INTERNAL USE ONLY</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#707784]">
          Reff NRA : SAT/KEB/TSM/001_Kebijakan Tes Genset dan Fungsi Automatic Transfer System Genset Branch/Depo/Bulky
        </p>
        <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 text-[11px]">
          <div>
            <span className="text-[#a0a0a0]">Diperiksa oleh:</span>
            <p className="font-semibold text-[#111111]">Branch Engineering Coordinator</p>
          </div>
          <div>
            <span className="text-[#a0a0a0]">Disetujui oleh:</span>
            <p className="font-semibold text-[#111111]">Branch Building & Maintenance Manager</p>
          </div>
        </div>
      </section>

      {/* SUBMIT BUTTON BAR */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="h-12 w-full rounded-xl bg-[#ff8a2a] text-sm font-bold text-white shadow-lg shadow-[#ff8a2a]/20 hover:bg-[#e67a22] disabled:opacity-50"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              <span>Menyimpan Laporan...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="size-4" />
              <span>Kirim Laporan Test ATS & Genset</span>
            </div>
          )}
        </Button>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewPhoto(undefined)}
        >
          <div
            className="relative max-h-[90vh] max-w-xl overflow-hidden rounded-2xl bg-white p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-bold text-[#111111]">
                Foto Bukti Temuan ATS
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(undefined)}
                className="grid size-7 place-items-center rounded-full bg-[#f5f5f3] text-[#111111]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-xl">
              <Image
                src={previewPhoto.url}
                alt="Foto Bukti Temuan ATS"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
