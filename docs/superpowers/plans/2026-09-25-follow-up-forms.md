# Fitur Form Tindak Lanjut (014 & 065) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengotomatiskan pembuatan draft form tindak lanjut (014 untuk perbaikan Sipil & ME, dan 065 untuk spare part) setelah user men-submit checklist yang memiliki item rusak, dengan pre-fill data otomatis.

**Architecture:** 
- Setelah checklist disubmit, client memeriksa apakah ada item dengan `repairForm` yang merujuk ke 014 atau 065.
- Jika ada, pengguna diarahkan ke halaman *Follow-up Orchestrator* (`/dashboard/reports/[reportId]/follow-up`).
- Orchestrator mendeteksi daftar form lanjutan yang harus diisi dan mengarahkan user secara berurutan ke form spesifik (misal `/dashboard/reports/follow-up/frm-tsm-014`).
- Halaman form (014/065) dibuat sebagai halaman mandiri (standalone page). Data dasar (Lokasi, Tanggal, Daftar Item Rusak) ditarik otomatis dari data checklist sebelumnya, sehingga teknisi tinggal melengkapi kolom harga, tindakan, atau tanda tangan.

**Tech Stack:** Next.js App Router (React Server Components, Client Components), TypeScript, Tailwind CSS, Base UI.

## Global Constraints

- Kode NRA: `SAT/FRM/TSM/014_Rev:000_060423` dan `SAT/FRM/TS/065_Rev : 00_161020`
- Tampilan harus *mobile-friendly* (karena diakses teknisi di lapangan) dan mempertahankan warna/identitas desain SPARTA Engineering.
- File plan: `docs/superpowers/plans/2026-09-25-follow-up-forms.md`

---

### Task 1: Update Skema & Payload Database

**Files:**
- Modify: `lib/checklists/payload.ts`

**Interfaces:**
- Produces: Memastikan ID laporan checklist tersimpan dan dapat dikembalikan saat submit.

- [ ] **Step 1: Pastikan respons submit mengembalikan ID checklist**
Tambahkan ID ke response checklist submission jika belum ada.
```typescript
export type ChecklistSubmitResponse = {
  success: boolean
  reportId: string // Akan digunakan untuk menarik data checklist di form lanjutan
}
```

### Task 2: Buat Halaman Orchestrator / Routing Lanjutan

**Files:**
- Create: `app/dashboard/reports/[reportId]/follow-up/page.tsx`

**Interfaces:**
- Consumes: Data checklist berdasar `reportId`.
- Produces: UI "Daftar Form Lanjutan yang Perlu Diisi" atau auto-redirect ke form pertama.

- [ ] **Step 1: Buat layout halaman Orchestrator**
Halaman ini membaca data checklist. Jika dalam checklist tersebut terdapat item dengan `repairForm: "SAT/FRM/TSM/014..."`, tampilkan kartu "Isi Form Estimasi 014". Jika ada 065, tampilkan kartu 065.

- [ ] **Step 2: Logika Redirect**
Jika user mengklik kartu, mereka diarahkan ke `/dashboard/reports/[reportId]/fill/frm-tsm-014` (contoh).

### Task 3: Buat Halaman Form 014 (Estimasi Biaya)

**Files:**
- Create: `app/dashboard/reports/[reportId]/fill/frm-tsm-014/page.tsx`
- Create: `components/es-dashboard/form-014-editor.tsx`

**Interfaces:**
- Consumes: Data checklist (berisi daftar `items` yang rusak dan dialokasikan ke 014).

- [ ] **Step 1: Buat UI Header Form**
Header berisi Nama Branch/Lokasi (pre-filled dari checklist), Tanggal (pre-filled), dsb.

- [ ] **Step 2: Buat UI Tabel Item**
Looping melalui item checklist yang rusak. Setiap baris berisi: `Nama Barang` (dari label checklist), `Jumlah` (dari qty unit rusak), `Harga/Unit` (input manual), `Total` (terhitung otomatis).

- [ ] **Step 3: Tambahkan logika submit form 014**
Submit data form ke backend dan redirect kembali ke Orchestrator.

### Task 4: Buat Halaman Form 065 (Penggantian Spare Part)

**Files:**
- Create: `app/dashboard/reports/[reportId]/fill/frm-ts-065/page.tsx`
- Create: `components/es-dashboard/form-065-editor.tsx`

**Interfaces:**
- Consumes: Data checklist (berisi daftar `items` yang rusak dan dialokasikan ke 065).

- [ ] **Step 1: Buat UI Header Form**
Header berisi Lokasi, Nama Unit, Tanggal (pre-filled dari checklist). Kolom Merk, No. Unit, No. Tiket diinput manual.

- [ ] **Step 2: Buat UI Tabel Tindakan**
Tabel dengan field: `Analisa Kerusakan` (bisa diisi pre-fill dari notes checklist), `Tindakan` (input), `Nama Part` (input), `No. Part` (input), `Asal Part` (dropdown Stock/PB), `Jumlah Part` (input).

- [ ] **Step 3: Tambahkan logika submit form 065**
Submit data form dan kembali ke Orchestrator atau halaman Selesai.

### Task 5: Integrasi Submit Checklist ke Orchestrator

**Files:**
- Modify: `components/es-dashboard/shared-checklist-form.tsx`

**Interfaces:**
- Consumes: URL Orchestrator.

- [ ] **Step 1: Update on-success redirect**
Saat tombol submit ditekan dan berhasil, cek apakah ada `repairFormName` di dalam array items.
Jika ada, `router.push("/dashboard/reports/" + reportId + "/follow-up")`.
Jika tidak ada, `router.push("/dashboard")` (atau halaman sukses standar).
