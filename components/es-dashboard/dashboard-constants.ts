import { Clock3, FileText, LayoutGrid, Shield } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type DashboardNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const dashboardNavigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Laporan", href: "/dashboard/reports", icon: FileText },
  { label: "Aktivitas", href: "/dashboard/activity", icon: Clock3 },
  { label: "Preventif", href: "/dashboard/preventive", icon: Shield },
] satisfies DashboardNavItem[]
