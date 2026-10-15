"use client"

import * as React from "react"
import { Bell, ChevronDown, Menu, PanelLeft } from "lucide-react"

import type { AreaFilter } from "./mock-data"
import { ProfileMenu } from "@/components/auth/profile-menu"
import { cn } from "@/lib/utils"

interface ManagerTopbarProps {
  selectedArea: AreaFilter
  onAreaChange: (area: AreaFilter) => void
  onToggleSidebar?: () => void
  onOpenMobileSidebar?: () => void
  userEmail?: string
  userRole?: string
}

export function ManagerTopbar({
  selectedArea,
  onAreaChange,
  onToggleSidebar,
  onOpenMobileSidebar,
  userEmail = "admin@admin.com",
  userRole = "ADMIN HO",
}: ManagerTopbarProps) {
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const areaLabelMap: Record<AreaFilter, string> = {
    ALL: "Semua Area",
    OFFICE: "Area Office",
    WAREHOUSE: "Area Warehouse",
  }

  const initials = React.useMemo(() => {
    return userRole
      .split(/[\s_-]+/)
      .map((part) => part.at(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AH"
  }, [userRole])

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Desktop Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden lg:flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="size-4" />
        </button>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="flex lg:hidden size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="size-4" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-900">Dashboard</span>
        </div>
      </div>

      {/* Right: Area Selector, Notifications, Profile Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Area Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsAreaDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <span>{areaLabelMap[selectedArea]}</span>
            <ChevronDown className="size-3.5 text-slate-400" />
          </button>

          {isAreaDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 z-50">
              {(["ALL", "OFFICE", "WAREHOUSE"] as AreaFilter[]).map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => {
                    onAreaChange(area)
                    setIsAreaDropdownOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    selectedArea === area
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span>{areaLabelMap[area]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          aria-label="Notifikasi"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-[#e11d48] ring-2 ring-white" />
        </button>

        {/* User Profile Menu with Logout */}
        <ProfileMenu initials={initials} email={userEmail} />
      </div>
    </header>
  )
}
