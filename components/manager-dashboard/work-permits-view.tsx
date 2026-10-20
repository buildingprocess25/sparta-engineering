"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Flame,
  HardHat,
  PanelLeft,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
  Zap,
} from "lucide-react"
import * as XLSX from "xlsx"

import { approveWorkPermitAction, rejectWorkPermitAction } from "@/lib/actions/work-permit"
import { cn } from "@/lib/utils"

export type WorkPermitItem = {
  id: string
  permitCode: string
  formCode: string
  kegiatan: string
  lokasi: string
  picSat: string
  kontraktor: string | null
  workDate: string | Date
  duration: string
  workers: any
  safetyPayload: any
  catatanPasca: string | null
  status: "PENDING_MANAGER" | "APPROVED" | "REJECTED" | "COMPLETED"
  applicantNik: string
  applicantSignedAt: string | Date
  managerNik: string | null
  managerSignedAt: string | Date | null
  managerNotes: string | null
  applicant?: {
    name: string
    NIK: string
    branchName: string
  }
  manager?: {
    name: string
    NIK: string
  } | null
  createdAt: string | Date
}

interface WorkPermitsViewProps {
  initialPermits: WorkPermitItem[]
  viewerRole?: string
  userEmail?: string
  onToggleSidebar?: () => void
}

type QuickFilter = "ALL" | "PENDING_MANAGER" | "APPROVED" | "REJECTED"

function formatItemsList(items: unknown): string {
  if (!items) return "-"
  if (Array.isArray(items)) {
    const valid = items.filter(Boolean)
    return valid.length > 0 ? valid.join(", ") : "-"
  }
  if (typeof items === "object") {
    const keys = Object.entries(items as Record<string, unknown>)
      .filter(([_, val]) => Boolean(val))
      .map(([key]) => key.replace(/_/g, " "))
    return keys.length > 0 ? keys.join(", ") : "-"
  }
  return String(items) || "-"
}

export function WorkPermitsView({
  initialPermits,
  viewerRole = "MANAGER",
  userEmail = "manager@admin.com",
  onToggleSidebar,
}: WorkPermitsViewProps) {
  const router = useRouter()
  const [permits, setPermits] = React.useState<WorkPermitItem[]>(initialPermits)
  const [filter, setFilter] = React.useState<QuickFilter>("ALL")
  const [search, setSearch] = React.useState("")
  const [selectedPermit, setSelectedPermit] = React.useState<WorkPermitItem | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [managerNoteInput, setManagerNoteInput] = React.useState("")

  React.useEffect(() => {
    setPermits(initialPermits)
  }, [initialPermits])

  const pendingCount = React.useMemo(
    () => permits.filter((p) => p.status === "PENDING_MANAGER").length,
    [permits]
  )
  const approvedCount = React.useMemo(
    () => permits.filter((p) => p.status === "APPROVED").length,
    [permits]
  )
  const rejectedCount = React.useMemo(
    () => permits.filter((p) => p.status === "REJECTED").length,
    [permits]
  )

  const filteredPermits = React.useMemo(() => {
    return permits.filter((p) => {
      if (filter !== "ALL" && p.status !== filter) return false
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchCode = p.permitCode.toLowerCase().includes(q)
        const matchKegiatan = p.kegiatan.toLowerCase().includes(q)
        const matchLokasi = p.lokasi.toLowerCase().includes(q)
        const matchApplicant =
          p.applicant?.name.toLowerCase().includes(q) || p.applicantNik.includes(q)
        return matchCode || matchKegiatan || matchLokasi || matchApplicant
      }
      return true
    })
  }, [permits, filter, search])

  const userInitials = React.useMemo(() => {
    return viewerRole
      .split(/[\s_-]+/)
      .map((part) => part.at(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "MG"
  }, [viewerRole])

  const handleExportXLSX = () => {
    const exportRows = filteredPermits.map((p) => ({
      "No. Izin Kerja": p.permitCode,
      "Tanggal": new Date(p.workDate).toLocaleDateString("id-ID"),
      "Durasi": p.duration,
      "Pemohon": p.applicant?.name || p.applicantNik,
      "Pekerjaan": p.kegiatan,
      "Lokasi": p.lokasi,
      "Kontraktor": p.kontraktor || "INTERNAL",
      "Status": p.status,
      "Catatan Manager": p.managerNotes || "-",
    }))
    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Izin Kerja K3")
    XLSX.writeFile(workbook, `izin-kerja-k3-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleApprove = async () => {
    if (!selectedPermit) return
    setActionLoading(true)
    try {
      const res = await approveWorkPermitAction(selectedPermit.id, managerNoteInput)
      if (res.ok) {
        setPermits((prev) =>
          prev.map((item) =>
            item.id === selectedPermit.id
              ? {
                  ...item,
                  status: "APPROVED",
                  managerNotes: managerNoteInput || "Disetujui oleh Manager",
                  managerSignedAt: new Date(),
                }
              : item
          )
        )
        setSelectedPermit(null)
        setManagerNoteInput("")
        router.refresh()
      } else {
        alert(res.error || "Gagal menyetujui izin kerja.")
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedPermit) return
    if (!managerNoteInput.trim()) {
      alert("Harap masukkan alasan penolakan / catatan revisi untuk teknisi.")
      return
    }
    setActionLoading(true)
    try {
      const res = await rejectWorkPermitAction(selectedPermit.id, managerNoteInput)
      if (res.ok) {
        setPermits((prev) =>
          prev.map((item) =>
            item.id === selectedPermit.id
              ? {
                  ...item,
                  status: "REJECTED",
                  managerNotes: managerNoteInput,
                  managerSignedAt: new Date(),
                }
              : item
          )
        )
        setSelectedPermit(null)
        setManagerNoteInput("")
        router.refresh()
      } else {
        alert(res.error || "Gagal menolak izin kerja.")
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Bar matching Laporan Maintenance */}
      <div className="flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        {/* Left: Sidebar toggle + Page Title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Toggle sidebar"
            >
              <PanelLeft className="size-4.5" />
            </button>
          )}
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Izin Kerja K3
          </h1>
        </div>

        {/* Right: Ekspor XLSX + Bell + User Avatar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportXLSX}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b1728] hover:bg-[#1e293b] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all active:scale-[0.98] border border-slate-800 cursor-pointer"
          >
            <Download className="size-3.5 text-[#ff8a2a]" />
            <span>Ekspor XLSX</span>
          </button>

          {/* Bell Icon with badge for pending permits */}
          <div className="relative flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            <Bell className="size-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ff8a2a] text-[9px] font-black text-slate-950">
                {pendingCount}
              </span>
            )}
          </div>

          {/* User Avatar circle */}
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
            {userInitials}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Operasional</span>
            <span>/</span>
            <span className="text-[#ff8a2a]">Izin Kerja K3 (FRM_MED_003)</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Persetujuan Izin Kerja K3
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Verifikasi kelayakan keselamatan kerja dan pengesahan izin kerja teknisi BES sebelum pekerjaan dimulai.
          </p>
        </div>

        {/* Pending Badge Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2">
            <Clock className="size-4 text-amber-600 animate-pulse" />
            <span className="text-xs font-bold text-amber-900">
              {pendingCount} Menunggu Approval
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div
          onClick={() => setFilter("ALL")}
          className={cn(
            "cursor-pointer rounded-xl border p-4 transition-all shadow-2xs",
            filter === "ALL"
              ? "border-[#ff8a2a] bg-orange-50/50 ring-1 ring-[#ff8a2a]"
              : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          <p className="text-xs font-medium text-slate-500">Total Izin Kerja</p>
          <p className="mt-1.5 text-2xl font-black text-slate-900">{permits.length}</p>
        </div>

        <div
          onClick={() => setFilter("PENDING_MANAGER")}
          className={cn(
            "cursor-pointer rounded-xl border p-4 transition-all shadow-2xs",
            filter === "PENDING_MANAGER"
              ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
              : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          <p className="text-xs font-medium text-amber-700">Menunggu Review</p>
          <p className="mt-1.5 text-2xl font-black text-amber-900">{pendingCount}</p>
        </div>

        <div
          onClick={() => setFilter("APPROVED")}
          className={cn(
            "cursor-pointer rounded-xl border p-4 transition-all shadow-2xs",
            filter === "APPROVED"
              ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
              : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          <p className="text-xs font-medium text-emerald-700">Disetujui (Aktif)</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-900">{approvedCount}</p>
        </div>

        <div
          onClick={() => setFilter("REJECTED")}
          className={cn(
            "cursor-pointer rounded-xl border p-4 transition-all shadow-2xs",
            filter === "REJECTED"
              ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500"
              : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          <p className="text-xs font-medium text-rose-700">Ditolak / Revisi</p>
          <p className="mt-1.5 text-2xl font-black text-rose-900">{rejectedCount}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode izin kerja, nama teknisi, NIK, atau pekerjaan..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#ff8a2a] focus:outline-hidden focus:ring-1 focus:ring-[#ff8a2a]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: "ALL", label: "Semua" },
              { key: "PENDING_MANAGER", label: "Menunggu Review" },
              { key: "APPROVED", label: "Disetujui" },
              { key: "REJECTED", label: "Ditolak" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                filter === item.key
                  ? "bg-[#ff8a2a] text-slate-950 shadow-2xs font-bold"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Permits Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Kode Izin Kerja</th>
                <th className="px-4 py-3.5">Tanggal / Durasi</th>
                <th className="px-4 py-3.5">Pemohon (BES)</th>
                <th className="px-4 py-3.5">Kegiatan & Lokasi</th>
                <th className="px-4 py-3.5">Risiko Terdeteksi</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <ShieldCheck className="mx-auto size-8 text-slate-300 mb-2" />
                    Tidak ada pengajuan izin kerja yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredPermits.map((p) => {
                  const safety = p.safetyPayload || {}
                  const hasHotWork = safety.hotWork?.active
                  const hasHeight = safety.workHeight?.active
                  const hasElectrical = safety.electrical?.active
                  const hasConfined = safety.confinedSpace?.active

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {p.permitCode}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div>
                          {new Date(p.workDate).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.duration}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {p.applicant?.name || p.applicantNik}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          NIK: {p.applicantNik} • {p.applicant?.branchName || "Cabang"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {p.kegiatan}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {p.lokasi} • {p.kontraktor || "INTERNAL"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {hasHotWork && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                              <Flame className="size-2.5" /> Api/Las
                            </span>
                          )}
                          {hasHeight && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <AlertTriangle className="size-2.5" /> Ketinggian
                            </span>
                          )}
                          {hasElectrical && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Zap className="size-2.5" /> Listrik
                            </span>
                          )}
                          {hasConfined && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <HardHat className="size-2.5" /> Ruang Terbatas
                            </span>
                          )}
                          {!hasHotWork && !hasHeight && !hasElectrical && !hasConfined && (
                            <span className="text-[10px] text-slate-400">Standar K3</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold",
                            p.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : p.status === "PENDING_MANAGER"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : p.status === "REJECTED"
                              ? "bg-rose-100 text-rose-900 border border-rose-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          )}
                        >
                          {p.status === "APPROVED"
                            ? "Disetujui"
                            : p.status === "PENDING_MANAGER"
                            ? "Menunggu Approval"
                            : p.status === "REJECTED"
                            ? "Ditolak"
                            : "Selesai"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedPermit(p)
                            setManagerNoteInput(p.managerNotes || "")
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
                            p.status === "PENDING_MANAGER"
                              ? "bg-[#ff8a2a] text-slate-950 hover:bg-[#e0751d]"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          <span>{p.status === "PENDING_MANAGER" ? "Review & Sahkan" : "Lihat Detail"}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Approval Modal */}
      {selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {selectedPermit.permitCode}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold",
                      selectedPermit.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedPermit.status === "PENDING_MANAGER"
                        ? "bg-amber-100 text-amber-900"
                        : selectedPermit.status === "REJECTED"
                        ? "bg-rose-100 text-rose-900"
                        : "bg-slate-100 text-slate-800"
                    )}
                  >
                    {selectedPermit.status === "APPROVED"
                      ? "Izin Aktif"
                      : selectedPermit.status === "PENDING_MANAGER"
                      ? "Menunggu Approval Manager"
                      : selectedPermit.status === "REJECTED"
                      ? "Ditolak"
                      : "Selesai"}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Form Izin Kerja (SAT/FRM/MED/003)
                </h3>
              </div>
              <button
                onClick={() => setSelectedPermit(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              {/* Section 1: Data Identitas */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Kegiatan / Pekerjaan
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">{selectedPermit.kegiatan}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Lokasi Pekerjaan
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">{selectedPermit.lokasi}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Pelaksana
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {selectedPermit.kontraktor || "INTERNAL"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Tanggal Berlaku
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">
                    {new Date(selectedPermit.workDate).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Estimasi Waktu
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">{selectedPermit.duration}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    PIC Pengawas SAT
                  </span>
                  <p className="mt-0.5 font-bold text-slate-900">{selectedPermit.picSat}</p>
                </div>
              </div>

              {/* Section 2: Pekerja */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Daftar Pekerja Lapangan</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {Array.isArray(selectedPermit.workers) && selectedPermit.workers.length > 0 ? (
                    selectedPermit.workers.map((w: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
                      >
                        <User className="size-3.5 text-slate-400" />
                        {w}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">Hanya pemohon sendiri</span>
                  )}
                </div>
              </div>

              {/* Section 3: Aspek Risiko & APD */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Checklist Aspek Risiko & APD</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Hot Work */}
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <Flame className="size-3.5 text-orange-600" />
                      <span>Kerja Api (Hot Work):</span>
                      <span
                        className={cn(
                          "ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold",
                          selectedPermit.safetyPayload?.hotWork?.active
                            ? "bg-orange-100 text-orange-900"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {selectedPermit.safetyPayload?.hotWork?.active ? "AKTIF" : "TIDAK"}
                      </span>
                    </div>
                    {selectedPermit.safetyPayload?.hotWork?.active && (
                      <div className="text-[11px] text-slate-600">
                        Item: {formatItemsList(selectedPermit.safetyPayload?.hotWork?.items)}
                      </div>
                    )}
                  </div>

                  {/* Ketinggian */}
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <AlertTriangle className="size-3.5 text-blue-600" />
                      <span>Kerja Ketinggian & Galian:</span>
                      <span
                        className={cn(
                          "ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold",
                          selectedPermit.safetyPayload?.workHeight?.active
                            ? "bg-blue-100 text-blue-900"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {selectedPermit.safetyPayload?.workHeight?.active ? "AKTIF" : "TIDAK"}
                      </span>
                    </div>
                    {selectedPermit.safetyPayload?.workHeight?.active && (
                      <div className="text-[11px] text-slate-600">
                        Item: {formatItemsList(selectedPermit.safetyPayload?.workHeight?.items)}
                      </div>
                    )}
                  </div>

                  {/* Listrik */}
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <Zap className="size-3.5 text-amber-600" />
                      <span>Listrik Tegangan Tinggi:</span>
                      <span
                        className={cn(
                          "ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold",
                          selectedPermit.safetyPayload?.electrical?.active
                            ? "bg-amber-100 text-amber-900"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {selectedPermit.safetyPayload?.electrical?.active ? "AKTIF" : "TIDAK"}
                      </span>
                    </div>
                    {selectedPermit.safetyPayload?.electrical?.active && (
                      <div className="text-[11px] text-slate-600">
                        Item: {formatItemsList(selectedPermit.safetyPayload?.electrical?.items)}
                      </div>
                    )}
                  </div>

                  {/* APD Standar */}
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                      <HardHat className="size-3.5 text-emerald-600" />
                      <span>APD yang Disiapkan:</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {formatItemsList(selectedPermit.safetyPayload?.apd?.items) !== "-"
                        ? formatItemsList(selectedPermit.safetyPayload?.apd?.items)
                        : "Standar Helm & Sepatu Safety"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Catatan / Alasan Manager */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Catatan Pengesahan / Arahan Manager (Opsional jika setuju, Wajib jika ditolak)
                </label>
                <textarea
                  rows={2}
                  value={managerNoteInput}
                  onChange={(e) => setManagerNoteInput(e.target.value)}
                  placeholder="Contoh: Pastikan safety harness selalu terpasang pada scaffolding..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#ff8a2a] focus:outline-hidden focus:ring-1 focus:ring-[#ff8a2a]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedPermit(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Tutup
              </button>

              <div className="flex items-center gap-3">
                {selectedPermit.status === "PENDING_MANAGER" && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleReject}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      <XCircle className="size-4" />
                      <span>Tolak / Minta Revisi</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleApprove}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff8a2a] px-5 py-2.5 text-xs font-bold text-slate-950 shadow-xs hover:bg-[#e0751d] disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Setujui & Sahkan Izin Kerja</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
