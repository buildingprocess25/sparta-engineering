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
| email | String? | Bisa nullable, tapi wajib unik (`@unique`) |
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

### Room
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| areaId | String | Relasi ke Area |
| name | String | Nama ruangan, contoh: "R. Adm Receiving", "Area Lobby" |
| code | String | Unique stable code ruangan yang digenerate saat seed |
| isActive | Boolean | Ruangan aktif dan dapat dipilih di flow checklist jika `true` |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Relasi: `belongsTo Area`, `hasMany RoomFormAvailability`, `hasMany ChecklistReport`.

### RoomFormAvailability
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| roomId | String | Relasi ke Room |
| formCode | String | Kode form checklist, contoh: `FRM_TSM_003`, `FRM_TS_016`, dll |
| period | ChecklistPeriod | Enum (WEEKLY, MONTHLY, QUARTERLY, SEMESTER) |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Constraint: `@@unique([roomId, formCode, period])`. Tabel ini menggantikan `AreaChecklistAvailability` sehingga form checklist terikat langsung per ruangan.

### ChecklistReport
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| reportCode | String? | Unique operational report code generated when the draft is reserved |
| formCode | String? | Form code such as `FRM_TSM_003` |
| areaId | String | Relasi ke Area |
| roomId | String? | Relasi ke Room (spesifik ruangan yang dicek) |
| authorId | String | Relasi ke User pembuat laporan (ES) |
| category | ReportCategory | Enum (PREVENTIVE, INCIDENTAL). Pembeda laporan rutin dan insidental |
| period | ChecklistPeriod? | Enum (WEEKLY, MONTHLY, QUARTERLY, SEMESTER). Berlaku hanya untuk PREVENTIVE |
| periodKey | String? | Penanda periode unik (misal "2026-W37", "2026-09", "2026-Q3", "2026-S2"). Berlaku hanya untuk PREVENTIVE |
| status | ReportStatus | Enum (DRAFT, PENDING_COORD, PENDING_MANAGER, PENDING_REQUESTER, COMPLETED, REJECTED). Default: `DRAFT` |
| isSafe | Boolean | True jika 100% aman (bypass Requester approval) |
| checklistPayload | Json | One JSON object containing submitted checklist item results |
| drivePhotoFileIds | Json | Array of Google Drive file IDs uploaded for the report |
| finalPdfDriveUrl | String? | Future final PDF Drive URL |
| finalPdfFolderUrl | String? | Future final PDF folder URL |
| createdAt | DateTime | Timestamp pembuatan laporan |
| updatedAt | DateTime | Timestamp update terakhir |

Constraint: `@@unique([areaId, roomId, period, periodKey, formCode])` untuk mencegah duplikasi laporan preventif per ruangan. Laporan insidental (`period = null`) tidak dibatasi.

### GoogleDriveFolderCache
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| cacheKey | String | Unique stable folder cache key |
| folderId | String | Google Drive folder ID |
| createdAt | DateTime | Timestamp pembuatan |
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

### Equipment
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| branchName | String | Nama cabang (e.g. "BALARAJA") |
| roomId | String? | Relasi opsional ke Room |
| areaId | String? | Relasi opsional ke Area |
| name | String | Nama/tipe equipment (e.g. "CONVEYOR", "EXHAUST FAN", "GENSET") |
| unitNo | Int | Nomor unit (e.g. 1, 2, 49) |
| code | String | Unique code equipment (e.g. "BALARAJA-CONVEYOR-1") |
| isActive | Boolean | Status aktif alat |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Constraint: `@@unique([branchName, name, unitNo])`.

### PicAssignment
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| userNik | String | Relasi ke User (PIC) |
| equipmentId | String? | Relasi opsional ke Equipment |
| roomId | String? | Relasi opsional ke Room |
| formCode | String | Kode form checklist (e.g. "SAT/FRM/TS/041") |
| period | ChecklistPeriod | Enum (WEEKLY, MONTHLY, QUARTERLY, SEMESTER) |
| isActive | Boolean | Status penugasan aktif |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Relasi: `belongsTo User`, `belongsTo Equipment`, `belongsTo Room`, `hasMany ChecklistTask`.

### ChecklistTask (To-Do List Rutin)
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| assignmentId | String | Relasi ke PicAssignment |
| targetDate | DateTime | Tanggal jadwal pelaksanaan kalender |
| periodKey | String | Kunci periode kalender (e.g. "2026-W41", "2026-10") |
| status | TaskStatus | Enum (PENDING, OVERDUE, COMPLETED, CANCELLED) |
| reportId | String? | Relasi opsional ke ChecklistReport penyelesai |
| completedAt | DateTime? | Waktu penyelesaian checklist |
| createdAt | DateTime | Timestamp pembuatan task |
| updatedAt | DateTime | Timestamp update terakhir |

Relasi: `belongsTo PicAssignment`, `belongsTo ChecklistReport`.
Constraint: `@@unique([assignmentId, periodKey])` untuk mencegah generate duplikat tugas.

