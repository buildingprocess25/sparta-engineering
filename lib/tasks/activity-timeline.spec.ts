import test from "node:test"
import assert from "node:assert/strict"
import { activityRange, groupActivity, monthRange, withinActivityRange } from "./activity-timeline"
const now="2026-11-25T09:00:00+07:00"
const range={from:"2026-11-19",to:"2026-11-25"}
const event=(id:string,code:string,at:string,kind="APPROVAL")=>({id,code,at,kind,target:"Conveyor",title:"Disetujui BEC",actor:"Demo BEC",notes:""})
test("default seven calendar days in WIB, reject invalid dates/ranges, support month selection",()=>{
  assert.deepEqual(activityRange(undefined,undefined,now),range)
  assert.deepEqual(activityRange("2026-02-30","2026-03-01",now),range)
  assert.deepEqual(activityRange("2026-11-25","2026-11-24",now),range)
  assert.deepEqual(activityRange("2024-01-01","2026-11-25",now),range)
  assert.deepEqual(monthRange("2024-02"),{from:"2024-02-01",to:"2024-02-29"})
  assert.equal(monthRange("2026-13"),null)
  assert.equal(withinActivityRange("2026-11-18T17:00:00Z",range),true)
  assert.equal(withinActivityRange("2026-11-25T17:00:00Z",range),false)
})
test("group date then report; oldest first, without mixing other reports",()=>{
  const events=[event("4","007","2026-11-24T15:18:00+07:00","EXECUTION"),event("2","008","2026-11-24T13:35:00+07:00"),event("1","007","2026-11-24T13:34:00+07:00"),event("3","007","2026-11-23T13:34:00+07:00"),event("0","007","2026-10-24T13:34:00+07:00"),event("bad","007","invalid")]
  const result=groupActivity(events,range)
  assert.deepEqual(result.map(g=>[g.day,g.code,g.entries.map(e=>e.id)]),[["2026-11-23","007",["3"]],["2026-11-24","007",["1","4"]],["2026-11-24","008",["2"]]])
  assert.deepEqual(groupActivity(events,range,"EXECUTION","007").flatMap(g=>g.entries.map(e=>e.id)),["4"])
  assert.equal(groupActivity(events,range,"ALL","008").length,1)
})
