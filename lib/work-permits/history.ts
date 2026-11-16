const HISTORY_HREF = "/dashboard/work-permits/history"
const PAGE_SIZE = 10

function getRequestedPage(value?: string | string[]) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1

  const page = Number(value)
  return Number.isSafeInteger(page) ? page : 1
}

export function getWorkPermitHistoryPagination(total: number, value?: string | string[]) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(pageCount, getRequestedPage(value))

  return { page, pageCount, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }
}

export function getWorkPermitHistoryHref(value?: string | string[]) {
  const page = getRequestedPage(value)
  return page === 1 ? HISTORY_HREF : `${HISTORY_HREF}?page=${page}`
}
