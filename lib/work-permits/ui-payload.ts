/** View shapes for persisted MED/003 JSON; no change to the storage contract. */
export type WorkPermitSafetySection = {
  active?: boolean
  items?: unknown
  lainnya?: string
}

export type WorkPermitSafetyPayload = {
  targetPeriod?: string
  adminReqs?: unknown
  adminLainnyaText?: string
  hotWork?: WorkPermitSafetySection
  workHeight?: WorkPermitSafetySection
  confinedSpace?: WorkPermitSafetySection
  electrical?: WorkPermitSafetySection
  apd?: WorkPermitSafetySection
  fireProtection?: WorkPermitSafetySection
}

export type WorkPermitApprovalHistoryEntry = {
  approvalRole?: string
  role?: string
  actorName?: string
  name?: string
  actorNik?: string
  nik?: string
  stage?: string
  decision?: string
  notes?: string | null
  decidedAt?: string
}
