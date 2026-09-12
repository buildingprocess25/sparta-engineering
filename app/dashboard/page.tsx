import {
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  FileSignature,
  Bell,
  Clock3,
  FileText,
  LayoutGrid,
  PlusCircle,
  Shield,
  ShieldCheck,
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

const stats = [
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
] satisfies Array<{
  value: string
  title: string
  description: string
  tone: "silver" | "orange"
  icon: LucideIcon
}>

export default function DashboardPage() {
  return (
    <main
      id="main-content"
      className="min-h-svh overflow-x-hidden bg-[#f5f5f3] pb-24 text-[#111111]"
    >
      <div className="relative mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:max-w-lg">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:mb-3 focus:rounded-md focus:bg-[#ff8a2a] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
        >
          Lewati ke konten
        </a>

        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#747474]">SPARTA</p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">
              Dashboard
            </h1>
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
            <div className="grid size-10 place-items-center rounded-full bg-[#111111] text-sm font-semibold text-white shadow-sm">
              ES
            </div>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[1.35rem] bg-[#111111] p-6 text-white shadow-xl shadow-black/15">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.02em]">
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

        <Button className="mt-5 h-14 rounded-lg bg-[#ff8a2a] text-base font-semibold text-black shadow-lg shadow-[#ff8a2a]/20 hover:bg-[#ff9c48]">
          <PlusCircle data-icon="inline-start" />
          Buat Laporan Baru
        </Button>

        <section className="mt-8">
          <SectionHeading kicker="Langkah awal" title="Form Ijin Kerja" />
          <div className="mt-3 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f3f0ec] text-[#111111]">
                <FileSignature aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">
                  Apakah perlu Form Ijin Kerja?
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#686868]">
                  Isi bila pekerjaan membutuhkan izin, atau lewati untuk lanjut
                  ke pilihan laporan.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button className="h-11 bg-[#111111] text-white hover:bg-[#252525]">
                Isi Form
              </Button>
              <Button
                variant="outline"
                className="h-11 border-[#dedede] bg-white text-[#111111] hover:bg-[#f2f2f2] hover:text-[#111111]"
              >
                Lewati
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading kicker="Pilih jalur" title="Jenis laporan" />
          <div className="mt-3 flex flex-col gap-3">
            {workflowChoices.map((choice) => (
              <ChoicePanel key={choice.title} {...choice} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading kicker="Pilih area" title="Lokasi pekerjaan" />
          <div className="mt-3 flex flex-col gap-3">
            {areaChoices.map((area) => (
              <AreaPanel key={area.title} {...area} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading kicker="Rekap" title="Progress awal" />
          <div className="mt-3 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                <ShieldCheck className="text-[#ff8a2a]" aria-hidden="true" />
                FLOW ES DASHBOARD
              </div>
              <span className="text-sm text-[#686868]">1 / 4 tahap</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#686868]">
              Mulai dari Form Ijin Kerja, lalu pilih jalur laporan dan area.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9e9e9]">
              <div className="h-full w-1/4 rounded-full bg-[#ff8a2a]" />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading kicker="Stats Laporan" title="Ringkasan" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {stats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </div>
        </section>
      </div>

      <BottomNavigation />
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
      <p className="text-sm font-medium text-[#686868]">
        {kicker}
      </p>
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#111111] text-pretty">
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
      className="group flex min-h-24 w-full items-start gap-3 rounded-2xl border border-[#dedede] bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#fbfbfb] focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/70"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1f1f1] text-[#111111]">
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-base font-semibold text-[#111111]">{title}</span>
          <ArrowRight
            className="shrink-0 text-[#b2b2b2] transition group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
        <span className="mt-1 block text-sm leading-6 text-[#686868]">
          {description}
        </span>
        <span className="mt-3 inline-flex rounded-md bg-[#f3f3f3] px-2 py-1 text-xs font-medium text-[#686868]">
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
      className="flex min-h-24 w-full items-start gap-3 rounded-2xl border border-[#dedede] bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#fbfbfb] focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/70"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1f1f1] text-[#111111]">
        <Icon aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-base font-semibold text-[#111111]">{title}</span>
          <Check className="shrink-0 text-[#b2b2b2]" aria-hidden="true" />
        </span>
        <span className="mt-1 block text-sm leading-6 text-[#686868]">
          {description}
        </span>
        <span className="mt-3 flex flex-wrap gap-2">
          {periods.map((period) => (
            <span
              key={period}
              className="rounded-md bg-[#fff0e3] px-2 py-1 text-xs font-semibold text-[#a64f00]"
            >
              {period}
            </span>
          ))}
        </span>
      </span>
    </button>
  )
}

function StatCard({
  value,
  title,
  description,
  tone,
  icon: Icon,
}: {
  value: string
  title: string
  description: string
  tone: "silver" | "orange"
  icon: LucideIcon
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative min-h-40 overflow-hidden rounded-2xl p-5 text-left shadow-sm",
        tone === "orange" ? "bg-[#fff0e3]" : "bg-white",
      )}
    >
      <div
        className={cn(
          "absolute -right-7 -top-8 size-28 rounded-full",
          tone === "orange" ? "bg-[#ffd0a3]" : "bg-[#eeeeee]",
        )}
      />
      <Icon
        className={cn(
          "absolute right-6 top-6",
          tone === "orange" ? "text-[#d86b0d]" : "text-[#bdbdbd]",
        )}
        aria-hidden="true"
      />
      <p className="text-5xl font-semibold tracking-[-0.05em] text-[#111111]">
        {value}
      </p>
      <p className="mt-6 text-sm font-semibold text-[#111111]">{title}</p>
      <p className="mt-1 text-xs text-[#686868]">{description}</p>
    </button>
  )
}

function BottomNavigation() {
  const items = [
    { label: "Dashboard", icon: LayoutGrid, active: true },
    { label: "Laporan", icon: FileText },
    { label: "Aktivitas", icon: Clock3 },
    { label: "Preventif", icon: Shield },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#e9e9e9] bg-white/92 px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {items.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold",
              active
                ? "bg-[#111111] text-white"
                : "text-[#747474] hover:bg-[#f4f4f4]",
            )}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
