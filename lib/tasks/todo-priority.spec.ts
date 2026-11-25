import test from "node:test"
import assert from "node:assert/strict"
import { getTodoPreview } from "./todo-priority"
test("preview excludes cancelled and completed, prioritizes overdue and earliest due, limits to three without mutating source",()=>{
  const tasks=[{id:"pending-late",status:"PENDING",targetDate:"2026-11-30"},{id:"done",status:"COMPLETED",targetDate:"2026-11-01"},{id:"cancelled",status:"CANCELLED",targetDate:"2026-11-01"},{id:"pending-early",status:"PENDING",targetDate:"2026-11-27"},{id:"overdue",status:"OVERDUE",targetDate:"2026-11-24"},{id:"overdue-early",status:"OVERDUE",targetDate:"2026-11-21"}]
  const result=getTodoPreview(tasks)
  assert.deepEqual(result.preview.map(t=>t.id),["overdue-early","overdue","pending-early"])
  assert.deepEqual([result.total,result.completed,result.pending,result.overdue,result.remaining],[5,1,2,2,4])
  assert.equal(tasks[0].id,"pending-late")
  assert.equal(getTodoPreview([]).total,0)
})
