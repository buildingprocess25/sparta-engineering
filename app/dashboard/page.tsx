import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  FileSignature,
  MapPin,
  ShieldCheck,
  Sparkles,
  Warehouse,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const workflowChoices = [
  {
    title: "Checklist",
    description: "Buat laporan checklist rutin untuk area operasional.",
    icon: ClipboardCheck,
    meta: "Monthly / Weekly",
  },
  {
    title: "Perbaikan by AHO / Temuan ES",
    description: "Catat temuan perbaikan dari AHO atau laporan ES.",
    icon: Wrench,
    meta: "Repair follow-up",
  },
]

const areaChoices = [
  {
    title: "Office",
    description: "Area kantor dan fasilitas pendukung.",
    icon: Building2,
    periods: ["Monthly"],
  },
  {
    title: "WHC / WH / Depo / Bulky / Store Hub / Gudang Anak",
    description: "Area gudang, depo, bulky, hub, dan gudang anak.",
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
    <main className="min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,126,31,0.26),transparent_32%),linear-gradient(145deg,#050505,#161616_48%,#050505)] text-white">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 py-5 sm:max-w-lg">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-md border border-white/15 bg-white/10 shadow-lg shadow-black/30 backdrop-blur-xl">
              <ShieldCheck className="text-[#ff8a2a]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#d7d7d7]">
                SPARTA
              </p>
              <h1 className="truncate text-xl font-semibold text-white">
                Dashboard ES
              </h1>
            </div>
          </div>
          <div className="rounded-md border border-[#c7c7c7]/20 bg-[#c7c7c7]/10 px-3 py-2 text-right backdrop-blur-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#bfbfbf]">
              Role
            </p>
            <p className="text-sm font-semibold text-white">ES</p>
          </div>
        </header>

        <section className="mt-6 rounded-md border border-white/12 bg-white/[0.08] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-md border border-[#ff8a2a]/35 bg-[#ff8a2a]/15 px-2 py-1 text-xs font-medium text-[#ffb46f]">
                <Sparkles aria-hidden="true" />
                Mulai shift
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">
                Pilih alur kerja engineering.
              </h2>
            </div>
            <MapPin className="mt-1 shrink-0 text-[#d5d5d5]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm leading-6 text-[#d7d7d7]">
            BANJARMASIN - mobile launcher untuk Form Ijin Kerja, Checklist,
            dan Perbaikan by AHO / Temuan ES.
          </p>
        </section>

        <section className="mt-4 rounded-md border border-[#ff8a2a]/30 bg-[#1f1308]/75 p-4 shadow-xl shadow-black/30 backdrop-blur-2xl">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#ff8a2a] text-black">
              <FileSignature aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#ffb46f]">
                Langkah awal
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Form Ijin Kerja
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#f2d7bf]">
                Isi bila diperlukan sebelum membuat laporan, atau lewati untuk
                langsung memilih jalur kerja.
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
              className="h-11 border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              Lewati
            </Button>
          </div>
        </section>

        <section className="mt-5">
          <SectionHeading
            kicker="Pilih jalur"
            title="Apa yang akan dikerjakan?"
          />
          <div className="mt-3 flex flex-col gap-3">
            {workflowChoices.map((choice, index) => (
              <ChoicePanel
                key={choice.title}
                {...choice}
                active={index === 0}
              />
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
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#bfbfbf]">
            Flow aktif
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {timeline.map((item, index) => (
              <div
                key={item}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-medium",
                  index === 0
                    ? "border-[#ff8a2a]/40 bg-[#ff8a2a]/15 text-[#ffb46f]"
                    : "border-white/10 bg-white/[0.06] text-[#d7d7d7]",
                )}
              >
                {index + 1}. {item}
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
      <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
    </div>
  )
}

function ChoicePanel({
  title,
  description,
  icon: Icon,
  meta,
  active,
}: {
  title: string
  description: string
  icon: typeof ClipboardCheck
  meta: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex min-h-28 w-full items-start gap-3 rounded-md border p-4 text-left shadow-xl shadow-black/25 backdrop-blur-2xl transition",
        active
          ? "border-[#ff8a2a]/45 bg-[#ff8a2a]/14"
          : "border-white/12 bg-white/[0.07] hover:bg-white/[0.1]",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-md",
          active ? "bg-[#ff8a2a] text-black" : "bg-[#d0d0d0]/15 text-white",
        )}
      >
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
        <span className="mt-3 inline-flex rounded-md border border-white/12 bg-black/25 px-2 py-1 text-xs font-medium text-[#d7d7d7]">
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
  icon: typeof Building2
  periods: string[]
}) {
  return (
    <button
      type="button"
      className="flex min-h-28 w-full items-start gap-3 rounded-md border border-white/12 bg-white/[0.07] p-4 text-left shadow-xl shadow-black/25 backdrop-blur-2xl transition hover:bg-white/[0.1]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#d0d0d0]/15 text-white">
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-base font-semibold text-white">{title}</span>
          <BadgeCheck className="shrink-0 text-[#cfcfcf]" aria-hidden="true" />
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
