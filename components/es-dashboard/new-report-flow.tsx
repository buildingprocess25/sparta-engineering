"use client"

import * as React from "react"
import { ClipboardCheck, FileSignature, Wrench } from "lucide-react"

import { FlowOptionButton } from "@/components/es-dashboard/flow-option-button"
import { ReportChoiceCard } from "@/components/es-dashboard/report-choice-card"

type WorkPermitChoice = "fill" | "skip"

const workPermitLabels: Record<WorkPermitChoice, string> = {
  fill: "Isi Form",
  skip: "Lewati",
}

function buildReportHref(reportType: "checklist" | "repair", workPermit?: WorkPermitChoice) {
  const params = new URLSearchParams()

  if (workPermit) {
    params.set("workPermit", workPermit)
  }

  return `/dashboard/reports/new/${reportType}/area?${params.toString()}`
}

export function NewReportFlow() {
  const [workPermit, setWorkPermit] = React.useState<WorkPermitChoice>()
  const canChooseType = Boolean(workPermit)

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#dedede] bg-white p-4 shadow-sm">
      <section>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
            1
          </span>
          <div>
            <h2 className="font-semibold text-[#111111]">Form Ijin Kerja</h2>
            <p className="mt-1 text-sm leading-5 text-[#686868]">
              Pilih sesuai kebutuhan pekerjaan hari ini.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <FlowOptionButton
            title="Isi Form"
            description="Butuh izin kerja"
            active={workPermit === "fill"}
            onClick={() => setWorkPermit("fill")}
          />
          <FlowOptionButton
            title="Lewati"
            description="Tidak diperlukan"
            active={workPermit === "skip"}
            onClick={() => setWorkPermit("skip")}
          />
        </div>
      </section>

      <section className={!canChooseType ? "opacity-55" : undefined}>
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#111111] text-xs font-semibold text-white">
            2
          </span>
          <div>
            <h2 className="font-semibold text-[#111111]">Jenis Laporan</h2>
            <p className="mt-1 text-sm leading-5 text-[#686868]">
              Lanjutkan ke jalur kerja yang sesuai.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <ReportChoiceCard
            href={buildReportHref("checklist", workPermit)}
            title="Checklist"
            description={
              workPermit
                ? `${workPermitLabels[workPermit]} lalu pilih area checklist.`
                : "Pilih Form Ijin Kerja terlebih dahulu."
            }
            icon={ClipboardCheck}
            disabled={!canChooseType}
          />
          <ReportChoiceCard
            href={buildReportHref("repair", workPermit)}
            title="Perbaikan / Temuan"
            description={
              workPermit
                ? `${workPermitLabels[workPermit]} lalu pilih area temuan.`
                : "Pilih Form Ijin Kerja terlebih dahulu."
            }
            icon={Wrench}
            disabled={!canChooseType}
          />
        </div>
      </section>

      <div className="rounded-xl bg-[#f3f3f3] p-3 text-sm leading-5 text-[#686868]">
        <FileSignature className="mb-2 text-[#111111]" aria-hidden="true" />
        Pilihan Form Ijin Kerja akan diteruskan ke form detail pada phase
        berikutnya.
      </div>
    </div>
  )
}
