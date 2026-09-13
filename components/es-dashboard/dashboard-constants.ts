import { Clock3, FileText, LayoutGrid, Shield } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type DashboardStat = {
  value: string
  title: string
  description: string
  tone: "silver" | "orange"
  icon: LucideIcon
}

export type DashboardNavItem = {
  label: string
  icon: LucideIcon
  active?: boolean
}

export const dashboardStats = [
  {
    value: "2",
    title: "Jalur Kerja",
    description: "Checklist dan temuan",
    tone: "silver",
    icon: FileText,
  },
  {
    value: "3",
    title: "Tahap Awal",
    description: "Ijin, jalur, area",
    tone: "orange",
    icon: Clock3,
  },
] satisfies DashboardStat[]

export const dashboardNavigationItems = [
  { label: "Dashboard", icon: LayoutGrid, active: true },
  { label: "Laporan", icon: FileText },
  { label: "Aktivitas", icon: Clock3 },
  { label: "Preventif", icon: Shield },
] satisfies DashboardNavItem[]
