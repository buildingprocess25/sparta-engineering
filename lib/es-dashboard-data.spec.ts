import assert from "node:assert/strict"

import { getCompletedChecklistPeriods } from "./es-dashboard-data"

const completedPeriods = getCompletedChecklistPeriods([
  {
    areaId: "area-office",
    period: "MONTHLY",
    status: "DRAFT",
  },
  {
    areaId: "area-whc",
    period: "MONTHLY",
    status: "PENDING_COORD",
  },
  {
    areaId: "area-wh",
    period: "WEEKLY",
    status: "COMPLETED",
  },
])

assert.deepEqual(completedPeriods, [
  { areaId: "area-whc", period: "MONTHLY" },
  { areaId: "area-wh", period: "WEEKLY" },
])
