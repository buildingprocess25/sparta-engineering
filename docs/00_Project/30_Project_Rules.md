# Project Rules

Aturan ini berlaku untuk semua developer dan AI Agent yang bekerja di proyek ini.
Sumber lengkapnya ada di `AI_RULES.md` dan `AGENTS.md` di root proyek.

---

## 1. DDD Workflow

Ikuti urutan ini untuk setiap fitur atau perubahan non-trivial:

```
DISCUSS → DOCUMENT → CODE → COMMIT
```

- Jangan mulai coding tanpa ada dokumen spesifikasi yang diperbarui terlebih dahulu.
- Fitur baru → buat `docs/02_Features/<NamaFitur>/00_Spec.md` dulu.
- Perubahan skema DB → update `docs/01_Architecture/10_Data_Models.md` dulu.

---

## 2. UI & Komponen

- **Gunakan shadcn/ui terlebih dahulu.** Cek dengan `npx shadcn@latest search '@shadcn' -q "<kebutuhan>"` sebelum membuat komponen baru dari nol.
- **Komponen custom harus reusable.** Tidak boleh hardcode data satu halaman. Taruh di `@/components/` dengan nama yang deskriptif.
- **Jangan tambahkan spacing manual ke komponen shadcn** (`Card`, `Button`, dll). Gunakan layout wrapper (`flex flex-col gap-4`) untuk jarak antar sibling.

---

## 3. Database & Prisma

- **Hanya gunakan Prisma ORM.** Jangan tambahkan ORM kedua.
- **Perintah yang DILARANG dijalankan:**
  - ❌ `prisma db push`
  - ❌ `prisma migrate dev`
  - ❌ `prisma migrate deploy`
- **Perintah yang diizinkan** (tidak mengubah database):
  - ✅ `pnpm prisma:validate`
  - ✅ `pnpm prisma:generate`
- Sebelum perintah apapun yang berhubungan dengan database, konfirmasi dulu apakah target adalah **development atau production**.

---

## 4. Git & Commit

- Pre-commit hook (`pnpm check:docs`) akan memblokir commit yang mengubah kode substantif tanpa memperbarui `docs/`.
- `git commit --no-verify` **hanya boleh** untuk perbaikan minor: typo, CSS tweak kecil, atau bugfix yang tidak mengubah perilaku fitur.
- Cantumkan alasannya di commit message jika menggunakan `--no-verify`.
