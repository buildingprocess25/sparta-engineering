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
