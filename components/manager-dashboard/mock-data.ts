export type AreaFilter = "ALL" | "OFFICE" | "WAREHOUSE"
export type PeriodFilter = "YTD" | "MONTHLY" | "QUARTERLY"

export interface StatusDistributionItem {
  id: string
  name: string
  count: number
  percentage: number
  color: string
  dotColor: string
  overSlaCount?: number
  slaLimit: string
  slaDescription: string
}

export interface ManagerDashboardData {
  areaFilter: AreaFilter
  period: PeriodFilter
  overview: {
    totalReports: number
    totalReportsArrow: string
    equipmentReports: number
    roomReports: number
    reportSubDescription: string
    reportsSubMetrics: {
      completed: number
      active: number
      rejected: number
      activeUsers: number
    }
    completionPercentage: number
    completionArrow: string
    equipmentCompletion: number
    roomCompletion: number
    completionSubDescription: string
    completionSubMetrics: {
      completed: number
      equipmentCompleted: number
      roomCompleted: number
      overdue: number
    }
    approvalCount: number
    approvalFormatted: string
    approvalArrow: string
    preventiveApprovalCount: number
    incidentalApprovalCount: number
    approvalSubDescription: string
    approvalSubMetrics: {
      pendingCoord: number
      pendingManager: number
      pendingRequester: number
    }
  }
  statusDistribution: {
    activeReports: number
    preventiveActive: number
    incidentalActive: number
    totalOverSla: number
    statuses: StatusDistributionItem[]
  }
}

export interface WorkPermitItem {
  id: string
  permitNumber: string
  title: string
  workType: "HOT_WORK" | "HEIGHT" | "CONFINED_SPACE" | "ELECTRICAL" | "GENERAL"
  workTypeLabel: string
  applicant: string
  contractorName: string
  location: string
  area: "OFFICE" | "WAREHOUSE"
  startDate: string
  endDate: string
  status: "PENDING_MANAGER" | "PENDING_COORD" | "APPROVED" | "REJECTED"
  statusLabel: string
  riskLevel: "HIGH" | "MEDIUM" | "LOW"
  workersCount: number
  k3Mitigations: string[]
}

export const PENDING_WORK_PERMITS: WorkPermitItem[] = [
  {
    id: "permit-01",
    permitNumber: "IK-2026/10/0042",
    title: "Pengelasan & Penggantian Jalur Pipa Header Hydrant",
    workType: "HOT_WORK",
    workTypeLabel: "Pekerjaan Panas (Hot Work)",
    applicant: "Hendra Gunawan (ES WH)",
    contractorName: "PT Indo Sarana Teknik",
    location: "Gudang Utama - Jalur Loading D",
    area: "WAREHOUSE",
    startDate: "14 Okt 2026 14:00",
    endDate: "15 Okt 2026 18:00",
    status: "PENDING_MANAGER",
    statusLabel: "Tunggu Approval Manager",
    riskLevel: "HIGH",
    workersCount: 4,
    k3Mitigations: [
      "Penyediaan APAR CO2 6kg di radius 3m",
      "Pemasangan fire blanket & isolasi area mudah terbakar",
      "Gas detector test pra-pengerjaan",
      "Safety watch standby selama pekerjaan",
    ],
  },
  {
    id: "permit-02",
    permitNumber: "IK-2026/10/0043",
    title: "Perbaikan Seng Canopy & Rangka Baja Atap Loading Dock",
    workType: "HEIGHT",
    workTypeLabel: "Bekerja di Ketinggian (> 2m)",
    applicant: "Rian Suwandi (ES Office)",
    contractorName: "Tim Maintenance Internal ES",
    location: "Loading Dock Barat Head Office",
    area: "OFFICE",
    startDate: "15 Okt 2026 08:30",
    endDate: "16 Okt 2026 17:00",
    status: "PENDING_MANAGER",
    statusLabel: "Tunggu Approval Manager",
    riskLevel: "HIGH",
    workersCount: 3,
    k3Mitigations: [
      "Wajib Full Body Harness double lanyard hook ke lifeline",
      "Pengecekan scaffolding / scissor lift checklist",
      "Pemasangan safety net & barricade line bawah",
    ],
  },
  {
    id: "permit-03",
    permitNumber: "IK-2026/10/0044",
    title: "Preventif Cubicle MV 20kV & Uji Tahanan Isolasi Trafo",
    workType: "ELECTRICAL",
    workTypeLabel: "Kelistrikan Arus Kuat",
    applicant: "Bambang Tri (ES WH)",
    contractorName: "PT Daya Elektrindo Pratama",
    location: "Gardu Trafo & Power House DC",
    area: "WAREHOUSE",
    startDate: "16 Okt 2026 21:00",
    endDate: "17 Okt 2026 04:00",
    status: "PENDING_MANAGER",
    statusLabel: "Tunggu Approval Manager",
    riskLevel: "HIGH",
    workersCount: 5,
    k3Mitigations: [
      "Pemberlakuan prosedur LOTO (Lockout / Tagout)",
      "Uji tegangan nihil (voltage detector) sebelum sentuh",
      "Peralatan kerja isolasi 1000V bersertifikat",
      "Koordinasi pemadaman terjadwal PLN & Genset backup",
    ],
  },
  {
    id: "permit-04",
    permitNumber: "IK-2026/10/0039",
    title: "Pengurasan & Pembersihan Bak Ground Water Tank",
    workType: "CONFINED_SPACE",
    workTypeLabel: "Ruang Terbatas (Confined Space)",
    applicant: "Hendra Gunawan (ES WH)",
    contractorName: "CV Tirta Bening",
    location: "Basement Utilitas WH",
    area: "WAREHOUSE",
    startDate: "13 Okt 2026 09:00",
    endDate: "13 Okt 2026 16:00",
    status: "APPROVED",
    statusLabel: "Disetujui",
    riskLevel: "HIGH",
    workersCount: 3,
    k3Mitigations: [
      "Blower sirkulasi udara aktif kontinu",
      "Continuous gas monitoring O2, CO, H2S",
      "Tripod harness rescue standby",
    ],
  },
  {
    id: "permit-05",
    permitNumber: "IK-2026/10/0038",
    title: "Pemasangan Partisi Gypsum Ruang Server Baru",
    workType: "GENERAL",
    workTypeLabel: "Pekerjaan Umum",
    applicant: "Rian Suwandi (ES Office)",
    contractorName: "CV Prima Karya",
    location: "Lantai 2 Office",
    area: "OFFICE",
    startDate: "12 Okt 2026 08:00",
    endDate: "14 Okt 2026 17:00",
    status: "APPROVED",
    statusLabel: "Disetujui",
    riskLevel: "LOW",
    workersCount: 2,
    k3Mitigations: [
      "Penggunaan masker partikel debu",
      "Penyekatan debu plastik agar tidak masuk server rack",
    ],
  },
]

export const MANAGER_DASHBOARD_DATA: Record<AreaFilter, ManagerDashboardData> = {
  ALL: {
    areaFilter: "ALL",
    period: "YTD",
    overview: {
      totalReports: 40777,
      totalReportsArrow: "↗",
      equipmentReports: 31572,
      roomReports: 9205,
      reportSubDescription: "Seluruh checklist preventif & laporan temuan tahun berjalan",
      reportsSubMetrics: {
        completed: 40546,
        active: 178,
        rejected: 53,
        activeUsers: 311,
      },
      completionPercentage: 99,
      completionArrow: "↗",
      equipmentCompletion: 99,
      roomCompletion: 99,
      completionSubDescription: "Selesai dibanding seluruh target checklist preventif",
      completionSubMetrics: {
        completed: 40546,
        equipmentCompleted: 31572,
        roomCompleted: 8974,
        overdue: 0,
      },
      approvalCount: 127,
      approvalFormatted: "127 Laporan",
      approvalArrow: "↗",
      preventiveApprovalCount: 115,
      incidentalApprovalCount: 12,
      approvalSubDescription: "Laporan aktif menunggu review berjenjang (Coord, Manager, Requester)",
      approvalSubMetrics: {
        pendingCoord: 45,
        pendingManager: 70,
        pendingRequester: 12,
      },
    },
    statusDistribution: {
      activeReports: 178,
      preventiveActive: 142,
      incidentalActive: 36,
      totalOverSla: 68,
      statuses: [
        {
          id: "review-coord",
          name: "Tunggu Approval Coord",
          count: 45,
          percentage: 25,
          color: "bg-sky-500",
          dotColor: "bg-sky-500",
          overSlaCount: 15,
          slaLimit: "2 hari",
          slaDescription: "Coordinator memvalidasi kelengkapan form checklist dari teknisi.",
        },
        {
          id: "review-manager",
          name: "Tunggu Review Manager",
          count: 70,
          percentage: 39,
          color: "bg-emerald-500",
          dotColor: "bg-emerald-500",
          overSlaCount: 49,
          slaLimit: "2 hari",
          slaDescription: "Manager memverifikasi dan menyetujui laporan pemeliharaan engineering.",
        },
        {
          id: "inspeksi-lapangan",
          name: "Pengerjaan Lapangan (ES)",
          count: 38,
          percentage: 21,
          color: "bg-indigo-500",
          dotColor: "bg-indigo-500",
          overSlaCount: 4,
          slaLimit: "3 hari",
          slaDescription: "Teknisi ES melakukan inspeksi checklist rutin terjadwal.",
        },
        {
          id: "review-requester",
          name: "Review Requester",
          count: 12,
          percentage: 7,
          color: "bg-purple-500",
          dotColor: "bg-purple-500",
          slaLimit: "3 hari",
          slaDescription: "Requester/User memvalidasi penyelesaian temuan kerusakan unit.",
        },
        {
          id: "tindak-lanjut-perbaikan",
          name: "Perbaikan Unit / Sparepart",
          count: 8,
          percentage: 5,
          color: "bg-amber-400",
          dotColor: "bg-amber-400",
          slaLimit: "5 hari",
          slaDescription: "Proses pengadaan sparepart & perbaikan lanjutan untuk temuan unit rusak.",
        },
        {
          id: "verifikasi-dokumen",
          name: "Verifikasi Dokumen Checklist",
          count: 5,
          percentage: 3,
          color: "bg-teal-400",
          dotColor: "bg-teal-400",
          slaLimit: "1 hari",
          slaDescription: "Verifikasi kelengkapan foto & dokumen pendukung checklist.",
        },
      ],
    },
  },
  OFFICE: {
    areaFilter: "OFFICE",
    period: "YTD",
    overview: {
      totalReports: 12450,
      totalReportsArrow: "↗",
      equipmentReports: 8200,
      roomReports: 4250,
      reportSubDescription: "Checklist preventif & temuan area Head Office / Branch",
      reportsSubMetrics: {
        completed: 12410,
        active: 32,
        rejected: 8,
        activeUsers: 85,
      },
      completionPercentage: 99,
      completionArrow: "↗",
      equipmentCompletion: 99,
      roomCompletion: 99,
      completionSubDescription: "Selesai dibanding target checklist area Office",
      completionSubMetrics: {
        completed: 12410,
        equipmentCompleted: 8180,
        roomCompleted: 4230,
        overdue: 0,
      },
      approvalCount: 24,
      approvalFormatted: "24 Laporan",
      approvalArrow: "↗",
      preventiveApprovalCount: 22,
      incidentalApprovalCount: 2,
      approvalSubDescription: "Laporan area Office menunggu review berjenjang",
      approvalSubMetrics: {
        pendingCoord: 8,
        pendingManager: 14,
        pendingRequester: 2,
      },
    },
    statusDistribution: {
      activeReports: 32,
      preventiveActive: 26,
      incidentalActive: 6,
      totalOverSla: 12,
      statuses: [
        {
          id: "review-coord",
          name: "Tunggu Approval Coord",
          count: 8,
          percentage: 25,
          color: "bg-sky-500",
          dotColor: "bg-sky-500",
          overSlaCount: 3,
          slaLimit: "2 hari",
          slaDescription: "Coordinator memvalidasi kelengkapan form checklist dari teknisi.",
        },
        {
          id: "review-manager",
          name: "Tunggu Review Manager",
          count: 14,
          percentage: 44,
          color: "bg-emerald-500",
          dotColor: "bg-emerald-500",
          overSlaCount: 8,
          slaLimit: "2 hari",
          slaDescription: "Manager memverifikasi dan menyetujui laporan pemeliharaan engineering.",
        },
        {
          id: "inspeksi-lapangan",
          name: "Pengerjaan Lapangan (ES)",
          count: 6,
          percentage: 19,
          color: "bg-indigo-500",
          dotColor: "bg-indigo-500",
          overSlaCount: 1,
          slaLimit: "3 hari",
          slaDescription: "Teknisi ES melakukan inspeksi checklist rutin terjadwal.",
        },
        {
          id: "review-requester",
          name: "Review Requester",
          count: 2,
          percentage: 6,
          color: "bg-purple-500",
          dotColor: "bg-purple-500",
          slaLimit: "3 hari",
          slaDescription: "Requester/User memvalidasi penyelesaian temuan kerusakan unit.",
        },
        {
          id: "tindak-lanjut-perbaikan",
          name: "Perbaikan Unit / Sparepart",
          count: 1,
          percentage: 3,
          color: "bg-amber-400",
          dotColor: "bg-amber-400",
          slaLimit: "5 hari",
          slaDescription: "Proses pengadaan sparepart & perbaikan lanjutan untuk temuan unit rusak.",
        },
        {
          id: "verifikasi-dokumen",
          name: "Verifikasi Dokumen Checklist",
          count: 1,
          percentage: 3,
          color: "bg-teal-400",
          dotColor: "bg-teal-400",
          slaLimit: "1 hari",
          slaDescription: "Verifikasi kelengkapan foto & dokumen pendukung checklist.",
        },
      ],
    },
  },
  WAREHOUSE: {
    areaFilter: "WAREHOUSE",
    period: "YTD",
    overview: {
      totalReports: 28327,
      totalReportsArrow: "↗",
      equipmentReports: 23372,
      roomReports: 4955,
      reportSubDescription: "Checklist preventif & temuan area Gudang/WHC/DC",
      reportsSubMetrics: {
        completed: 28136,
        active: 146,
        rejected: 45,
        activeUsers: 226,
      },
      completionPercentage: 99,
      completionArrow: "↗",
      equipmentCompletion: 99,
      roomCompletion: 99,
      completionSubDescription: "Selesai dibanding target checklist area Warehouse",
      completionSubMetrics: {
        completed: 28136,
        equipmentCompleted: 23392,
        roomCompleted: 4744,
        overdue: 0,
      },
      approvalCount: 103,
      approvalFormatted: "103 Laporan",
      approvalArrow: "↗",
      preventiveApprovalCount: 93,
      incidentalApprovalCount: 10,
      approvalSubDescription: "Laporan area Warehouse menunggu review berjenjang",
      approvalSubMetrics: {
        pendingCoord: 37,
        pendingManager: 56,
        pendingRequester: 10,
      },
    },
    statusDistribution: {
      activeReports: 146,
      preventiveActive: 116,
      incidentalActive: 30,
      totalOverSla: 56,
      statuses: [
        {
          id: "review-coord",
          name: "Tunggu Approval Coord",
          count: 37,
          percentage: 25,
          color: "bg-sky-500",
          dotColor: "bg-sky-500",
          overSlaCount: 12,
          slaLimit: "2 hari",
          slaDescription: "Coordinator memvalidasi kelengkapan form checklist dari teknisi.",
        },
        {
          id: "review-manager",
          name: "Tunggu Review Manager",
          count: 56,
          percentage: 38,
          color: "bg-emerald-500",
          dotColor: "bg-emerald-500",
          overSlaCount: 41,
          slaLimit: "2 hari",
          slaDescription: "Manager memverifikasi dan menyetujui laporan pemeliharaan engineering.",
        },
        {
          id: "inspeksi-lapangan",
          name: "Pengerjaan Lapangan (ES)",
          count: 32,
          percentage: 22,
          color: "bg-indigo-500",
          dotColor: "bg-indigo-500",
          overSlaCount: 3,
          slaLimit: "3 hari",
          slaDescription: "Teknisi ES melakukan inspeksi checklist rutin terjadwal.",
        },
        {
          id: "review-requester",
          name: "Review Requester",
          count: 10,
          percentage: 7,
          color: "bg-purple-500",
          dotColor: "bg-purple-500",
          slaLimit: "3 hari",
          slaDescription: "Requester/User memvalidasi penyelesaian temuan kerusakan unit.",
        },
        {
          id: "tindak-lanjut-perbaikan",
          name: "Perbaikan Unit / Sparepart",
          count: 7,
          percentage: 5,
          color: "bg-amber-400",
          dotColor: "bg-amber-400",
          slaLimit: "5 hari",
          slaDescription: "Proses pengadaan sparepart & perbaikan lanjutan untuk temuan unit rusak.",
        },
        {
          id: "verifikasi-dokumen",
          name: "Verifikasi Dokumen Checklist",
          count: 4,
          percentage: 3,
          color: "bg-teal-400",
          dotColor: "bg-teal-400",
          slaLimit: "1 hari",
          slaDescription: "Verifikasi kelengkapan foto & dokumen pendukung checklist.",
        },
      ],
    },
  },
}
