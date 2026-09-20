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
        title: "SAT/FRM/TSM/003 REV 000 211022",
        description: "Checklist Ruangan",
      },
      {
        id: "frm-tsm-005",
        title: "SAT/FRM/TSM/005 REV 211022",
        description: "Checklist Maintenance",
      },
      {
        id: "frm-tsm-002",
        title: "SAT/FRM/TSM/002_REV_000_211022",
        description: "Checklist Peralatan",
      },
      {
        id: "frm-tsm-004",
        title: "SAT/FRM/TSM/004_REV_000_211022",
        description: "Checklist Kendaraan",
      },
    ],
  },
  WAREHOUSE: {
    MONTHLY: [
      {
        id: "frm-tsm-003",
        title: "SAT/FRM/TSM/003 REV 000 211022",
        description: "Checklist Ruangan",
      },
    ],
    WEEKLY: [],
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
