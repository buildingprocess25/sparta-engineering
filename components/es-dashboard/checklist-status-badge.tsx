import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CHECKLIST_STATUS_LABELS } from "@/lib/reports/checklist-status-labels"
import { cn } from "@/lib/utils"

export function ChecklistStatusBadge({ status }: { status: string }) {
  const completed = status === "COMPLETED"
  const unsuccessful = status === "REJECTED" || status === "OVERDUE"

  return (
    <Badge
      variant={unsuccessful ? "destructive" : "outline"}
      className={cn(
        completed && "border-emerald-200 bg-emerald-100 text-emerald-900",
        status === "NEEDS_REVISION" && "border-orange-200 bg-orange-50 text-orange-900",
      )}
    >
      {completed && <Check data-icon="inline-start" aria-hidden="true" />}
      {status === "OVERDUE" ? "Terlewat" : CHECKLIST_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
