# Design Spec: Todo List Equipment & Ruangan Segmented Control

## Overview
Komponen To-Do List di dashboard ES (`components/es-dashboard/todo-list-panel.tsx`) saat ini menampilkan seluruh tugas PIC yang mencakup penugasan unit alat (**EQUIPMENT**) dan penugasan area/fasilitas gedung (**ROOM**) dalam satu daftar campuran. 

Untuk mempermudah teknisi/PIC fokus mengerjakan checklist sesuai kategori fisik pekerjaannya, ditambahkan elemen **Segmented Control** tepat di bawah bilah pencarian (search bar) yang memisahkan tampilan daftar tugas antara **Equipment** dan **Ruangan**, dengan default aktif pada **Equipment**.

## User Intent & Requirements
1. **Segmented Control Tabs**:
   - Memiliki 2 opsi tab: **Equipment** dan **Ruangan**.
   - Default aktif saat halaman dimuat: **Equipment**.
2. **Posisi Elemen**:
   - Terletak tepat di **bawah input pencarian (search bar)** dan tepat di atas daftar kartu tugas.
3. **Data & Filtering**:
   - Saat tab `Equipment` aktif: Hanya menampilkan tugas dengan `objectType === "EQUIPMENT"`.
   - Saat tab `Ruangan` aktif: Hanya menampilkan tugas dengan `objectType === "ROOM"`.
   - Menampilkan jumlah badge/counter tugas pending untuk masing-masing tab (misal: `Equipment (21)`, `Ruangan (113)`).
   - Filter period (Mingguan, Bulanan, dll.), filter status (Perlu Dikerjakan, Selesai), serta filter query pencarian tetap berfungsi harmonis bersamaan dengan kategori yang aktif.
   - Paginasi otomatis reset ke halaman 1 setiap kali tab kategori berganti.

## UI Design & Aesthetics
- Desain mengikuti prinsip Impeccable UI & identitas visual SPARTA Engineering:
  - Kontainer Segmented Control: `bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/60`.
  - Tombol Tab:
    - State Aktif: `bg-[#ff8a2a] text-black font-bold shadow-xs` atau `bg-white text-slate-900 font-bold shadow-xs ring-1 ring-slate-200/50`.
    - State Inaktif: `text-slate-600 hover:text-slate-900 font-medium`.
    - Ikon pendukung: `Wrench` untuk Equipment, `Building2` untuk Ruangan.
    - Counter pill kecil di sebelah label untuk kejelasan jumlah tugas.

## Component Changes
- File target: `components/es-dashboard/todo-list-panel.tsx`
- State baru:
  ```ts
  type ObjectTypeFilter = "EQUIPMENT" | "ROOM"
  const [selectedObjectType, setSelectedObjectType] = React.useState<ObjectTypeFilter>("EQUIPMENT")
  ```
- Filtering logic:
  ```ts
  if (task.objectType !== selectedObjectType) return false
  ```
- Reset pagination:
  ```ts
  React.useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, selectedObjectType])
  ```

## Verification & Testing
1. Cek saat membuka `/dashboard`: Tab `Equipment` otomatis terpilih.
2. Cek jumlah tugas yang muncul di tab `Equipment` hanya menampilkan alat (seperti Hand Pallet, Conveyor, Genset).
3. Klik tab `Ruangan`: Daftar berganti menampilkan area ruangan (seperti Area Lobby, R. BM, Dry Area).
4. Cek pencarian teks: Pencarian berfungsi di dalam tab kategori yang sedang aktif.
5. Paginasi: Navigasi page berpindah normal dan kembali ke page 1 saat ganti tab.
