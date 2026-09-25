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
        title: "Checklist Bangunan Utama & Penunjang",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse",
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
        title: "Checklist Bangunan Utama & Penunjang",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse",
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
        title: "Checklist Bangunan Utama & Penunjang",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse",
        description: "SAT/FRM/TSM/002_REV_000_211022",
      },
      {
        id: "frm-tsm-004",
        title: "Checklist Main Cable",
        description: "SAT/FRM/TSM/004_REV_000_211022",
      },
      {
        id: "frm-ts-029",
        title: "Checklist Forklift Monthly",
        description: "SAT/FRM TS/029",
      },
      {
        id: "frm-ts-016",
        title: "Checklist Pallet Mover Monthly",
        description: "SAT/FRM/TS/016",
      },
      {
        id: "frm-tsm-001",
        title: "Checklist Test ATS",
        description: "SAT/FRM/TSM/001",
      },
      {
        id: "frm-tsm-006",
        title: "Checklist Hydrant",
        description: "SAT/FRM/TSM/006",
      },
      {
        id: "frm-ts-062",
        title: "Checklist Handpallet",
        description: "SAT/FRM/TS/062",
      },
      {
        id: "frm-ts-068",
        title: "Checklist Baterai Forklift",
        description: "SAT/FRM/TS/068",
      },
      {
        id: "frm-ts-028",
        title: "Checklist Baterai Pallet Mover",
        description: "SAT/FRM/TS/028-REV.002 161020",
      },
      {
        id: "frm-ts-063",
        title: "Checklist Exhaust Fan",
        description: "SAT/FRM/TS/063_REV : 00_161020",
      },
      {
        id: "frm-tsm-007",
        title: "Checklist PLTS",
        description: "SAT/FRM/TSM/007",
      },
      {
        id: "frm-tsm-013",
        title: "Checklist Water Recycle",
        description: "SAT/FRM/TSM/013_REV 000_100123",
      },
      {
        id: "frm-ts-041",
        title: "Checklist Conveyor",
        description: "SAT/FRM/TS/041_REV: 01_161020",
      },
      {
        id: "frm-ts-064",
        title: "Checklist Table Lifter",
        description: "SAT/FRM/TS/064_REV: 00_161020",
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
        title: "Checklist Bangunan Utama & Penunjang",
        description: "SAT/FRM/TSM/005 REV 211022",
      },
      {
        id: "frm-tsm-002",
        title: "Checklist Warehouse",
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
