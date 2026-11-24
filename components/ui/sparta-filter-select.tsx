"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

type SpartaFilterSelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: readonly Option[]
  ariaLabel: string
  className?: string
  disabled?: boolean
}

/** Shared, accessible shadcn Select for dashboard filter controls. */
export function SpartaFilterSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
  disabled,
}: SpartaFilterSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange(next)
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-10! w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 shadow-sm outline-none transition-colors",
          "hover:border-orange-300 focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-200",
          "dark:border-slate-200 dark:bg-white dark:text-slate-900",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        sideOffset={5}
        className="z-50 max-h-72 rounded-xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl ring-0 dark:border-slate-200 dark:bg-white dark:text-slate-900"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="min-h-9 cursor-pointer rounded-lg px-3 py-2 text-[13px] font-medium text-slate-800 focus:bg-orange-50 focus:text-orange-900 data-[highlighted]:bg-orange-50 data-[highlighted]:text-orange-900 dark:text-slate-800 dark:focus:bg-orange-50 dark:focus:text-orange-900"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
