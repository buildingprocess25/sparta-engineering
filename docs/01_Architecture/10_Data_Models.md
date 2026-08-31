# Data Models

Dokumen ini mendefinisikan standar skema database dan relasi antar model Prisma
di proyek ini.

> **Sumber kebenaran skema**: `prisma/schema.prisma`  
> **Provider**: PostgreSQL  
> **Prisma Client output**: `generated/prisma/`

---

## Aturan Skema

1. Setiap perubahan skema **wajib** didiskusikan dan diupdate di sini terlebih dahulu.
2. Jalankan `pnpm prisma:validate` setelah setiap perubahan skema.
3. Jalankan `pnpm prisma:generate` untuk memperbarui Prisma Client.
4. Perintah migrasi yang dijalankan langsung ke database (`migrate dev`, `migrate deploy`, `db push`) **dilarang keras** — koordinasikan dengan DBA/lead engineer.

---

## Model

> _Belum ada model yang didefinisikan. Tambahkan di sini setiap kali ada model baru di `schema.prisma`._

<!-- Contoh format:

### User

| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| email | String (unique) | Email login |
| createdAt | DateTime | Timestamp pembuatan |

-->
