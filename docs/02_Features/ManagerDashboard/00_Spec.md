# Manager Dashboard & Laporan Maintenance (SPARTA Engineering)

> **Status**: `Active`  
> **Terakhir diperbarui**: 2026-10-14  

## User Story

- Sebagai **Coordinator (Level BMC) / Manager (Level BNM) / Head of Engineering**, saya ingin memantau dashboard operasional yang terhubung langsung ke **database riil PostgreSQL** (2.254 unit equipment, 468 ruangan, 162 teknisi ES, dan laporan aktif).
- Sebagai **Coordinator & Manager**, saya ingin halaman **Laporan Maintenance** (`/dashboard/reports`) mengadopsi standar tampilan role BMC di `sparta-maintenance`, mencakup filter scope cepat (*Semua, Laporan Aktif, Review Coord, Review Manager, Selesai, Draft*), pencarian teknisi/aset, serta workbench review laporan berjenjang (*Setujui, Minta Revisi, Tolak*).

## Scope

**Dalam scope:**
1. **Koneksi Database Riil (Opsi A)**:
   - Mengambil metrik langsung dari database Prisma:
     - Total unit Equipment (`2.254 unit`)
     - Total Ruangan (`468 ruangan`)
     - Total Teknisi ES Aktif (`162 teknisi`)
     - Total & Distribusi Status Laporan (`PENDING_COORD`, `PENDING_MANAGER`, `PENDING_REQUESTER`, `COMPLETED`, `DRAFT`, `REJECTED`).
2. **Navigasi Sidebar Terintegrasi**:
   - Kategori Utama: `Dashboard`
   - Kategori `OPERASIONAL & REKAPAN`:
     - `Laporan Maintenance` (`/dashboard/reports`) - Approval checklist & laporan temuan
     - `Izin Kerja K3` (`/dashboard/work-permits`) - Approval form izin kerja (FRM_MED_003)
3. **Halaman Izin Kerja K3 (`/dashboard/work-permits`)**:
   - Menampilkan antrean persetujuan izin kerja diajukan oleh teknisi BES.
   - Memberikan badge status, indikator risiko tinggi (Hot Work, Ketinggian, Listrik), serta aksi Setujui / Tolak.
4. **Halaman Laporan Maintenance (`/dashboard/reports`) Berstandar Sparta Engineering**:
   - Palette identitas SPARTA Engineering (kepatuhan `/frontend-design`): Bebas dari aksen biru ritel generic, menggunakan oranye signature SPARTA (`#ff8a2a`), deep navy (`#0b1728`), serta slate pekat.
   - Header bar atas: Tombol toggle sidebar, breadcrumb `Laporan Maintenance`, tombol aksi `Ekspor XLSX` (dark deep navy `#0b1728` profesional), lonceng notifikasi (badge oranye SPARTA `3`), serta avatar profil user.
   - Counter summary dinamis: `Total {n} laporan sesuai filter` dengan angka tebal.
   - Quick Filters button (kotak rounded-lg/md):
     - Active state: Oranye SPARTA (`bg-[#ff8a2a] text-slate-950 font-bold shadow-2xs`).
     - Inactive state: Putih bersih `bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50`.
     - Pilihan filter: `Semua`, `Laporan aktif`, `Lewat SLA`, `Review Coord`, `Review Manager`, `Revisi`, `Selesai`, `Draft`.
   - Baris pencarian dan kontrol: Input pencarian dengan fokus border oranye SPARTA (`#ff8a2a`), serta tombol `Filter` (dengan ikon filter).
   - Tabel Daftar Laporan Presisi:
     - `Laporan`: Nomor laporan berkarakter monospace tebal dengan hover aksen oranye SPARTA dan panah keluar (`↗`).
     - `Update`: Format tanggal dan jam Indonesia (e.g. `14 Okt 2026, 10.49`).
     - `Target & Lokasi`: Nama unit aset equipment / ruangan serta subtext area (e.g. `Office - Lt 2 Server`).
     - `Cabang`: Nama cabang kerja engineering (e.g. `HEAD OFFICE`).
     - `Teknisi ES`: Nama teknisi lapangan serta NIK.
     - `Biaya`: Format stacked label `Estimasi` dan `Realisasi`.
     - `Status`: Pill badge status berjenjang (`Draft`, `Selesai`, `Review Coord`, `Review Manager`, `Revisi`, `Ditolak`).
     - `Aksi`: Tombol aksi detail laporan.
4. **Halaman Detail Laporan (`/dashboard/reports/[reportCode]`) Berstandar Sparta Maintenance**:
   - Header & Navigasi: Breadcrumb `Laporan Maintenance > [reportCode]`, lonceng notifikasi, serta identitas user.
   - Hero Header: Kode laporan tebal, status badge, jumlah item bermasalah, serta tombol aksi:
     - `Laporan Final PDF` (membuka/mengunduh PDF laporan resmi langsung atau via link Google Drive).
     - `Siapkan Laporan Lengkap PDF` (generate/sinkronisasi ulang PDF ke Google Drive secara instan).
   - Metadata Info Card (2 baris informatif):
     - Baris 1: Target/Objek, Kode Unit/Ruangan, NIK & Nama Teknisi ES, Cabang.
     - Baris 2: Komposisi Laporan (Status, Item bermasalah, Pekerjaan), Riwayat Waktu (Dibuat, Update, Selesai), Estimasi & Realisasi Biaya.
   - Tab Navigasi Terpadu:
     - Tab `Checklist`: Kategori item form checklist resmi SAT (contoh: Pallet Mover `FRM_TS_016`, Fisik Gedung `FRM_TSM_005`, ME `FRM_TSM_002`/`003`) dengan ID, Item, Kondisi (`BAIK`, `RUSAK`, `REPAIR`, `TIDAK_ADA`), estimasi, dan foto bukti. Dilengkapi sub-filter (`Semua`, `Bermasalah`, `Ada foto`).
     - Tab `Pekerjaan & Biaya`: Rincian perbaikan dan estimasi spare part temuan.
     - Tab `Dokumentasi`: Galeri foto bukti visual checklist lapangan.
     - Tab `Riwayat Aktivitas`: Kronologi status laporan dari pembuatan hingga persetujuan akhir.
     - Tab `Aksi`: Panel keputusan Coordinator & Manager (Setujui, Minta Revisi, Tolak).

5. **Otomatisasi Generate PDF & Sinkronisasi Google Drive**:
   - Pemicu Submit: Saat teknisi ES melakukan submit laporan di `submitChecklistAction`, sistem langsung memproses pembuatan dokumen PDF resmi.
   - Format PDF Resmi SAT: Memuat identitas PT Sumber Alfaria Trijaya Tbk, Division Property & Development, Department Building & Maintenance, nomor formulir NRA, data unit/lokasi, tabel checklist terperinci, catatan teknisi, serta blok tanda tangan tiga tingkat (Teknisi ES, Coordinator, Manager).
   - Struktur Google Drive: Mengunggah PDF ke folder path terstruktur:
     `{branchName}/Engineering/Checklist/{areaName}/{periodKey}/{reportCode}/01 - Dokumen/{reportCode} - Laporan Final.pdf`.
   - Persistensi Database: Menyimpan `finalPdfDriveUrl` dan `finalPdfFolderUrl` di tabel `ChecklistReport` pada database PostgreSQL.

6. **Widget Laporan Menunggu Review (Dashboard Utama)**:
   - Menggantikan progress bar Distribusi Status & SLA lama dengan widget ringkasan "Laporan Menunggu Review" (100% terminologi SPARTA Engineering: Review Coord, Review Manager, tanpa label BMC toko).
   - Header widget: Judul "Laporan Menunggu Review", Subtitle "Estimasi dan penyelesaian pekerjaan yang perlu segera ditinjau", serta tombol aksi "Buka tabel ↗" menuju `/dashboard/reports`.
   - Kolom tabel ringkas: Laporan (nomor & tanggal), Lokasi & Target (area, ruangan/equipment, teknisi ES), Status badge (`Review Coord`, `Review Manager`), serta Umur laporan (dihitung sejak tanggal submit). Kolom biaya ditiadakan agar proporsional dan fokus pada validasi teknis.
   - Layout grid: Berdampingan dengan panel "Batas SLA per status" dengan ketinggian serasi (h-full).
   - Dashboard utama bersih dan fokus: alur persetujuan terpusat pada Laporan Maintenance (`/dashboard/reports`) dan Izin Kerja K3 (`/dashboard/work-permits`).

**Luar scope:**
- Modifikasi skema tabel Prisma yang telah ada.

## Aturan Bisnis & Tampilan

1. Seluruh metrik KPI dihitung dinamis dari database PostgreSQL riil via Prisma.
2. Alur approval laporan mengikuti rantai komando SPARTA Engineering:
   - Teknisi ES submit -> `PENDING_COORD` (Review Coord / BMC) -> `PENDING_MANAGER` (Review Manager / BNM) -> `COMPLETED`.
3. Mengikuti kaidah `frontend-design` dan `antislop`:
   - Bebas dari em dash. Gunakan tanda baca standar seperti titik dua, koma, atau titik.
   - Warna aksen oranye SPARTA (`#ff8a2a`) dengan teks hitam pekat `text-slate-950 font-bold`.
   - Tanpa efek dekoratif generik atau filler yang tidak relevan.
