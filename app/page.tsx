import Link from "next/link"
import Image from "next/link" // We'll just use text or simple icons for now to avoid missing assets
import { Settings, ClipboardCheck, TrendingDown, ArrowRight, BookOpen } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar */}
      <header className="w-full bg-[#0072bc] py-4 shadow-md flex justify-center items-center">
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-md px-2 py-1 flex items-center shadow-sm">
            <span className="text-[#e20613] font-bold text-xl tracking-tighter">Alfamart</span>
          </div>
          <div className="h-8 w-px bg-white/30" />
          <div className="flex items-center space-x-2 text-white">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center font-bold shadow-inner">
              S
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-widest">SPARTA</span>
              <span className="text-[10px] tracking-wider text-white/80">Engineering</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-2">
          Pusat Pelaporan <span className="text-[#0072bc]">Pekerjaan</span>
        </h1>
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0072bc] mb-12">
          Engineering <span className="text-gray-900">Toko</span>
        </h2>

        {/* Features Row */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12">
          <div className="flex flex-col items-center">
            <div className="mb-2 text-[#0072bc]">
              <Settings size={32} strokeWidth={1.5} />
            </div>
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm">
              <span className="text-[#0072bc]">✓</span> Laporan Cepat
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-2 text-[#0072bc]">
              <ClipboardCheck size={32} strokeWidth={1.5} />
            </div>
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm">
              <span className="text-[#0072bc]">✓</span> Tracking Real-time
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-2 text-[#0072bc]">
              <TrendingDown size={32} strokeWidth={1.5} />
            </div>
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm">
              <span className="text-[#0072bc]">✓</span> Efisiensi Biaya
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-500 max-w-2xl text-sm md:text-base leading-relaxed mb-10">
          Dengan atau Tanpa <span className="text-[#0072bc] font-semibold">Dana Taktis</span>. Menjaga toko tetap <span className="text-[#0072bc] font-semibold">aman, nyaman, rapi,</span> dan beroperasi optimal dengan <span className="text-[#0072bc] font-semibold">biaya efisien</span> dan <span className="text-[#0072bc] font-semibold">respon cepat</span>.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md mx-auto">
          <Link href="/login" className="flex-1 w-full bg-[#0072bc] hover:bg-[#005a96] text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-md">
            <ArrowRight size={18} /> Login
          </Link>
          <button className="flex-1 w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
            <BookOpen size={18} /> User Manual
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        © 2026 Building & Engineering System. All rights reserved.
      </footer>
    </div>
  )
}
