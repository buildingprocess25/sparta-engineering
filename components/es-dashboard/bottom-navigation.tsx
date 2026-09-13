import { dashboardNavigationItems } from "@/components/es-dashboard/dashboard-constants"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#e9e9e9] bg-white/92 px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {dashboardNavigationItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold",
              active
                ? "bg-[#111111] text-white"
                : "text-[#747474] hover:bg-[#f4f4f4]",
            )}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
