import { BottomNavigation } from "@/components/es-dashboard/bottom-navigation"
import { DashboardHeader } from "@/components/es-dashboard/dashboard-header"
import { DashboardShell } from "@/components/es-dashboard/dashboard-shell"
import { HardHat } from "lucide-react"

type PlaceholderScreenProps = {
  title: string
  email: string
  role: string
}

export function PlaceholderScreen({
  title,
  email,
  role,
}: PlaceholderScreenProps) {
  return (
    <>
      <DashboardShell>
        <DashboardHeader email={email} role={role} />

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-[#2d2c28] bg-[#1e1d1a] shadow-inner shadow-black/50">
            <HardHat className="size-10 text-orange-500" />
          </div>

          <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">
            {title}
          </h2>

          <p className="max-w-xs text-sm text-zinc-400">
            Halaman ini sedang dalam tahap pengembangan (Under Construction).
            Fitur akan segera tersedia.
          </p>
        </div>
      </DashboardShell>
      <BottomNavigation />
    </>
  )
}
