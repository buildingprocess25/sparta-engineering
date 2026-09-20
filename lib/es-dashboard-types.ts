export type EsAreaOption = {
  id: string
  code: string
  name: string
  type: "OFFICE" | "WAREHOUSE"
  periods: Array<"MONTHLY" | "WEEKLY">
  completedPeriods?: Array<"MONTHLY" | "WEEKLY">
  completedForms?: string[]
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
