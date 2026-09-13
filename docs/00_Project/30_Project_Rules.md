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

## 2.1 React & Next Code Organization

- Route files di `app/**/page.tsx` harus tipis: data loading, auth/role guard, dan komposisi layout. Hindari menyimpan banyak section UI langsung di page.
- Pisahkan Server Component dan Client Component secara eksplisit. Data fetching dan akses database berada di server; state, event handler, dan interaksi browser berada di client.
- Komponen role-based dashboard harus dipisah per domain di `components/<domain>/` agar mudah dikembangkan untuk ES, Coord, Manager, Requester, Admin HO, dan Super Admin.
- Hindari duplikasi card/button/section pattern. Buat primitive kecil reusable untuk pilihan, section heading, stats card, dan navigation item.
- Terapkan Vercel React best practices: hindari waterfall yang tidak perlu, minimalkan prop serialization dari server ke client, jangan membuat component inline di dalam component, dan gunakan struktur file yang statically analyzable.

### Dashboard Code Quality Checklist

Sebelum menyelesaikan dashboard role-based:

- Route file `page.tsx` maksimal bertanggung jawab pada data loading, role guard, dan komposisi komponen.
- Setiap section besar dashboard berada di file komponen sendiri.
- Client Component hanya dipakai ketika butuh state, event handler, lifecycle, atau browser API.
- Props dari Server Component ke Client Component harus minimal dan serializable.
- Repeated option/card/button pattern harus memakai primitive reusable.
- Data access harus punya fallback/error state agar kegagalan database tidak membuat halaman crash.
- Jalankan `pnpm lint`, `pnpm typecheck`, dan `pnpm build` sebelum klaim selesai.

---

## 3. Database & Prisma

- **Hanya gunakan Prisma ORM.** Jangan tambahkan ORM kedua.
- **Jangan pernah gunakan `prisma db push`.**
- **Perubahan schema wajib direkam sebagai Prisma migration.**
- **Perintah yang diizinkan** (tidak mengubah database):
  - ✅ `pnpm prisma:validate`
  - ✅ `pnpm prisma:generate`
  - ✅ `pnpm prisma format`
- `prisma migrate dev --create-only` hanya boleh untuk koneksi **development** setelah target environment dikonfirmasi.
- Applying migration (`prisma migrate dev` tanpa `--create-only` atau `prisma migrate deploy`) wajib konfirmasi environment secara eksplisit dan tidak boleh menarget production kecuali workflow deployment production memang dikonfirmasi.
- Sebelum perintah apapun yang memengaruhi database, konfirmasi dulu apakah target adalah **development atau production**.

---

## 4. Git & Commit

- Pre-commit hook (`pnpm check:docs`) akan memblokir commit yang mengubah kode substantif tanpa memperbarui `docs/`.
- `git commit --no-verify` **hanya boleh** untuk perbaikan minor: typo, CSS tweak kecil, atau bugfix yang tidak mengubah perilaku fitur.
- Cantumkan alasannya di commit message jika menggunakan `--no-verify`.
