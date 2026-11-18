"use server"

import { revalidatePath } from "next/cache"
import { submitTokenDecision } from "@/lib/work-permits/email-approval"

export async function submitTokenDecisionAction(
  token: string,
  decision: "APPROVED" | "REJECTED",
  notes?: string
) {
  const res = await submitTokenDecision({ token, decision, notes })
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/work-permits")
  revalidatePath("/demo/outbox")
  return res
}
