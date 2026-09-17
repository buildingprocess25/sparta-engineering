import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BookOpen } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#181715] font-sans text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg border border-white/10 bg-white p-1.5 shadow-lg shadow-black/20">
            <Image
              src="/assets/logoalfamart.png"
              alt="Alfamart"
              width={2823}
              height={1114}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="h-9 w-px bg-white/15" />
          <div className="flex items-center gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-wide">SPARTA</span>
              <span className="text-[10px] font-medium text-zinc-400">
                Engineering
              </span>
            </div>
          </div>
        </div>

        <div className="h-9 w-9" aria-hidden="true" />
      </header>

      <main className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:min-h-[calc(100vh-9rem)] lg:grid-cols-[1fr_24rem]">
        <section className="max-w-3xl">
          <p className="mb-5 text-sm font-medium text-orange-300">
            SPARTA Engineering
          </p>

          <h1 className="max-w-3xl text-4xl font-semibold text-balance text-white sm:text-6xl">
            Pusat Pelaporan Engineering
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Kelola checklist, temuan perbaikan, dan approval pekerjaan
            engineering dalam satu alur kerja yang rapi dan mudah ditelusuri.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 text-sm font-bold text-zinc-950 shadow-lg shadow-orange-950/25 transition hover:bg-orange-400"
            >
              Login
              <ArrowRight className="size-4" />
            </Link>
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 text-sm font-semibold text-zinc-100 transition hover:bg-white/10">
              <BookOpen className="size-4" />
              User Manual
            </button>
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="rounded-xl border border-white/10 bg-[#22211f] p-8 shadow-2xl shadow-black/25">
            <Image
              src="/assets/Building-Logo.png"
              alt="Building Engineering"
              width={475}
              height={601}
              priority
              className="h-64 w-auto object-contain"
            />
          </div>
        </section>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-zinc-500">
        © 2026 SPARTA Engineering. Building & Engineering System.
      </footer>
    </div>
  )
}
