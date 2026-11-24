"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type { ChecklistCondition } from "@/lib/checklists/payload"
import { cn } from "@/lib/utils"

export type ChecklistConditionSelectOption = {
  value: ChecklistCondition
  code: string
  label: string
}

type ChecklistConditionSelectProps = {
  value?: ChecklistCondition | ""
  onValueChange: (value: ChecklistCondition | undefined) => void
  options: readonly ChecklistConditionSelectOption[]
  ariaLabel: string
  placeholder?: string
  allowClear?: boolean
  clearLabel?: string
  className?: string
  disabled?: boolean
}

const CLEAR_VALUE = "__CLEAR__"

function getTriggerStyle(value?: ChecklistCondition | "") {
  switch (value) {
    case "BAIK":
      return "border-emerald-300 bg-emerald-50/70 text-emerald-800"
    case "RUSAK":
      return "border-rose-300 bg-rose-50/70 text-rose-800"
    case "URGENT":
      return "border-red-400 bg-red-50 text-red-900"
    case "ADJUST_OR_ADD":
    case "REPAIR":
      return "border-amber-300 bg-amber-50/80 text-amber-900"
    case "TIDAK_ADA":
      return "border-slate-300 bg-slate-100 text-slate-700"
    default:
      return "border-[#e6e2de] bg-white text-[#111111]"
  }
}

/** Shared SPARTA shadcn Select for checklist item condition choices. */
export function ChecklistConditionSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  placeholder = "Pilih kondisi",
  allowClear = false,
  clearLabel = "Batalkan pilihan",
  className,
  disabled,
}: ChecklistConditionSelectProps) {
  const selected = options.find((opt) => opt.value === value)

  return (
    <Select
      value={value || ""}
      disabled={disabled}
      onValueChange={(next) => {
        if (!next || next === CLEAR_VALUE) {
          onValueChange(undefined)
          return
        }
        onValueChange(next as ChecklistCondition)
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "!h-10 h-10 w-full rounded-xl border px-3 text-xs font-semibold shadow-none transition-colors outline-none",
          "focus:border-[#ff8a2a] focus:ring-2 focus:ring-[#ff8a2a]/20 focus-visible:border-[#ff8a2a] focus-visible:ring-2 focus-visible:ring-[#ff8a2a]/20",
          getTriggerStyle(value),
          className,
        )}
      >
        <span className={cn("flex-1 truncate text-left", !selected && "font-medium text-[#707784]")}>
          {selected ? selected.label : placeholder}
        </span>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        sideOffset={4}
        className="rounded-xl border border-[#dedede] bg-white p-1 shadow-xl ring-1 ring-black/5"
      >
        <SelectGroup>
          {allowClear && value ? (
            <SelectItem
              value={CLEAR_VALUE}
              className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-[#707784] hover:bg-slate-100 focus:bg-slate-100"
            >
              {clearLabel}
            </SelectItem>
          ) : null}
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#fff0e3] hover:text-[#c75f00] focus:bg-[#fff0e3] focus:text-[#c75f00] data-[state=checked]:bg-[#fff0e3] data-[state=checked]:text-[#c75f00]"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
