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

### Revisi audit laporan 17 November 2026

`ChecklistReport.approvalHistory` dan `executionHistory` adalah Json array dengan default `[]`, hanya ditulis server dalam transaksi perubahan status. Keputusan menyimpan `reviewerId`, `reviewerName`, `reviewerRole`, `stage`, `decision`, `decidedAt`, dan `notes`. Pelaksanaan menyimpan `actorId`, `actorName`, `action`, `fromStatus`, `toStatus`, `occurredAt`, dan `notes`. Data ini terpisah dari jawaban checklist agar tidak dapat dipalsukan melalui payload form.

`ReportStatus` ditambah `WAITING_PB`, `WAITING_PARTS`, dan `IN_PROGRESS`. Penggantian spare part 065 wajib melalui `PENDING_REQUESTER` sebelum status pelaksanaan. Data lama tidak diberi identitas persetujuan fiktif; riwayat kosong tetap kosong. Lihat [spesifikasi Form 065](../02_Features/SparePartFollowUp/00_Spec.md).

Form 014 memakai `PENDING_REQUESTER` setelah ACC Manager dan `WAITING_PJU` setelah ACC Requester. `WAITING_PJU` adalah status tersendiri dari jalur PB/Stock Form 065.

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
| workPermitId | String? | Izin kerja aktif saat checklist dikirim. Opsional untuk draft dan laporan yang sudah tersimpan sebelum aturan ini berlaku |
| category | ReportCategory | Enum (PREVENTIVE, INCIDENTAL). Pembeda laporan rutin dan insidental |
| period | ChecklistPeriod? | Enum (WEEKLY, MONTHLY, QUARTERLY, SEMESTER). Berlaku hanya untuk PREVENTIVE |
| periodKey | String? | Penanda periode unik (misal "2026-W37", "2026-09", "2026-Q3", "2026-S2"). Berlaku hanya untuk PREVENTIVE |
| status | ReportStatus | Enum (DRAFT, NEEDS_REVISION, PENDING_COORD, PENDING_MANAGER, PENDING_REQUESTER, WAITING_PJU, WAITING_PB, WAITING_PARTS, IN_PROGRESS, COMPLETED, REJECTED). Default: `DRAFT` |
| isSafe | Boolean | True jika 100% aman (bypass Requester approval) |
| checklistPayload | Json | One JSON object containing submitted checklist item results |
| drivePhotoFileIds | Json | Array of Google Drive file IDs uploaded for the report |
| finalPdfDriveUrl | String? | Future final PDF Drive URL |
| finalPdfFolderUrl | String? | Future final PDF folder URL |
| createdAt | DateTime | Timestamp pembuatan laporan |
| updatedAt | DateTime | Timestamp update terakhir |

Constraint: `@@unique([areaId, roomId, period, periodKey, formCode])` untuk mencegah duplikasi laporan preventif per ruangan. Laporan insidental (`period = null`) tidak dibatasi.

### DashboardNoticeRead

Catatan baca notifikasi terkait antrean atau keputusan checklist dan izin K3. Kunci gabungan pengguna, peran, cabang, dan notifikasi menyimpan satu catatan tiap tahap dokumen. Judul, referensi, tautan internal, dan waktu perubahan disimpan untuk Riwayat setelah dokumen berpindah tahap. Notifikasi izin yang disetujui penuh tetap memakai kolom baca pada WorkPermit untuk mempertahankan riwayat yang sudah ada.

### ChecklistReportRevision

| Field | Tipe | Keterangan |
|---|---|---|
| id | String | Primary key |
| reportId | String | Relasi ke ChecklistReport |
| reason, reviewerId, reviewerName | String? | Alasan dan identitas reviewer saat permintaan. Kosong untuk riwayat lama yang tidak tercatat |
| reviewStage | ReportStatus? | `PENDING_COORD` atau `PENDING_MANAGER` saat diminta revisi |
| requestedAt, resubmittedAt | DateTime? | Waktu permintaan dan pengiriman ulang |
| previousPayload, resubmittedPayload | Json, Json? | Isian saat dikembalikan dan saat dikirim ulang |

Satu permintaan aktif per laporan, dijamin oleh indeks unik parsial pada `reportId` dengan `resubmittedAt IS NULL`. Perubahan status laporan dan pencatatan permintaan atau pengiriman ulang berada dalam transaksi yang sama.

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


### WorkPermit (Form Izin Kerja FRM_MED_003)
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| permitCode | String | Unique nomor izin kerja (e.g. "WP-CKL-20261019-0001") |
| formCode | String | Default: `SAT/FRM/MED/003_Rev:000_180225` |
| kegiatan | String | Nama/deskripsi pekerjaan yang akan dilakukan |
| lokasi | String | Lokasi pekerjaan (Office, Warehouse, Depo, dll) |
| picSat | String | PIC Pengawas SAT / Alfamart |
| kontraktor | String? | Nama kontraktor/rekanan atau "INTERNAL" |
| workDate | DateTime (@db.Date) | Tanggal berlaku izin kerja |
| duration | String | Estimasi lama pekerjaan (e.g. "1 Hari", "8 Jam") |
| workers | Json | Daftar nama pekerja (Array string) |
| safetyPayload | Json | Payload K3: administrasi, hot work, ketinggian, ruang terbatas, listrik, APD, fire protection |
| catatanPasca | String? | Catatan hasil pemeriksaan pasca pekerjaan |
| status | WorkPermitStatus | Enum (PENDING_MANAGER, APPROVED, REJECTED, COMPLETED) |
| applicantNik | String | Relasi ke User (Pemohon - BES) |
| applicantSignedAt | DateTime | Timestamp pengajuan oleh pemohon |
| managerNik | String? | Relasi opsional ke User (Approver - Manager) |
| managerSignedAt | DateTime? | Timestamp persetujuan Manager |
| managerNotes | String? | Catatan pengesahan / alasan penolakan Manager |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |

Relasi:
- `belongsTo User` sebagai `applicant` (`applicantNik`)
- `belongsTo User` sebagai `manager` (`managerNik`)
- `hasMany ChecklistReport` via `workPermitId` (opsional)



### Revisi MED/003: persetujuan berjenjang

`WorkPermitStatus` menambahkan `PENDING_P2K3`, `PENDING_SECRETARY`. Alur wajib
Manager → P2K3 atau Delegate → Sekretaris P2K3 → APPROVED. `APPROVED` saja tanpa
bukti ketiga tahap tidak cukup untuk menjadi izin aktif.

| Field WorkPermit | Tipe | Keterangan |
|---|---|---|
| applicantName | String? | Snapshot nama akun saat pengajuan; nullable untuk data lama |
| approvalHistory | Json, default [] | Audit server: stage, actorNik, actorName, accountRole, approvalRole, decision, notes, decidedAt |
| applicantNotificationReadAt | DateTime? (@db.Timestamptz(3)) | Waktu BES menandai notifikasi persetujuan akhir sebagai dibaca. Null berarti belum dibaca untuk izin yang telah mendapat persetujuan lengkap. |

Kolom managerNik/managerSignedAt/managerNotes tetap kompatibel dengan riwayat lama;
managerSignedAt mencatat waktu keputusan akun, bukan tanda tangan elektronik.
Semua perubahan audit dan status dilakukan dengan pemeriksaan versi/status atomik.

### WorkPermitApprover

| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| branchName | String | Cabang akun/pemohon, dibandingkan tanpa membedakan kapital |
| userNik | String | Relasi User.NIK yang sudah ada |
| name | String? | Nama kontak approver (snapshot / kontak untuk email) |
| email | String? | Email kontak approver untuk pengiriman notifikasi |
| approvalRole | WorkPermitApprovalRole | P2K3, DELEGATE, SECRETARY |
| isActive | Boolean, default true | Hak persetujuan aktif |
| createdAt, updatedAt | DateTime | Waktu konfigurasi |

Unik `(branchName, userNik, approvalRole)`; indeks userNik dan branchName. Tidak
mengubah UserRole atau memberi hak otomatis pada role aplikasi yang sudah ada.
Manager menggunakan pemetaan User.branchName yang sudah ada. Migration tidak
menciptakan pemetaan orang. Izin APPROVED lama hanya dipindahkan ke tahap P2K3
jika bukti Manager tersedia; selain itu menunggu Manager kembali. Persetujuan
manual di kertas tidak diisi atau dipalsukan oleh aplikasi.

### WorkPermitApprovalToken

| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| token | String (unique) | Token acak kriptografis URL-safe |
| permitId | String | Relasi ke WorkPermit (Cascade delete) |
| approverNik | String | NIK akun approver yang berwenang |
| approverName | String | Nama approver saat token diterbitkan |
| approverEmail | String | Email approver tujuan notifikasi |
| approvalRole | WorkPermitApprovalRole | P2K3, DELEGATE, SECRETARY |
| targetStage | WorkPermitStatus | PENDING_P2K3 atau PENDING_SECRETARY |
| expiresAt | DateTime | Batas waktu kedaluwarsa tautan |
| usedAt | DateTime? | Timestamp saat token digunakan (menjamin single-use) |
| decision | String? | Keputusan yang diambil (APPROVED / REJECTED) |
| notes | String? | Catatan saat pengambilan keputusan |
| createdAt | DateTime | Waktu pembuatan token |

Indeks: `token`, `permitId`, `targetStage`.

### DemoOutboxEmail

| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| toEmail | String | Alamat email penerima |
| toName | String? | Nama penerima |
| subject | String | Judul subjek email |
| bodyHtml | Text | Isi email dalam format HTML |
| bodyText | Text? | Isi email teks cadangan |
| actionUrl | String? | Tautan aksi utama (cth: halaman persetujuan) |
| metadata | Json? | Informasi kontekstual (permitId, stage, token, dll.) |
| sentAt | DateTime | Waktu pengiriman email simulasi |
| readAt | DateTime? | Waktu email dibuka di kotak keluar demo |
| createdAt | DateTime | Waktu pembuatan |

Indeks: `toEmail`, `sentAt`.

