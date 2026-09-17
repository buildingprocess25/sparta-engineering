import { Bell } from "lucide-react"

import { ProfileMenu } from "@/components/auth/profile-menu"

type DashboardHeaderProps = {
  email?: string
  role?: string
}

export function DashboardHeader({ email, role = "ES" }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#747474]">SPARTA</p>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
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
