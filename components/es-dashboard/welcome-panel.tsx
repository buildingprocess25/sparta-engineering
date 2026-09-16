import { EngineerIllustration } from "./engineer-illustration"

export function WelcomePanel() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-[#0a0a0a] p-6 shadow-xl shadow-black/40 border border-white/10">
      {/* Subtle glass overlay */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-balance text-2xl font-semibold leading-tight text-white">
            Welcome ES User
          </h2>
          <p className="mt-2 max-w-48 text-sm leading-6 text-gray-400">
            Pilih alur kerja untuk area BANJARMASIN.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-[#ff8a2a]/10 border border-[#ff8a2a]/20 px-4 py-2 text-xs font-semibold text-[#ff8a2a] shadow-[inset_0_0_10px_rgba(255,138,42,0.1)]">
            ENGINEERING SUPPORT
          </div>
        </div>
        
        {/* New Illustration Component */}
        <div className="relative shrink-0 -mr-2 sm:mr-0">
          <EngineerIllustration />
        </div>
      </div>
    </section>
  )
}
