# ES Preventive & Incidental Report Flow

> **Status**: `Active`
> **Terakhir diperbarui**: 2026-09-16

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin dapat melihat daftar tugas *preventive checklist* (rutin mingguan/bulanan) yang menjadi tanggung jawab saya dan memantau status penyelesaiannya secara langsung di dashboard.
- Sebagai **ES**, saya ingin sistem membatasi pembuatan *preventive checklist* ganda pada area dan periode waktu yang sama untuk mencegah duplikasi.
- Sebagai **ES**, saya ingin tetap bisa melaporkan kerusakan mendadak (*incidental*) di area manapun kapan saja, tanpa terblokir oleh batasan periode checklist preventif.

## Scope

**Dalam scope:**
- Modifikasi skema database `ChecklistReport` untuk mendukung tipe laporan (`PREVENTIVE` dan `INCIDENTAL`).
- Tracking periode penyelesaian `ChecklistReport` tipe `PREVENTIVE`.
- Modifikasi logika UI di `/dashboard` untuk menampilkan status *tracker* checklist preventif.
- Modifikasi logika UI di `/dashboard/reports/new/checklist/area` (Flow Rutin) untuk me-lock area yang sudah dikerjakan di periode tersebut.
- Modifikasi logika UI di `/dashboard/reports/new/repair/area` (Flow Insidental) agar area selalu terbuka untuk dipilih.

**Luar scope:**
- Alur verifikasi dari Coordinator/Manager.
- Push notifikasi.

## Architecture & Data Models

### Perubahan Skema Database (`prisma/schema.prisma`)
1.  **Penambahan Enum:**
    ```prisma
    enum ReportCategory {
      PREVENTIVE
      INCIDENTAL
    }
    ```
2.  **Modifikasi `ChecklistReport`:**
    ```prisma
    model ChecklistReport {
      // ... (kolom lama)
      category    ReportCategory @default(PREVENTIVE)
      period      ChecklistPeriod?
      periodKey   String?        // Format: "YYYY-Www" atau "YYYY-MM"
      
      @@unique([areaId, period, periodKey]) // Unique constraint
    }
    ```
    *Constraint* unik ini akan mencegah duplikasi pembuatan laporan rutin. Karena pada PostgreSQL nilai `NULL` dianggap unik (atau lebih tepatnya, tidak melanggar aturan unique), laporan `INCIDENTAL` (yang field `period` dan `periodKey`-nya null) dapat dibuat berkali-kali di area yang sama.

## Aturan Bisnis (Business Rules)

1.  **Dua Jenis Laporan:** Semua laporan akan masuk ke `ChecklistReport`, namun dibedakan melalui field `category`.
2.  **Pembatasan Preventif:** Jika seorang ES masuk ke menu *Checklist* (Rutin) dan memilih Area Office, sistem akan mencatat laporan dengan `period=MONTHLY` dan `periodKey` bulan ini (misal `2026-09`). ES tidak bisa membuat laporan Checklist untuk Office lagi di bulan yang sama.
3.  **Kebebasan Insidental:** Jika di tengah bulan yang sama, AC di Office rusak, ES bisa masuk melalui menu *Perbaikan/Temuan*. Laporan akan dicatat sebagai `INCIDENTAL` dengan `period=null` dan `periodKey=null`.
4.  **To-Do Tracker:** Dashboard ES akan menarik daftar area yang ditugaskan ke ES, mengecek laporan `PREVENTIVE` yang cocok dengan `periodKey` saat ini, dan menampilkan persentase/jumlah penyelesaian (misal: "Weekly Checklist: 2/5 Selesai").

## Verification
- Memastikan `prisma generate` dan `prisma db push` berhasil mengaplikasikan constraint baru tanpa error.
- Memastikan flow pembuatan laporan insidental bisa berulang di area yang sama.
- Memastikan flow pembuatan laporan preventif terblokir jika periode masih sama.
