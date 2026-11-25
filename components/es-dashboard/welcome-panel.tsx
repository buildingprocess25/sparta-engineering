import { EngineerIllustration } from "@/components/es-dashboard/engineer-illustration"
import type { EsDashboardUserContext } from "@/lib/es-dashboard-types"

type WelcomePanelProps = {
  user: EsDashboardUserContext | null
}

export function WelcomePanel({ user }: WelcomePanelProps) {
  const displayName = user?.name || "Engineering Support"
  const areaLabel = user?.location || user?.branchName || "area operasional Anda"

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl border border-[#dedede] bg-white p-5 sm:p-6 shadow-sm">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-balance text-2xl font-semibold leading-tight text-[#111111] md:text-3xl">
            Selamat datang, {displayName}
          </h2>
          <p className="mt-2 max-w-48 sm:max-w-md md:max-w-lg text-sm leading-6 text-slate-600 md:text-base">
            Pilih alur kerja untuk {areaLabel}.
          </p>
          <div className="mt-5 inline-flex rounded-full border border-[#ff8a2a]/20 bg-[#ff8a2a]/10 px-4 py-2 text-xs font-semibold text-orange-800">
            ENGINEERING SUPPORT
          </div>
        </div>

        <div className="relative hidden shrink-0 sm:block">
          <EngineerIllustration />
        </div>
      </div>
    </section>
  )
}
