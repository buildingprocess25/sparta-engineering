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
4. Jangan gunakan `prisma db push`.
5. Perubahan skema wajib direkam sebagai Prisma migration.
6. Perintah migration yang menyentuh database wajib diawali konfirmasi target environment (development atau production).

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
| code | String | Unique stable code, contoh: `office`, `whc`, `store_hub` |
| name | String | Contoh: "Office", "WHC", "Store Hub" |
| type | AreaType | Enum (OFFICE, WAREHOUSE). Menentukan form family |
| isActive | Boolean | Area tampil di flow ES jika `true` |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Area berlaku global untuk semua cabang. Area `OFFICE` memakai office checklist family. Area `WAREHOUSE` memakai shared warehouse checklist family untuk WHC, WH, Depo, Bulky, Store Hub, dan Gudang Anak.

### AreaChecklistAvailability
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| areaId | String | Relasi ke Area |
| period | ChecklistPeriod | Enum (MONTHLY, WEEKLY) |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Constraint: `@@unique([areaId, period])`.

### ChecklistReport
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| areaId | String | Relasi ke Area |
| authorId | String | Relasi ke User pembuat laporan (ES) |
| category | ReportCategory | Enum (PREVENTIVE, INCIDENTAL). Pembeda laporan rutin dan insidental |
| period | ChecklistPeriod? | Enum (MONTHLY, WEEKLY). Berlaku hanya untuk PREVENTIVE |
| periodKey | String? | Penanda periode unik (misal "2026-W37" atau "2026-09"). Berlaku hanya untuk PREVENTIVE |
| status | ReportStatus | Enum (PENDING_COORD, PENDING_MANAGER, PENDING_REQUESTER, COMPLETED, REJECTED) |
| isSafe | Boolean | True jika 100% aman (bypass Requester approval) |
| createdAt | DateTime | Timestamp pembuatan laporan |
| updatedAt | DateTime | Timestamp update terakhir |

Constraint: `@@unique([areaId, period, periodKey])` untuk mencegah duplikasi laporan preventif. Laporan insidental (`period = null`) tidak dibatasi.

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
