"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Trash2, 
  Wrench, 
  Calculator, 
  AlertCircle, 
  Check, 
  Loader2, 
  Building2, 
  Calendar, 
  User, 
  FileText,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

interface MaterialItem {
  id: string
  namaBarang: string
  jumlah: number
  satuan: string
  hargaUnit: number
  total: number
}

interface SparePartItem {
  id: string
  namaPart: string
  nomorPart: string
  asalPart: "STOCK" | "PB"
  jumlahPart: number
}

interface ItemFollowUp014 {
  materials: MaterialItem[]
  catatan?: string
}

interface ItemFollowUp065 {
  jenis: "PERBAIKAN" | "PENGGANTIAN_SPARE_PART"
  namaUnit: string
  merk: string
  nomorUnit: string
  nomorTiketProblem: string
  analisa: string
  tindakan: string
  parts: SparePartItem[]
}

interface FollowUpUnit {
  key: string
  rawIndex: number
  itemId: string
  label: string
  condition: string
  notes?: string
  formType: "014" | "065"
  unitNumber: number
  totalUnitsOfThisItem: number
}

interface FollowUpFormsEditorProps {
  reportCode: string
  payload: any
  context: {
    branchName: string
    authorName: string
    areaName: string
    areaCode: string
    createdAt: string
  }
}

export function FollowUpFormsEditor({
  reportCode,
  payload,
  context,
}: FollowUpFormsEditorProps) {
  const router = useRouter()
  const rawItems: any[] = payload?.items || []

  // Extract all units that require Form 014 or Form 065 in exact order
  const followUpUnits: FollowUpUnit[] = useMemo(() => {
    const units: FollowUpUnit[] = []
    
    // Group counts to calculate "Unit #X of Y"
    const itemCounts: Record<string, number> = {}
    rawItems.forEach((item) => {
      if (
        item.repairForm === "SAT/FRM/TSM/014_REV:000_060423" ||
        item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
      ) {
        itemCounts[item.id] = (itemCounts[item.id] || 0) + 1
      }
    })

    const itemTracker: Record<string, number> = {}

    rawItems.forEach((item, index) => {
      const is014 = item.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
      const is065 = item.repairForm === "SAT/FRM/TS/065_REV:00_161020"

      if (is014 || is065) {
        itemTracker[item.id] = (itemTracker[item.id] || 0) + 1
        units.push({
          key: `unit-${item.id}-${index}`,
          rawIndex: index,
          itemId: item.id,
          label: item.label,
          condition: item.condition || "RUSAK",
          notes: item.notes || "",
          formType: is014 ? "014" : "065",
          unitNumber: itemTracker[item.id],
          totalUnitsOfThisItem: itemCounts[item.id] || 1,
        })
      }
    })

    return units
  }, [rawItems])

  const [currentStep, setCurrentStep] = useState(0)

  // Initialize form 014 state keyed by unit.key
  const [data014, setData014] = useState<Record<string, ItemFollowUp014>>(() => {
    const initial: Record<string, ItemFollowUp014> = {}
    followUpUnits.forEach((unit) => {
      if (unit.formType === "014") {
        const item = rawItems[unit.rawIndex]
        const existing = item?.followUp014 || item?.followUpData
        if (existing?.materials && Array.isArray(existing.materials) && existing.materials.length > 0) {
          initial[unit.key] = {
            materials: existing.materials,
            catatan: existing.catatan || unit.notes || "",
          }
        } else {
          initial[unit.key] = {
            materials: [
              {
                id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                namaBarang: unit.label,
                jumlah: 1,
                satuan: "Pcs",
                hargaUnit: existing?.hargaUnit ? Number(existing.hargaUnit) : 0,
                total: existing?.hargaUnit ? Number(existing.hargaUnit) : 0,
              },
            ],
            catatan: unit.notes || "",
          }
        }
      }
    })
    return initial
  })

  // Initialize form 065 state keyed by unit.key
  const [data065, setData065] = useState<Record<string, ItemFollowUp065>>(() => {
    const initial: Record<string, ItemFollowUp065> = {}
    followUpUnits.forEach((unit) => {
      if (unit.formType === "065") {
        const item = rawItems[unit.rawIndex]
        const existing = item?.followUp065 || item?.followUpData
        initial[unit.key] = {
          jenis: existing?.jenis || "PENGGANTIAN_SPARE_PART",
          namaUnit: existing?.namaUnit || unit.label,
          merk: existing?.merk || "",
          nomorUnit: existing?.nomorUnit || item?.unitNo || "",
          nomorTiketProblem: existing?.nomorTiketProblem || "",
          analisa: existing?.analisa || unit.notes || "",
          tindakan: existing?.tindakan || "",
          parts: existing?.parts && Array.isArray(existing.parts) && existing.parts.length > 0
            ? existing.parts
            : [
                {
                  id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  namaPart: existing?.namaPart || "",
                  nomorPart: existing?.nomorPart || "",
                  asalPart: existing?.asalPart || "STOCK",
                  jumlahPart: existing?.jumlahPart ? Number(existing.jumlahPart) : 1,
                },
              ],
        }
      }
    })
    return initial
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Current active unit
  const activeUnit = followUpUnits[currentStep]
  const totalSteps = followUpUnits.length

  // Material helpers for 014
  const addMaterialRow = (unitKey: string) => {
    setData014((prev) => {
      const current = prev[unitKey] || { materials: [], catatan: "" }
      return {
        ...prev,
        [unitKey]: {
          ...current,
          materials: [
            ...current.materials,
            {
              id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              namaBarang: "",
              jumlah: 1,
              satuan: "Pcs",
              hargaUnit: 0,
              total: 0,
            },
          ],
        },
      }
    })
  }

  const removeMaterialRow = (unitKey: string, matId: string) => {
    setData014((prev) => {
      const current = prev[unitKey]
      if (!current || current.materials.length <= 1) return prev
      return {
        ...prev,
        [unitKey]: {
          ...current,
          materials: current.materials.filter((m) => m.id !== matId),
        },
      }
    })
  }

  const updateMaterialField = (
    unitKey: string,
    matId: string,
    field: keyof MaterialItem,
    val: any
  ) => {
    setData014((prev) => {
      const current = prev[unitKey]
      if (!current) return prev
      const updatedMaterials = current.materials.map((m) => {
        if (m.id !== matId) return m
        const updated = { ...m, [field]: val }
        if (field === "jumlah" || field === "hargaUnit") {
          const qty = field === "jumlah" ? Number(val) || 0 : m.jumlah
          const price = field === "hargaUnit" ? Number(val) || 0 : m.hargaUnit
          updated.total = qty * price
        }
        return updated
      })
      return {
        ...prev,
        [unitKey]: {
          ...current,
          materials: updatedMaterials,
        },
      }
    })
  }

  // Spare part helpers for 065
  const updateField065 = (unitKey: string, field: keyof ItemFollowUp065, val: any) => {
    setData065((prev) => ({
      ...prev,
      [unitKey]: {
        ...(prev[unitKey] || {
          jenis: "PENGGANTIAN_SPARE_PART",
          namaUnit: "",
          merk: "",
          nomorUnit: "",
          nomorTiketProblem: "",
          analisa: "",
          tindakan: "",
          parts: [],
        }),
        [field]: val,
      },
    }))
  }

  const addSparePartRow = (unitKey: string) => {
    setData065((prev) => {
      const current = prev[unitKey]
      if (!current) return prev
      return {
        ...prev,
        [unitKey]: {
          ...current,
          parts: [
            ...current.parts,
            {
              id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              namaPart: "",
              nomorPart: "",
              asalPart: "STOCK",
              jumlahPart: 1,
            },
          ],
        },
      }
    })
  }

  const removeSparePartRow = (unitKey: string, partId: string) => {
    setData065((prev) => {
      const current = prev[unitKey]
      if (!current || current.parts.length <= 1) return prev
      return {
        ...prev,
        [unitKey]: {
          ...current,
          parts: current.parts.filter((p) => p.id !== partId),
        },
      }
    })
  }

  const updateSparePartField = (
    unitKey: string,
    partId: string,
    field: keyof SparePartItem,
    val: any
  ) => {
    setData065((prev) => {
      const current = prev[unitKey]
      if (!current) return prev
      return {
        ...prev,
        [unitKey]: {
          ...current,
          parts: current.parts.map((p) =>
            p.id === partId ? { ...p, [field]: val } : p
          ),
        },
      }
    })
  }

  // Calculate current unit subtotal for 014
  const currentUnitSubtotal = useMemo(() => {
    if (!activeUnit || activeUnit.formType !== "014") return 0
    const itemData = data014[activeUnit.key]
    if (!itemData) return 0
    return itemData.materials.reduce((sum, m) => sum + (Number(m.total) || 0), 0)
  }, [activeUnit, data014])

  // Total Estimasi Biaya (Grand total 014 across all units)
  const grandTotal014 = useMemo(() => {
    return Object.values(data014).reduce((sum, item) => {
      return sum + item.materials.reduce((mSum, m) => mSum + (Number(m.total) || 0), 0)
    }, 0)
  }, [data014])

  const formattedDate = new Date(context.createdAt || Date.now()).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  )

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      // Merge follow up data into items
      const updatedItems = rawItems.map((item: any, idx: number) => {
        const unit = followUpUnits.find((u) => u.rawIndex === idx)
        if (!unit) return item

        if (unit.formType === "014") {
          const item014 = data014[unit.key]
          return {
            ...item,
            followUp014: item014,
            followUpData: {
              materials: item014?.materials || [],
              totalCost: item014?.materials.reduce((s, m) => s + (Number(m.total) || 0), 0) || 0,
              catatan: item014?.catatan || "",
            },
          }
        }

        if (unit.formType === "065") {
          const item065 = data065[unit.key]
          return {
            ...item,
            followUp065: item065,
            followUpData: {
              jenis: item065?.jenis,
              namaUnit: item065?.namaUnit,
              merk: item065?.merk,
              nomorUnit: item065?.nomorUnit,
              nomorTiketProblem: item065?.nomorTiketProblem,
              analisa: item065?.analisa,
              tindakan: item065?.tindakan,
              parts: item065?.parts || [],
            },
          }
        }

        return item
      })

      const has014 = followUpUnits.some((u) => u.formType === "014")
      const has065 = followUpUnits.some((u) => u.formType === "065")

      const res = await fetch(`/api/reports/${reportCode}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedItems,
          followUp014Summary: has014 ? { totalCost: grandTotal014 } : null,
          followUp065Summary: has065 ? { itemCount: followUpUnits.filter((u) => u.formType === "065").length } : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Gagal menyimpan form tindak lanjut.")
      }

      window.location.assign("/dashboard/reports")
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan data.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (totalSteps === 0) {
    return (
      <div className="rounded-2xl border border-[#dedede] bg-white p-6 text-center shadow-sm">
        <Info className="mx-auto mb-3 size-10 text-[#707784]" />
        <h2 className="text-base font-bold text-[#111111]">Tidak Ada Form Lanjutan</h2>
        <p className="mt-1 text-xs text-[#707784]">
          Semua item checklist dalam kondisi baik atau telah selesai tanpa biaya.
        </p>
        <button
          onClick={() => router.push("/dashboard/reports")}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#ff8a2a] px-6 text-xs font-bold text-white shadow-sm"
        >
          Kembali ke Daftar Laporan
        </button>
      </div>
    )
  }

  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="flex flex-col gap-5 pb-32">
      {/* Context Bar */}
      <div className="rounded-xl border border-[#dedede] bg-white p-3.5 shadow-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-[#707784]" />
            <div className="min-w-0">
              <p className="text-[10px] text-[#707784] font-medium">Branch / Depo</p>
              <p className="font-semibold text-[#111111] truncate">{context.branchName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-[#707784]" />
            <div className="min-w-0">
              <p className="text-[10px] text-[#707784] font-medium">Lokasi Pekerjaan</p>
              <p className="font-semibold text-[#111111] truncate">{context.areaName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-[#707784]" />
            <div className="min-w-0">
              <p className="text-[10px] text-[#707784] font-medium">Tanggal</p>
              <p className="font-semibold text-[#111111] truncate">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="size-4 shrink-0 text-[#707784]" />
            <div className="min-w-0">
              <p className="text-[10px] text-[#707784] font-medium">Pelapor</p>
              <p className="font-semibold text-[#111111] truncate">{context.authorName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Progress Card */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-full bg-[#111111] text-xs font-bold text-white">
              {currentStep + 1}
            </span>
            <span className="text-xs font-bold text-[#111111]">
              Langkah {currentStep + 1} dari {totalSteps}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#707784]">
            {Math.round(((currentStep + 1) / totalSteps) * 100)}% Selesai
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-[#f0f0ee] overflow-hidden">
          <div 
            className="h-full bg-[#ff8a2a] transition-all duration-300 ease-out rounded-full"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Current Unit Badge Header */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f0ee] pt-3">
          <div>
            <p className="text-[11px] font-semibold text-[#707784] uppercase tracking-wider">
              Item Sedang Diisi:
            </p>
            <h2 className="text-base font-bold text-[#111111] flex items-center gap-2 mt-0.5">
              <span>{activeUnit.label}</span>
              {activeUnit.totalUnitsOfThisItem > 1 && (
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
                  Unit {activeUnit.unitNumber} dari {activeUnit.totalUnitsOfThisItem}
                </span>
              )}
            </h2>
          </div>

          <div>
            {activeUnit.formType === "014" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ffc9a3] bg-[#fff5ed] px-2.5 py-1 text-xs font-bold text-[#c75f00]">
                <Calculator className="size-3.5" />
                Form 014 (Estimasi Biaya)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ffd7bc] bg-[#fff5ed] px-2.5 py-1 text-xs font-bold text-[#c75f00]">
                <Wrench className="size-3.5" />
                Form 065 (Spare Part)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* STEP CONTENT: FORM 014 (ESTIMASI BIAYA SIPIL & ME) */}
      {activeUnit.formType === "014" && (() => {
        const itemData = data014[activeUnit.key] || { materials: [], catatan: "" }

        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[#ffc9a3] bg-[#fff8f3] p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#943d00]">Form Estimasi Biaya Sipil & ME (014)</span>
                {activeUnit.notes && (
                  <span className="text-[11px] text-[#b85a0c] italic truncate max-w-[200px]">
                    Catatan: {activeUnit.notes}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[#a64f00] leading-relaxed">
                Tambahkan rincian material, jasa, atau bahan yang diperlukan untuk memperbaiki {activeUnit.label}.
              </p>
            </div>

            {/* List of Material Cards for Mobile */}
            <div className="flex flex-col gap-3">
              {itemData.materials.map((m, mIdx) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-[#e8e8e6] bg-white p-4 shadow-xs flex flex-col gap-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#f4f4f2] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-[#ff8a2a]/15 text-xs font-bold text-[#ff8a2a]">
                        {mIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-[#111111]">
                        Rincian Material #{mIdx + 1}
                      </span>
                    </div>
                    {itemData.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMaterialRow(activeUnit.key, m.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                      Nama Barang / Material / Pekerjaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="mis. Semen Portland 50kg, Cat Tembok, Pipa PVC"
                      value={m.namaBarang}
                      onChange={(e) =>
                        updateMaterialField(activeUnit.key, m.id, "namaBarang", e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                        Jumlah (Qty)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={m.jumlah}
                        onChange={(e) =>
                          updateMaterialField(activeUnit.key, m.id, "jumlah", e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                        Satuan
                      </label>
                      <input
                        type="text"
                        placeholder="Pcs, Zak, Meter"
                        value={m.satuan}
                        onChange={(e) =>
                          updateMaterialField(activeUnit.key, m.id, "satuan", e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                      Harga Satuan (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={m.hargaUnit || ""}
                        onChange={(e) =>
                          updateMaterialField(activeUnit.key, m.id, "hargaUnit", e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 pl-10 pr-3 text-sm font-semibold focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-dashed border-[#e8e8e6] pt-2.5">
                    <span className="text-xs text-zinc-500 font-medium">Subtotal Barang Ini:</span>
                    <span className="text-sm font-bold text-[#111111]">
                      Rp {(m.total || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Material Button */}
            <button
              type="button"
              onClick={() => addMaterialRow(activeUnit.key)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ff8a2a] bg-[#fff8f3] text-xs font-bold text-[#ff8a2a] transition-colors hover:bg-[#fff0e3]"
            >
              <Plus className="size-4" />
              Tambah Rincian Material Lainnya
            </button>

            {/* Subtotal Card for this unit */}
            <div className="rounded-xl border border-[#ffd7bc] bg-[#fffaf5] p-3.5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#8a3d00]">
                Subtotal Estimasi Unit Ini:
              </span>
              <span className="text-base font-bold text-[#ff8a2a]">
                Rp {currentUnitSubtotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )
      })()}

      {/* STEP CONTENT: FORM 065 (PERBAIKAN / PENGGANTIAN SPARE PART EQUIPMENT) */}
      {activeUnit.formType === "065" && (() => {
        const itemData = data065[activeUnit.key] || {
          jenis: "PENGGANTIAN_SPARE_PART",
          namaUnit: activeUnit.label,
          merk: "",
          nomorUnit: "",
          nomorTiketProblem: "",
          analisa: activeUnit.notes || "",
          tindakan: "",
          parts: [],
        }

        return (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[#ffd7bc] bg-[#fff8f3] p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#c75f00]">
                  Form Penggantian Spare Part Equipment (065)
                </span>
                {activeUnit.notes && (
                  <span className="text-[11px] text-[#a64f00] italic truncate max-w-[200px]">
                    Catatan: {activeUnit.notes}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[#8a3d00] leading-relaxed">
                Lengkapi identitas unit equipment, analisa kerusakan, tindakan, dan ketersediaan spare part.
              </p>
            </div>

            {/* Segmented Control for Jenis Pekerjaan */}
            <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs">
              <label className="text-xs font-bold text-zinc-700 mb-2 block">
                Jenis Pekerjaan
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() => updateField065(activeUnit.key, "jenis", "PERBAIKAN")}
                  className={`h-10 rounded-lg text-xs font-bold transition-all ${
                    itemData.jenis === "PERBAIKAN"
                      ? "bg-[#ff8a2a] text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Perbaikan
                </button>
                <button
                  type="button"
                  onClick={() => updateField065(activeUnit.key, "jenis", "PENGGANTIAN_SPARE_PART")}
                  className={`h-10 rounded-lg text-xs font-bold transition-all ${
                    itemData.jenis === "PENGGANTIAN_SPARE_PART"
                      ? "bg-[#ff8a2a] text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Penggantian Spare Part
                </button>
              </div>
            </div>

            {/* Unit Identity Card */}
            <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs flex flex-col gap-3.5">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Identitas Unit Equipment
              </h3>

              {/* Baris 1: Nama Unit / Equipment & Merk / Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                    Nama Unit / Equipment
                  </label>
                  <input
                    type="text"
                    value={itemData.namaUnit}
                    onChange={(e) => updateField065(activeUnit.key, "namaUnit", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                    Merk / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="mis. Daikin, Mitsubishi"
                    value={itemData.merk}
                    onChange={(e) => updateField065(activeUnit.key, "merk", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Baris 2: No. Unit / Asset & No. Tiket Problem (Opsional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                    No. Unit / Asset
                  </label>
                  <input
                    type="text"
                    placeholder="mis. AC-01, P-02"
                    value={itemData.nomorUnit}
                    onChange={(e) => updateField065(activeUnit.key, "nomorUnit", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                    No. Tiket Problem (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="mis. TKT-2026-0901"
                    value={itemData.nomorTiketProblem}
                    onChange={(e) => updateField065(activeUnit.key, "nomorTiketProblem", e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Analisa & Tindakan Card */}
            <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs flex flex-col gap-3.5">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Analisa & Tindakan
              </h3>

              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                  Analisa Kerusakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={itemData.analisa}
                  onChange={(e) => updateField065(activeUnit.key, "analisa", e.target.value)}
                  placeholder="Uraikan analisa penyebab kerusakan..."
                  className="w-full rounded-xl border border-[#dedede] bg-zinc-50/50 p-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                  Tindakan Perbaikan
                </label>
                <textarea
                  rows={2}
                  value={itemData.tindakan}
                  onChange={(e) => updateField065(activeUnit.key, "tindakan", e.target.value)}
                  placeholder="Langkah atau tindakan perbaikan yang diambil..."
                  className="w-full rounded-xl border border-[#dedede] bg-zinc-50/50 p-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all resize-y"
                />
              </div>
            </div>

            {/* Spare Parts Card List (if Penggantian Spare Part) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  Daftar Spare Part yang Dibutuhkan
                </h3>
              </div>

              {itemData.parts.map((p, pIdx) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-[#ffd7bc] bg-white p-4 shadow-xs flex flex-col gap-3.5"
                >
                  <div className="flex items-center justify-between border-b border-[#fff5ed] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-[#ff8a2a]/15 text-xs font-bold text-[#ff8a2a]">
                        {pIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-[#111111]">
                        Spare Part #{pIdx + 1}
                      </span>
                    </div>
                    {itemData.parts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSparePartRow(activeUnit.key, p.id)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Hapus part ini"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* Baris 1: Nama Part & Nomor Part / Seri */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                        Nama Part <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="mis. Filter Dryer, Kapasitor 45uF, Bearing"
                        value={p.namaPart}
                        onChange={(e) =>
                          updateSparePartField(activeUnit.key, p.id, "namaPart", e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                        Nomor Part / Seri
                      </label>
                      <input
                        type="text"
                        placeholder="Part number / seri (jika ada)"
                        value={p.nomorPart}
                        onChange={(e) =>
                          updateSparePartField(activeUnit.key, p.id, "nomorPart", e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Baris 2: Asal Part & Jumlah Part */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                        Asal Part
                      </label>
                      <Select
                        value={p.asalPart}
                        onValueChange={(val) =>
                          updateSparePartField(activeUnit.key, p.id, "asalPart", val as "STOCK" | "PB")
                        }
                      >
                        <SelectTrigger className="w-full !h-11 h-11 rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm font-medium text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.02)] outline-none focus:border-[#ff8a2a]/50 focus:ring-3 focus:ring-[#ff8a2a]/20 focus-visible:border-[#ff8a2a]/50 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/20 focus-visible:ring-offset-0 transition-all">
                          <span className="flex-1 text-left truncate">
                            {p.asalPart === "STOCK" ? "Stock Gudang" : "PB (Pengadaan Baru)"}
                          </span>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} className="rounded-xl border-[#dedede] bg-white shadow-lg">
                          <SelectItem
                            value="STOCK"
                            className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                          >
                            Stock Gudang
                          </SelectItem>
                          <SelectItem
                            value="PB"
                            className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                          >
                            PB (Pengadaan Baru)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 mb-1 block">
                        Jumlah Part
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={p.jumlahPart}
                        onChange={(e) =>
                          updateSparePartField(
                            activeUnit.key,
                            p.id,
                            "jumlahPart",
                            Number(e.target.value) || 1
                          )
                        }
                        className="h-11 w-full rounded-xl border border-[#dedede] bg-zinc-50/50 px-3 text-sm font-semibold focus:border-[#ff8a2a] focus:bg-white focus:ring-2 focus:ring-[#ff8a2a]/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addSparePartRow(activeUnit.key)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ff8a2a] bg-[#fff8f3] text-xs font-bold text-[#ff8a2a] transition-colors hover:bg-[#fff0e3]"
              >
                <Plus className="size-4" />
                Tambah Baris Spare Part
              </button>
            </div>
          </div>
        )
      })()}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Inline Navigation Controls directly below content */}
      <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-xs mt-2">
        <div className="flex items-center justify-between gap-3">
          {/* Left Navigation Control */}
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#dedede] bg-white px-4 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <ChevronLeft className="size-4" />
              Sebelumnya
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/dashboard/reports")}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dedede] bg-white px-3.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-colors"
            >
              Nanti Saja
            </button>
          )}

          {/* Center Info Indicator */}
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold text-zinc-900">
              Unit {currentStep + 1} dari {totalSteps}
            </span>
            <span className="text-[10px] text-zinc-500 max-w-[130px] truncate">
              {activeUnit.label}
            </span>
          </div>

          {/* Right Navigation / Submit Control */}
          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#ff8a2a] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#f07b1a] transition-all active:scale-95"
            >
              Selanjutnya
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff8a2a] px-5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(255,138,42,0.35)] hover:bg-[#f07b1a] transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Simpan Form
                  <Check className="size-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
