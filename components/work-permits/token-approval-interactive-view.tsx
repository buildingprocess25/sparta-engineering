"use client"

import { useState } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react"

import { submitTokenDecisionAction } from "@/app/work-permits/approve/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type Decision = "APPROVED" | "REJECTED"

type TokenApprovalInteractiveViewProps = {
  token: string
  approverName: string
  approverEmail: string
  targetStage: "PENDING_P2K3" | "PENDING_SECRETARY"
  permitCode: string
  applicantName: string
  applicantNik: string
  branchName: string
  lokasi: string
  kegiatan: string
  workDate: string
  targetPeriod: string
  duration: string
  workers: string[]
  apdList: string[]
  highRiskList: string[]
  approvalHistory: Array<{
    actorName: string
    approvalRole: string
    decision: string
    notes?: string
    decidedAt?: string
  }>
}

const steps = [
  { stage: "PENDING_MANAGER", label: "BNM Manager" },
  { stage: "PENDING_P2K3", label: "P2K3 / Delegate" },
  { stage: "PENDING_SECRETARY", label: "Sekretaris P2K3" },
] as const

const decisionDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

function approvalRoleLabel(role: string) {
  switch (role) {
    case "MANAGER":
    case "PENDING_MANAGER":
      return "BNM Manager"
    case "P2K3":
    case "DELEGATE":
    case "P2K3_DELEGATE":
    case "PENDING_P2K3":
      return "P2K3 / Delegate"
    case "SECRETARY":
    case "PENDING_SECRETARY":
      return "Sekretaris P2K3"
    default:
      return "Penyetuju"
  }
}

export function TokenApprovalInteractiveView(
  props: TokenApprovalInteractiveViewProps
) {
  const {
    token,
    approverName,
    approverEmail,
    targetStage,
    permitCode,
    applicantName,
    applicantNik,
    branchName,
    lokasi,
    kegiatan,
    workDate,
    targetPeriod,
    duration,
    workers,
    apdList,
    highRiskList,
    approvalHistory,
  } = props
  const [notes, setNotes] = useState("")
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [result, setResult] = useState<{
    decision: Decision
    date: Date
    notes: string
  }>()
  const currentStep = steps.findIndex((step) => step.stage === targetStage)
  const roleLabel = steps[currentStep].label

  async function handleDecision(decision: Decision) {
    const trimmedNotes = notes.trim()
    if (decision === "REJECTED" && !trimmedNotes) {
      setErrorMessage("Isi alasan penolakan pada kolom catatan.")
      document.getElementById("approval-notes")?.focus()
      return
    }

    setPendingDecision(decision)
    setErrorMessage("")
    try {
      const response = await submitTokenDecisionAction(
        token,
        decision,
        trimmedNotes
      )
      if (!response.ok) {
        setErrorMessage(response.error || "Keputusan belum bisa disimpan.")
        return
      }
      setResult({ decision, date: new Date(), notes: trimmedNotes })
    } catch {
      setErrorMessage("Keputusan belum bisa disimpan. Coba lagi.")
    } finally {
      setPendingDecision(null)
    }
  }

  if (result) {
    const approved = result.decision === "APPROVED"
    return (
      <Card role="status" className="mx-auto max-w-xl">
        <CardHeader>
          {approved ? (
            <CheckCircle2 className="mb-2 size-7 text-emerald-700" />
          ) : (
            <XCircle className="mb-2 size-7 text-destructive" />
          )}
          <h1 className="text-2xl font-semibold">
            {approved ? "Persetujuan tersimpan" : "Penolakan tersimpan"}
          </h1>
          <CardDescription>
            {permitCode} · {roleLabel} · {decisionDate.format(result.date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-base leading-7">
            <p>
              {approved && targetStage === "PENDING_P2K3"
                ? "Pengajuan diteruskan ke Sekretaris P2K3."
                : approved
                  ? "Izin kerja telah mendapat persetujuan akhir."
                  : "Pengajuan izin kerja telah ditolak."}
            </p>
            {result.notes && (
              <p className="break-words whitespace-pre-wrap">
                <strong>Catatan</strong>
                <br />
                {result.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-muted-foreground">
          Izin Kerja K3 · SAT/FRM/MED/003
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Persetujuan izin kerja
        </h1>
        <p className="mt-2 text-sm leading-6 break-words text-muted-foreground">
          {permitCode} · {branchName}
        </p>
      </div>
      <Card>
        <CardContent>
          <ol
            aria-label="Tahapan persetujuan"
            className="grid gap-3 sm:grid-cols-3"
          >
            {steps.map((step, index) => {
              const done = index < currentStep
              const current = index === currentStep
              return (
                <li
                  key={step.stage}
                  aria-current={current ? "step" : undefined}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 aria-current:border-[#eac4a3] aria-current:bg-[#fff3e9]"
                >
                  <span
                    className={
                      done
                        ? "text-emerald-700"
                        : current
                          ? "text-[#a44910]"
                          : "text-muted-foreground"
                    }
                  >
                    {done ? (
                      <Check className="size-5" aria-hidden />
                    ) : current ? (
                      <Clock className="size-5" aria-hidden />
                    ) : (
                      <Circle className="size-5" aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold">{step.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {done
                        ? "Disetujui"
                        : current
                          ? "Giliran Anda"
                          : "Menunggu"}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0">
          <CardHeader className="border-b">
            <h2 className="text-lg font-semibold">Ringkasan pengajuan</h2>
            <CardDescription>
              {applicantName} · {applicantNik}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-muted-foreground">Kegiatan</h3>
                <p className="text-base leading-7 break-words whitespace-pre-wrap">
                  {kegiatan}
                </p>
              </div>
              <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Lokasi</dt>
                  <dd className="text-base break-words">{lokasi}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tanggal kerja</dt>
                  <dd className="text-base">{workDate}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Periode target</dt>
                  <dd className="text-base">{targetPeriod}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Waktu pelaksanaan</dt>
                  <dd className="text-base break-words">
                    {duration || "Belum dicantumkan"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Pelaksana</dt>
                  <dd className="text-base break-words">
                    {workers.length ? workers.join(", ") : "Belum dicantumkan"}
                  </dd>
                </div>
              </dl>
              <Separator />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-base font-semibold">APD wajib</h3>
                  {apdList.length ? (
                    <ul className="space-y-1.5">
                      {apdList.map((label) => (
                        <li key={label} className="flex items-start gap-2">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-emerald-700"
                            aria-hidden
                          />
                          {label}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Belum dicantumkan.</p>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold">
                    Pekerjaan berisiko tinggi
                  </h3>
                  {highRiskList.length ? (
                    <ul className="space-y-1.5">
                      {highRiskList.map((label) => (
                        <li key={label} className="flex items-start gap-2">
                          <AlertCircle
                            className="mt-0.5 size-4 shrink-0 text-destructive"
                            aria-hidden
                          />
                          {label}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      Belum ada risiko tinggi yang ditandai.
                    </p>
                  )}
                </div>
              </div>
              {approvalHistory.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-base font-semibold">
                      Riwayat persetujuan
                    </h3>
                    <ul className="divide-y divide-border">
                      {approvalHistory.map((item, index) => (
                        <li
                          key={index}
                          className="flex flex-wrap justify-between gap-2 py-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium break-words">
                              {item.actorName}
                            </p>
                            <p className="text-muted-foreground">
                              {approvalRoleLabel(item.approvalRole)}
                              {item.decidedAt
                                ? ` · ${decisionDate.format(new Date(item.decidedAt))}`
                                : ""}
                            </p>
                            {item.notes && (
                              <p className="mt-1 break-words whitespace-pre-wrap">
                                {item.notes}
                              </p>
                            )}
                          </div>
                          {item.decision === "APPROVED" && (
                            <span className="font-medium text-emerald-700">
                              Disetujui
                            </span>
                          )}
                          {item.decision === "REJECTED" && (
                            <span className="font-medium text-destructive">
                              Ditolak
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-6">
          <CardHeader className="border-b">
            <h2 className="text-lg font-semibold">Keputusan Anda</h2>
            <CardDescription className="break-words">
              {approverName} · {roleLabel}
              <br />
              {approverEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="approval-notes" className="font-medium">
                  Catatan untuk pemohon
                </label>
                <Textarea
                  id="approval-notes"
                  rows={4}
                  value={notes}
                  disabled={pendingDecision !== null}
                  aria-describedby="approval-notes-hint"
                  onChange={(event) => setNotes(event.target.value)}
                />
                <p id="approval-notes-hint" className="text-muted-foreground">
                  Wajib diisi jika Anda menolak izin kerja.
                </p>
              </div>
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Button
                  size="lg"
                  disabled={pendingDecision !== null}
                  onClick={() => handleDecision("APPROVED")}
                >
                  {pendingDecision === "APPROVED" ? (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <Check data-icon="inline-start" />
                  )}
                  {pendingDecision === "APPROVED"
                    ? "Menyimpan…"
                    : "Setujui izin kerja"}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  disabled={pendingDecision !== null}
                  onClick={() => handleDecision("REJECTED")}
                >
                  {pendingDecision === "REJECTED" ? (
                    <Loader2
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <XCircle data-icon="inline-start" />
                  )}
                  {pendingDecision === "REJECTED"
                    ? "Menyimpan…"
                    : "Tolak izin kerja"}
                </Button>
              </div>
              <p className="text-muted-foreground">
                Tautan ini berlaku untuk satu keputusan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
