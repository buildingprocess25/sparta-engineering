# FRM_TSM_006 Hydrant Checklist Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyesuaikan form checklist hydrant `FRM_TSM_006` dengan menyembunyikan item secara default, menyediakan dropdown Jenis Perawatan (General Mingguan, Bulanan, 6 Bulanan), selector minggu kalender riil dengan penguncian minggu lalu, serta filter kategori dan validasi dinamis.

**Architecture:** Memisahkan kalkulasi kalender mingguan riil ke dalam helper modular `lib/checklists/hydrant-calendar.ts`, lalu memperbarui komponen antarmuka `components/es-dashboard/frm-tsm-006-form.tsx` dengan kontrol bertahap (*contextual sub-form switcher*), visibilitas dinamis, dan penyesuaian payload submit.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, shadcn/ui.

## Global Constraints

- Sesuai dengan spesifikasi `docs/superpowers/specs/2026-09-28-frm-tsm-006-hydrant-checklist-design.md` dan `docs/02_Features/Checklist/00_Spec.md`.
- Hitungan tanggal minggu tidak boleh menggunakan asumsi tetap 30 hari; harus menggunakan perhitungan kalender nyata (`new Date()`).
- Tetap mematuhi aturan DDD (Documentation Driven Development).

---

### Task 1: Utility Kalkulasi Kalender Mingguan Riil Hydrant

**Files:**
- Create: `lib/checklists/hydrant-calendar.ts`

- [ ] **Step 1: Implementasi fungsi kalkulasi tanggal riil**
  - Mengambil jumlah hari riil dalam bulan dan tahun (`getDaysInMonth(year, month)`).
  - Menghasilkan 4 rentang minggu:
    - Mgg 1: 1 - 7
    - Mgg 2: 8 - 14
    - Mgg 3: 15 - 21
    - Mgg 4: 22 - akhir bulan
  - Menghitung minggu aktif saat ini dan menentukan minggu-minggu sebelumnya yang sudah lewat (`isPast: true`).
  - Menentukan default semester berdasarkan bulan berjalan.

---

### Task 2: Refactor UI Header, Kontrol Dinamis & Visibilitas Form `FRM_TSM_006`

**Files:**
- Modify: `components/es-dashboard/frm-tsm-006-form.tsx`

- [ ] **Step 1: Perbarui state & header form**
  - Ubah `jenisPerawatan` default menjadi `""` (belum dipilih).
  - Tampilkan Baris 1: `Jenis Hydrant` (Input) & `Periode / Tahun` (Display).
  - Tampilkan Baris 2: Dropdown `Select` Jenis Perawatan (`GENERAL_MINGGUAN`, `BULANAN`, `ENAM_BULANAN`).
- [ ] **Step 2: Implementasi Sub-Selector Baris 3**
  - Jika `GENERAL_MINGGUAN`: Tampilkan radio button pill `Mgg 1` s/d `Mgg 4` dengan tanggal kalender riil, kunci minggu yang sudah lewat (`disabled`).
  - Jika `ENAM_BULANAN`: Tampilkan radio button pill `Semester 1 (Jan - Jun)` & `Semester 2 (Jul - Des)`.
  - Jika belum dipilih: Tampilkan kartu instruksi ramah (*empty state*) bahwa checklist tersembunyi.
- [ ] **Step 3: Filter Kategori & Hitungan Evaluasi Dinamis**
  - Hanya render Kategori 1 untuk `GENERAL_MINGGUAN`.
  - Hanya render Kategori 2–11 untuk `BULANAN`.
  - Hanya render Kategori 12 untuk `ENAM_BULANAN`.
  - Sesuaikan `totalItemsCount`, `evaluatedCount`, dan validasi submit agar hanya mengevaluasi item yang aktif.
- [ ] **Step 4: Sesuaikan buildPayload**
  - Sertakan `jenisHydrant`, `jenisPerawatan`, `subPeriod`, `subPeriodLabel`, dan item yang aktif ke dalam payload laporan.

---

### Task 3: Verifikasi Typecheck & Build

**Files:**
- Run: `npm run typecheck`

- [ ] **Step 1: Jalankan typecheck dan verifikasi di Next.js**
- [ ] **Step 2: Commit perubahan fitur**
