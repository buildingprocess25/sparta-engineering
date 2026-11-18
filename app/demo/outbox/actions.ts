"use server"

import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { getSpartaAppMode } from "@/lib/sparta-app-mode"
import { clearOutboxEmails } from "@/lib/work-permits/email-approval"

export async function clearOutboxAction() {
  if (getSpartaAppMode() !== "demo") notFound()

  const result = await clearOutboxEmails()
  revalidatePath("/demo/outbox")
  return result
}
