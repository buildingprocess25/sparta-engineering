/** Dashboard preview only; Checklist Rutin still owns the complete list. */
export function getTodoPreview<T extends { id: string; status: string; targetDate: Date | string }>(tasks: readonly T[]) {
  const recorded = tasks.filter(t=>t.status!=="CANCELLED")
  const active = recorded.filter(t=>t.status==="PENDING"||t.status==="OVERDUE")
  const priority = [...active].sort((a,b)=>Number(b.status==="OVERDUE")-Number(a.status==="OVERDUE")||new Date(a.targetDate).getTime()-new Date(b.targetDate).getTime()||a.id.localeCompare(b.id))
  return {total:recorded.length, completed:recorded.filter(t=>t.status==="COMPLETED").length, pending:recorded.filter(t=>t.status==="PENDING").length, overdue:recorded.filter(t=>t.status==="OVERDUE").length, remaining:active.length, preview:priority.slice(0,3)}
}
