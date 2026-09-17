"use client"

import { useActionState } from "react"
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { loginAction, type LoginFormState } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

const initialLoginFormState: LoginFormState = {
  message: "",
  email: "",
}

export function LocalLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialLoginFormState,
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-950"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.email}
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-10 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-3 focus:ring-orange-500/20"
            placeholder="nama@alfamart.co.id"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-950"
        >
          Password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-10 text-sm text-zinc-950 outline-none transition focus:border-orange-500 focus:ring-3 focus:ring-orange-500/20"
            placeholder="Masukkan password"
          />
        </div>
      </div>

      {state.message ? (
        <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-zinc-900">
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 bg-orange-500 text-sm font-semibold text-zinc-950 shadow-sm shadow-orange-950/20 hover:bg-orange-400"
      >
        <ShieldCheck className="size-4" />
        {isPending ? "Memeriksa akses..." : "Masuk ke Dashboard"}
      </Button>
    </form>
  )
}
