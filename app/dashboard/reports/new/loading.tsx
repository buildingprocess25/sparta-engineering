import { ReportFlowShell } from "@/components/es-dashboard/report-flow-shell"

export default function Loading() {
  return (
    <ReportFlowShell
      eyebrow="LAPORAN BARU"
      title="Menyiapkan Flow"
      description="Memuat pilihan laporan engineering."
    >
      <div className="rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
        <div className="h-5 w-32 rounded-full bg-[#eeeeee]" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-20 rounded-xl bg-[#f3f3f3]" />
          <div className="h-20 rounded-xl bg-[#f3f3f3]" />
        </div>
        <div className="mt-5 h-24 rounded-xl bg-[#f3f3f3]" />
      </div>
    </ReportFlowShell>
  )
}
