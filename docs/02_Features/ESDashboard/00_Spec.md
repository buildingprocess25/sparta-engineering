# ES Dashboard Launcher

> **Status**: `Active`
> **Terakhir diperbarui**: 2026-09-12

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin saat masuk SPARTA langsung diarahkan ke pilihan kerja utama, agar saya bisa mulai dari Form Ijin Kerja, Checklist, atau Perbaikan by AHO / Temuan ES tanpa mencari menu.
- Sebagai **ES**, saya ingin alur dashboard mengikuti flow operasional yang sudah dipakai di engineering, agar sistem digital terasa sama dengan proses kerja lapangan.

## Scope Phase 1

**Dalam scope:**
- Route `/dashboard` sebagai layar awal ES.
- Tampilan mobile-first.
- Pilihan awal untuk mengisi atau melewati Form Ijin Kerja.
- Pilihan workflow: Checklist atau Perbaikan by AHO / Temuan ES.
- Preview pilihan area: Office dan WHC / WH / Depo / Bulky / Store Hub / Gudang Anak.
- Sinyal periode form: Monthly dan Weekly sesuai area.
- Visual direction SPARTA: black, silver, orange, white, luxury, elegant, glassmorphism.
- Polish visual yang natural: gunakan pola mobile app yang familiar (app bar, welcome panel, CTA utama, rekap, stats, bottom navigation) dan hindari glow/dekorasi berlebihan, novelty badge, serta pattern dashboard generik yang terlihat AI-generated.

**Luar scope Phase 1:**
- Submit form ke database.
- Auth role sungguhan.
- Upload foto.
- Matriks checklist detail.
- Approval action untuk Coord, Manager, Requester.
- Input PB/PJU aktual.

## Aturan Bisnis

1. ES masuk SPARTA dan melihat flow kerja yang dimulai dari keputusan Form Ijin Kerja.
2. Form Ijin Kerja bersifat opsional/kondisional untuk Phase 1 UI: user dapat memilih "Isi Form" atau "Lewati".
3. Setelah keputusan Form Ijin Kerja, ES memilih salah satu jalur:
   - Checklist
   - Perbaikan by AHO / Temuan ES
4. Setelah memilih jalur, ES memilih area:
   - Office
   - WHC / WH / Depo / Bulky / Store Hub / Gudang Anak
5. Office diarahkan ke form Monthly.
6. Area warehouse group menampilkan pilihan Monthly dan Weekly.

## UI & Alur Pengguna

- **Route:** `/dashboard`
- **Alur Phase 1:**
  1. ES melihat header SPARTA, role, dan lokasi kerja mock.
  2. ES melihat panel "Form Ijin Kerja" dengan aksi "Isi Form" dan "Lewati".
  3. ES melihat dua pilihan workflow besar: Checklist dan Perbaikan by AHO / Temuan ES.
  4. ES melihat area yang tersedia dan periode form terkait.
  5. CTA berikutnya ditampilkan sebagai preview, belum melakukan mutasi data.

## Data & API

Phase 1 menggunakan data mock statis di komponen UI. Tidak ada query database atau Server Action.

## Acceptance Criteria

- `/dashboard` dapat dibuka dan menampilkan ES launcher mobile-first.
- `/` mengarahkan user ke `/dashboard`.
- Tampilan menggunakan palette dan material yang tercatat di `DESIGN.md`.
- File Excel lokal di `data/` tetap ignored dan tidak masuk commit.
- `pnpm lint`, `pnpm typecheck`, dan `pnpm build` lolos.
