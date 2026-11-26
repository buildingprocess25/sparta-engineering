"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Inbox, RefreshCw, Trash2 } from "lucide-react"

import { clearOutboxAction } from "@/app/demo/outbox/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { SimulatedEmailItem } from "@/lib/work-permits/email-approval"

type OutboxMessage = Pick<
  SimulatedEmailItem,
  "id" | "toEmail" | "toName" | "subject" | "bodyText" | "actionUrl" | "sentAt"
>

const sentDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

export function OutboxView({ emails }: { emails: OutboxMessage[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string>()
  const [mobileReading, setMobileReading] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isPending, startTransition] = useTransition()
  const selected = emails.find((email) => email.id === selectedId) ?? emails[0]

  function clearMessages() {
    startTransition(async () => {
      try {
        const result = await clearOutboxAction()
        if (!result.ok) throw new Error()
        setConfirmationOpen(false)
        setSelectedId(undefined)
        setMobileReading(false)
        setFeedback("")
        router.refresh()
      } catch {
        setConfirmationOpen(false)
        setFeedback("Kotak keluar belum bisa dikosongkan. Coba lagi.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
        >
          <RefreshCw
            data-icon="inline-start"
            className={isPending ? "animate-spin" : undefined}
          />{" "}
          Muat ulang
        </Button>
        {emails.length > 0 && (
          <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
            <DialogTrigger
              render={<Button variant="ghost" disabled={isPending} />}
            >
              <Trash2 data-icon="inline-start" /> Kosongkan email
            </DialogTrigger>
            <DialogContent className="permit-workspace" showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Kosongkan kotak keluar demo?</DialogTitle>
                <DialogDescription>
                  Pesan simulasi akan dihapus. Data pengajuan izin kerja tetap
                  tersimpan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" disabled={isPending} />}
                >
                  Batal
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={clearMessages}
                  disabled={isPending}
                >
                  {isPending ? "Mengosongkan…" : "Kosongkan email"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {feedback && (
        <Alert variant="destructive">
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      {selected ? (
        <div className="grid items-start gap-5 md:grid-cols-[minmax(15rem,1fr)_minmax(0,2.1fr)]">
          <Card className={mobileReading ? "hidden md:flex" : undefined}>
            <CardHeader className="border-b">
              <h2 className="text-base font-semibold">Pesan terkirim</h2>
              <CardDescription>{emails.length} pesan terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              <ul aria-label="Pesan terkirim" className="space-y-1">
                {emails.map((email) => (
                  <li key={email.id}>
                    <Button variant="ghost"
                      type="button"
                      aria-current={
                        email.id === selected.id ? "true" : undefined
                      }
                      className="inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit w-full rounded-lg border border-transparent px-3 py-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-current:border-[#eac4a3] aria-current:bg-[#fff3e9]"
                      onClick={() => {
                        setSelectedId(email.id)
                        setMobileReading(true)
                      }}
                    >
                      <span className="block text-sm font-semibold break-words">
                        {email.toName || email.toEmail}
                      </span>
                      <span className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {email.subject}
                      </span>
                      <time
                        dateTime={email.sentAt.toISOString()}
                        className="mt-1.5 block text-xs text-muted-foreground"
                      >
                        {sentDate.format(email.sentAt)}
                      </time>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card
            className={mobileReading ? "min-w-0" : "hidden min-w-0 md:flex"}
          >
            <CardHeader className="border-b">
              <div className="mb-2 md:hidden">
                <Button variant="ghost" onClick={() => setMobileReading(false)}>
                  <ArrowLeft data-icon="inline-start" /> Kembali ke pesan
                </Button>
              </div>
              <h2 className="text-lg leading-snug font-semibold break-words sm:text-xl">
                {selected.subject}
              </h2>
              <CardDescription className="break-words">
                Kepada {selected.toName ? `${selected.toName} · ` : ""}
                {selected.toEmail}
              </CardDescription>
              <time
                dateTime={selected.sentAt.toISOString()}
                className="text-sm text-muted-foreground"
              >
                {sentDate.format(selected.sentAt)}
              </time>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <p className="text-base leading-7 break-words whitespace-pre-line">
                  {messageContent(selected.bodyText)}
                </p>
                {selected.actionUrl && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        nativeButton={false}
                        render={
                          <a
                            href={selected.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        Buka halaman persetujuan{" "}
                        <ArrowUpRight data-icon="inline-end" />
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Tautan berlaku untuk satu keputusan dan bisa dibuka
                        tanpa login.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent>
            <div className="py-10 text-center">
              <Inbox
                className="mx-auto mb-3 size-7 text-muted-foreground"
                aria-hidden
              />
              <h2 className="text-base font-semibold">Belum ada email demo</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Email pertama muncul setelah BNM Manager menyetujui pengajuan
                izin kerja demo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function messageContent(bodyText: string | null) {
  return (
    bodyText
      ?.trim()
      .replace(/^\[Persetujuan Izin Kerja K3\]\s*/, "")
      .split(/\n\s*Buka halaman persetujuan berikut/)[0]
      ?.trim() || "Isi pesan tidak tersedia."
  )
}
