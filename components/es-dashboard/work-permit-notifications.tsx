"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Bell,
  CircleCheck,
  Download,
  History,
  Inbox,
} from "lucide-react"

import {
  markWorkPermitNotificationRead,
  refreshWorkPermitNotifications,
} from "@/app/dashboard/notification-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatWorkPermitMonth } from "@/lib/work-permits/active-period"
import {
  getWorkPermitDetailHref,
  getWorkPermitPdfHref,
} from "@/lib/work-permits/links"
import type { getWorkPermitNotifications } from "@/lib/work-permits/notifications"

export type WorkPermitNotificationData = Awaited<
  ReturnType<typeof getWorkPermitNotifications>
>

const EMPTY_NOTIFICATIONS: WorkPermitNotificationData = {
  unreadCount: 0,
  notices: [],
}
const approvalDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

export function WorkPermitNotifications({
  initialData,
}: {
  initialData: WorkPermitNotificationData | null
}) {
  const router = useRouter()
  const [data, setData] = useState(initialData ?? EMPTY_NOTIFICATIONS)
  const [error, setError] = useState(
    initialData ? "" : "Notifikasi belum dapat dimuat."
  )
  const [tab, setTab] = useState(
    initialData?.unreadCount === 0 && initialData.notices.length > 0
      ? "history"
      : "unread"
  )
  const [announcement, setAnnouncement] = useState("")
  const unreadTab = useRef<HTMLButtonElement>(null)
  const historyTab = useRef<HTMLButtonElement>(null)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const knownIds = useRef(new Set(data.notices.map((notice) => notice.id)))
  const refreshActive = useRef(false)
  const readActive = useRef(false)
  const readSequence = useRef(0)

  const refresh = useCallback(async () => {
    if (readActive.current || refreshActive.current) return
    refreshActive.current = true
    const startedAt = readSequence.current
    try {
      const latest = await refreshWorkPermitNotifications()
      if (startedAt !== readSequence.current) return
      if (!latest) {
        setError("Sesi telah berakhir. Silakan masuk kembali.")
        return
      }

      const hasNewNotice = latest.notices.some(
        (notice) => notice.readAt === null && !knownIds.current.has(notice.id)
      )
      latest.notices.forEach((notice) => knownIds.current.add(notice.id))
      setData(latest)
      setError("")
      if (hasNewNotice) router.refresh()
    } catch {
      if (startedAt === readSequence.current)
        setError("Notifikasi belum dapat dimuat. Coba muat ulang.")
    } finally {
      refreshActive.current = false
    }
  }, [router])

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void refresh()
    }
    const timer = window.setInterval(refreshWhenVisible, 30_000)
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [refresh])

  async function markRead(id: string) {
    if (readActive.current) return
    readActive.current = true
    readSequence.current += 1
    setMarkingId(id)
    setAnnouncement("")
    try {
      const latest = await markWorkPermitNotificationRead(id)
      if (!latest) {
        setError("Status notifikasi belum dapat diperbarui.")
        return
      }
      unreadTab.current?.focus()
      setData(latest)
      setError("")
      setAnnouncement("Notifikasi dipindahkan ke Riwayat.")
    } catch {
      setError("Status notifikasi belum dapat diperbarui. Coba lagi.")
    } finally {
      setMarkingId(null)
      readActive.current = false
    }
  }

  const unread = data.notices.filter((notice) => notice.readAt === null)
  const history = data.notices.filter((notice) => notice.readAt !== null)

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) void refresh()
      }}
    >
      <PopoverTrigger
        aria-label={
          data.unreadCount
            ? `Notifikasi, ${data.unreadCount} belum dibaca`
            : "Notifikasi"
        }
        render={
          <Button
            className="permit-workspace relative"
            variant="outline"
            size="icon-lg"
          />
        }
      >
        <Bell aria-hidden />
        {data.unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
          >
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="permit-workspace w-[min(27rem,calc(100vw_-_2rem))] rounded-xl"
      >
        <PopoverHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#fff0e3] text-[#9e4715]">
              <Bell className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <PopoverTitle className="text-base font-semibold">
                Notifikasi
              </PopoverTitle>
              <PopoverDescription>Persetujuan izin kerja K3</PopoverDescription>
            </div>
          </div>
        </PopoverHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void refresh()}
                >
                  Muat ulang
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
          <TabsList className="w-full" aria-label="Status notifikasi">
            <TabsTrigger value="unread" ref={unreadTab}>
              Belum dibaca
              {data.unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-4 bg-[#fff0e3] text-[#82380f]"
                >
                  {data.unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" ref={historyTab}>
              Riwayat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            {unread.length > 0 ? (
              <ul
                aria-label="Notifikasi belum dibaca"
                className="max-h-[min(26rem,50svh)] divide-y divide-border overflow-y-auto"
              >
                {unread.map((notice) => (
                  <NotificationItem
                    key={notice.id}
                    notice={notice}
                    markingId={markingId}
                    onMarkRead={markRead}
                  />
                ))}
              </ul>
            ) : (
              !error && (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                  <Inbox className="size-6 text-muted-foreground" aria-hidden />
                  <p className="font-semibold">Tidak ada notifikasi baru</p>
                  {history.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        historyTab.current?.focus()
                        setTab("history")
                      }}
                    >
                      Buka Riwayat
                    </Button>
                  )}
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="history">
            {history.length > 0 ? (
              <ul
                aria-label="Riwayat notifikasi"
                className="max-h-[min(26rem,50svh)] divide-y divide-border overflow-y-auto"
              >
                {history.map((notice) => (
                  <NotificationItem key={notice.id} notice={notice} />
                ))}
              </ul>
            ) : (
              !error && (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                  <History
                    className="size-6 text-muted-foreground"
                    aria-hidden
                  />
                  <p className="font-semibold">Riwayat masih kosong</p>
                  <p className="text-muted-foreground">
                    Notifikasi yang ditandai dibaca akan muncul di sini.
                  </p>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

type NotificationItemProps = {
  notice: WorkPermitNotificationData["notices"][number]
  markingId?: string | null
  onMarkRead?: (id: string) => Promise<void>
}

function NotificationItem({
  notice,
  markingId,
  onMarkRead,
}: NotificationItemProps) {
  const { approvedAt, permitCode, period, readAt } = notice
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 px-1.5 py-3.5">
      <div
        className={
          readAt
            ? "grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"
            : "grid size-8 place-items-center rounded-lg bg-[#fff0e3] text-[#9e4715]"
        }
      >
        <CircleCheck className="size-4" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold">Izin kerja disetujui</p>
          <p className="break-words text-muted-foreground">
            {permitCode} · {formatWorkPermitMonth(period)}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Disetujui{" "}
            <time dateTime={approvedAt}>
              {approvalDate.format(new Date(approvedAt))} WIB
            </time>
            {readAt && (
              <>
                <br />
                Dibaca{" "}
                <time dateTime={readAt}>
                  {approvalDate.format(new Date(readAt))} WIB
                </time>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={getWorkPermitDetailHref(permitCode)}
            className={buttonVariants({ variant: "outline" })}
          >
            Lihat izin <ArrowUpRight data-icon="inline-end" />
          </Link>
          <a
            href={getWorkPermitPdfHref(permitCode)}
            className={buttonVariants({ variant: "outline" })}
          >
            <Download data-icon="inline-start" /> Unduh PDF
          </a>
          {onMarkRead && (
            <Button
              variant="ghost"
              type="button"
              disabled={markingId !== null}
              onClick={() => void onMarkRead(notice.id)}
            >
              {markingId === notice.id ? "Menyimpan…" : "Tandai dibaca"}
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}
