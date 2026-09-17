"use client"

import { useEffect, useRef, useState } from "react"
import { KeyRound, LogOut } from "lucide-react"

import { logoutAction } from "@/app/login/actions"

type ProfileMenuProps = {
  initials: string
  email?: string
}

export function ProfileMenu({ initials, email }: ProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Menu profile"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid size-10 place-items-center rounded-full bg-[#111111] text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a2a2a] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/35"
      >
        {initials}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-lg border border-[#dedede] bg-white text-[#111111] shadow-xl shadow-black/15">
          {email ? (
            <div className="border-b border-[#eeeeee] px-4 py-3 text-xs text-[#747474]">
              {email}
            </div>
          ) : null}

          <button
            type="button"
            disabled
            className="flex h-12 w-full items-center gap-3 px-4 text-left text-sm text-[#111111] opacity-60"
          >
            <KeyRound className="size-4" />
            Ganti Password
          </button>

          <form action={logoutAction} className="border-t border-[#eeeeee]">
            <button
              type="submit"
              className="flex h-12 w-full items-center gap-3 px-4 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
