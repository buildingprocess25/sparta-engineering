"use server"

import { revalidatePath } from "next/cache"
import { clearOutboxEmails } from "@/lib/work-permits/email-approval"

export async function clearOutboxAction() {
  const result = await clearOutboxEmails()
  revalidatePath("/demo/outbox")
  return result
}
