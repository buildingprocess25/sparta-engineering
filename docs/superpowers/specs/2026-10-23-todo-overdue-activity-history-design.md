# Design Spec: Todo Overdue Filter & Activity History Segregation

## Overview
Saat ini, kartu tugas berstatus **Terlewat** (`OVERDUE`) masih menumpuk bersama kartu **Pending** di panel To-Do List Dashboard (`/dashboard`). Hal ini membuat daftar tugas teknisi terlihat penuh dan rancu antara tugas yang aktif harus dikerjakan dengan tugas yang sudah lewat batas waktu.

Berdasarkan diskusi:
1. **Dashboard Utama (`/dashboard`)**: Menjadi area kerja murni tugas aktif. Hanya menampilkan tugas berstatus `PENDING` (yang belum lewat batas waktu). Tugas `Terlewat` dan `Selesai` disaring keluar dari daftar To-do Dashboard.
2. **Menu Aktivitas (`/dashboard/activity`)**: Ditransformasi dari *placeholder* menjadi pusat riwayat aktivitas checklist teknisi dengan **Opsi A** (2 Segment Tab: `Selesai` dan `Terlewat`), di mana tugas `Terlewat` bersifat *read-only* (catatan riwayat tanpa link pengerjaan susulan).

---

## User Intent & Requirements

### 1. Dashboard Todo List (`components/es-dashboard/todo-list-panel.tsx`)
- **Penyaringan Tugas Aktif**:
  - Hanya menampilkan tugas berstatus `PENDING` (bukan `OVERDUE` dan bukan `COMPLETED`).
  - Badge counter pada tab kategori (`Equipment`, `Ruangan`) dan tab periode (`Mingguan`, `Bulanan`) menghitung tugas yang berstatus `PENDING` aktif saja.
  - Jumlah total tugas pada footer Todo panel merefleksikan sisa tugas yang aktif harus dikerjakan.
  - Ringkasan progres bulanan (`ProgressSummary`) tetap menampilkan akumulasi progres keseluruhan bulan berjalan.

### 2. Menu Aktivitas (`/dashboard/activity`)
- **Shell & Layout**:
  - Menggunakan `DashboardShell`, `DashboardHeader`, dan `BottomNavigation` (tab aktif: "Aktivitas").
  - Menampilkan ringkasan singkat: *Total Selesai* (hijau) dan *Total Terlewat* (merah).
- **Segmented Control Tab (Opsi A)**:
  - Tab 1: **Selesai (`COMPLETED`)**
    - Menampilkan kartu tugas yang telah disubmit pada bulan berjalan.
    - Menampilkan tanggal penyelesaian (`completedAt`), nama alat/ruangan, kode form, dan badge hijau "Selesai".
    - Kartu dapat diklik untuk melihat detail riwayat form secara *read-only*.
  - Tab 2: **Terlewat (`OVERDUE`)**
    - Menampilkan kartu tugas yang telah melewati target deadline tanpa submit.
    - Menampilkan tanggal target yang terlewat, nama alat/ruangan, kode form, dan badge merah "Terlewat".
    - Bersifat **read-only** murni: tidak memiliki link pengerjaan form (sesuai kesepakatan bahwa tugas yang terlewat tidak diizinkan diisi susulan).
- **Sub-Filter & Search**:
  - Filter cepat: `Semua`, `Equipment`, dan `Ruangan`.
  - Input pencarian (search bar) berdasarkan nama alat, ruangan, atau kode form.
- **Empty States**:
  - Tampilan kosong yang ramah ketika belum ada data selesai atau tidak ada tugas yang terlewat.

---

## Data Model & Query

- Menggunakan data yang di-generate oleh `getUserTodoTasks(userNik, referenceDate)` di `lib/tasks/todo-service.ts`:
  - `tasks.filter(t => t.status === "PENDING")` -> dialokasikan ke Todo List Dashboard.
  - `tasks.filter(t => t.status === "COMPLETED")` -> dialokasikan ke Tab "Selesai" di Aktivitas.
  - `tasks.filter(t => t.status === "OVERDUE")` -> dialokasikan ke Tab "Terlewat" di Aktivitas.
- Tidak diperlukan migrasi skema database baru karena model `ChecklistTask` dan `TaskStatus` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `CANCELLED`) sudah tersedia.

---

## UI Components & Aesthetics

1. **Dashboard Todo Panel**:
   - Filter `statusFilter === "PENDING"` secara tegas mengecualikan `OVERDUE`.
   - Counter tab murni menghitung item `PENDING`.
2. **Activity View Component (`components/es-dashboard/activity-history-view.tsx`)**:
   - Desain modern SPARTA: Slate dark gradient header, kontras tinggi, pill filter rounded-xl.
   - Kartu riwayat Selesai: border slate-200 dengan aksen hijau emerald, icon `CheckCircle2`.
   - Kartu riwayat Terlewat: border red-100 bg-red-50/20 dengan badge merah, icon `Clock` atau `AlertCircle`.
   - Empty state dengan icon `Sparkles` / `CheckCircle2`.

---

## Verification Plan

1. **Dashboard Check**:
   - Buka `/dashboard`: Konfirmasi bahwa unit Pallet Mover yang berstatus "Terlewat" tidak lagi muncul di Todo List.
   - Hanya tugas "Pending" yang tampil di tab Equipment dan Ruangan.
   - Counter tab dan footer counter sinkron dengan jumlah kartu pending.
2. **Activity Page Check**:
   - Klik menu "Aktivitas" pada bottom navigation (`/dashboard/activity`).
   - Tab "Selesai": Menampilkan tugas yang sudah berstatus selesai.
   - Tab "Terlewat": Menampilkan 4 unit Pallet Mover yang berstatus terlewat.
   - Uji klik kartu "Terlewat": Konfirmasi kartu bersifat read-only (tidak membuka form isi).
   - Uji switch filter Equipment & Ruangan di halaman Aktivitas.
