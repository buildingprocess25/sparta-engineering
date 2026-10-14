# Design Spec: Work Permit Banner on ES Dashboard

## Overview
Menambahkan Card / Banner Form Izin Kerja (SAT/FRM/MED/003) di dashboard ES, tepat di atas komponen **Tugas Rutin PIC (To-Do List)**.

## User Intent & Requirements
1. **Posisi**: Tepat di atas Card *Tugas Rutin PIC (To-Do List)* pada halaman dashboard utama ES (`app/dashboard/page.tsx`).
2. **Konten Card**:
   - Judul: Form Izin Kerja (SAT/FRM/MED/003)
   - Deskripsi edukasi kepatuhan K3/SMK3 untuk pelaksana teknisi sebelum memulai checklist di lapangan.
   - Tombol "Isi Form Izin Kerja" yang mengarah ke `/dashboard/reports/new/work-permit?next=dashboard`.
   - Menampilkan status aktif jika izin kerja sudah diisi pada sesi aktif (`sparta_work_permit`).
3. **Logic Scope**:
   - Hanya penambahan tampilan (UI Card & Button), tanpa membatasi atau mengunci fungsi kartu to-do yang sudah ada saat ini.

## Implementation Details
- Buat komponen reusable: `components/es-dashboard/work-permit-card.tsx`
- Gunakan di `app/dashboard/page.tsx` tepat sebelum `<TodoListPanel />`.
- Dukung deteksi status sesi client-side (`sessionStorage.getItem("sparta_work_permit")`) agar tombol dinamis: "Isi Form Izin Kerja" atau "Buka Form Izin Kerja (Terisi)".
