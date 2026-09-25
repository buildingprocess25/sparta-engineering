"use client"

import * as React from "react"
import Image from "next/image"
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  Info,
  Loader2,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"

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
import { getChecklistConfig } from "@/lib/checklists/registry"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPayloadItem,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import {
  getPayloadPhotosForCondition,
  nextChecklistPhotoState,
} from "@/lib/checklists/photo-state"
import { validateChecklistPayload } from "@/lib/checklists/payload"
import { buildChecklistPhotoWatermarkLines } from "@/lib/checklists/photo-watermark"
import { cn } from "@/lib/utils"

export type ChecklistItemConfig = {
  id: string
  label: string
  icon: React.ElementType
}

export type ChecklistConfig = {
  formCode: string
  formName: string
  items: ChecklistItemConfig[]
  conditionOptions: ChecklistCondition[]
  conditionLabels: Record<ChecklistCondition, string>
  conditionRequiresPhoto: (condition?: ChecklistCondition) => boolean
  allowPartial?: boolean
}

export type SharedChecklistFormProps = {
  reportCode: string
  areaCode: string
  areaName: string
  periodKey: string
  watermarkUserLabel: string
  watermarkUserRole: string
  formCode: string
  submitAction(input: {
    reportCode: string
    payload: ChecklistPayload
  }): Promise<
    | { ok: true; isSafe?: boolean }
    | { ok: false; errors: string[] }
  >
}

type ItemState = {
  condition?: ChecklistCondition
  photos: ChecklistPhoto[]
  notes: string
  handler?: "BES" | "EKSTERNAL"
  repairForm?: string
  uploading: boolean
}

type UploadNotice = {
  tone: "loading" | "success" | "error"
  message: string
}

const FOLLOW_UP_LABELS: Record<string, string> = {
  "SAT/FRM/TSM/014_REV:000_060423": "Form Estimasi Biaya Sipil & ME (014)",
  "SAT/FRM/TS/065_REV:00_161020": "Form Penggantian Spare Part (065)",
  "REPAIR_TANPA_BIAYA": "Repair Tanpa Biaya",
}

type PreviewPhoto = {
  itemLabel: string
  url: string
}

export function SharedChecklistForm({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  watermarkUserLabel,
  watermarkUserRole,
  formCode,
  submitAction,
}: SharedChecklistFormProps) {
  const router = useRouter()
  const config = React.useMemo(() => getChecklistConfig(formCode), [formCode])
  
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() => {
    if (!config) return {}
    return Object.fromEntries(config.items.map((item) => [item.id, 1]))
  })
  
  const [items, setItems] = React.useState<Record<string, ItemState[]>>(() => {
    if (!config) return {}
    return Object.fromEntries(config.items.map((item) => [item.id, []]))
  })
  const [errors, setErrors] = React.useState<string[]>([])
  const [uploadNotice, setUploadNotice] = React.useState<UploadNotice>()
  const [previewPhoto, setPreviewPhoto] = React.useState<PreviewPhoto>()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(true)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!uploadNotice || uploadNotice.tone === "loading") return

    const timeoutId = window.setTimeout(() => setUploadNotice(undefined), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [uploadNotice])

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-[#686868]">Form config tidak ditemukan.</p>
      </div>
    )
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleItems = normalizedQuery
    ? config.items.filter((item) =>
        item.label.toLowerCase().includes(normalizedQuery)
      )
    : config.items
  const evaluatedCount = config.items.filter(item => items[item.id].every(state => state.condition)).length
  const totalCount = config.items.length
  const progressPercentage = Math.round((evaluatedCount / totalCount) * 100)
  
  const missingPhotoCount = config.items.reduce((sum, item) => {
    return sum + items[item.id].filter(state => config.conditionRequiresPhoto(state.condition) && state.photos.length === 0).length
  }, 0)
  
  const isUploading = Object.values(items).some(list => list.some(state => state.uploading))
  
  const hasEvaluatedItems = evaluatedCount > 0
  const isFullyEvaluated = evaluatedCount === totalCount
  const isEvaluationValid = config.allowPartial ? hasEvaluatedItems : isFullyEvaluated
  
  const hasMissingActionInfo = config.items.some((item) => {
    return items[item.id].some((state) => {
      const requiresAction = ["RUSAK", "REPAIR", "URGENT", "ADJUST_OR_ADD", "CLEAN"].includes(state.condition || "")
      if (!requiresAction) return false
      if (!state.handler) return true
      if (!state.notes.trim()) return true
      if (!state.repairForm) return true
      return false
    })
  })

  const canSubmit =
    isEvaluationValid &&
    missingPhotoCount === 0 &&
    !hasMissingActionInfo &&
    !isUploading &&
    !isPending

  function updateItemQty(itemId: string, qty: number) {
    if (qty < 1) return
    setQuantities(curr => ({ ...curr, [itemId]: qty }))
    setItems(curr => {
      const list = curr[itemId]
      if (list.length > qty) {
        return { ...curr, [itemId]: list.slice(0, qty) }
      }
      return curr
    })
  }

  function addDamagedUnit(itemId: string) {
    setItems(curr => {
      const list = curr[itemId]
      if (list.length >= (quantities[itemId] || 1)) return curr
      return { ...curr, [itemId]: [...list, { photos: [], notes: "", uploading: false }] }
    })
  }

  function removeDamagedUnit(itemId: string) {
    setItems(curr => {
      const list = curr[itemId]
      if (list.length === 0) return curr
      return { ...curr, [itemId]: list.slice(0, -1) }
    })
  }

  function updateItem(itemId: string, index: number, next: Partial<ItemState>) {
    setItems(curr => {
      const list = [...curr[itemId]]
      list[index] = { ...list[index], ...next }
      return { ...curr, [itemId]: list }
    })
  }

  async function uploadPhoto(itemId: string, index: number, file: File) {
    updateItem(itemId, index, { uploading: true })
    setUploadNotice({ tone: "loading", message: "Foto sedang diupload." })
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
          sequence: (items[itemId]?.[index]?.photos.length || 0) + 1,
        })
      )
      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Upload gagal.")
      }

      setItems(curr => {
        const list = [...curr[itemId]]
        list[index] = { ...list[index], uploading: false, photos: [...list[index].photos, payload] }
        return { ...curr, [itemId]: list }
      })
      setUploadNotice({ tone: "success", message: "Upload foto tersimpan." })
    } catch (error) {
      updateItem(itemId, index, { uploading: false })
      setUploadNotice({ tone: "error", message: "Upload foto gagal." })
      setErrors([error instanceof Error ? error.message : "Upload foto gagal."])
    }
  }

  function deletePhoto(itemId: string, index: number, fileId: string) {
    setItems(curr => {
      const list = [...curr[itemId]]
      list[index] = { ...list[index], photos: list[index].photos.filter(p => p.fileId !== fileId) }
      return { ...curr, [itemId]: list }
    })
  }

  function buildPayload(): ChecklistPayload {
    return {
      formCode,
      formName: config!.formName,
      areaCode,
      period: "MONTHLY",
      periodKey,
      items: config!.items.flatMap((item) => {
        const qty = quantities[item.id] || 1
        const damagedList = items[item.id] || []
        const goodCount = qty - damagedList.length

        const payloadItems: ChecklistPayloadItem[] = []
        for (let i = 0; i < goodCount; i++) {
          payloadItems.push({
            id: item.id,
            label: item.label,
            condition: "BAIK",
            photos: [],
            notes: "",
          })
        }
        for (const state of damagedList) {
          payloadItems.push({
            id: item.id,
            label: item.label,
            condition: state.condition ?? "TIDAK_ADA",
            photos: getPayloadPhotosForCondition(state.condition ?? "TIDAK_ADA", state.photos),
            notes: state.notes,
            handler: state.handler,
            repairForm: state.repairForm === "REPAIR_TANPA_BIAYA" ? undefined : state.repairForm,
            repairFormName:
              state.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
                ? "Form Estimasi Biaya Sipil & ME (014)"
                : state.repairForm === "SAT/FRM/TS/065_REV:00_161020"
                ? "Form Penggantian Spare Part (065)"
                : state.repairForm === "REPAIR_TANPA_BIAYA"
                ? "Repair Tanpa Biaya"
                : undefined,
          })
        }
        return payloadItems
      }),
    }
  }

  function handleSubmit() {
    setErrors([])

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
        router.back()
      } catch (error) {
        setErrors([error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi."])
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 pb-3">
      {uploadNotice ? (
        <div
          className={cn(
            "fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-40 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.16)]",
            uploadNotice.tone === "loading" && "border-[#dedede] text-[#111111]",
            uploadNotice.tone === "success" &&
              "border-[#c9ead2] bg-[#f0fbf3] text-[#1f6b35]",
            uploadNotice.tone === "error" &&
              "border-[#ffc9a3] bg-[#fff4ec] text-[#8a3d00]"
          )}
          role="status"
          aria-live="polite"
        >
          {uploadNotice.tone === "loading" ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : uploadNotice.tone === "success" ? (
            <Check data-icon="inline-start" />
          ) : (
            <X data-icon="inline-start" />
          )}
          {uploadNotice.message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_6px_18px_rgba(17,17,17,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff0e3] text-[#c75f00]">
              <ClipboardCheck aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-[#111111]">
                Checklist Item
              </h2>
              <p className="mt-0.5 text-sm text-[#686868]">
                {areaName} Monthly - {evaluatedCount} dari {totalCount} item
                dievaluasi
              </p>
            </div>
          </div>
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[#f5f5f3] text-sm font-bold text-[#111111]">
            {progressPercentage}%
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#efefed]">
          <div
            className="h-full rounded-full bg-[#ff8a2a] transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-[#e6e2de] bg-white p-4 shadow-[0_6px_18px_rgba(17,17,17,0.05)]">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff0e3] text-[#c75f00]">
          <Info aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-semibold text-[#111111]">
            {config.allowPartial ? "Mode Temuan / Perbaikan" : "Mode Checklist Wajib"}
          </h3>
          <p className="mt-1 text-sm leading-5 text-[#686868]">
            {config.allowPartial
              ? "Pilih minimal 1 item yang rusak. Kondisi rusak wajib menyertakan foto bukti."
              : "Pilih kondisi setiap item. Khusus item yang rusak wajib menyertakan foto sebagai bukti."}
          </p>
        </div>
      </section>

      {errors.length > 0 ? (
        <div className="rounded-xl border border-[#ffc9a3] bg-[#fff4ec] p-3 text-sm text-[#8a3d00]">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#707784]"
          aria-hidden="true"
        />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari kategori atau item checklist"
          className="h-14 rounded-2xl border-[#e3e3e3] bg-white pl-12 text-sm text-[#111111] shadow-[0_4px_14px_rgba(17,17,17,0.04)] placeholder:text-[#707784]"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e6e2de] bg-white shadow-[0_6px_18px_rgba(17,17,17,0.05)]">
        <button
          type="button"
          onClick={() => setIsCategoryOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left outline-none transition-colors hover:bg-[#fbfbfa] focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/35"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff0e3] text-sm font-bold text-[#c75f00]">
              A
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-[#111111]">
                {config.formName}
              </h3>
              <p className="mt-0.5 text-sm text-[#686868]">
                {evaluatedCount} dari {totalCount} item dievaluasi
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "shrink-0 text-[#707784] transition-transform",
              isCategoryOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {isCategoryOpen ? (
          <div className="flex flex-col gap-3 border-t border-[#eeeeec] bg-[#fbfbfa] p-3">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => {
                const list = items[item.id]
                const totalQty = quantities[item.id] || 1
                const unitsRusak = list.length
                const goodCount = totalQty - unitsRusak

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[#e8e8e6] bg-white p-5 shadow-[0_4px_14px_rgba(17,17,17,0.04)]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f5f3] text-[#707784]">
                          <item.icon className="size-5" aria-hidden="true" />
                        </span>
                        <h4 className="text-base font-semibold text-[#111111]">
                          {item.label}
                        </h4>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* UNIT RUSAK STEPPER */}
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#707784] tracking-wider uppercase">UNIT RUSAK</span>
                          <div className="flex items-center rounded-lg border border-[#e8e8e6] bg-[#fbfbfa]">
                            <button
                              type="button"
                              onClick={() => removeDamagedUnit(item.id)}
                              disabled={unitsRusak <= 0}
                              className="grid size-8 place-items-center text-[#686868] hover:bg-[#efefed] disabled:opacity-30 rounded-l-lg transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{unitsRusak}</span>
                            <button
                              type="button"
                              onClick={() => addDamagedUnit(item.id)}
                              disabled={unitsRusak >= totalQty}
                              className="grid size-8 place-items-center text-[#686868] hover:bg-[#efefed] disabled:opacity-30 rounded-r-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* TOTAL QTY STEPPER */}
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#707784] tracking-wider uppercase">TOTAL QTY</span>
                          <div className="flex items-center rounded-lg border border-[#e8e8e6] bg-[#fbfbfa]">
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.id, totalQty - 1)}
                              disabled={totalQty <= 1}
                              className="grid size-8 place-items-center text-[#686868] hover:bg-[#efefed] disabled:opacity-30 rounded-l-lg transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{totalQty}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.id, totalQty + 1)}
                              className="grid size-8 place-items-center text-[#686868] hover:bg-[#efefed] rounded-r-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {unitsRusak === 0 ? (
                      <div className="mt-5 p-4 rounded-xl bg-[#fff0e3] border border-[#ffc9a3] text-center text-[13px] text-[#a64f00] font-medium leading-relaxed">
                        Sebanyak <span className="font-bold">{totalQty} unit</span> tercatat dalam kondisi <span className="font-bold">BAIK</span>.<br />
                        <span className="text-[#a64f00]/80 text-xs font-normal">Tambahkan angka pada tombol (+) Unit Rusak di atas jika ada yang bermasalah.</span>
                      </div>
                    ) : (
                      <div className="mt-5 flex flex-col gap-6">
                        {list.map((state, index) => {
                          const photoRequired = config.conditionRequiresPhoto(state.condition)
                          return (
                            <div key={index} className={cn(index > 0 && "border-t border-dashed border-[#dedede] pt-6 relative")}>
                              <p className="mb-3 text-sm font-bold text-[#707784]">
                                Laporan Kerusakan #{index + 1}
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {config.conditionOptions.map((condition) => {
                                  const isFullWidth = condition === "TIDAK_ADA"
                                  const isActive = state.condition === condition
                                  const isBaik = condition === "BAIK"
                                  const isTidakAda = condition === "TIDAK_ADA"

                                  const activeClasses = isBaik
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-xs"
                                    : isTidakAda
                                    ? "border-[#111111] bg-[#111111] text-white font-bold shadow-xs"
                                    : "border-red-500 bg-red-50 text-red-600 font-bold shadow-xs"

                                  return (
                                    <button
                                      key={condition}
                                      type="button"
                                      onClick={() =>
                                        updateItem(item.id, index, {
                                          ...nextChecklistPhotoState(state, condition),
                                          ...(!["RUSAK", "REPAIR", "URGENT", "ADJUST_OR_ADD", "CLEAN"].includes(condition) ? { handler: undefined, notes: "", repairForm: undefined } : {})
                                        })
                                      }
                                      className={cn(
                                        "h-11 rounded-xl border px-2 text-[13px] font-bold transition-all flex items-center justify-center text-center leading-tight",
                                        isFullWidth ? "col-span-3" : "col-span-1",
                                        isActive
                                          ? activeClasses
                                          : "border-[#e8e8e6] bg-[#f5f5f3] text-[#707784] hover:border-[#d0d0d0] hover:text-[#111111]"
                                      )}
                                    >
                                      {config.conditionLabels[condition] ?? condition}
                                    </button>
                                  )
                                })}
                              </div>

                              {["RUSAK", "REPAIR", "URGENT", "ADJUST_OR_ADD", "CLEAN"].includes(state.condition || "") ? (
                                <div className="mt-5 border-t border-[#eeeeec] pt-4 flex flex-col gap-4">
                                  <div>
                                    <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider">
                                      AKAN DIHANDLE <span className="text-red-500">*</span>
                                    </p>
                                    <div className="flex rounded-xl bg-[#f5f5f3] p-1">
                                      <button
                                        type="button"
                                        onClick={() => updateItem(item.id, index, { handler: "BES" })}
                                        className={cn(
                                          "flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
                                          state.handler === "BES"
                                            ? "bg-[#ff8a2a] text-white shadow"
                                            : "text-[#707784] hover:text-[#111111]"
                                        )}
                                      >
                                        BES
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateItem(item.id, index, { handler: "EKSTERNAL" })}
                                        className={cn(
                                          "flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all",
                                          state.handler === "EKSTERNAL"
                                            ? "bg-[#ff8a2a] text-white shadow"
                                            : "text-[#707784] hover:text-[#111111]"
                                        )}
                                      >
                                        Eksternal
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {photoRequired ? (
                                <div className="mt-4 border-t border-[#eeeeec] pt-4">
                                  <p className="mb-2 text-xs font-bold text-[#707784]">
                                    Foto bukti <span className="text-red-500">*</span>
                                  </p>
                                  
                                  {state.photos.length === 0 ? (
                                    <CameraCaptureButton
                                      disabled={state.uploading}
                                      uploading={state.uploading}
                                      watermarkLines={buildChecklistPhotoWatermarkLines({
                                        areaName,
                                        userLabel: watermarkUserLabel,
                                        userRole: watermarkUserRole,
                                      })}
                                      onCapture={(file) => void uploadPhoto(item.id, index, file)}
                                    />
                                  ) : null}

                                  {state.photos.length > 0 ? (
                                    <div className="mt-3 flex flex-col gap-2">
                                      {state.photos.map((photo) => (
                                        <div key={photo.fileId} className="relative">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPreviewPhoto({
                                                itemLabel: item.label,
                                                url: photo.url,
                                              })
                                            }
                                            className="group w-full overflow-hidden rounded-xl border border-[#e8e8e6] bg-[#111111] text-left shadow-[0_4px_14px_rgba(17,17,17,0.08)] outline-none focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/40"
                                          >
                                            <Image
                                              src={photo.url}
                                              alt={`Foto bukti ${item.label}`}
                                              width={640}
                                              height={360}
                                              className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.01]"
                                            />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deletePhoto(item.id, index, photo.fileId);
                                            }}
                                            className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-red-500/90 text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 shadow-md"
                                            aria-label="Hapus foto"
                                          >
                                            <Trash2 className="size-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}

                              {["RUSAK", "REPAIR", "URGENT", "ADJUST_OR_ADD", "CLEAN"].includes(state.condition || "") ? (
                                <div className="mt-4 border-t border-[#eeeeec] pt-4">
                                  <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider">
                                    RENCANA AKSI <span className="text-red-500">*</span>
                                  </p>
                                  <textarea
                                    value={state.notes}
                                    onChange={(e) => updateItem(item.id, index, { notes: e.target.value })}
                                    placeholder="Tambahkan rencana aksi..."
                                    className="w-full min-h-[80px] rounded-xl border border-[#e8e8e6] bg-white p-3 text-[13px] text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.02)] outline-none placeholder:text-[#a0a5ad] focus-visible:border-[#ff8a2a]/50 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/20 resize-y"
                                  />
                                  <div className="mt-3">
                                    <p className="mb-2 text-[11px] font-bold text-[#707784] tracking-wider">
                                      FORM TINDAK LANJUT <span className="text-red-500">*</span>
                                    </p>
                                    <Select
                                      value={state.repairForm || ""}
                                      onValueChange={(val) => updateItem(item.id, index, { repairForm: val || undefined })}
                                    >
                                      <SelectTrigger className="w-full h-11 rounded-xl border-[#e8e8e6] bg-white text-[13px] text-[#111111] focus:ring-[#ff8a2a] focus:ring-offset-0">
                                        <span className={cn("flex-1 text-left truncate", !state.repairForm && "text-[#707784]")}>
                                          {state.repairForm ? FOLLOW_UP_LABELS[state.repairForm] || state.repairForm : "Pilih form tindak lanjut"}
                                        </span>
                                      </SelectTrigger>
                                      <SelectContent alignItemWithTrigger={false} className="rounded-xl border-[#dedede] bg-white shadow-lg">
                                        <SelectItem
                                          value="SAT/FRM/TSM/014_REV:000_060423"
                                          className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                                        >
                                          Form Estimasi Biaya Sipil & ME (014)
                                        </SelectItem>
                                        <SelectItem
                                          value="SAT/FRM/TS/065_REV:00_161020"
                                          className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                                        >
                                          Form Penggantian Spare Part (065)
                                        </SelectItem>
                                        <SelectItem
                                          value="REPAIR_TANPA_BIAYA"
                                          className="text-[#111111] hover:bg-[#fff7ed] focus:bg-[#fff7ed] focus:text-[#c2410c] data-[state=checked]:bg-[#fff7ed] data-[state=checked]:text-[#c2410c] font-medium py-2.5 cursor-pointer"
                                        >
                                          Repair Tanpa Biaya
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </article>
                )
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-[#d8d8d8] bg-white p-4 text-sm text-[#686868]">
                Item checklist tidak ditemukan.
              </p>
            )}
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-0 -mx-5 mt-1 bg-[#f5f5f3]/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="h-12 w-full bg-[#111111] text-white shadow-[0_8px_18px_rgba(17,17,17,0.18)] hover:bg-[#242424]"
        >
          {isPending ? (
            <Loader2 data-icon="inline-start" />
          ) : (
            <Send data-icon="inline-start" />
          )}
          Simpan Checklist
        </Button>
        {!canSubmit ? (
          <p className="mt-2 text-center text-xs text-[#686868]">
            {config.allowPartial
              ? "Lengkapi kondisi wajib (foto, handler, rencana aksi) sebelum menyimpan."
              : "Lengkapi semua pilihan, foto wajib, dan rencana aksi sebelum menyimpan."}
          </p>
        ) : null}
      </div>

      {previewPhoto ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-5">
          <button
            type="button"
            onClick={() => setPreviewPhoto(undefined)}
            className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white text-[#111111] shadow-lg outline-none transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/50"
            aria-label="Tutup preview foto"
          >
            <X aria-hidden="true" />
          </button>
          <Image
            src={previewPhoto.url}
            alt={`Preview foto bukti ${previewPhoto.itemLabel}`}
            width={1280}
            height={720}
            className="max-h-[82svh] w-auto max-w-full rounded-xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            priority
          />
        </div>
      ) : null}
    </div>
  )
}
