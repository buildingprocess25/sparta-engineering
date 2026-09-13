import { cn } from "@/lib/utils"

type FlowOptionButtonProps = {
  title: string
  description: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

export function FlowOptionButton({
  title,
  description,
  active,
  disabled,
  onClick,
}: FlowOptionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-20 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        active ? "border-[#ff8a2a] bg-[#fff0e3]" : "border-[#dedede] bg-[#fbfbfb]",
      )}
    >
      <span className="block font-semibold text-[#111111]">{title}</span>
      <span className="mt-1 block text-sm text-[#686868]">{description}</span>
    </button>
  )
}
