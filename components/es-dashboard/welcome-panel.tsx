import { EngineerIllustration } from "@/components/es-dashboard/engineer-illustration"
import type { EsDashboardUserContext } from "@/lib/es-dashboard-types"

type WelcomePanelProps = {
  user: EsDashboardUserContext | null
}

export function WelcomePanel({ user }: WelcomePanelProps) {
  const displayName = user?.name || "Engineering Support"
  const areaLabel = user?.location || user?.branchName || "area operasional Anda"

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-xl shadow-black/40">
      <div className="pointer-events-none absolute inset-0 bg-white/5" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-balance text-2xl font-semibold leading-tight text-white">
            Selamat datang, {displayName}
          </h2>
          <p className="mt-2 max-w-48 text-sm leading-6 text-gray-400">
            Pilih alur kerja untuk {areaLabel}.
          </p>
          <div className="mt-5 inline-flex rounded-full border border-[#ff8a2a]/20 bg-[#ff8a2a]/10 px-4 py-2 text-xs font-semibold text-[#ff8a2a] shadow-[inset_0_0_10px_rgba(255,138,42,0.1)]">
            ENGINEERING SUPPORT
          </div>
        </div>

        <div className="relative -mr-2 shrink-0 sm:mr-0">
          <EngineerIllustration />
        </div>
      </div>
    </section>
  )
}
