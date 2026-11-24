"use client"

import * as React from "react"
import Image from "next/image"
import { CheckCircle2, Loader2, Trash2, Upload } from "lucide-react"

import { executeReportSparePartAction } from "@/app/dashboard/reports/actions"
import { CameraCaptureButton } from "@/components/es-dashboard/camera-capture-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { readPhotoUploadResponse, type UploadedChecklistPhoto } from "@/lib/photos/photo-upload-client"
import {
  hasCostEstimateFollowUp,
  hasForm065FollowUp,
} from "@/lib/reports/checklist-follow-up"
import {
  COMPLETION_EVIDENCE_LABELS,
  validateCompletionEvidence,
  type CompletionEvidenceType,
  type EvidencePhoto,
} from "@/lib/reports/completion-evidence"

export type CompletionEvidencePanelProps = {
  reportId: string
  reportCode: string
  reportVersion: string
  checklistPayload: unknown
  authorName: string
  authorNik: string
  disabled?: boolean
  onVersionChange?(version: string): void
  onSuccess(): void
}

type PhotoGroupProps = {
  evidenceType: CompletionEvidenceType
  reportCode: string
  authorName: string
  authorNik: string
  photos: EvidencePhoto[]
  disabled?: boolean
  onAdd(photo: UploadedChecklistPhoto): void
  onRemove(fileId: string): void
}

function EvidencePhotoGroup({
  evidenceType,
  reportCode,
  authorName,
  authorNik,
  photos,
  disabled,
  onAdd,
  onRemove,
}: PhotoGroupProps) {
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append(
        "context",
        JSON.stringify({
          kind: "COMPLETION_EVIDENCE",
          reportCode,
          evidenceType,
          sequence: photos.length + 1,
        }),
      )

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      })
      const uploaded = await readPhotoUploadResponse(response)
      onAdd(uploaded)
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Gagal mengunggah foto bukti penyelesaian.",
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-900">
          {COMPLETION_EVIDENCE_LABELS[evidenceType]} *
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {photos.length} foto terunggah
        </span>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, idx) => (
            <div
              key={photo.fileId}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <Image
                unoptimized
                src={photo.url}
                alt={`${COMPLETION_EVIDENCE_LABELS[evidenceType]} ${idx + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => onRemove(photo.fileId)}
                aria-label={`Hapus foto ${idx + 1}`}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white hover:bg-rose-600 disabled:opacity-50"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <CameraCaptureButton
          disabled={disabled || uploading}
          uploading={uploading}
          watermarkLines={[
            { text: `${reportCode} · Bukti Penyelesaian`, weight: 700 },
            { text: `${COMPLETION_EVIDENCE_LABELS[evidenceType]}`, weight: 400 },
            { text: `${authorName} (${authorNik})`, weight: 400 },
          ]}
          onCapture={(file) => {
            void uploadFile(file)
          }}
        />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ""
              if (file) {
                void uploadFile(file)
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-full bg-white text-slate-800 hover:bg-slate-100"
          >
            {uploading ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            Pilih File Gambar
          </Button>
        </div>
      </div>

      {uploadError && (
        <p role="alert" className="text-xs font-medium text-rose-700">
          {uploadError}
        </p>
      )}
    </div>
  )
}

export function CompletionEvidencePanel({
  reportId,
  reportCode,
  reportVersion,
  checklistPayload,
  authorName,
  authorNik,
  disabled,
  onVersionChange,
  onSuccess,
}: CompletionEvidencePanelProps) {
  const needs014 = hasCostEstimateFollowUp(checklistPayload)
  const needs065 = hasForm065FollowUp(checklistPayload)

  const [syncedVersion, setSyncedVersion] = React.useState<{
    base: string
    latest: string
  } | null>(null)
  const currentVersion =
    syncedVersion && syncedVersion.base === reportVersion
      ? syncedVersion.latest
      : reportVersion

  function syncVersionFromUpload(photo: UploadedChecklistPhoto): EvidencePhoto {
    if (photo.reportVersion) {
      setSyncedVersion({ base: reportVersion, latest: photo.reportVersion })
      onVersionChange?.(photo.reportVersion)
    }
    return { fileId: photo.fileId, url: photo.url }
  }

  const [workPhotos, setWorkPhotos] = React.useState<EvidencePhoto[]>([])
  const [receiptPhotos, setReceiptPhotos] = React.useState<EvidencePhoto[]>([])
  const [refundTransferPhotos, setRefundTransferPhotos] = React.useState<EvidencePhoto[]>([])
  const [actualPurchaseAmount, setActualPurchaseAmount] = React.useState("")

  const [handoverConfirmed, setHandoverConfirmed] = React.useState(false)
  const [handoverRecipient, setHandoverRecipient] = React.useState("")
  const [handoverNotes, setHandoverNotes] = React.useState("")
  const [repairWithUnitPhotos, setRepairWithUnitPhotos] = React.useState<EvidencePhoto[]>([])
  const [selfieWithUserPhotos, setSelfieWithUserPhotos] = React.useState<EvidencePhoto[]>([])

  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<string[]>([])
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit() {
    const candidate = {
      ...(needs014
        ? {
            form014: {
              workPhotos,
              receiptPhotos,
              refundTransferPhotos,
              actualPurchaseAmount: actualPurchaseAmount.trim(),
            },
          }
        : {}),
      ...(needs065
        ? {
            form065: {
              handoverConfirmed,
              handoverRecipient,
              handoverNotes,
              repairWithUnitPhotos,
              selfieWithUserPhotos,
            },
          }
        : {}),
      notes,
    }

    const check = validateCompletionEvidence(checklistPayload, candidate)
    if (!check.valid || !check.normalized) {
      setErrors(check.errors)
      return
    }

    setErrors([])
    startTransition(async () => {
      try {
        const result = await executeReportSparePartAction(
          reportId,
          "FINISH_WORK",
          notes,
          currentVersion,
          { completionEvidence: check.normalized },
        )
        if (!result.success) {
          setErrors([result.error || "Gagal menyelesaikan pekerjaan."])
          return
        }
        onSuccess()
      } catch {
        setErrors(["Terjadi kesalahan saat menyimpan bukti penyelesaian pekerjaan."])
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-slate-900">
          Bukti Penyelesaian Pekerjaan (Wajib Sebelum Selesai)
        </h3>
        <p className="text-xs text-slate-600">
          Lengkapi seluruh bukti lapangan sebelum mengubah status laporan menjadi Selesai.
        </p>
      </div>

      {needs014 && (
        <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50/40 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-900">
            Persyaratan Form 014 (PJU & Biaya Aktual)
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="actual-purchase-amount"
              className="text-xs font-bold text-slate-900"
            >
              Actual Pembelian Barang (Rp) *
            </label>
            <Input
              id="actual-purchase-amount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              disabled={disabled || isPending}
              value={actualPurchaseAmount}
              onChange={(e) => setActualPurchaseAmount(e.target.value)}
              placeholder="Contoh: 250000"
              className="bg-white"
            />
          </div>

          <EvidencePhotoGroup
            evidenceType="WORK_PROGRESS"
            reportCode={reportCode}
            authorName={authorName}
            authorNik={authorNik}
            photos={workPhotos}
            disabled={disabled || isPending}
            onAdd={(p) => setWorkPhotos((prev) => [...prev, syncVersionFromUpload(p)])}
            onRemove={(id) => setWorkPhotos((prev) => prev.filter((p) => p.fileId !== id))}
          />

          <EvidencePhotoGroup
            evidenceType="PURCHASE_RECEIPT"
            reportCode={reportCode}
            authorName={authorName}
            authorNik={authorNik}
            photos={receiptPhotos}
            disabled={disabled || isPending}
            onAdd={(p) => setReceiptPhotos((prev) => [...prev, syncVersionFromUpload(p)])}
            onRemove={(id) => setReceiptPhotos((prev) => prev.filter((p) => p.fileId !== id))}
          />

          <EvidencePhotoGroup
            evidenceType="REFUND_TRANSFER"
            reportCode={reportCode}
            authorName={authorName}
            authorNik={authorNik}
            photos={refundTransferPhotos}
            disabled={disabled || isPending}
            onAdd={(p) => setRefundTransferPhotos((prev) => [...prev, syncVersionFromUpload(p)])}
            onRemove={(id) =>
              setRefundTransferPhotos((prev) => prev.filter((p) => p.fileId !== id))
            }
          />
        </div>
      )}

      {needs065 && (
        <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-900">
            Persyaratan Form 065 (Serah Terima Unit & Dokumentasi)
          </p>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900">
            <input
              type="checkbox"
              checked={handoverConfirmed}
              disabled={disabled || isPending}
              onChange={(e) => setHandoverConfirmed(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 accent-[#ff8a2a]"
            />
            <span className="font-semibold leading-snug">
              Serah Terima Unit Selesai · Unit sudah diperbaiki, diuji fungsi, dan diserahkan kembali kepada user. *
            </span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="handover-recipient"
                className="text-xs font-bold text-slate-900"
              >
                Nama Penerima Serah Terima *
              </label>
              <Input
                id="handover-recipient"
                disabled={disabled || isPending}
                value={handoverRecipient}
                onChange={(e) => setHandoverRecipient(e.target.value)}
                placeholder="Nama user penerima unit"
                className="bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="handover-notes"
                className="text-xs font-bold text-slate-900"
              >
                Catatan Serah Terima (Opsional)
              </label>
              <Input
                id="handover-notes"
                disabled={disabled || isPending}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Hasil uji coba / keterangan serah terima"
                className="bg-white"
              />
            </div>
          </div>

          <EvidencePhotoGroup
            evidenceType="REPAIR_UNIT"
            reportCode={reportCode}
            authorName={authorName}
            authorNik={authorNik}
            photos={repairWithUnitPhotos}
            disabled={disabled || isPending}
            onAdd={(p) => setRepairWithUnitPhotos((prev) => [...prev, syncVersionFromUpload(p)])}
            onRemove={(id) =>
              setRepairWithUnitPhotos((prev) => prev.filter((p) => p.fileId !== id))
            }
          />

          <EvidencePhotoGroup
            evidenceType="USER_SELFIE"
            reportCode={reportCode}
            authorName={authorName}
            authorNik={authorNik}
            photos={selfieWithUserPhotos}
            disabled={disabled || isPending}
            onAdd={(p) => setSelfieWithUserPhotos((prev) => [...prev, syncVersionFromUpload(p)])}
            onRemove={(id) =>
              setSelfieWithUserPhotos((prev) => prev.filter((p) => p.fileId !== id))
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="completion-notes" className="text-xs font-bold text-slate-900">
          Catatan Penyelesaian Pekerjaan (Opsional)
        </label>
        <Input
          id="completion-notes"
          disabled={disabled || isPending}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ringkasan hasil pekerjaan lapangan"
          className="bg-white"
        />
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Bukti Penyelesaian Belum Lengkap</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        disabled={disabled || isPending}
        onClick={handleSubmit}
        size="lg"
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {isPending ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <CheckCircle2 data-icon="inline-start" />
        )}
        Selesaikan Pekerjaan (Selesai)
      </Button>
    </div>
  )
}
