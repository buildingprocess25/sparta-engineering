# ES Dashboard Launcher

> **Status**: `Active`
> **Terakhir diperbarui**: 2026-09-12

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin saat masuk SPARTA langsung diarahkan ke pilihan kerja utama, agar saya bisa mulai dari Form Ijin Kerja, Checklist, atau Perbaikan by AHO / Temuan ES tanpa mencari menu.
- Sebagai **ES**, saya ingin alur dashboard mengikuti flow operasional yang sudah dipakai di engineering, agar sistem digital terasa sama dengan proses kerja lapangan.

## Scope Phase 1

**Dalam scope:**
- Route `/dashboard` sebagai layar awal ES.
- Route `/dashboard/reports/new` sebagai layar awal pembuatan laporan baru.
- Route `/dashboard/reports/new/checklist/area` untuk pemilihan area checklist.
- Route `/dashboard/reports/new/repair/area` untuk pemilihan area perbaikan / temuan.
- Tampilan mobile-first.
- Pilihan awal untuk mengisi atau melewati Form Ijin Kerja.
- Pilihan workflow: Checklist atau Perbaikan by AHO / Temuan ES.
- Preview pilihan area: Office dan WHC / WH / Depo / Bulky / Store Hub / Gudang Anak.
- Sinyal periode form: Monthly dan Weekly sesuai area.
- Area dan periode diambil dari database, bukan array hardcoded sebagai source of truth.
- Visual direction SPARTA: black, silver, orange, white, luxury, elegant, glassmorphism.
- Polish visual yang natural: gunakan pola mobile app yang familiar (app bar, welcome panel, CTA utama, rekap, stats, bottom navigation) dan hindari glow/dekorasi berlebihan, novelty badge, serta pattern dashboard generik yang terlihat AI-generated.

**Luar scope Phase 1:**
- Submit form ke database.
- Upload foto.
- Matriks checklist detail.
- Approval action untuk Coord, Manager, Requester.
- Input PB/PJU aktual.
- Auth role sungguhan (pengambilan ES NIK untuk tracking).

## Fitur Baru (Phase 2 & Phase 3)
- **Preventive Tracker**: Dashboard menampilkan widget yang merekap persentase penyelesaian tugas preventif berdasarkan `ChecklistReport` (kategori PREVENTIVE) untuk `periodKey` minggu/bulan berjalan.
- **Area Locking (Checklist Rutin)**: Pada flow Checklist Rutin, area yang periode preventifnya sudah lengkap di-lock (disabled dengan status ✅ Selesai).
- **Incidental Freedom**: Flow Perbaikan/Temuan (Incidental) bebas dari locking dan dapat dipilih kapan saja.
- **Todo & Activity Segregation (Phase 3 & UI Revamp)**:
  - Todo List Dashboard (`/dashboard`) hanya menampilkan tugas aktif (`PENDING` yang belum terlewat).
  - Tugas yang sudah `COMPLETED` (Selesai) atau `OVERDUE` (Terlewat) dialihkan ke menu Aktivitas (`/dashboard/activity`).
  - Halaman Aktivitas dirancang mobile-first yang bersih dan ergonomis (tanpa shape/banner raksasa seperti dashboard), mengadopsi pola modern mobile list:
    - **Header**: Terintegrasi rapi dengan `DashboardHeader` menampilkan judul "Aktivitas" dan badge/count jumlah riwayat dengan jarak/ritme spasial yang seimbang.
    - **Search Bar**: Berada langsung di bawah header untuk pencarian cepat berdasarkan nama alat, ruangan, kode formulir, atau cabang.
    - **Filter Controls**: Opsi tombol filter 4 kolom rata kiri-kanan (`grid grid-cols-4 w-full`) mencakup `Selesai`, `Terlewat`, `Equipment`, dan `Ruangan` tanpa counter angka, dengan visual *soft orange* (`bg-orange-50 text-orange-700 border-orange-300`) saat aktif/terpilih sesuai tema SPARTA.
    - **Looping History Cards**: Setiap riwayat ditampilkan sebagai kartu mandiri (`rounded-xl`, white surface, border halus, soft shadow) dengan icon squircle di sisi kiri, identitas objek, kode form/periode, status badge (emerald untuk Selesai, rose untuk Terlewat), tanggal/waktu penyelesaian atau batas waktu, serta akses langsung ke detail laporan (`reportCode`).
- **Responsive Tablet Dashboard ES (`/dashboard`)**:
  - Halaman dashboard utama ES dibuat responsif adaptif terhadap layar tablet/iPad (`md:max-w-3xl lg:max-w-4xl px-4 sm:px-6 md:px-8`).
  - Welcome Panel & Work Permit Banner memanfaatkan ruang horizontal tablet secara proporsional.
  - To-Do List PIC menampilkan kartu tugas dalam layout 2-kolom (`md:grid-cols-2`) dengan metrik 4-kolom.
  - Bagian bawah menampilkan Rekap Progres Preventif & Stats Laporan berdampingan secara seimbang (`md:grid md:grid-cols-2 md:gap-4`).
  - Bottom Navigation melebar proporsional (`md:max-w-xl`) tanpa membuat tombol terdistorsi.
- **Responsive Tablet Halaman Aktivitas ES (`/dashboard/activity`)**:
  - Halaman riwayat aktivitas ES dibuat responsif adaptif terhadap layar tablet/iPad (`md:max-w-3xl lg:max-w-4xl px-4 sm:px-6 md:px-8`).
  - Search bar & tombol filter 4-kolom (`Selesai`, `Terlewat`, `Equipment`, `Ruangan`) proporsional dan nyaman diakses di tablet.
  - Kartu riwayat aktivitas checklist (`ActivityHistoryView`) ditampilkan dalam tata letak responsif 2-kolom di tablet (`grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3`), memanfaatkan lebar viewport tablet secara optimal tanpa kolom sempit memanjang.
  - Tampilan kosong (empty state) dan total count footer selaras dengan batas kontainer tablet.

## Aturan Bisnis

1. ES masuk SPARTA dan melihat flow kerja yang dimulai dari keputusan Form Ijin Kerja.
2. Form Ijin Kerja bersifat opsional/kondisional untuk Phase 1 UI: user dapat memilih "Isi Form" atau "Lewati".
3. Setelah keputusan Form Ijin Kerja, ES memilih salah satu jalur:
   - Checklist
   - Perbaikan by AHO / Temuan ES
4. Setelah memilih jalur, ES memilih area spesifik:
   - Office
   - WHC
   - WH
   - Depo
   - Bulky
   - Store Hub
   - Gudang Anak
5. Office diarahkan ke form Monthly.
6. Area warehouse-family menampilkan pilihan Monthly dan Weekly.

## UI & Alur Pengguna

- **Route:** `/dashboard`
- **Report flow routes:**
  - `/dashboard/reports/new`
  - `/dashboard/reports/new/checklist/area`
  - `/dashboard/reports/new/repair/area`
- **Alur Phase 1:**
  1. ES melihat dashboard enterprise shell.
  2. ES menekan `Buat Laporan Baru` dan berpindah ke `/dashboard/reports/new`.
  3. ES memilih `Isi Form Ijin Kerja` atau `Lewati`.
  4. ES memilih `Checklist` atau `Perbaikan by AHO / Temuan ES`.
  5. Sistem memindahkan ES ke halaman pemilihan area sesuai jenis laporan.
  6. ES memilih area spesifik dari data database.
  7. Jika report type adalah Checklist:
     - Office hanya menampilkan Monthly.
     - Area warehouse-family menampilkan Monthly dan Weekly.
  8. CTA `Lanjutkan` aktif setelah pilihan wajib lengkap.

## Implementation Boundaries

- `app/dashboard/page.tsx` hanya boleh menjadi route-level Server Component untuk mengambil data dan menyusun komponen halaman.
- Komponen visual dashboard ES harus berada di `components/es-dashboard/` dan dipisah berdasarkan tanggung jawab: shell, header, welcome panel, guided flow, progress summary, stats, dan bottom navigation.
- State interaktif flow laporan hanya boleh berada di Client Component kecil yang memang membutuhkan event handler. Step utama flow laporan harus menggunakan route page agar URL, browser back, dan refresh tetap bermakna.
- Data area dan periode checklist harus datang dari `lib/es-dashboard-data.ts`, bukan dari array hardcoded di komponen UI.
- Props yang dikirim dari Server Component ke Client Component harus berupa data serializable minimal.

## Data & API

Phase berikutnya menggunakan data database:
- Area diambil dari model `Area` dengan `isActive = true`.
- Opsi period diambil dari relasi `AreaChecklistAvailability`.
- Area berlaku global untuk semua cabang.
- UI tidak menjadikan array hardcoded sebagai source of truth.

## Acceptance Criteria

- `/dashboard` dapat dibuka dan menampilkan ES launcher mobile-first.
- `/` mengarahkan user ke `/dashboard`.
- Tampilan menggunakan palette dan material yang tercatat di `DESIGN.md`.
- File Excel lokal di `data/` tetap ignored dan tidak masuk commit.
- `pnpm lint`, `pnpm typecheck`, dan `pnpm build` lolos.

## Quality Gate

- `app/dashboard/page.tsx` harus tetap tipis dan mudah dibaca.
- Flow pilihan laporan harus tetap data-driven dari database.
- Jika database belum bisa diakses, UI harus menampilkan unavailable state dan tidak crash.
- Refactor visual tidak boleh mengubah business flow tanpa update spec.
