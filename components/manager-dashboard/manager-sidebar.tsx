"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  LayoutDashboard,
  ListChecks,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface ManagerSidebarProps {
  userEmail?: string
  userRole?: string
  isOpenMobile?: boolean
  onCloseMobile?: () => void
  isCollapsed?: boolean
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Operasional",
    items: [
      {
        label: "Laporan Maintenance",
        href: "/dashboard/reports",
        icon: ListChecks,
      },
    ],
  },
]

export function ManagerSidebar({
  userEmail = "admin@admin.com",
  userRole = "ADMIN HO",
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
}: ManagerSidebarProps) {
  const pathname = usePathname()

  const initials = React.useMemo(() => {
    return userRole
      .split(/[\s_-]+/)
      .map((part) => part.at(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AH"
  }, [userRole])

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0b1728] text-slate-300">
      {/* Brand Header */}
      <div className="border-b border-slate-800/80 px-3.5 py-3.5">
        <div className="flex items-center gap-2">
          {/* Alfamart Emblem (direct without wrapper shape) */}
          <Image
            src="/assets/Alfamart-Emblem.png"
            alt="Alfamart"
            width={120}
            height={44}
            priority
            className="h-7 w-auto object-contain shrink-0"
          />

          {/* SPARTA Engineering Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src="/assets/sparta-engineering-logo.png"
              alt="SPARTA Engineering"
              width={60}
              height={70}
              priority
              className="size-8 shrink-0 object-contain"
            />
            {!isCollapsed && (
              <div className="min-w-0 leading-tight">
                <span className="block text-xs font-black tracking-wider text-white">
                  SPARTA
                </span>
                <span className="block text-[9px] font-medium text-slate-400">
                  Engineering
                </span>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Tutup navigasi"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links Scrollable Area */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && !isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}

            {section.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all duration-150",
                    isActive
                      ? "bg-[#ff8a2a] text-slate-950 shadow-xs font-black"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white font-medium",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      isActive ? "text-slate-950" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-slate-950 text-[#ff8a2a]"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User Footer Profile Card */}
      <div className="border-t border-slate-800/80 p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl bg-slate-900/60 p-2.5 transition-colors hover:bg-slate-800/60",
            isCollapsed && "justify-center p-2"
          )}
        >
          {/* Avatar Initials */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white border border-slate-700">
            {initials}
          </div>

          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-bold text-white">
                  {userRole}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {userEmail}
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-500 shrink-0" />
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col border-r border-slate-800/80 transition-all duration-200",
          isCollapsed ? "w-18" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Backdrop + Slide Over) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-64 max-w-[85vw] flex-col shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
