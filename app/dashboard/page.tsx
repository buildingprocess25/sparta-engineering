import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  FileSignature,
  MapPin,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const workflowChoices = [
  {
    title: "Checklist",
    description: "Laporan rutin area kerja.",
    icon: ClipboardCheck,
    meta: "Monthly / Weekly",
  },
  {
    title: "Perbaikan / Temuan",
    description: "Temuan ES atau arahan AHO.",
    icon: Wrench,
    meta: "Follow-up",
  },
]

const areaChoices = [
  {
    title: "Office",
    description: "Ruang kantor dan fasilitas pendukung.",
    icon: Building2,
    periods: ["Monthly"],
  },
  {
    title: "Warehouse Group",
    description: "WHC, WH, Depo, Bulky, Store Hub, Gudang Anak.",
    icon: Warehouse,
    periods: ["Monthly", "Weekly"],
  },
]

const timeline = [
  "Form Ijin Kerja",
  "Pilih Jalur",
  "Pilih Area",
  "Monthly / Weekly",
]

export default function DashboardPage() {
  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-[#0b0b0c] text-white"
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(255,138,42,0.13),transparent)]" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-4 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:mb-3 focus:rounded-md focus:bg-[#ff8a2a] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
        >
          Lewati ke konten
        </a>

        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md border border-white/12 bg-white/[0.06] text-sm font-semibold tracking-[0.04em] text-[#f3f3f3] shadow-lg shadow-black/20 backdrop-blur-md">
              SP
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-white">
                SPARTA
              </h1>
              <p className="truncate text-sm text-[#b9b9b9]">
                Engineering Support
              </p>
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-right backdrop-blur-md">
            <p className="text-xs text-[#b9b9b9]">Hari ini</p>
            <p className="text-sm font-medium text-white">ES</p>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-black/25 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#b9b9b9]">BANJARMASIN</p>
              <h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-white">
                Mulai pekerjaan engineering
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#cfcfcf]">
                Pilih langkah awal sesuai kondisi pekerjaan hari ini.
              </p>
            </div>
            <MapPin className="mt-1 shrink-0 text-[#cfcfcf]" aria-hidden="true" />
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-[#ff8a2a]/25 bg-[#17110c]/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#ff8a2a] text-black shadow-md shadow-[#ff8a2a]/10">
              <FileSignature aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#ffb46f]">Langkah awal</p>
              <h2 className="mt-1 text-lg font-semibold text-white text-pretty">
                Form Ijin Kerja
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#dec6b2]">
                Isi bila pekerjaan membutuhkan izin. Jika tidak, lanjut ke
                pilihan laporan.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button className="h-11 bg-[#ff8a2a] text-black hover:bg-[#ff9c48]">
              Isi Form
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              className="h-11 border-white/14 bg-white/[0.06] text-white hover:bg-white/[0.09] hover:text-white"
            >
              Lewati
            </Button>
          </div>
        </section>

        <section className="mt-5">
          <SectionHeading
            kicker="Pilih jalur"
            title="Jenis laporan"
          />
          <div className="mt-3 flex flex-col gap-3">
            {workflowChoices.map((choice) => (
              <ChoicePanel key={choice.title} {...choice} />
            ))}
          </div>
        </section>

        <section className="mt-5">
          <SectionHeading kicker="Pilih area" title="Lokasi pekerjaan" />
          <div className="mt-3 flex flex-col gap-3">
            {areaChoices.map((area) => (
              <AreaPanel key={area.title} {...area} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-md border border-white/12 bg-black/35 p-4 backdrop-blur-xl">
          <p className="text-sm font-medium text-white">Urutan kerja</p>
          <div className="mt-3 flex flex-col gap-2">
            {timeline.map((item, index) => (
              <div
                key={item}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2 text-sm",
                  index === 0
                    ? "border-[#ff8a2a]/35 bg-[#ff8a2a]/12 text-[#ffb46f]"
                    : "border-white/10 bg-white/[0.04] text-[#d7d7d7]",
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-current text-xs">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function SectionHeading({
  kicker,
  title,
}: {
  kicker: string
  title: string
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#bfbfbf]">
        {kicker}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-white text-pretty">
        {title}
      </h2>
    </div>
  )
}

function ChoicePanel({
  title,
  description,
  icon: Icon,
  meta,
}: {
  title: string
  description: string
  icon: LucideIcon
  meta: string
}) {
  return (
    <button
      type="button"
      className="group flex min-h-24 w-full items-start gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4 text-left shadow-lg shadow-black/20 backdrop-blur-md transition-colors hover:border-white/16 hover:bg-white/[0.075] focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/70"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#d0d0d0]/12 text-white">
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-base font-semibold text-white">{title}</span>
          <ArrowRight
            className="shrink-0 text-[#ffb46f] transition group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
        <span className="mt-1 block text-sm leading-6 text-[#d7d7d7]">
          {description}
        </span>
        <span className="mt-3 inline-flex rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs font-medium text-[#d7d7d7]">
          {meta}
        </span>
      </span>
    </button>
  )
}

function AreaPanel({
  title,
  description,
  icon: Icon,
  periods,
}: {
  title: string
  description: string
  icon: LucideIcon
  periods: string[]
}) {
  return (
    <button
      type="button"
      className="flex min-h-24 w-full items-start gap-3 rounded-lg border border-white/10 bg-white/[0.055] p-4 text-left shadow-lg shadow-black/20 backdrop-blur-md transition-colors hover:border-white/16 hover:bg-white/[0.075] focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/70"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#d0d0d0]/12 text-white">
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-base font-semibold text-white">{title}</span>
          <Check className="shrink-0 text-[#cfcfcf]" aria-hidden="true" />
        </span>
        <span className="mt-1 block text-sm leading-6 text-[#d7d7d7]">
          {description}
        </span>
        <span className="mt-3 flex flex-wrap gap-2">
          {periods.map((period) => (
            <span
              key={period}
              className="rounded-md border border-[#ff8a2a]/35 bg-[#ff8a2a]/12 px-2 py-1 text-xs font-medium text-[#ffb46f]"
            >
              {period}
            </span>
          ))}
        </span>
      </span>
    </button>
  )
}
