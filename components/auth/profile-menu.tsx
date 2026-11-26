"use client"

import { useEffect, useRef, useState } from "react"
import { KeyRound, LogOut } from "lucide-react"

import { logoutAction } from "@/app/login/actions"
import { useDemoMode } from "@/components/auth/demo-mode-context"
import { Button } from "@/components/ui/button"

type ProfileMenuProps = {
  initials: string
  email?: string
}

export function ProfileMenu({ initials, email }: ProfileMenuProps) {
  const demoMode = useDemoMode()
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
      <Button variant="ghost"
        type="button"
        aria-label="Menu profile"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit grid size-10 place-items-center rounded-full bg-[#111111] text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a2a2a] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff8a2a]/35"
      >
        {initials}
      </Button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-lg border border-[#dedede] bg-white text-[#111111] shadow-xl shadow-black/15">
          {email ? (
            <div className="border-b border-[#eeeeee] px-4 py-3 text-xs text-[#747474]">
              {email}
            </div>
          ) : null}

          {!demoMode && (
            <Button variant="ghost"
              type="button"
              disabled
              className="inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit flex h-12 w-full items-center gap-3 px-4 text-left text-sm text-[#111111] opacity-60"
            >
              <KeyRound className="size-4" />
              Ganti Password
            </Button>
          )}

          <form action={logoutAction} className="border-t border-[#eeeeee]">
            <Button variant="ghost"
              type="submit"
              onClick={() => {
                try {
                  if (typeof window !== "undefined") {
                    window.sessionStorage.clear()
                  }
                } catch {
                  // ignore
                }
              }}
              className="inline-block h-auto shrink gap-0 whitespace-normal rounded-none border-0 bg-transparent p-0 font-normal text-inherit shadow-none hover:bg-transparent hover:text-inherit flex h-12 w-full items-center gap-3 px-4 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="size-4" />
              {demoMode ? "Ganti Pengguna" : "Logout"}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
