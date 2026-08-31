# Checklist & Approval Workflow

> **Status**: `Draft` (Menunggu kejelasan alur bisnis dari stakeholder)  
> **Terakhir diperbarui**: 2026-08-20

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin dapat mengisi checklist rutin (bulanan/mingguan) secara digital melalui sistem web, agar tidak perlu lagi menggunakan kertas dan Google Forms.
- Sebagai **ES**, saya ingin dapat melaporkan temuan kerusakan langsung dari form checklist agar dapat segera ditindaklanjuti.
- Sebagai **Engineering Coordinator / Manager / Requester**, saya ingin dapat memverifikasi dan menyetujui (approve) laporan checklist dan perbaikan secara berjenjang di dalam satu sistem yang sama.

## Scope

**Dalam scope:**
- Form pengisian checklist (Weekly & Monthly).
- Pemilihan Area (Office vs WHC/Gudang).
- Pencatatan status per item (Baik, Clean, Repair, Rusak, Tidak Ada).
- Alur Approval berjenjang.

**Luar scope:**
- *Form Ijin Kerja* (Relasinya akan dipisahkan / belum didefinisikan).

## ❓ Open Questions (Pending Business Rules)

Pertanyaan-pertanyaan di bawah ini **harus dijawab oleh user/stakeholder** sebelum fitur ini bisa masuk ke tahap desain database dan implementasi:

1. **Model Pengisian Data**: 
   - Apakah ES membuat "Dokumen Laporan Baru" di sistem setiap kali jadwal checklist tiba? Ataukah mereka meng-update sebuah "Master Tabel Ruangan" yang sudah ada?
2. **Approval untuk Laporan "Tanpa Kerusakan"**:
   - Jika laporan checklist 100% aman (TIDAK ADA KERUSAKAN), apakah alurnya berhenti dan selesai di **COORD APPROVED**, atau tetap harus naik ke meja **Manager** dan **Requester**?
3. **Definisi PB / PJU**:
   - Apa kepanjangan dari PB / PJU? (Permintaan Barang / Pekerjaan Jasa Umum?)
   - Siapa (role apa) yang bertugas menginput form PB/PJU ke dalam sistem?
   - Kapan perbaikan fisik benar-benar dilakukan? Apakah setelah PB/PJU diinput, atau sebelum?

## UI & Alur Pengguna (Draft)

- **Route(s)**: `/dashboard/checklist`
- **Alur Kasar**:
  1. ES masuk halaman checklist.
  2. Pilih Area dan Jenis Form.
  3. Mengisi matriks kondisi barang.
  4. Submit.
  5. Jika ada kerusakan -> Masuk antrean Approval.

## Data & API (Pending)

*(Akan diisi struktur model Prisma setelah Open Questions di atas terjawab)*
