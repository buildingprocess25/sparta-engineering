import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const spartaApiUrl = process.env.SPARTA_API_URL || "http://localhost:10000"
  // SSO launch URL for engineering module
  const ssoLaunchUrl = `${spartaApiUrl}/v1/modules/engineering/launch`

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar - Blue Header with Back button */}
      <header className="w-full bg-[#0072bc] h-14 flex items-center justify-between px-4 sm:px-6 shadow-md">
        <Link href="/" className="flex items-center text-white hover:text-white/80 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          <span className="font-semibold text-sm">Kembali</span>
        </Link>

        {/* Logos */}
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded px-2 py-0.5 flex items-center shadow-sm">
            <span className="text-[#e20613] font-bold text-sm tracking-tight">Alfamart</span>
          </div>
          <div className="flex items-center space-x-1.5 text-white">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center font-bold text-xs shadow-inner">
              S
            </div>
            <div className="flex flex-col leading-[1]">
              <span className="font-bold text-[10px] tracking-wider">SPARTA</span>
              <span className="text-[8px] tracking-widest text-white/90">Engineering</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 w-full">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-500 mb-10 text-sm">
            Masukkan kredensial Anda untuk mengakses sistem
          </p>

          <a
            href={ssoLaunchUrl}
            className="block w-full bg-[#006bb3] hover:bg-[#005a96] text-white font-medium py-3 px-4 rounded-md transition-colors shadow-sm mb-8"
          >
            Masuk via SPARTA SSO
          </a>

          <div className="relative flex items-center justify-center w-full mb-6">
            <div className="border-t border-gray-200 w-full"></div>
            <div className="absolute bg-white px-4 text-[10px] font-semibold text-gray-400 tracking-wider">
              BUTUH BANTUAN?
            </div>
          </div>

          <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors shadow-sm text-sm">
            Lihat User Manual
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
