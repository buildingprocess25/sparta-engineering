import "server-only"

import { cache } from "react"

import { getPrisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const getWorkPermitUser = cache(async () => {
  const session = await getSession()
  if (typeof session?.userId !== "string") return null

  return getPrisma().user.findUnique({
    where: { NIK: session.userId },
    select: { NIK: true, name: true, email: true, role: true, branchName: true },
  })
})
