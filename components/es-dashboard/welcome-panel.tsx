import { FileSignature } from "lucide-react"

export function WelcomePanel() {
  return (
    <section className="mt-6 overflow-hidden rounded-[1.35rem] bg-[#111111] p-6 text-white shadow-xl shadow-black/15">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-balance text-2xl font-semibold leading-tight">
            Welcome ES User
          </h2>
          <p className="mt-2 max-w-48 text-sm leading-6 text-[#d9d9d9]">
            Pilih alur kerja untuk area BANJARMASIN.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-[#ffb46f]">
            ENGINEERING SUPPORT
          </div>
        </div>
        <div className="relative mt-1 grid size-28 shrink-0 place-items-center">
          <div className="absolute inset-0 rounded-full bg-[#2a2a2a]" />
          <div className="absolute bottom-1 h-20 w-16 rounded-t-full bg-[#d7d7d7]" />
          <div className="absolute top-3 size-12 rounded-full bg-[#ffb46f]" />
          <div className="absolute right-0 top-14 rounded-xl bg-[#ff8a2a] px-3 py-2 shadow-lg shadow-black/20">
            <FileSignature className="text-black" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
