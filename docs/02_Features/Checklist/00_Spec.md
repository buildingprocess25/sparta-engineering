# Checklist & Approval Workflow

> **Status**: `Active`  
> **Terakhir diperbarui**: 2026-08-31

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

## Aturan Bisnis (Business Rules)

1. **Model Pengisian Data**: ES membuat "Dokumen Laporan Baru" (record baru) di dalam sistem setiap kali jadwal checklist tiba.
2. **Alur Approval (Tanpa Kerusakan)**: Jika laporan checklist 100% aman (tidak ada laporan kerusakan), maka proses approval cukup melalui **Coord** dan **Manager**, lalu status menjadi Selesai (Tidak perlu sampai ke Requester).
3. **Alur Approval (Ada Kerusakan)**: Jika terdapat temuan kerusakan, alur akan mengikuti proses yang lebih panjang (ES -> Coord -> Manager -> Requester). *Catatan: Integrasi PB/PJU diabaikan untuk iterasi awal ini.*

## UI & Alur Pengguna

- **Route(s)**: `/dashboard/checklist`
- **Alur Kasar**:
  1. ES masuk halaman checklist.
  2. Pilih Area dan Jenis Form.
  3. Mengisi matriks kondisi barang.
  4. Submit (membuat Laporan Baru).
  5. Laporan masuk antrean Approval:
     - Jika 100% aman: `Coord -> Manager -> Selesai`
     - Jika ada kerusakan: `Coord -> Manager -> Requester -> Selesai`

## Data & API

- Model utama yang dibutuhkan: `ChecklistReport`, `ChecklistItem`, `Area`, `User`.
- Status approval: `PENDING_COORD`, `PENDING_MANAGER`, `PENDING_REQUESTER`, `COMPLETED`, `REJECTED`.
*(Detail field akan didokumentasikan lebih lanjut di `docs/01_Architecture/10_Data_Models.md`)*
