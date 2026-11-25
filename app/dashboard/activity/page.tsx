import { EsNavigationUnavailable } from "@/components/es-dashboard/es-navigation-unavailable"
import { EsActivityTimeline } from "@/components/es-dashboard/es-activity-timeline"
import { PlaceholderScreen } from "@/components/es-dashboard/placeholder-screen"
import { getEsActivityEvents } from "@/lib/reports/es-navigation-data"
import { activityRange, withinActivityRange } from "@/lib/tasks/activity-timeline"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

interface ActivityPageProps {
  searchParams?: Promise<{ tab?: string; from?: string; to?: string }>
}

export default async function ActivityPage(props: ActivityPageProps) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (typeof session?.userId !== "string") redirect("/login")
  if (session.role === "ES") {
    // Preserve Dashboard's existing deep links and bookmarks.
    if (searchParams?.tab === "completed") redirect("/dashboard/checklists?status=COMPLETED")
    if (searchParams?.tab === "overdue") redirect("/dashboard/checklists?status=OVERDUE")
    if (searchParams?.tab === "revision") redirect("/dashboard/reports?status=NEEDS_REVISION")
    if (searchParams?.tab === "submitted") redirect("/dashboard/reports")
    try {
      const now = new Date().toISOString()
      const range = activityRange(searchParams?.from, searchParams?.to, now)
      const events = (await getEsActivityEvents(session.userId)).filter(e => withinActivityRange(e.at, range))
      return <EsActivityTimeline key={`${range.from}-${range.to}`} events={events} email={session.email as string} range={range} now={now} />
    } catch (error) {
      console.error("ES activity unavailable", error)
      return <EsNavigationUnavailable email={session.email as string} title="Aktivitas" href="/dashboard/activity" />
    }
  }
  return <PlaceholderScreen title="Aktivitas" email={session.email as string} role={session.role as string} />
}
