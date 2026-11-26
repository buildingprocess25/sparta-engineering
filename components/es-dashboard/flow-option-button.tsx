import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
    <Button variant="ghost"
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={["inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit", (cn(
        "min-h-20 rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        active ? "border-[#ff8a2a] bg-[#fff0e3]" : "border-[#dedede] bg-[#fbfbfb]",
      ))].filter(Boolean).join(" ")}
    >
      <span className="block font-semibold text-[#111111]">{title}</span>
      <span className="mt-1 block text-sm text-[#686868]">{description}</span>
    </Button>
  )
}
