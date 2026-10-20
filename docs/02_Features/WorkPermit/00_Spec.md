# Feature Spec: Form Izin Kerja (FRM_MED_003) & Manager Approval

## 1. Ringkasan Fitur
Fitur Izin Kerja (`FRM_MED_003` - SAT/FRM/MED/003_Rev:000_180225) adalah implementasi digital dari Sistem Manajemen K3 (SMK3) SAT/KEB/MED/001 untuk memastikan setiap kegiatan pemeliharaan atau perbaikan oleh teknisi Branch Engineering Support (BES) maupun kontraktor memenuhi standar keselamatan kerja sebelum dimulai.

Fitur ini mencakup alur pengajuan oleh PIC / Teknisi ES, penyimpanan persisten di database, dan proses review & persetujuan (*approval*) oleh Branch Building & Maintenance Manager melalui menu khusus di dashboard Manager.

---

## 2. Alur Pengguna (User Journey)

### A. Sisi Pemohon (Teknisi BES / PIC)
1. **Pemeriksaan Sesi Kerja Harian**:
   - Saat teknisi masuk ke Dashboard ES, sistem mengecek ke database apakah teknisi memiliki `WorkPermit` berstatus `APPROVED` untuk tanggal hari ini (`workDate = CURRENT_DATE`).
   - Jika belum ada atau berstatus `PENDING_MANAGER`, kartu tugas checklist rutin terkunci (`disabled`) demi kepatuhan K3.
2. **Pengisian Form `FRM_MED_003`**:
   - Teknisi membuka form izin kerja (`/dashboard/reports/new/work-permit`).
   - Mengisi identitas pekerjaan (Kegiatan, Lokasi, PIC SAT, Kontraktor/Internal, Estimasi Waktu, Daftar Nama Pekerja).
   - Memilih checklist K3: Administrasi/JSA, APD khusus (Hot Work, Ketinggian, Ruang Terbatas, Listrik Tegangan Tinggi, APAR).
   - Menekan tombol **"Simpan & Ajukan Izin Kerja"**.
3. **Status Pengajuan**:
   - Izin kerja tersimpan di database dengan status `PENDING_MANAGER`.
   - Di dashboard ES muncul banner informatif: *"Izin Kerja Menunggu Persetujuan Manager (Diajukan [Waktu])"*.

### B. Sisi Manajer (Branch Building & Maintenance Manager)
1. **Notifikasi & Antrean Approval**:
   - Di sidebar Manager terdapat menu baru: **"Izin Kerja K3"** (`/dashboard/work-permits`) dengan badge angka antrean pending.
2. **Review Detail K3**:
   - Manajer melihat daftar pengajuan izin kerja lengkap dengan indikator risiko tinggi (*Hot Work*, *Ketinggian*, *Listrik*).
   - Manajer membuka drawer/modal detail untuk memeriksa daftar pekerja, JSA, dan APD yang disiapkan.
3. **Pemberian Keputusan**:
   - **Setujui (Approve)**: Manajer mengklik "Setujui Izin Kerja", status berubah menjadi `APPROVED`, timestamp `managerSignedAt` tersimpan, dan kartu To-Do List teknisi otomatis terbuka (unlocked).
   - **Tolak / Revisi (Reject)**: Manajer memasukkan catatan arahan (misal: "Harap lengkapi body harness untuk pekerjaan rak tinggi"). Status berubah menjadi `REJECTED`.

---

## 3. Skema Data & Relasi
Lihat dokumentasi lengkap di [10_Data_Models.md](../../01_Architecture/10_Data_Models.md).

- Model: `WorkPermit`
- Enum Status: `WorkPermitStatus` (`PENDING_MANAGER`, `APPROVED`, `REJECTED`, `COMPLETED`)
- Relasi:
  - `applicant`: `User` (BES)
  - `manager`: `User` (Manager)
  - `reports`: `ChecklistReport[]`

---

## 4. Rute & Komponen Baru / Diperbarui
1. `prisma/schema.prisma`: Penambahan model `WorkPermit`.
2. `lib/actions/work-permit.ts`: Server Actions (`submitWorkPermitAction`, `approveWorkPermitAction`, `rejectWorkPermitAction`, `getActiveWorkPermit`).
3. `components/es-dashboard/frm-med-003-form.tsx`: Pengiriman data langsung ke database.
4. `components/es-dashboard/work-permit-card.tsx` & `todo-list-panel.tsx`: Integrasi status approval dinamis dari database.
5. `app/dashboard/work-permits/page.tsx`: Halaman workbench approval Manager.
6. `components/manager-dashboard/work-permits-view.tsx`: Komponen tabel dan modal review Manager.
7. `components/manager-dashboard/manager-sidebar.tsx`: Penambahan navigasi "Izin Kerja K3".
