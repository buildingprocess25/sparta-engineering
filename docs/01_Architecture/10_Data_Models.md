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

### User
| Field | Tipe | Keterangan |
|---|---|---|
| NIK | String | Primary key, diambil dari master data |
| name | String | Nama user / PIC |
| email | String? | Bisa nullable |
| branchName | String | Nama cabang (Contoh: "BANJARMASIN") |
| location | String? | Lokasi penempatan khusus ES |
| role | UserRole | Enum (ES, COORD, MANAGER, REQUESTER, ADMIN_HO, SUPER_ADMIN) |
| passwordHash | String | Hashed password. Default: Nama Cabang |
| mustChangePassword | Boolean | Default: `true`. Wajib ganti password saat login pertama kali |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

### Area
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| name | String | Contoh: "Office Lantai 1", "Gudang A" |
| type | AreaType | Enum (OFFICE, WAREHOUSE) |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

### ChecklistReport
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| areaId | String | Relasi ke Area |
| authorId | String | Relasi ke User pembuat laporan (ES) |
| status | ReportStatus | Enum (PENDING_COORD, PENDING_MANAGER, PENDING_REQUESTER, COMPLETED, REJECTED) |
| isSafe | Boolean | True jika 100% aman (bypass Requester approval) |
| createdAt | DateTime | Timestamp pembuatan laporan |
| updatedAt | DateTime | Timestamp update terakhir |

### ChecklistItem
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| reportId | String | Relasi ke ChecklistReport |
| itemName | String | Nama barang/area spesifik yang dicek |
| condition | ItemCondition | Enum (BAIK, CLEAN, REPAIR, RUSAK, TIDAK_ADA) |
| notes | String? | Catatan (opsional) |
| photoUrls | Json | Array URL/ID foto kerusakan dari storage/CDN. Default: `[]` |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |
