import type { ReactNode } from "react"
import { DashboardShell } from "./dashboard-shell"
import { DashboardHeader } from "./dashboard-header"
import { BottomNavigation } from "./bottom-navigation"

export function EsNavigationShell({ email, title, description, children }: { email: string; title: string; description: string; children: ReactNode }) {
  return <><DashboardShell className="es-report-surface es-light-workspace" contentClassName="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl sm:px-6 md:px-8">
    <DashboardHeader email={email} role="ES" title={title} />
    <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    <div className="mt-5 space-y-4 pb-8">{children}</div>
  </DashboardShell><BottomNavigation /></>
}
