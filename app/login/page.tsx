import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BadgeCheck } from "lucide-react"

import { LocalLoginForm } from "@/components/auth/local-login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,var(--muted),var(--background)_42rem)] font-sans text-white">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Link>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-white/10 bg-white p-1.5 shadow-lg shadow-black/20">
            <Image
              src="/assets/logoalfamart.png"
              alt="Alfamart"
              width={2823}
              height={1114}
              priority
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="h-8 w-px bg-white/15" />
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white">
              <Image
                src="/assets/Building-Logo.png"
                alt=""
                width={475}
                height={601}
                className="h-7 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-wide">SPARTA</span>
              <span className="text-[10px] font-medium text-zinc-400">
                Engineering
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_25rem]">
        <section className="max-w-2xl">
          <h1 className="max-w-xl text-4xl font-semibold text-balance text-white sm:text-5xl">
            Masuk ke SPARTA Engineering
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">
            Akses checklist, laporan temuan, dan proses approval dari satu
            dashboard kerja Engineering.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-orange-400" />
              Akses sesuai peran
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-orange-400" />
              Status pekerjaan terlacak
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/15 bg-white p-5 text-zinc-950 shadow-2xl shadow-black/30">
          <div className="mb-6">
            <p className="text-sm font-semibold text-orange-600">
              AKSES MODUL
            </p>
            <h2 className="mt-2 text-2xl font-black text-zinc-950">
              Login SPARTA Engineering
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Gunakan email dan password akun Engineering Anda.
            </p>
          </div>

          <LocalLoginForm />
        </section>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-zinc-500">
        © 2026 SPARTA Engineering. Operational access only.
      </footer>
    </div>
  )
}
