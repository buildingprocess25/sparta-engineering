"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react"

import type {
  FrmTsm004Payload,
  FrmTsm004Measurements,
} from "@/lib/checklists/payload-004"
import { FRM_TSM_004_PANELS } from "@/lib/checklists/frm-tsm-004"

type FrmTsm004FormProps = {
  reportCode: string
  areaCode: string
  periodKey: string
  formCode?: "FRM_TSM_004" | "FRM_TSM_004_REPAIR"
  watermarkUserLabel: string
  watermarkUserRole: string
  submitAction: (input: {
    reportCode: string
    payload: FrmTsm004Payload
  }) => Promise<{ ok: boolean; errors?: string[] }>
}

export function FrmTsm004Form({
  reportCode,
  areaCode,
  periodKey,
  formCode = "FRM_TSM_004",
  submitAction,
}: FrmTsm004FormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [expandedPanel, setExpandedPanel] = useState<string | null>(
    FRM_TSM_004_PANELS[0].id
  )
  const [keterangan, setKeterangan] = useState("")
  const [measurements, setMeasurements] = useState<
    Record<string, FrmTsm004Measurements>
  >(() => {
    const initial: Record<string, FrmTsm004Measurements> = {}
    for (const panel of FRM_TSM_004_PANELS) {
      initial[panel.id] = { rn: "", sn: "", tn: "", rs: "", st: "", tr: "" }
    }
    return initial
  })

  const handleInputChange = (
    panelId: string,
    field: keyof FrmTsm004Measurements,
    value: string
  ) => {
    setMeasurements((prev) => ({
      ...prev,
      [panelId]: {
        ...prev[panelId],
        [field]: value,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const payload: FrmTsm004Payload = {
      formCode,
      formName: "Form Checklist Main Cable",
      areaCode,
      period: "MONTHLY",
      periodKey,
      keterangan,
      panels: FRM_TSM_004_PANELS.map((p) => ({
        id: p.id,
        label: p.label,
        measurements: measurements[p.id],
      })),
    }

    startTransition(async () => {
      try {
        const result = await submitAction({ reportCode, payload })
        if (!result.ok) {
          setErrorMsg(result.errors?.[0] ?? "Gagal menyimpan laporan.")
          return
        }
        router.push("/dashboard/reports")
      } catch {
        setErrorMsg("Terjadi kesalahan sistem saat menyimpan laporan.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
          <h3 className="font-semibold text-gray-900">
            Pengukuran Tegangan Panel
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Isi nilai tegangan (dalam Volt) untuk setiap fasa. Kosongkan jika
            panel tidak tersedia di area ini.
          </p>
        </div>

        <div className="w-full border-t border-gray-100">
          {FRM_TSM_004_PANELS.map((panel) => {
            const data = measurements[panel.id]
            const isFilled = Object.values(data).some(
              (val) => val.trim() !== ""
            )
            const isExpanded = expandedPanel === panel.id

            return (
              <div
                key={panel.id}
                className="border-b border-gray-100 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => setExpandedPanel(isExpanded ? null : panel.id)}
                  className="flex w-full items-center justify-between bg-white px-5 py-4 hover:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="font-medium text-gray-900">
                      {panel.label}
                    </span>
                    {isFilled && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-5 pt-2 pb-5">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">
                          R-N (Volt)
                        </label>
                        <Input
                          type="number"
                          placeholder="Contoh: 220"
                          value={data.rn}
                          onChange={(e) =>
                            handleInputChange(panel.id, "rn", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">
                          S-N (Volt)
                        </label>
                        <Input
                          type="number"
                          placeholder="Contoh: 220"
                          value={data.sn}
                          onChange={(e) =>
                            handleInputChange(panel.id, "sn", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">
                          T-N (Volt)
                        </label>
                        <Input
                          type="number"
                          placeholder="Contoh: 220"
                          value={data.tn}
                          onChange={(e) =>
                            handleInputChange(panel.id, "tn", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">
                          R-S (Volt)
                        </label>
                        <Input
                          type="number"
                          placeholder="Contoh: 380"
                          value={data.rs}
                          onChange={(e) =>
                            handleInputChange(panel.id, "rs", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">
                          S-T (Volt)
                        </label>
                        <Input
                          type="number"
                          placeholder="Contoh: 380"
                          value={data.st}
                          onChange={(e) =>
                            handleInputChange(panel.id, "st", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500">
                          T-R (Volt)
                        </label>
                        <Input
                          type="number"
                          placeholder="Contoh: 380"
                          value={data.tr}
                          onChange={(e) =>
                            handleInputChange(panel.id, "tr", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-900">Keterangan</h3>
        <textarea
          placeholder="Tuliskan catatan tambahan (opsional)..."
          value={keterangan}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setKeterangan(e.target.value)
          }
          className="min-h-[100px] w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {/* <p className="mt-3 text-xs leading-relaxed text-gray-500">
          Catatan: Selisih hasil ukur tegangan antara LVMDP - MDP - SDP adalah
          meningkat 5% dan turun 10%.
        </p> */}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-1 bg-[#f5f5f3]/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 w-full bg-[#111111] text-white shadow-[0_8px_18px_rgba(17,17,17,0.18)] hover:bg-[#242424]"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Laporan
        </Button>
      </div>
    </form>
  )
}
