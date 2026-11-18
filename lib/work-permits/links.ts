export function getWorkPermitDetailHref(permitCode: string) {
  return `/dashboard/reports/new/work-permit?view=readonly&next=dashboard&permitCode=${encodeURIComponent(permitCode)}`
}

export function getWorkPermitPdfHref(permitCode: string) {
  return `/api/work-permits/${encodeURIComponent(permitCode)}/pdf`
}
