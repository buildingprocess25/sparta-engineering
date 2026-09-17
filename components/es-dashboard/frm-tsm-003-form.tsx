"use client"

import * as React from "react"
import { Camera, Check, Loader2, Send, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  FRM_TSM_003_FORM_CODE,
  FRM_TSM_003_ITEMS,
} from "@/lib/checklists/frm-tsm-003"
import type {
  ChecklistCondition,
  ChecklistPayload,
  ChecklistPhoto,
} from "@/lib/checklists/payload"
import { cn } from "@/lib/utils"

type FrmTsm003FormProps = {
  reportCode: string
  areaCode: string
  areaName: string
  periodKey: string
  submitAction(input: {
    reportCode: string
    payload: ChecklistPayload
  }): Promise<
    | { ok: true; isSafe: boolean }
    | { ok: false; errors: string[] }
  >
}

type ItemState = {
  condition: ChecklistCondition
  photos: ChecklistPhoto[]
  notes: string
  uploading: boolean
}

const conditionLabels: Record<ChecklistCondition, string> = {
  BAIK: "Baik",
  RUSAK: "Rusak",
  TIDAK_ADA: "Tidak ada",
}

const initialItems = Object.fromEntries(
  FRM_TSM_003_ITEMS.map((item) => [
    item.id,
    {
      condition: "TIDAK_ADA",
      photos: [],
      notes: "",
      uploading: false,
    } satisfies ItemState,
  ])
) as Record<string, ItemState>

function requiresPhoto(condition: ChecklistCondition) {
  return condition === "BAIK" || condition === "RUSAK"
}

export function FrmTsm003Form({
  reportCode,
  areaCode,
  areaName,
  periodKey,
  submitAction,
}: FrmTsm003FormProps) {
  const router = useRouter()
  const [items, setItems] =
    React.useState<Record<string, ItemState>>(initialItems)
  const [errors, setErrors] = React.useState<string[]>([])
  const [isPending, startTransition] = React.useTransition()

  const missingPhotoCount = FRM_TSM_003_ITEMS.filter((item) => {
    const state = items[item.id]
    return requiresPhoto(state.condition) && state.photos.length === 0
  }).length
  const isUploading = Object.values(items).some((item) => item.uploading)
  const canSubmit = missingPhotoCount === 0 && !isUploading && !isPending

  function updateItem(itemId: string, next: Partial<ItemState>) {
    setItems((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...next },
    }))
  }

  async function uploadPhoto(itemId: string, file: File) {
    updateItem(itemId, { uploading: true })
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
    } catch (error) {
      updateItem(itemId, { uploading: false })
      setErrors([
        error instanceof Error ? error.message : "Upload foto gagal.",
      ])
    }
  }

  function buildUploadFormData(itemId: string, file: File, sequence: number) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append(
      "context",
      JSON.stringify({
        kind: "CHECKLIST_ITEM",
        reportCode,
        formCode: FRM_TSM_003_FORM_CODE,
        itemId,
        sequence,
      })
    )
    return formData
  }

  function buildPayload(): ChecklistPayload {
    return {
      formCode: FRM_TSM_003_FORM_CODE,
      formName: "Form Checklist Ruangan",
      areaCode,
      period: "MONTHLY",
      periodKey,
      items: FRM_TSM_003_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        condition: items[item.id].condition,
        photos: items[item.id].photos,
        notes: items[item.id].notes,
      })),
    }
  }

  function submit() {
    setErrors([])
    startTransition(async () => {
      const result = await submitAction({
        reportCode,
        payload: buildPayload(),
      })

      if (!result.ok) {
        setErrors(result.errors)
        return
      }

      router.push("/dashboard/reports")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#ff8a2a]">
              {reportCode}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#111111]">
              {areaName} Monthly
            </h2>
          </div>
          <span className="rounded-full bg-[#f1f1ef] px-3 py-1 text-xs font-semibold text-[#4c4c4c]">
            {periodKey}
          </span>
        </div>
      </section>

      {errors.length > 0 ? (
        <div className="rounded-xl border border-[#ffc9a3] bg-[#fff4ec] p-3 text-sm text-[#8a3d00]">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {FRM_TSM_003_ITEMS.map((item, index) => {
          const state = items[item.id]
          const photoRequired = requiresPhoto(state.condition)
          const missingPhoto = photoRequired && state.photos.length === 0

          return (
            <section
              key={item.id}
              className={cn(
                "rounded-2xl border bg-white p-4 shadow-sm",
                missingPhoto ? "border-[#ffb46f]" : "border-[#dedede]"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#111111]">{item.label}</h3>
                  <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-[#dedede] bg-[#f5f5f3]">
                    {(["BAIK", "RUSAK", "TIDAK_ADA"] as const).map(
                      (condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              condition,
                              photos: requiresPhoto(condition)
                                ? state.photos
                                : [],
                            })
                          }
                          className={cn(
                            "min-h-10 px-2 text-xs font-semibold transition-colors",
                            state.condition === condition
                              ? "bg-[#111111] text-white"
                              : "text-[#4c4c4c]"
                          )}
                        >
                          {conditionLabels[condition]}
                        </button>
                      )
                    )}
                  </div>

                  {photoRequired ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#b8b8b8] bg-[#fbfbfb] px-3 text-sm font-semibold text-[#111111]">
                        {state.uploading ? (
                          <Loader2 data-icon="inline-start" />
                        ) : (
                          <Camera data-icon="inline-start" />
                        )}
                        {state.uploading ? "Mengupload..." : "Upload foto"}
                        <input
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={state.uploading}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            event.target.value = ""
                            if (file) void uploadPhoto(item.id, file)
                          }}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {state.photos.map((photo) => (
                          <span
                            key={photo.fileId}
                            className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ed] px-2 py-1 text-xs font-semibold text-[#1f6b35]"
                          >
                            <Check data-icon="inline-start" />
                            Foto tersimpan
                          </span>
                        ))}
                        {missingPhoto ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e3] px-2 py-1 text-xs font-semibold text-[#8a3d00]">
                            <X data-icon="inline-start" />
                            Foto wajib
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <Button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="h-12 bg-[#111111] text-white hover:bg-[#242424]"
      >
        {isPending ? (
          <Loader2 data-icon="inline-start" />
        ) : (
          <Send data-icon="inline-start" />
        )}
        Simpan Checklist
      </Button>
    </div>
  )
}
