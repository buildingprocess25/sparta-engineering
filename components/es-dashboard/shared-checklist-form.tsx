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
import { getChecklistConfig } from "@/lib/checklists/registry"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import {
  getPayloadPhotosForCondition,
  nextChecklistPhotoState,
} from "@/lib/checklists/photo-state"
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
  uploading: boolean
}

type UploadNotice = {
  tone: "loading" | "success" | "error"
  message: string
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
  
  const [items, setItems] = React.useState<Record<string, ItemState>>(() => {
    if (!config) return {}
    return Object.fromEntries(
      config.items.map((item) => [
        item.id,
        {
          photos: [],
          notes: "",
          uploading: false,
        } satisfies ItemState,
      ])
    ) as Record<string, ItemState>
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
  const evaluatedCount = config.items.filter(
    (item) => items[item.id].condition
  ).length
  const totalCount = config.items.length
  const progressPercentage = Math.round((evaluatedCount / totalCount) * 100)
  const missingPhotoCount = config.items.filter((item) => {
    const state = items[item.id]
    return config.conditionRequiresPhoto(state.condition) && state.photos.length === 0
  }).length
  const isUploading = Object.values(items).some((item) => item.uploading)
  const canSubmit =
    evaluatedCount === totalCount &&
    missingPhotoCount === 0 &&
    !isUploading &&
    !isPending

  function updateItem(itemId: string, next: Partial<ItemState>) {
    setItems((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...next },
    }))
  }

  async function uploadPhoto(itemId: string, file: File) {
    updateItem(itemId, { uploading: true })
    setUploadNotice({ tone: "loading", message: "Foto sedang diupload." })
    setErrors([])

    try {
      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: buildUploadFormData(itemId, file, items[itemId].photos.length + 1),
      })
      const payload = (await response.json()) as
        | { fileId: string; url: string }
        | { error: string }

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Upload gagal.")
      }

      setItems((current) => ({
        ...current,
        [itemId]: {
          ...current[itemId],
          uploading: false,
          photos: [...current[itemId].photos, payload],
        },
      }))
      setUploadNotice({ tone: "success", message: "Upload foto tersimpan." })
    } catch (error) {
      updateItem(itemId, { uploading: false })
      setUploadNotice({ tone: "error", message: "Upload foto gagal." })
      setErrors([
        error instanceof Error ? error.message : "Upload foto gagal.",
      ])
    }
  }

  function deletePhoto(itemId: string, fileId: string) {
    setItems((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        photos: current[itemId].photos.filter((p) => p.fileId !== fileId),
      },
    }))
  }

  function buildUploadFormData(itemId: string, file: File, sequence: number) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append(
      "context",
      JSON.stringify({
        kind: "CHECKLIST_ITEM",
        reportCode,
        formCode: config!.formCode,
        itemId,
        sequence,
      })
    )
    return formData
  }

  function buildPayload(): ChecklistPayload {
    return {
      formCode: config!.formCode,
      formName: config!.formName,
      areaCode,
      period: "MONTHLY",
      periodKey,
      items: config!.items.map((item) => ({
        id: item.id,
        label: item.label,
        condition: items[item.id].condition ?? "TIDAK_ADA",
        photos: getPayloadPhotosForCondition(
          items[item.id].condition ?? "TIDAK_ADA",
          items[item.id].photos
        ),
        notes: items[item.id].notes,
      })),
    }
  }

  function submit() {
    if (!canSubmit) return

    setErrors([])
    startTransition(async () => {
      const result = await submitAction({
        reportCode,
        payload: buildPayload(),
      })

      if (!result.ok) {
        setErrors(result.errors || ["Terjadi kesalahan saat menyimpan."])
        return
      }

      router.push("/dashboard/reports")
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
          <h3 className="font-semibold text-[#111111]">Mode Checklist Wajib</h3>
          <p className="mt-1 text-sm leading-5 text-[#686868]">
            Evaluasi semua item. Kondisi tertentu wajib memakai foto dari
            kamera.
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
              <h3 className="truncate font-semibold text-[#111111]">
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
                const state = items[item.id]
                const photoRequired = config.conditionRequiresPhoto(state.condition)

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[#e8e8e6] bg-white p-5 shadow-[0_4px_14px_rgba(17,17,17,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5f5f3] text-[#707784]">
                        <item.icon className="size-5" aria-hidden="true" />
                      </span>
                      <h4 className="text-base font-semibold text-[#111111]">
                        {item.label}
                      </h4>
                    </div>
                    
                    <div className="mt-5 flex flex-wrap gap-2">
                      {config.conditionOptions.map((condition) => {
                        const isActive = state.condition === condition;
                        
                        let activeClasses = "border-[#111111] bg-[#111111] text-white shadow-sm"
                        if (condition === "BAIK" || condition === "CLEAN") {
                          activeClasses = "border-green-500 bg-green-50 text-green-700 shadow-sm"
                        } else if (condition === "RUSAK" || condition === "URGENT" || condition === "REPAIR") {
                          activeClasses = "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        }

                        return (
                          <button
                            key={condition}
                            type="button"
                            onClick={() =>
                              updateItem(item.id, {
                                ...nextChecklistPhotoState(state, condition),
                              })
                            }
                            className={cn(
                              "flex-1 min-w-[calc(30%-0.5rem)] rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all text-center leading-tight",
                              isActive
                                ? activeClasses
                                : "border-[#e6e2de] bg-[#fbfbfa] text-[#686868] hover:border-[#d0d0d0] hover:bg-white"
                            )}
                          >
                            {config.conditionLabels[condition]}
                          </button>
                        )
                      })}
                    </div>

                    {photoRequired ? (
                      <div className="mt-4 border-t border-[#eeeeec] pt-4">
                        <p className="mb-2 text-xs font-bold text-[#707784]">
                          Foto bukti *
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
                            onCapture={(file) => void uploadPhoto(item.id, file)}
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
                                    deletePhoto(item.id, photo.fileId);
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
          onClick={submit}
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
            Lengkapi semua pilihan dan foto wajib sebelum menyimpan.
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
