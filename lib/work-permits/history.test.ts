import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getWorkPermitHistoryHref, getWorkPermitHistoryPagination } from "./history"

describe("work permit history navigation", () => {
  it("can reach permits older than the first twenty records", () => {
    assert.deepEqual(getWorkPermitHistoryPagination(24, "3"), {
      page: 3,
      pageCount: 3,
      skip: 20,
      take: 10,
    })
  })

  it("uses the first page for empty, repeated, or malformed page parameters", () => {
    for (const pageParam of [undefined, ["2", "3"], "0", "-2", "2e1", "Infinity", "2.5"]) {
      assert.equal(getWorkPermitHistoryPagination(24, pageParam).page, 1)
    }
    assert.deepEqual(getWorkPermitHistoryPagination(0, "2"), {
      page: 1,
      pageCount: 1,
      skip: 0,
      take: 10,
    })
  })

  it("bounds the requested page to the last available page", () => {
    const result = getWorkPermitHistoryPagination(23, "1000")
    assert.equal(result.page, 3)
    assert.equal(result.skip, 20)
  })

  it("returns to the selected history page only within the history route", () => {
    assert.equal(getWorkPermitHistoryHref("2"), "/dashboard/work-permits/history?page=2")
    assert.equal(getWorkPermitHistoryHref("1"), "/dashboard/work-permits/history")
    assert.equal(getWorkPermitHistoryHref("//example.com"), "/dashboard/work-permits/history")
  })
})
