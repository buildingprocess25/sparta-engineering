import type { ReactNode } from "react"
import { connection } from "next/server"

import { DemoModeProvider } from "@/components/auth/demo-mode-context"
import { getSpartaAppMode } from "@/lib/sparta-app-mode"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await connection()

  return <DemoModeProvider enabled={getSpartaAppMode() === "demo"}>{children}</DemoModeProvider>
}
