"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check } from "lucide-react"

export function FollowUpFormsEditor({ 
  reportCode, 
  payload 
}: { 
  reportCode: string
  payload: any 
}) {
  const router = useRouter()
  const [items, setItems] = useState<any[]>(payload.items || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items014 = items.filter(
    (item) => item.repairForm === "SAT/FRM/TSM/014_REV:000_060423"
  )
  const items065 = items.filter(
    (item) => item.repairForm === "SAT/FRM/TS/065_REV:00_161020"
  )

  const updateItemData = (id: string, field: string, value: string) => {
    setItems((prev) => 
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            followUpData: {
              ...(item.followUpData || {}),
              [field]: value
            }
          }
        }
        return item
      })
    )
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      const res = await fetch(`/api/reports/${reportCode}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      })
      if (!res.ok) throw new Error("Failed to save follow-up forms")
      router.push("/dashboard/reports")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {items065.length > 0 && (
        <section className="rounded-xl border border-[#dedede] bg-white shadow-sm overflow-hidden">
          <div className="bg-[#f0f6ff] border-b border-[#c2d7f8] px-5 py-4">
            <h2 className="text-lg font-bold text-[#1a56db]">Form Penggantian Spare Part (065)</h2>
            <p className="text-sm text-[#3b6bb8]">Lengkapi rincian part yang perlu diganti untuk perbaikan equipment.</p>
          </div>
          <div className="p-5 flex flex-col gap-6">
            {items065.map((item, idx) => (
              <div key={item.id} className="rounded-lg border border-[#e8e8e6] p-4 bg-[#fafafa]">
                <h3 className="font-semibold text-[#111] mb-3 flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-[#e5e7eb] text-xs">{idx + 1}</span>
                  {item.label}
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#444]">Analisa Kerusakan</label>
                    <input 
                      type="text" 
                      value={item.followUpData?.analisa || item.notes || ""} 
                      onChange={(e) => updateItemData(item.id, "analisa", e.target.value)}
                      className="h-10 rounded-lg border border-[#dedede] px-3 text-sm focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#444]">Tindakan</label>
                    <input 
                      type="text" 
                      value={item.followUpData?.tindakan || ""} 
                      onChange={(e) => updateItemData(item.id, "tindakan", e.target.value)}
                      className="h-10 rounded-lg border border-[#dedede] px-3 text-sm focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#444]">Nama Part</label>
                    <input 
                      type="text" 
                      value={item.followUpData?.namaPart || ""} 
                      onChange={(e) => updateItemData(item.id, "namaPart", e.target.value)}
                      className="h-10 rounded-lg border border-[#dedede] px-3 text-sm focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#444]">Nomor Part</label>
                    <input 
                      type="text" 
                      value={item.followUpData?.nomorPart || ""} 
                      onChange={(e) => updateItemData(item.id, "nomorPart", e.target.value)}
                      className="h-10 rounded-lg border border-[#dedede] px-3 text-sm focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#444]">Asal Part</label>
                    <select 
                      value={item.followUpData?.asalPart || ""} 
                      onChange={(e) => updateItemData(item.id, "asalPart", e.target.value)}
                      className="h-10 rounded-lg border border-[#dedede] px-3 text-sm focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white"
                    >
                      <option value="">Pilih asal part...</option>
                      <option value="STOCK">Stock</option>
                      <option value="PB">PB</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#444]">Jumlah Part</label>
                    <input 
                      type="number" 
                      value={item.followUpData?.jumlahPart || ""} 
                      onChange={(e) => updateItemData(item.id, "jumlahPart", e.target.value)}
                      className="h-10 rounded-lg border border-[#dedede] px-3 text-sm focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {items014.length > 0 && (
        <section className="rounded-xl border border-[#dedede] bg-white overflow-hidden shadow-sm">
          <div className="bg-[#fff0e3] border-b border-[#ffc9a3] px-5 py-4">
            <h2 className="text-lg font-bold text-[#c75f00]">Form Estimasi Biaya Sipil & ME (014)</h2>
            <p className="text-sm text-[#a64f00]">Lengkapi estimasi harga barang untuk perbaikan infrastruktur.</p>
          </div>
          <div className="p-5 flex flex-col gap-6">
            <div className="overflow-x-auto rounded-lg border border-[#e8e8e6]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fafafa] font-medium text-[#444]">
                  <tr>
                    <th className="px-4 py-3 border-b border-[#e8e8e6] w-12 text-center">No</th>
                    <th className="px-4 py-3 border-b border-[#e8e8e6]">Nama Barang</th>
                    <th className="px-4 py-3 border-b border-[#e8e8e6] w-24">Jumlah</th>
                    <th className="px-4 py-3 border-b border-[#e8e8e6] w-40">Harga/Unit (Rp)</th>
                    <th className="px-4 py-3 border-b border-[#e8e8e6] w-40">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {items014.map((item, idx) => {
                    const harga = parseFloat(item.followUpData?.hargaUnit || "0") || 0
                    const jumlah = 1
                    const total = harga * jumlah
                    
                    return (
                      <tr key={item.id} className="border-b border-[#e8e8e6] last:border-0">
                        <td className="px-4 py-3 text-center text-[#747474]">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-[#111]">{item.label}</td>
                        <td className="px-4 py-3 text-[#111]">{jumlah}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="number"
                            placeholder="0"
                            value={item.followUpData?.hargaUnit || ""}
                            onChange={(e) => updateItemData(item.id, "hargaUnit", e.target.value)}
                            className="h-9 w-full rounded-md border border-[#dedede] px-3 text-sm focus:border-[#ff8a2a] focus:ring-1 focus:ring-[#ff8a2a] bg-white"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#111]">
                          {total > 0 ? total.toLocaleString("id-ID") : "-"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-xl border border-[#ffc9a3] bg-[#fff4ec] p-4 text-sm text-[#8a3d00]">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ff8a2a] px-8 text-base font-bold text-white shadow-[0_6px_20px_rgba(255,138,42,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(255,138,42,0.4)] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              Simpan Form Lanjutan
              <Check className="size-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
