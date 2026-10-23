import { Bell } from "lucide-react"

import { ProfileMenu } from "@/components/auth/profile-menu"

type DashboardHeaderProps = {
  email?: string
  role?: string
  title?: string
  subtitle?: string
  countBadge?: string | number
}

export function DashboardHeader({
  email,
  role = "ES",
  title = "Dashboard",
  subtitle = "SPARTA",
  countBadge,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold tracking-wider text-[#747474] uppercase">
          {subtitle}
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
            {title}
          </h1>
          {countBadge !== undefined && (
            <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
              {countBadge}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative grid size-10 place-items-center rounded-full border border-[#dedede] bg-white text-[#111111] shadow-sm"
        >
          <Bell aria-hidden="true" />
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ff8a2a] text-[10px] font-semibold text-black">
            1
          </span>
        </button>
        <ProfileMenu initials={getInitials(role)} email={email} />
      </div>
    </header>
  )
}

function getInitials(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
