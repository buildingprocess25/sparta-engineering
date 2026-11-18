export const DEMO_BRANCH = "WH PARUNG"
export const DEMO_COORDINATOR = {
  nik: "WHP-BEC-001",
  name: "Demo BEC WH Parung",
  email: "bec.whparung@admin.com",
} as const

export const DEMO_ACCOUNTS = [
  { key: "bes", nik: "WHP-BES-001", role: "ES", label: "BES" },
  {
    key: "bec",
    nik: DEMO_COORDINATOR.nik,
    role: "COORD",
    label: "BEC / Koordinator",
  },
  { key: "manager", nik: "WHP-MGR-001", role: "MANAGER", label: "BNM Manager" },
] as const
