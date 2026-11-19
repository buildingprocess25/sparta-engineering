"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "cn"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Bell,
  Check,
  ClipboardList,
  ShieldCheck,
  Download,
  History,
  Inbox,
} from "lucide-react"

import {
  markDashboardNotificationRead,
  refreshDashboardNotificationSummary,
  refreshDashboardNotifications,
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getLatestUnreadApprovalAt,
  type DashboardNotice,
  type DashboardNoticeData,
} from "@/lib/dashboard-notices"

const approvalDate = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

export function DashboardNotifications({ workPermitSnapshotAt }: { workPermitSnapshotAt?: string }) {
  const router = useRouter()
  const [data, setData] = useState<DashboardNoticeData | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("unread")
  const [announcement, setAnnouncement] = useState("")
  const [markingId, setMarkingId] = useState<string | null>(null)
  const unreadTab = useRef<HTMLButtonElement>(null)
  const historyTab = useRef<HTMLButtonElement>(null)
  const observedApproval = useRef<string | null | undefined>(workPermitSnapshotAt)
  const hasLoadedPanel = useRef(false)
  const panelOpen = useRef(false)
  const summaryActive = useRef(false)
  const panelActive = useRef(false)
  const readActive = useRef(false)
  const requestVersion = useRef(0)

  const observeApproval = useCallback((approval: string | null) => {
    const previous = observedApproval.current
    if (previous === undefined) {
      observedApproval.current = approval
    } else if (approval && (!previous || approval > previous)) {
      observedApproval.current = approval
      router.refresh()
    }
  }, [router])

  const refreshSummary = useCallback(async () => {
    if (summaryActive.current || panelActive.current || readActive.current) return
    summaryActive.current = true
    const startedAt = requestVersion.current

    try {
      const latest = await refreshDashboardNotificationSummary()
      if (!latest || startedAt !== requestVersion.current) return
      setUnreadCount(latest.unreadCount)
      observeApproval(latest.latestUnreadApprovalAt)
    } catch {
      // Keep the last count. Opening the panel offers a retry if its request also fails.
    } finally {
      summaryActive.current = false
    }
  }, [observeApproval])

  const refreshPanel = useCallback(async () => {
    if (panelActive.current || readActive.current) return
    panelActive.current = true
    const startedAt = ++requestVersion.current
    setError("")

    try {
      const latest = await refreshDashboardNotifications()
      if (startedAt !== requestVersion.current) return
      if (!latest) {
        setError("Sesi telah berakhir. Silakan masuk kembali.")
        return
      }

      if (!hasLoadedPanel.current) {
        hasLoadedPanel.current = true
        if (latest.unreadCount === 0 && latest.notices.length > 0) setTab("history")
      }
      setData(latest)
      setUnreadCount(latest.unreadCount)
      observeApproval(getLatestUnreadApprovalAt(latest.notices))
    } catch {
      if (startedAt === requestVersion.current)
        setError("Notifikasi belum dapat dimuat. Coba muat ulang.")
    } finally {
      panelActive.current = false
    }
  }, [observeApproval])

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState !== "visible") return
      if (panelOpen.current) void refreshPanel()
      else void refreshSummary()
    }

    refreshWhenVisible()
    const timer = window.setInterval(refreshWhenVisible, 30_000)
    document.addEventListener("visibilitychange", refreshWhenVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [refreshPanel, refreshSummary])

  async function markRead(id: string) {
    if (readActive.current) return
    readActive.current = true
    requestVersion.current += 1
    setMarkingId(id)
    setAnnouncement("")
    try {
      const latest = await markDashboardNotificationRead(id)
      if (!latest) {
        setError("Status notifikasi belum dapat diperbarui.")
        return
      }
      unreadTab.current?.focus()
      setData(latest)
      setUnreadCount(latest.unreadCount)
      observeApproval(getLatestUnreadApprovalAt(latest.notices))
      setError("")
      setAnnouncement("Notifikasi dipindahkan ke Riwayat.")
    } catch {
      setError("Status notifikasi belum dapat diperbarui. Coba lagi.")
    } finally {
      setMarkingId(null)
      readActive.current = false
    }
  }

  const unread = (data?.notices ?? []).filter((notice) => notice.readAt === null)
  const history = (data?.notices ?? []).filter((notice) => notice.readAt !== null)

  return (
    <Popover
      onOpenChange={(open) => {
        panelOpen.current = open
        if (open) void refreshPanel()
      }}
    >
      <PopoverTrigger
        aria-label={
          unreadCount
            ? `Notifikasi, ${unreadCount} belum dibaca`
            : "Notifikasi"
        }
        render={
          <Button
            className="notification-workspace relative rounded-xl bg-background text-foreground aria-expanded:border-primary aria-expanded:bg-[#fff1e7] aria-expanded:text-[#963a0d]"
            variant="outline"
            size="icon-lg"
          />
        }
      >
        <Bell aria-hidden />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="notification-workspace w-[min(27rem,calc(100vw_-_1.5rem))] gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_16px_48px_-16px_#1d1c1a66] motion-reduce:animate-none"
      >
        <PopoverHeader className="border-b-[3px] border-primary bg-[#1d1c1a] text-white">
          <div className="flex items-center gap-3.5 px-4 py-4 sm:px-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground">
              <Bell className="size-[18px]" aria-hidden />
            </span>
            <div className="min-w-0">
              <PopoverTitle className="text-lg font-semibold tracking-tight">Notifikasi</PopoverTitle>
              <PopoverDescription className="text-zinc-300">
                Izin kerja dan laporan maintenance
              </PopoverDescription>
            </div>
          </div>
        </PopoverHeader>

        {error && (
          <div className="px-3 pt-3 sm:px-4">
            <Alert variant="destructive">
              <AlertDescription>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>{error}</p>
                  <Button size="sm" variant="outline" onClick={() => void refreshPanel()}>
                    Muat ulang
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        {data ? (
          <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
            <div className="px-3 pt-3 sm:px-4">
              <TabsList className="w-full" aria-label="Status notifikasi">
                <TabsTrigger value="unread" ref={unreadTab}>
                  Belum dibaca
                  {data.unreadCount > 0 && (
                    <Badge variant="secondary" className="bg-[#262321] text-white">
                      {data.unreadCount > 99 ? "99+" : data.unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" ref={historyTab}>
                  Riwayat
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="unread">
              {unread.length > 0 ? (
                <ul
                  aria-label="Notifikasi belum dibaca"
                  className="max-h-[min(26rem,50svh)] divide-y divide-border overflow-y-auto overscroll-contain"
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
                  className="max-h-[min(26rem,50svh)] divide-y divide-border overflow-y-auto overscroll-contain"
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
        ) : (
          !error && <NotificationListSkeleton />
        )}
      </PopoverContent>
    </Popover>
  )
}

function NotificationListSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Memuat notifikasi</span>
      <div aria-hidden="true">
        <div className="px-3 pt-3 pb-2 sm:px-4">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="divide-y divide-border">
          {[0, 1].map((row) => (
            <div key={row} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 px-3 py-3.5 sm:px-4">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

type NotificationItemProps = {
  notice: DashboardNotice
  markingId?: string | null
  onMarkRead?: (id: string) => Promise<void>
}

function NotificationItem({
  notice,
  markingId,
  onMarkRead,
}: NotificationItemProps) {
  const { occurredAt, readAt } = notice
  const Icon = notice.kind === "permit" ? ShieldCheck : ClipboardList
  const highlighted = notice.attention && !readAt

  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 px-3 py-3.5 sm:px-4",
        highlighted && "bg-[#fff1e7] shadow-[inset_3px_0_0_var(--primary)]",
      )}
    >
      <div className={cn(
        "grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground",
        highlighted && "bg-[#ffddc5] text-[#8a330b]",
      )}>
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={cn("font-semibold leading-5", highlighted && "text-[#78310d]")}>
          {notice.title}
        </p>
        <p className="break-words text-xs leading-5 text-muted-foreground">{notice.reference}</p>
        <p className="text-xs leading-5 tabular-nums text-muted-foreground">
          <time dateTime={occurredAt}>{approvalDate.format(new Date(occurredAt))} WIB</time>
          {readAt && (
            <span className="block">
              Dibaca <time dateTime={readAt}>{approvalDate.format(new Date(readAt))} WIB</time>
            </span>
          )}
        </p>
      </div>
      {onMarkRead && (
        <div className="flex items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full bg-[#d45010]" aria-hidden />
          <Button
            variant="ghost"
            size="icon-lg"
            type="button"
            aria-label={`Tandai dibaca: ${notice.title}, ${notice.reference}`}
            aria-busy={markingId === notice.id}
            title={markingId === notice.id ? "Menyimpan…" : "Tandai dibaca"}
            disabled={markingId !== null}
            onClick={() => void onMarkRead(notice.id)}
          >
            <Check aria-hidden />
          </Button>
        </div>
      )}
      <div className="col-start-2 col-end-4 flex flex-wrap items-center gap-1.5">
        <Link
          href={notice.href}
          className={buttonVariants({
            variant: highlighted ? "secondary" : "ghost",
            size: "sm",
            className: highlighted ? "bg-[#ffddc5] text-[#78310d] hover:bg-[#ffd1ae]" : undefined,
          })}
        >
          {notice.actionLabel} <ArrowUpRight data-icon="inline-end" aria-hidden />
        </Link>
        {notice.pdfHref && (
          <a href={notice.pdfHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Download data-icon="inline-start" aria-hidden /> Unduh PDF
          </a>
        )}
      </div>
    </li>
  )
}
