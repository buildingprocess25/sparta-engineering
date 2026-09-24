export type ChecklistFormConfig = {
  id: string
  title: string
  description: string
}

export const CHECKLIST_FORMS: Record<
  string, // area type (OFFICE | WAREHOUSE)
  Record<string, ChecklistFormConfig[]> // period (MONTHLY | WEEKLY)
> = {
  OFFICE: {
    MONTHLY: [
      {
        id: "frm-tsm-003",
        title: "Checklist Ruangan",
        description: "SAT/FRM/TSM/003 REV 000 211022",
      },
      {
        id: "frm-tsm-005",
        title: "Checklist Maintenance",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse / Peralatan",
        description: "SAT/FRM/TSM/002_REV_000_211022",
      },
      {
        id: "frm-tsm-004",
        title: "Checklist Main Cable",
        description: "SAT/FRM/TSM/004_REV_000_211022",
      },
    ],
    WEEKLY: [
      {
        id: "frm-tsm-003",
        title: "Checklist Ruangan",
        description: "SAT/FRM/TSM/003 REV 000 211022",
      },
      {
        id: "frm-tsm-005",
        title: "Checklist Maintenance",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse / Peralatan",
        description: "SAT/FRM/TSM/002_REV_000_211022",
      },
      {
        id: "frm-tsm-004",
        title: "Checklist Main Cable",
        description: "SAT/FRM/TSM/004_REV_000_211022",
      },
    ],
  },
  WAREHOUSE: {
    MONTHLY: [
      {
        id: "frm-tsm-003",
        title: "Checklist Ruangan",
        description: "SAT/FRM/TSM/003 REV 000 211022",
      },
      {
        id: "frm-tsm-005",
        title: "Checklist Maintenance",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse / Peralatan",
        description: "SAT/FRM/TSM/002_REV_000_211022",
      },
      {
        id: "frm-tsm-004",
        title: "Checklist Main Cable",
        description: "SAT/FRM/TSM/004_REV_000_211022",
      },
    ],
    WEEKLY: [
      {
        id: "frm-tsm-003",
        title: "Checklist Ruangan",
        description: "SAT/FRM/TSM/003 REV 000 211022",
      },
      {
        id: "frm-tsm-005",
        title: "Checklist Maintenance",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse / Peralatan",
        description: "SAT/FRM/TSM/002_REV_000_211022",
      },
      {
        id: "frm-tsm-004",
        title: "Checklist Main Cable",
        description: "SAT/FRM/TSM/004_REV_000_211022",
      },
    ],
  },
}

export function getChecklistForms(
  areaType: string,
  period: string,
): ChecklistFormConfig[] {
  const areaForms = CHECKLIST_FORMS[areaType]
  if (!areaForms) return []
  return areaForms[period] || []
}
