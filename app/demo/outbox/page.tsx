import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { OutboxView } from "@/components/demo/outbox-view"
import { Button } from "@/components/ui/button"
import { PermitPublicLayout } from "@/components/work-permits/permit-public-layout"
import { getSpartaAppMode } from "@/lib/sparta-app-mode"
import { getOutboxEmails } from "@/lib/work-permits/email-approval"

export const dynamic = "force-dynamic"

export default async function DemoOutboxPage() {
  if (getSpartaAppMode() !== "demo") notFound()

  const emails = await getOutboxEmails()

  return (
    <PermitPublicLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Kotak Keluar Email Demo
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Lihat simulasi email persetujuan izin kerja untuk P2K3 / Delegate
            dan Sekretaris P2K3.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          <ArrowLeft data-icon="inline-start" /> Kembali ke halaman masuk
        </Button>
      </div>
      <OutboxView
        emails={emails.map(
          ({ id, toEmail, toName, subject, bodyText, actionUrl, sentAt }) => ({
            id,
            toEmail,
            toName,
            subject,
            bodyText,
            actionUrl,
            sentAt,
          })
        )}
      />
    </PermitPublicLayout>
  )
}
