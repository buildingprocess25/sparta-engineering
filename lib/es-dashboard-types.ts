export type ChecklistPeriodType = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER"

export type EsRoomOption = {
  id: string
  areaId: string
  name: string
  code: string
  formAvailabilities: Array<{
    id: string
    formCode: string
    period: ChecklistPeriodType
  }>
}

export type EsAreaOption = {
  id: string
  code: string
  name: string
  type: "OFFICE" | "WAREHOUSE"
  periods: ChecklistPeriodType[]
  completedPeriods?: ChecklistPeriodType[]
  completedForms?: string[]
  rooms?: EsRoomOption[]
}


export type EsDashboardFlowIssue = {
  title: string
  description: string
}

export type EsDashboardFlowOptions = {
  areas: EsAreaOption[]
  areaIssue?: EsDashboardFlowIssue
}

export type EsDashboardUserContext = {
  name: string
  branchName: string
  location?: string | null
  role: string
}

export type EsDashboardStat = {
  value: string
  title: string
  description: string
  tone: "silver" | "orange"
}
