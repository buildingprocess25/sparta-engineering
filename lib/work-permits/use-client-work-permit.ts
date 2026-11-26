"use client"

import { useCallback, useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener("popstate", onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener("popstate", onChange)
  }
}

export function readLegacyWorkPermit(userNik: string | undefined, includeReportFallback: boolean): boolean {
  if (typeof window === "undefined") return false
  try {
    const permitRaw = window.sessionStorage.getItem(userNik ? `sparta_work_permit_${userNik}` : "sparta_work_permit")
    if (permitRaw) {
      try {
        const parsed = JSON.parse(permitRaw)
        if (!userNik || !parsed.userNik || parsed.userNik === userNik) {
          return parsed.status ? parsed.status === "APPROVED" : true
        }
      } catch {
        // Keep existing fallback for unreadable legacy values.
      }
    }
    if (includeReportFallback && userNik) {
      const fallback = window.sessionStorage.getItem("sparta_work_permit")
      if (fallback) {
        try {
          const parsed = JSON.parse(fallback)
          if (parsed.userNik === userNik) {
            return parsed.status ? parsed.status === "APPROVED" : true
          }
        } catch {
          // Keep existing query fallback.
        }
      }
    }
    return includeReportFallback && new URLSearchParams(window.location.search).get("permit") === "done"
  } catch {
    return false
  }
}

/** UI hint only. Server actions must independently authorize every mutation. */
export function useClientWorkPermit(
  userNik: string | undefined,
  serverStatus: { status?: string | null } | null | undefined,
  includeReportFallback = false,
) {
  const serverApproved = serverStatus ? serverStatus.status === "APPROVED" : undefined
  const getSnapshot = useCallback(
    () => serverApproved ?? readLegacyWorkPermit(userNik, includeReportFallback),
    [serverApproved, userNik, includeReportFallback],
  )
  const getServerSnapshot = useCallback(() => serverApproved ?? false, [serverApproved])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
