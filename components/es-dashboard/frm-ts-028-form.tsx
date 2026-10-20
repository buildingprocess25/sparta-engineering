"use client"

import * as React from "react"
import Image from "next/image"
import {
  AlertCircle,
  Battery,
  BatteryCharging,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Gauge,
  Loader2,
  Plus,
  Search,
  Send,
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
import {
  BATTERY_INSPECTION_ITEMS,
  FRM_TS_028_FORM_CODE,
  FRM_TS_028_NRA,
  FRM_TS_028_REF_NRA,
  type BatteryInspectionItem,
  type CellMeasurement,
} from "@/lib/checklists/frm-ts-028"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPayloadItem,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type FrmTs028FormProps = {
  reportCode: string
  areaCode: string
  areaName: string
  periodKey: string
  watermarkUserLabel: string
  watermarkUserRole: string
  formCode?: string
  isRepairMode?: boolean
  defaultUnitName?: string
  defaultUnitNo?: number
  submitAction(input: {
    reportCode: string
    payload: ChecklistPayload
  }): Promise<{ ok: true; isSafe?: boolean } | { ok: false; errors: string[] }>
  onSuccess?(data: { isSafe: boolean }): void
}

type FollowUpActionType = "014" | "065" | "REPAIR_TANPA_BIAYA"

type ItemState = {
  condition: ChecklistCondition | ""
  notes: string
  photos: ChecklistPhoto[]
  followUpAction?: FollowUpActionType
  problemDescription?: string
}

export function FrmTs028Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode = FRM_TS_028_FORM_CODE,
  isRepairMode = false,
  defaultUnitName = "",
  defaultUnitNo = 1,
  submitAction,
  onSuccess,
}: FrmTs028FormProps) {
  // Determine initial Unit Type from equipment name if available
  const initialUnitType =
    defaultUnitName.toUpperCase().includes("PALLET") ||
    defaultUnitName.toUpperCase().includes("MOVER")
      ? "Pallet Mover"
      : "Forklift"

  // 1. Header Metadata State
  const [warehouse, setWarehouse] = React.useState(areaName || "Warehouse")
  const [unitType, setUnitType] = React.useState<"Forklift" | "Pallet Mover">(initialUnitType)
  const [unitNo, setUnitNo] = React.useState(String(defaultUnitNo || 1))
  const [volt, setVolt] = React.useState(initialUnitType === "Pallet Mover" ? "24V" : "48V")
  const [brand, setBrand] = React.useState<"Jungheinrich" | "Crown">("Jungheinrich")
  const [generalCondition, setGeneralCondition] = React.useState("Baik")

  // 2. Cell Measurements State (12 cells for Pallet Mover, 24 for Forklift)
  const initialCellCount = unitType === "Pallet Mover" ? 12 : 24
  const [cellCount, setCellCount] = React.useState<number>(initialCellCount)
  const [cellData, setCellData] = React.useState<CellMeasurement[]>(() =>
    Array.from({ length: 24 }, (_, idx) => ({
      cellNo: idx + 1,
      bj: "",
      voltage: "",
    }))
  )

  // Sync volt & cell count when unitType changes
  const handleUnitTypeChange = (val: "Forklift" | "Pallet Mover") => {
    setUnitType(val)
    if (val === "Pallet Mover") {
      setVolt("24V")
      setCellCount(12)
    } else {
      setVolt("48V")
      setCellCount(24)
    }
  }

  // Update single cell measurement
  const updateCell = (cellNo: number, field: "bj" | "voltage", value: string) => {
    setCellData((prev) =>
      prev.map((c) => (c.cellNo === cellNo ? { ...c, [field]: value } : c))
    )
  }

  // Quick prefill normal cells (e.g. B.J = 1.28, Volt = 2.10V)
  const prefillNormalCells = () => {
    setCellData((prev) =>
      prev.map((c) =>
        c.cellNo <= cellCount
          ? {
              ...c,
              bj: c.bj || "1.28",
              voltage: c.voltage || "2.10",
            }
          : c
      )
    )
  }

  // Calculate total voltage
  const totalVoltage = React.useMemo(() => {
    let sum = 0
    let validCount = 0
    for (let i = 0; i < cellCount; i++) {
      const v = parseFloat(cellData[i]?.voltage || "0")
      if (!isNaN(v) && v > 0) {
        sum += v
        validCount++
      }
    }
    return validCount > 0 ? sum.toFixed(2) : "0.00"
  }, [cellData, cellCount])

  // 3. Inspection Items State (14 items)
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {}
    BATTERY_INSPECTION_ITEMS.forEach((it) => {
      initial[it.id] = {
        condition: isRepairMode ? "RUSAK" : "",
        notes: "",
        photos: [],
      }
    })
    return initial
  })

  // Follow-up modal state
  const [activeFollowUpItem, setActiveFollowUpItem] = React.useState<BatteryInspectionItem | null>(null)
  const [followUpAction, setFollowUpAction] = React.useState<FollowUpActionType>("065")
  const [problemDescription, setProblemDescription] = React.useState("")
  const [pendingPhotos, setPendingPhotos] = React.useState<ChecklistPhoto[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false)

  const handleCapturePhoto = async (file: File) => {
    if (!activeFollowUpItem) return
    setIsUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set(
        "context",
        JSON.stringify({
          kind: "CHECKLIST_ITEM",
          reportCode,
          formCode,
          itemId: activeFollowUpItem.id,
          sequence: pendingPhotos.length + 1,
        })
      )

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Upload foto gagal.")
      }

      setPendingPhotos((prev) => [...prev, payload])
    } catch (err: any) {
      alert(err.message || "Gagal mengunggah foto.")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [searchFilter, setSearchFilter] = React.useState("")

  // Set condition handler
  const setCondition = (itemId: string, cond: ChecklistCondition) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition: cond,
      },
    }))

    // If marked defective, prompt follow up modal
    if (cond === "RUSAK" || cond === "REPAIR" || cond === "URGENT") {
      const item = BATTERY_INSPECTION_ITEMS.find((it) => it.id === itemId)
      if (item) {
        const cur = items[itemId]
        setFollowUpAction(cur?.followUpAction || "065")
        setProblemDescription(cur?.problemDescription || cur?.notes || "")
        setPendingPhotos(cur?.photos || [])
        setActiveFollowUpItem(item)
      }
    }
  }

  // Mark all 14 items as OK (V)
  const markAllGood = () => {
    setItems((prev) => {
      const updated = { ...prev }
      BATTERY_INSPECTION_ITEMS.forEach((it) => {
        updated[it.id] = {
          ...updated[it.id],
          condition: "BAIK",
        }
      })
      return updated
    })
  }

  // Save follow up modal
  const saveFollowUp = () => {
    if (!activeFollowUpItem) return
    const id = activeFollowUpItem.id
    setItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        followUpAction,
        problemDescription,
        notes: problemDescription,
        photos: pendingPhotos,
      },
    }))
    setActiveFollowUpItem(null)
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Check unfilled items
    const unfilled = BATTERY_INSPECTION_ITEMS.filter((it) => !items[it.id]?.condition)
    if (unfilled.length > 0) {
      setSubmitError(`Harap isi semua kondisi komponen. Ada ${unfilled.length} item yang belum diisi.`)
      return
    }

    setIsSubmitting(true)

    // Build items payload
    const payloadItems: ChecklistPayloadItem[] = BATTERY_INSPECTION_ITEMS.map((it) => {
      const st = items[it.id]
      const cond = (st?.condition || "BAIK") as ChecklistCondition
      return {
        id: it.id,
        label: it.label,
        condition: cond,
        notes: st?.notes || st?.problemDescription || "",
        photos: st?.photos || [],
        followUpCode: st?.followUpAction,
        repairForm:
          st?.followUpAction === "014"
            ? "SAT/FRM/TSM/014_REV:000_060423"
            : st?.followUpAction === "065"
            ? "SAT/FRM/TS/065_REV:00_161020"
            : undefined,
        repairFormName:
          st?.followUpAction === "014"
            ? "Form Estimasi Biaya Sipil & ME (014)"
            : st?.followUpAction === "065"
            ? "Form Penggantian Spare Part (065)"
            : undefined,
      }
    })

    const payload: ChecklistPayload = {
      formCode,
      formName: "Form Monthly Checklist Battery",
      areaCode,
      period: "MONTHLY",
      periodKey,
      unitNo: unitNo.trim(),
      unitBrand: brand,
      unitModel: unitType,
      capacityKva: volt,
      generalNotes: JSON.stringify({
        warehouse,
        unitType,
        unitNo,
        volt,
        brand,
        generalCondition,
        cellCount,
        totalVoltage,
        cellMeasurements: cellData.slice(0, cellCount),
      }),
      items: payloadItems,
    }

    const validation = validateChecklistPayload(payload)
    if (!validation.valid) {
      setIsSubmitting(false)
      setSubmitError(validation.errors.join(", "))
      return
    }

    try {
      const res = await submitAction({ reportCode, payload })
      if (!res.ok) {
        setIsSubmitting(false)
        setSubmitError(res.errors.join(", "))
        return
      }

      if (onSuccess) {
        onSuccess({ isSafe: res.isSafe ?? true })
      } else {
        const needsFollowUp = payloadItems.some(
          (item) => item.followUpCode === "014" || item.followUpCode === "065"
        )
        if (needsFollowUp) {
          window.location.assign(`/dashboard/reports/${reportCode}/follow-up`)
        } else {
          window.location.assign("/dashboard/reports")
        }
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setSubmitError(err.message || "Terjadi kesalahan saat menyimpan checklist.")
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-20">
      {/* Official Form Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-[#ff8a2a] uppercase">
              {FRM_TS_028_NRA}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              FORM MONTHLY CHECKLIST BATTERY
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Pemeriksaan bulanan kondisi fisik baterai serta pengukuran parameter keasaman air accu (B.J) dan tegangan statik per cell (Forklift & Pallet Mover).
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-right">
            <BatteryCharging className="size-4 text-[#ff8a2a]" />
            <span className="font-mono text-xs font-bold text-slate-700">Periode: {periodKey}</span>
          </div>
        </div>

        {/* Form Metadata Inputs (WH, Unit, No. Unit, Volt, Merk, Kondisi) */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          {/* WH */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              WH / Lokasi
            </label>
            <Input
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              placeholder="Warehouse"
              className="h-8 text-xs font-semibold"
            />
          </div>

          {/* Unit Dropdown: Forklift / Pallet Mover */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Unit
            </label>
            <Select
              value={unitType}
              onValueChange={(val) => {
                if (val) handleUnitTypeChange(val as "Forklift" | "Pallet Mover")
              }}
            >
              <SelectTrigger className="h-8 text-xs font-semibold">
                <SelectValue placeholder="Pilih Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Forklift">Forklift (48V / 24 Cell)</SelectItem>
                <SelectItem value="Pallet Mover">Pallet Mover (24V / 12 Cell)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* No. Unit */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              No. Unit
            </label>
            <Input
              value={unitNo}
              onChange={(e) => setUnitNo(e.target.value)}
              placeholder="Unit 1"
              className="h-8 text-xs font-semibold"
            />
          </div>

          {/* Volt */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Voltase
            </label>
            <Input
              value={volt}
              onChange={(e) => setVolt(e.target.value)}
              placeholder="48V"
              className="h-8 text-xs font-semibold"
            />
          </div>

          {/* Merk Dropdown: Jungheinrich / Crown */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Merk
            </label>
            <Select
              value={brand}
              onValueChange={(val) => {
                if (val) setBrand(val as "Jungheinrich" | "Crown")
              }}
            >
              <SelectTrigger className="h-8 text-xs font-semibold">
                <SelectValue placeholder="Pilih Merk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jungheinrich">Jungheinrich</SelectItem>
                <SelectItem value="Crown">Crown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kondisi */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Kondisi Umum
            </label>
            <Select
              value={generalCondition}
              onValueChange={(val) => {
                if (val) setGeneralCondition(val)
              }}
            >
              <SelectTrigger className="h-8 text-xs font-semibold">
                <SelectValue placeholder="Kondisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baik">Baik</SelectItem>
                <SelectItem value="Cukup">Cukup</SelectItem>
                <SelectItem value="Kurang">Kurang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (14 Inspection Items) & Right (Cell Measurements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (14 Bagian/Komponen): 7 Cols on desktop */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Tabel Bagian / Komponen Fisik
                </h2>
                <p className="text-[11px] text-slate-500">14 item inspeksi fisik baterai</p>
              </div>

              {/* Action Button: Tandai Semua Baik */}
              <button
                type="button"
                onClick={markAllGood}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff8a2a] px-3 py-1.5 text-xs font-bold text-slate-950 shadow-2xs transition-colors hover:bg-[#e0751d]"
              >
                <Check className="size-3.5" />
                <span>Tandai Semua Baik</span>
              </button>
            </div>

            {/* Items List */}
            <div className="mt-3 divide-y divide-slate-100">
              {BATTERY_INSPECTION_ITEMS.map((item) => {
                const current = items[item.id]?.condition || ""
                const isDefect = current === "RUSAK" || current === "REPAIR" || current === "URGENT"

                return (
                  <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-600">
                        {item.number}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">
                          {item.label}
                        </p>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </div>
                    </div>

                    {/* Condition Selector Buttons (V, X, R, U, N) */}
                    <div className="flex items-center gap-1 self-end sm:self-center">
                      {(
                        [
                          { key: "BAIK", label: "V", title: "OK", color: "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" },
                          { key: "RUSAK", label: "X", title: "Not Good", color: "hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300" },
                          { key: "REPAIR", label: "R", title: "Repair", color: "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300" },
                          { key: "URGENT", label: "U", title: "Urgent", color: "hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300" },
                          { key: "TIDAK_ADA", label: "N", title: "None", color: "hover:bg-slate-100 text-slate-600" },
                        ] as const
                      ).map((btn) => {
                        const isSelected = current === btn.key

                        return (
                          <button
                            key={btn.key}
                            type="button"
                            title={btn.title}
                            onClick={() => setCondition(item.id, btn.key)}
                            className={cn(
                              "flex size-7 items-center justify-center rounded-md border text-xs font-bold transition-all",
                              isSelected
                                ? btn.key === "BAIK"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : btn.key === "RUSAK"
                                  ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                                  : btn.key === "REPAIR"
                                  ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                                  : btn.key === "URGENT"
                                  ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                                  : "bg-slate-200 text-slate-800 border-slate-300 font-semibold"
                                : `border-slate-200 bg-white text-slate-600 ${btn.color}`
                            )}
                          >
                            {btn.label}
                          </button>
                        )
                      })}

                      {/* Detail / Follow up indicator if defect */}
                      {isDefect && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFollowUpItem(item)
                            setFollowUpAction(items[item.id]?.followUpAction || "065")
                            setProblemDescription(items[item.id]?.problemDescription || items[item.id]?.notes || "")
                            setPendingPhotos(items[item.id]?.photos || [])
                          }}
                          className="ml-1 rounded px-1.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                        >
                          Tindak Lanjut & foto
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Plain uncolored Legend per user preference */}
            <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
              <span>
                <strong>Ket. Kondisi:</strong> V = OK • X = Not Good • R = Repair • U = Urgent • N = None
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Data Point 10 & 11 - Cell Measurements): 5 Cols on desktop */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Gauge className="size-4 text-[#ff8a2a]" />
                  <span>Data Point 10 & 11 (Cell Battery)</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  {cellCount} Cell terdaftar ({unitType} - {volt})
                </p>
              </div>

              {/* Helper button */}
              <button
                type="button"
                onClick={prefillNormalCells}
                className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline"
              >
                Isi Standar (1.28 / 2.1V)
              </button>
            </div>

            {/* Cell Measurement Table */}
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-12">No Cell</th>
                    <th className="py-2 px-2.5">B.J (Keasaman)</th>
                    <th className="py-2 px-2.5">Teg. Static (V)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {cellData.slice(0, cellCount).map((cell) => (
                    <tr key={cell.cellNo} className="hover:bg-slate-50/70">
                      <td className="py-1 px-2.5 text-center font-bold text-slate-700 bg-slate-50/50">
                        {cell.cellNo}
                      </td>
                      <td className="py-1 px-2">
                        <Input
                          type="text"
                          value={cell.bj}
                          onChange={(e) => updateCell(cell.cellNo, "bj", e.target.value)}
                          placeholder="1.28"
                          className="h-7 text-xs font-mono font-medium"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <Input
                          type="text"
                          value={cell.voltage}
                          onChange={(e) => updateCell(cell.cellNo, "voltage", e.target.value)}
                          placeholder="2.10"
                          className="h-7 text-xs font-mono font-medium"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t border-slate-200">
                  <tr>
                    <td colSpan={2} className="py-2 px-3 text-right text-xs">
                      Total Tegangan (V):
                    </td>
                    <td className="py-2 px-2.5 font-mono text-sm text-[#0072bc]">
                      {totalVoltage} V
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Cell Switcher (12 vs 24 cells) */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Ubah slot cell:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCellCount(12)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-bold border transition-colors",
                    cellCount === 12
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  12 Cell (Pallet Mover)
                </button>
                <button
                  type="button"
                  onClick={() => setCellCount(24)}
                  className={cn(
                    "rounded px-2 py-0.5 text-[10px] font-bold border transition-colors",
                    cellCount === 24
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  24 Cell (Forklift)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message if any */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit Bottom Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="text-xs text-slate-500">
          Form Monthly Checklist Battery • <strong>{reportCode}</strong>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-[#ff8a2a] px-6 py-2.5 text-xs font-bold text-slate-950 shadow-xs transition-all hover:bg-[#e0751d] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Menyimpan Laporan...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Simpan & Kirim Laporan</span>
            </>
          )}
        </button>
      </div>

      {/* Follow-up & Photo Modal for Defective Items */}
      {activeFollowUpItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase">
                  Item #{activeFollowUpItem.number}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeFollowUpItem.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveFollowUpItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
              {/* Follow-up Action Type */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Pilih Form Tindak Lanjut Perbaikan
                </label>
                <Select
                  value={followUpAction}
                  onValueChange={(val) => {
                    if (val) setFollowUpAction(val as FollowUpActionType)
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Jenis Form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="065">
                      SAT/FRM/TS/065 (Penggantian Spare Part Baterai / Terminal)
                    </SelectItem>
                    <SelectItem value="014">
                      SAT/FRM/TSM/014 (Estimasi Biaya Perbaikan Baterai)
                    </SelectItem>
                    <SelectItem value="REPAIR_TANPA_BIAYA">
                      Perbaikan Mandiri / Tanpa Biaya (Internal ES)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Problem Description */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Keterangan Kerusakan / Analisa Masalah
                </label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Deskripsikan kondisi kerusakan (misal: kabel terminal korosi, air aki keruh/kering)..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#ff8a2a] focus:outline-hidden focus:ring-1 focus:ring-[#ff8a2a]"
                />
              </div>

              {/* Photo Evidence */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Foto Bukti Temuan (Wajib untuk item rusak)
                </label>
                <div className="flex items-center gap-3">
                  <CameraCaptureButton
                    disabled={isUploadingPhoto}
                    uploading={isUploadingPhoto}
                    watermarkLines={buildChecklistPhotoWatermarkLines({
                      areaName: `${areaName} (Unit: ${unitNo || "-"})`,
                      userLabel: watermarkUserLabel,
                      userRole: watermarkUserRole,
                    })}
                    onCapture={(file) => void handleCapturePhoto(file)}
                  />
                  <span className="text-[11px] text-slate-500">
                    {pendingPhotos.length} foto terlampir
                  </span>
                </div>

                {/* Thumbnails */}
                {pendingPhotos.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    {pendingPhotos.map((p, idx) => (
                      <div
                        key={idx}
                        className="relative size-16 rounded-lg overflow-hidden border border-slate-200"
                      >
                        <Image
                          src={p.url}
                          alt="Foto Temuan"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPendingPhotos((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white hover:bg-black/90"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setActiveFollowUpItem(null)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveFollowUp}
                className="rounded-xl bg-[#ff8a2a] px-4 py-1.5 text-xs font-bold text-slate-950 shadow-2xs hover:bg-[#e0751d]"
              >
                Simpan Keterangan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
