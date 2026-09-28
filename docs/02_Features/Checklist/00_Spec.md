# Checklist & Approval Workflow

> **Status**: `Active`  
> **Terakhir diperbarui**: 2026-08-31

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin dapat mengisi checklist rutin (bulanan/mingguan) secara digital melalui sistem web, agar tidak perlu lagi menggunakan kertas dan Google Forms.
- Sebagai **ES**, saya ingin dapat melaporkan temuan kerusakan langsung dari form checklist agar dapat segera ditindaklanjuti.
- Sebagai **Engineering Coordinator / Manager / Requester**, saya ingin dapat memverifikasi dan menyetujui (approve) laporan checklist dan perbaikan secara berjenjang di dalam satu sistem yang sama.

## Scope

**Dalam scope:**
- Keputusan awal untuk mengisi atau melewati *Form Ijin Kerja* sebagai langkah opsional/kondisional pada alur ES.
- Form pengisian checklist (Weekly & Monthly).
- Pemilihan Area (Office vs WHC/Gudang).
- Pencatatan status per item (Baik, Clean, Repair, Rusak, Tidak Ada).
- Alur Approval berjenjang.

**Luar scope:**
- Persistensi detail *Form Ijin Kerja* lengkap masih akan dipisahkan ke iterasi berikutnya.

## Aturan Bisnis (Business Rules)

1. **Langkah Awal ES**: Setelah masuk SPARTA, ES melihat pilihan untuk mengisi *Form Ijin Kerja* atau melewatinya jika tidak diperlukan.
2. **Pilihan Jalur Kerja**: Setelah keputusan *Form Ijin Kerja*, ES memilih antara **Checklist** atau **Perbaikan by AHO / Temuan ES**.
3. **Model Pengisian Data**: ES membuat "Dokumen Laporan Baru" (record baru) di dalam sistem setiap kali jadwal checklist tiba.
4. **Alur Approval (Tanpa Kerusakan)**: Jika laporan checklist 100% aman (tidak ada laporan kerusakan), maka proses approval cukup melalui **Coord** dan **Manager**, lalu status menjadi Selesai (Tidak perlu sampai ke Requester).
5. **Alur Approval (Ada Kerusakan)**: Jika terdapat temuan kerusakan, alur akan mengikuti proses yang lebih panjang (ES -> Coord -> Manager -> Requester -> Input PB/PJU -> Selesai).

## UI & Alur Pengguna

- **Route(s)**: `/dashboard`, `/dashboard/checklist`
- **Alur Kasar**:
  1. ES masuk SPARTA.
  2. ES memilih untuk mengisi atau melewati *Form Ijin Kerja*.
  3. ES memilih jalur **Checklist** atau **Perbaikan by AHO / Temuan ES**.
  4. ES pilih Area dan Jenis Form.
  5. ES mengisi matriks kondisi barang.
  6. Submit (membuat Laporan Baru).
  7. Laporan masuk antrean Approval:
     - Jika 100% aman: `Coord -> Manager -> Selesai`
     - Jika ada kerusakan: `Coord -> Manager -> Requester -> Input PB/PJU -> Selesai`



## Data & API

- Model utama yang dibutuhkan: `ChecklistReport`, `ChecklistItem`, `Area`, `User`.
- Status approval: `PENDING_COORD`, `PENDING_MANAGER`, `PENDING_REQUESTER`, `COMPLETED`, `REJECTED`.
*(Detail field akan didokumentasikan lebih lanjut di `docs/01_Architecture/10_Data_Models.md`)*

## Form Checklist Tersedia

Saat ini terdapat 5 jenis form utama yang didigitalkan untuk Checklist & Perbaikan:
1. **FRM_TSM_002** (Genset / Warehouse)
2. **FRM_TSM_003** (Checklist Ruangan)
3. **FRM_TSM_004** (Pemakaian Daya/KWH)
4. **FRM_TSM_005** (Pompa Air)
5. **FRM_TS_016** (Checklist Pallet Mover Monthly - SAT/FRM/TS/016_Rev: 02_161020)

### Form FRM_TS_016: Monthly Checklist Pallet Mover
- **Metadata Unit**: Nomor Unit/Serial (`unitNo`), Merk Unit (`unitBrand`), Jam Kerja Alat (`hourMeter`).
- **12 Kategori Komponen (~41 item pengecekan)**:
  1. Interview User (`In`)
  2. Hour Meter 1 (travel) (`W`)
  3. Body & Structure (`Ch&A`, `Ch`, `Ch&C`)
  4. Drive Unit (`Ch`, `Ch&A`, `Ch&Cl`)
  5. Wheel (`Ch&A`)
  6. Steering / Controller Shaft (`Ch`)
  7. Hydraulics (`Ch&A`, `Ch&Cl`)
  8. Safety Foots Pad (`Ch&A`, `Ch`)
  9. Safety Gate (`Ch`)
  10. Load Lifting & Hoist Frame (`Ch&L`)
  11. Electrical System (`Ch`)
  12. Functional Test (`Td`)
- **Tindakan Lapangan**: Setiap item menampilkan badge cara tindakan (`In`, `W`, `Ch`, `A`, `Cl`, `L`, `Td`).
- **Opsi Kondisi**: `BAIK` (OK) dan `RUSAK` (NOK). Item yang rusak wajib foto bukti, penanggung jawab, catatan, dan pilihan form tindak lanjut (`FRM_TS_065` / `FRM_TSM_014` / `REPAIR_TANPA_BIAYA`).

Data form disimpan pada `ChecklistReport.checklistPayload` dalam format JSON. Pengunggahan foto menggunakan endpoint Google Drive dan hanya terkirim setelah Laporan beralih dari status `DRAFT`.

## Alur: Checklist vs Perbaikan (Repair)

Terdapat 2 jalur utama pengisian laporan yang dibedakan secara logika meskipun secara UI sangat mirip:

1. **Jalur Checklist (Rutin)**:
   - Form 002, 003, dan 005 memiliki opsi kondisi lengkap: `BAIK`, `RUSAK`, `TIDAK_ADA`.
   - `BAIK` dan `RUSAK` wajib disertai foto (mandatory).
   - Seluruh item dalam checklist **wajib** diisi kondisinya sebelum laporan dapat disubmit.
   - Pengecualian: Form **004** murni penginputan angka daya (KWH) tanpa opsi kondisi dan tidak memerlukan foto.

2. **Jalur Perbaikan / Temuan (Ad-hoc / Repair)**:
   - Form 002, 003, dan 005 **hanya** menampilkan opsi kondisi `RUSAK`.
   - Opsi `RUSAK` wajib disertai foto temuan.
   - Berbeda dengan Checklist rutin, form Repair **tidak wajib** diisi semua itemnya. ES cukup mengisi item yang memang ditemukan rusak saja. (Minimal 1 item diisi).
   - Form 004-repair berlaku persis seperti 004 (input daya).

## ES Checklist UX Refinement

The ES checklist form should follow the interaction pattern of the Sparta
Maintenance checklist reference while keeping SPARTA Engineering's black,
silver, orange, and white visual language.

Required behavior:
- Checklist entry uses a compact mobile-first wizard surface with a header,
  progress summary, search field, category accordion, segmented condition
  controls, and a sticky bottom continue/save action.
- Layout and interaction may mirror Sparta Maintenance, but checklist data,
  area names, and SPARTA Engineering brand styling remain owned by this
  project.
- Condition choices remain `BAIK`, `RUSAK`, and `TIDAK_ADA`; displayed labels
  are `Baik`, `Rusak`, and `Tidak Ada`.
- `BAIK` and `RUSAK` require direct camera capture evidence. The upload control
  must request browser camera permission and open a live camera preview instead
  of starting from file storage.
- Captured camera images continue to upload through the existing photo upload
  endpoint and are stored as Google Drive-backed photo IDs/URLs.
- Every captured checklist photo must be watermarked into the uploaded image.
  The watermark uses real checklist context and contains only:
  `SPARTA Engineering`, capture date/time, `Oleh: <user> - <role>`, and
  `Area: <area name>`.
- Uploaded photo previews appear inline as the image itself, without a separate
  "foto tersimpan" status chip. Tapping the preview opens a dark fullscreen
  image viewer with a close control.
- Missing required photo state must be communicated through disabled submit and
  upload status, not through an orange warning chip/card inside the item.
- While an ES user is creating or filling a report under
  `/dashboard/reports/new/**`, the bottom navigation must be hidden so the
  report flow owns the screen.
- Report flow back navigation moves one browser-history step at a time. It must
  not hardcode "Back to Dashboard" from every checklist step.
- Area/period completion indicators must only count submitted reports. `DRAFT`
  reports reserved for photo upload or in-progress form filling must not mark an
  area or period as `Selesai`.

## Form Tindak Lanjut Perbaikan (FRM_TSM_014 & FRM_TS_065)

Sesuai flowchart SPARTA Engineering, jika terdapat temuan kerusakan pada checklist:
1. **Pilihan Form Tindak Lanjut per Unit**:
   - `SAT/FRM/TSM/014_REV:000_060423` (Form Estimasi Biaya Sipil & ME)
   - `SAT/FRM/TS/065_REV:00_161020` (Form Penggantian Spare Part Equipment)
   - `REPAIR_TANPA_BIAYA` (Perbaikan tanpa biaya)

2. **Alur Halaman Rekapitulasi Tindak Lanjut (`/dashboard/reports/[reportCode]/follow-up`)**:
   - Jika checklist memiliki item dengan form 014 atau 065, setelah submit checklist user diarahkan ke halaman pengisian form lanjutan.
   - Jika tidak ada (semua baik atau repair tanpa biaya), laporan langsung menuju antrean approval `PENDING_COORD`.
   - **Tampilan Step-by-Step (1 Form per Halaman/Langkah)**:
     - Form ditampilkan secara berurutan unit demi unit sesuai urutan item rusak di checklist (misal: Unit 1 AC [065] -> Unit 2 AC [065] -> Unit 1 Exhaust Fan [014]).
     - Navigasi antar unit menggunakan tombol "Sebelumnya" dan "Selanjutnya", dengan progress indicator yang jelas (e.g. "Item 1 dari 3").
     - Pada langkah terakhir, tombol berubah menjadi "Simpan Form Tindak Lanjut" untuk memfinalisasi seluruh data.
   - **Desain Mobile-First & Input Terstruktur**:
     - Menggantikan tabel horizontal yang sempit dengan kartu input vertikal yang nyaman di smartphone.
     - Form 014: Nama barang, Qty, Satuan, Harga Satuan dengan prefix Rupiah, perhitungan subtotal otomatis, serta kemampuan menambah/menghapus baris material.
     - Form 065: Segmented control jenis perbaikan, input identitas unit (merk, no asset), analisa kerusakan, tindakan, serta kartu rincian spare part (nama part, nomor part, asal part Stock/PB, qty).
   - Data dasar (Lokasi, Branch, Tanggal, Item Rusak, Rencana Aksi) di-prefill otomatis dari checklist.
   - Setelah form lanjutan disimpan, laporan dialihkan ke `PENDING_COORD` untuk proses approval berjenjang.
