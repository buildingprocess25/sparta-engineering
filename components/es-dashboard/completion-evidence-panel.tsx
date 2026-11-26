"use client"

import * as React from "react"
import Image from "next/image"
import { CheckCircle2, ClipboardCheck, ImagePlus, Loader2, Trash2, Upload, Wallet, Handshake, Camera } from "lucide-react"
import { ReportPhotoPreview } from "@/components/reports/report-photo-preview"

import { executeReportSparePartAction } from "@/app/dashboard/reports/actions"
import { CameraCaptureButton } from "@/components/es-dashboard/camera-capture-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { readPhotoUploadResponse, type UploadedChecklistPhoto } from "@/lib/photos/photo-upload-client"
import {
  getReportItems,
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
  targetLabel?: string
  locationLabel?: string
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
  onUploadStart(): boolean
  onUploadEnd(): void
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
  onUploadStart,
  onUploadEnd,
  onAdd,
  onRemove,
}: PhotoGroupProps) {
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState<{ url: string; title: string } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  async function uploadFile(file: File) {
    if (!onUploadStart()) return
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
      onUploadEnd()
    }
  }

  const label = COMPLETION_EVIDENCE_LABELS[evidenceType]
  return (
    <section aria-label={label} className="min-w-0 rounded-lg border bg-background">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{label} <span className="text-destructive">*</span></p>
            <p className="text-xs text-muted-foreground" aria-live="polite">{photos.length} foto terunggah</p>
          </div>
          {photos.length > 0 ? (
            <Badge variant="outline" className="border-emerald-200 text-emerald-700"><CheckCircle2 /> Lengkap</Badge>
          ) : <Badge variant="secondary">Belum lengkap</Badge>}
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-2">
            {photos.map((photo, idx) => (
              <div key={photo.fileId} className="min-w-0 overflow-hidden rounded-lg border bg-background">
                <Button variant="ghost"
                  type="button"
                  aria-label={`Perbesar ${label} ${idx + 1}`}
                  onClick={() => setPreview({ url: photo.url, title: `${label} ${idx + 1}` })}
                  className="inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                >
                  <Image unoptimized src={photo.url} alt={`${label} ${idx + 1}`} fill sizes="(max-width: 640px) 160px, 220px" className="object-cover" />
                </Button>
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <Button type="button" size="sm" variant="ghost" className="min-w-0 flex-1 text-xs" onClick={() => setPreview({ url: photo.url, title: `${label} ${idx + 1}` })}>Lihat foto</Button>
                  <Button type="button" size="icon" variant="ghost" disabled={disabled || uploading} onClick={() => onRemove(photo.fileId)} aria-label={`Hapus ${label} ${idx + 1}`} className="text-destructive"><Trash2 /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/30 p-3 text-center">
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Belum ada dokumentasi</p>
            <p className="text-xs text-muted-foreground">Ambil foto atau pilih dari galeri.</p>
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
          <CameraCaptureButton
            disabled={disabled || uploading}
            uploading={uploading}
            watermarkLines={[
              { text: `${reportCode} · Bukti Penyelesaian`, weight: 700 },
              { text: label, weight: 400 },
              { text: `${authorName} (${authorNik})`, weight: 400 },
            ]}
            onCapture={(file) => { void uploadFile(file) }}
          />
          <div className="min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (file) void uploadFile(file)
              }}
            />
            <Button type="button" variant="outline" disabled={disabled || uploading} onClick={() => fileInputRef.current?.click()} className="h-12 w-full">
              {uploading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
              {uploading ? "Mengunggah..." : "Galeri"}
            </Button>
          </div>
        </div>
        {uploadError && (
          <Alert variant="destructive" role="alert"><AlertTitle>Foto gagal diunggah</AlertTitle><AlertDescription>{uploadError}</AlertDescription></Alert>
        )}
      </div>
      <ReportPhotoPreview photo={preview} onClose={() => setPreview(null)} />
    </section>
  )
}

export function CompletionEvidencePanel({
  reportId,
  reportCode,
  reportVersion,
  checklistPayload,
  authorName,
  authorNik,
  targetLabel,
  locationLabel,
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

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [uploadInProgress, setUploadInProgress] = React.useState(false)
  const uploadLock = React.useRef(false)
  const finishLock = React.useRef(false)
  const busy = Boolean(disabled || isPending || uploadInProgress)

  function beginUpload() {
    if (disabled || isPending || finishLock.current || uploadLock.current) return false
    uploadLock.current = true
    setUploadInProgress(true)
    return true
  }

  function endUpload() {
    uploadLock.current = false
    setUploadInProgress(false)
  }

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
  const validation = validateCompletionEvidence(checklistPayload, candidate)
  const requirements = [
    ...(needs014 ? [
      { label: "Realisasi biaya", complete: actualPurchaseAmount.trim() !== "" && Number.isFinite(Number(actualPurchaseAmount)) && Number(actualPurchaseAmount) >= 0 },
      { label: "Foto pekerjaan", complete: workPhotos.length > 0 },
      { label: "Bon pembelian", complete: receiptPhotos.length > 0 },
      { label: "Bukti transfer", complete: refundTransferPhotos.length > 0 },
    ] : []),
    ...(needs065 ? [
      { label: "Serah terima unit", complete: handoverConfirmed && handoverRecipient.trim() !== "" },
      { label: "Foto perbaikan", complete: repairWithUnitPhotos.length > 0 },
      { label: "Foto selfie", complete: selfieWithUserPhotos.length > 0 },
    ] : []),
  ]
  const completed = requirements.filter((requirement) => requirement.complete).length
  const total = requirements.length
  const progress = total ? Math.round(completed / total * 100) : 100
  const ready = validation.valid && completed === total
  const formLabel = [needs014 && "Form 014", needs065 && "Form 065"].filter(Boolean).join(" + ")
  const unitNames = [...new Set(getReportItems(checklistPayload).map((item) => typeof item.followUp065?.namaUnit === "string" ? item.followUp065.namaUnit.trim() : "").filter(Boolean))]
  const jobTypes = [...new Set(getReportItems(checklistPayload).map((item) => item.followUp065?.jenis === "PERBAIKAN" ? "Perbaikan" : item.followUp065?.jenis === "PENGGANTIAN_SPARE_PART" ? "Penggantian Spare Part" : "").filter(Boolean))]

  function handleSubmit() {
    if (disabled || isPending || uploadLock.current || finishLock.current) return
    setConfirmOpen(false)
    const check = validateCompletionEvidence(checklistPayload, candidate)
    if (!check.valid || !check.normalized) {
      setErrors(check.errors)
      return
    }

    setErrors([])
    finishLock.current = true
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
      } finally {
        finishLock.current = false
      }
    })
  }

  function renderPhotoGroup(evidenceType: CompletionEvidenceType, photos: EvidencePhoto[], setPhotos: React.Dispatch<React.SetStateAction<EvidencePhoto[]>>) {
    return (
      <EvidencePhotoGroup
        key={evidenceType}
        evidenceType={evidenceType}
        reportCode={reportCode}
        authorName={authorName}
        authorNik={authorNik}
        photos={photos}
        disabled={busy}
        onUploadStart={beginUpload}
        onUploadEnd={endUpload}
        onAdd={(photo) => {
          const savedPhoto = syncVersionFromUpload(photo)
          setPhotos((previous) => [...previous, savedPhoto])
        }}
        onRemove={(id) => setPhotos((previous) => previous.filter((photo) => photo.fileId !== id))}
      />
    )
  }

  return (
    <Card className="min-w-0 bg-background text-foreground">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground"><ClipboardCheck className="size-5" /></div>
            <div className="min-w-0">
              <CardTitle>Penyelesaian Pekerjaan</CardTitle>
              <CardDescription className="break-words">{reportCode}{formLabel ? ` · ${formLabel}` : ""}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-900">Sedang Dikerjakan</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          {(targetLabel || locationLabel || unitNames.length > 0 || jobTypes.length > 0) && (
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5 gap-y-3 rounded-lg bg-muted/45 p-3">
              {(targetLabel || unitNames.length > 0) && <div className="min-w-0"><dt className="text-xs text-muted-foreground">Unit / Objek</dt><dd className="break-words text-sm font-medium">{unitNames.length ? unitNames.join(", ") : targetLabel}</dd></div>}
              {locationLabel && <div className="min-w-0"><dt className="text-xs text-muted-foreground">Lokasi</dt><dd className="break-words text-sm font-medium">{locationLabel}</dd></div>}
              {formLabel && <div><dt className="text-xs text-muted-foreground">Form tindak lanjut</dt><dd className="text-sm font-medium">{formLabel}</dd></div>}
              {jobTypes.length > 0 && <div><dt className="text-xs text-muted-foreground">Jenis pekerjaan</dt><dd className="text-sm font-medium">{jobTypes.join(", ")}</dd></div>}
            </dl>
          )}

          <div className="flex flex-col gap-2" aria-live="polite">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">Kelengkapan penyelesaian</p>
              <span className="text-xs tabular-nums text-muted-foreground">{completed} dari {total} persyaratan</span>
            </div>
            <Progress aria-label="Kelengkapan penyelesaian" value={progress} className="[&_[data-slot=progress-indicator]]:bg-[#ff8a2a]" />
            <p className="text-xs text-muted-foreground">{ready ? "Seluruh persyaratan lengkap." : `Belum lengkap: ${requirements.filter((requirement) => !requirement.complete).map((requirement) => requirement.label).join(", ") || "periksa kembali bukti"}.`}</p>
          </div>
          <Separator />

          <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))] items-start gap-5">
            <div className="flex min-w-0 flex-col gap-5">
              {needs014 && (
                <section aria-labelledby="completion-cost-heading" className="flex min-w-0 flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div><h3 id="completion-cost-heading" className="text-sm font-semibold">Realisasi Biaya</h3><p className="text-xs text-muted-foreground">Form 014 · Pembelian barang aktual.</p></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="actual-purchase-amount">Actual pembelian barang (Rp) *</Label>
                    <Input id="actual-purchase-amount" type="number" min="0" step="1" inputMode="numeric" disabled={busy} value={actualPurchaseAmount} onChange={(e) => setActualPurchaseAmount(e.target.value)} placeholder="Contoh: 250000" required />
                  </div>
                </section>
              )}
              {needs014 && needs065 && <Separator />}
              {needs065 && (
                <section aria-labelledby="completion-handover-heading" className="flex min-w-0 flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <Handshake className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div><h3 id="completion-handover-heading" className="text-sm font-semibold">Serah Terima Unit</h3><p className="text-xs text-muted-foreground">Form 065 · Konfirmasi hasil pekerjaan kepada user.</p></div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <Checkbox id="handover-confirmed" checked={handoverConfirmed} disabled={busy} onCheckedChange={(checked) => setHandoverConfirmed(checked === true)} required />
                    <Label htmlFor="handover-confirmed" className="cursor-pointer leading-relaxed">Unit sudah diperbaiki, diuji fungsi, dan diserahkan kembali kepada user. *</Label>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="handover-recipient">Nama penerima serah terima *</Label>
                    <Input id="handover-recipient" disabled={busy} value={handoverRecipient} onChange={(e) => setHandoverRecipient(e.target.value)} placeholder="Nama user penerima unit" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="handover-notes">Catatan serah terima <span className="font-normal text-muted-foreground">(Opsional)</span></Label>
                    <Textarea id="handover-notes" disabled={busy} value={handoverNotes} onChange={(e) => setHandoverNotes(e.target.value)} placeholder="Hasil uji coba / keterangan serah terima" rows={3} />
                  </div>
                </section>
              )}
            </div>
            <section aria-labelledby="completion-photos-heading" className="flex min-w-0 flex-col gap-3">
              <div className="flex items-start gap-2">
                <Camera className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div><h3 id="completion-photos-heading" className="text-sm font-semibold">Dokumentasi Pekerjaan</h3><p className="text-xs text-muted-foreground">Unggah minimal satu foto untuk setiap jenis bukti wajib.</p></div>
              </div>
              {needs014 && renderPhotoGroup("WORK_PROGRESS", workPhotos, setWorkPhotos)}
              {needs014 && renderPhotoGroup("PURCHASE_RECEIPT", receiptPhotos, setReceiptPhotos)}
              {needs014 && renderPhotoGroup("REFUND_TRANSFER", refundTransferPhotos, setRefundTransferPhotos)}
              {needs065 && renderPhotoGroup("REPAIR_UNIT", repairWithUnitPhotos, setRepairWithUnitPhotos)}
              {needs065 && renderPhotoGroup("USER_SELFIE", selfieWithUserPhotos, setSelfieWithUserPhotos)}
            </section>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label htmlFor="completion-notes">Catatan penyelesaian <span className="font-normal text-muted-foreground">(Opsional)</span></Label>
            <Textarea id="completion-notes" disabled={busy} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tuliskan ringkasan hasil pekerjaan..." rows={3} />
          </div>
          {errors.length > 0 && (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Penyelesaian belum berhasil</AlertTitle>
              <AlertDescription><ul className="list-disc pl-4">{errors.map((error) => <li key={error}>{error}</li>)}</ul></AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            {uploadInProgress ? <Loader2 className="size-4 shrink-0 animate-spin" /> : ready ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <ClipboardCheck className="size-4 shrink-0" />}
            <span>{uploadInProgress ? "Tunggu hingga unggahan selesai." : ready ? "Bukti lengkap, siap diselesaikan." : "Lengkapi seluruh persyaratan wajib."}</span>
          </div>
          <Button type="button" size="lg" disabled={busy || !ready} onClick={() => { setErrors([]); setConfirmOpen(true) }} className="h-11 grow bg-[#ff8a2a] text-[#111111] hover:bg-[#f07b1a]">
            {isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <CheckCircle2 data-icon="inline-start" />}
            {isPending ? "Menyelesaikan..." : "Selesaikan Pekerjaan"}
          </Button>
        </div>
      </CardFooter>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Selesaikan pekerjaan?</AlertDialogTitle>
            <AlertDialogDescription>Laporan {reportCode} akan berstatus Selesai setelah bukti berhasil divalidasi. Pastikan seluruh data sudah benar karena laporan selesai bersifat final.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Periksa kembali</AlertDialogCancel>
            <AlertDialogAction type="button" disabled={busy || !ready} onClick={handleSubmit} className="bg-[#ff8a2a] text-[#111111] hover:bg-[#f07b1a]">Ya, selesaikan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
