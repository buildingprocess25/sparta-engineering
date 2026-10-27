# Feature Spec: Form Izin Kerja (FRM_MED_003) & Manager Approval

## 1. Ringkasan Fitur
Fitur Izin Kerja (`FRM_MED_003` - SAT/FRM/MED/003_Rev:000_180225) adalah implementasi digital dari Sistem Manajemen K3 (SMK3) SAT/KEB/MED/001 untuk memastikan setiap kegiatan pemeliharaan atau perbaikan oleh teknisi Branch Engineering Support (BES) maupun kontraktor memenuhi standar keselamatan kerja sebelum dimulai.

Fitur ini mencakup alur pengajuan oleh PIC / Teknisi ES, penyimpanan persisten di database, dan proses review & persetujuan (*approval*) oleh Branch Building & Maintenance Manager melalui menu khusus di dashboard Manager.

---

## 2. Alur Pengguna (User Journey)

### A. Sisi Pemohon (Teknisi BES / PIC)
1. **Pemeriksaan Status Izin Kerja & Masa Berlaku 1 Bulan**:
   - Saat teknisi masuk ke Dashboard ES, sistem mengecek ke database apakah teknisi memiliki `WorkPermit` berstatus `APPROVED` yang aktif untuk **periode bulan berjalan** (`targetPeriod = YYYY-MM`).
   - **Masa Berlaku Bulanan**: Izin kerja yang telah disetujui oleh Manager (`status = APPROVED`) berlaku selama **1 bulan kalender penuh** (dari tanggal 1 pukul 00:00 hingga akhir bulan berjalan pukul 23:59).
   - **Mekanisme Pengajuan H- Bulan Sebelumnya**:
     - Mulai tanggal 20 ke atas setiap bulan, jendela pengajuan izin kerja untuk **bulan berikutnya (H-)** dibuka.
     - Teknisi dapat mengajukan form izin kerja lebih awal sehingga Manager dapat meninjau dan menyetujui sebelum tanggal 1 tiba.
     - Begitu pergantian bulan terjadi (tanggal 1), izin kerja yang telah disetujui langsung aktif secara otomatis (*seamless handoff*) tanpa membuat kartu tugas terkunci.
   - **Status Kedaluwarsa & Kunci Tugas**:
     - Jika izin kerja bulan sebelumnya berakhir dan belum ada izin kerja `APPROVED` untuk bulan berjalan, status menjadi `EXPIRED` (Kedaluwarsa).
     - Kartu tugas checklist rutin terkunci (`disabled`) demi kepatuhan K3 sampai izin kerja bulan berjalan disetujui Manager.
   - Pada alur checklist non-rutin (`/dashboard/reports/new`), card/tombol Form Izin Kerja pada Langkah 1 tetap dipertahankan; jika teknisi sudah memiliki izin kerja `APPROVED` untuk periode aktif, status otomatis terdeteksi terisi dan pilihan Langkah 2 langsung terbuka.
2. **Pengisian Form `FRM_MED_003`**:
   - Teknisi membuka form izin kerja (`/dashboard/reports/new/work-permit`).
   - Identitas pekerjaan terisi otomatis (auto-fill):
     - **PIC SAT**: Otomatis terisi nama teknisi yang sedang login.
     - **Kegiatan / Pekerjaan**: Default terisi `"Checklist Rutinan"` jika dibuka dari Todo List dashboard, atau deskripsi non-rutin jika dari alur laporan non-rutin.
     - **Lokasi Pekerjaan**: Otomatis terisi sesuai konteks Branch, Area, dan Ruangan kerja yang dipilih.
     - **Lama Pekerjaan / Jam**: Menggunakan format jam terstruktur (Jam Mulai & Jam Selesai via input time) dengan kalkulasi durasi otomatis.
     - **Daftar Pekerja**: Pekerja pertama otomatis terisi teknisi pemohon.
   - Memilih checklist K3: Administrasi/JSA, APD khusus (Hot Work, Ketinggian, Ruang Terbatas, Listrik Tegangan Tinggi, APAR).
   - Menekan tombol **"Simpan & Ajukan Izin Kerja"**.
3. **Status Pengajuan & Tampilan Detail Read-Only**:
   - Izin kerja tersimpan di database dengan status `PENDING_MANAGER`.
   - Di dashboard ES muncul banner informatif: *"Izin Kerja Menunggu Persetujuan Manager (Diajukan [Waktu])"*.
   - Saat izin kerja sudah di-ACC (`status = APPROVED`), tombol pada card izin kerja bertuliskan **"Lihat Izin Kerja"**.
   - Ketika teknisi mengklik **"Lihat Izin Kerja"**, sistem membuka formulir izin kerja (`FrmMed003Form`) persis sama seperti tampilan formulir pengisian aslinya namun dalam mode **Read-Only**: seluruh input, pilihan, dan checkbox terisi sesuai data pengajuan database dalam status terkunci (*disabled*), dilengkapi banner status persetujuan Manager, serta tombol navigasi "Kembali ke Dashboard" dan "Ajukan Izin Kerja Baru".
4. **Tampilan Responsif Tablet Form Izin Kerja (`/dashboard/reports/new/work-permit`)**:
   - Halaman formulir izin kerja ES dibuat responsif adaptif terhadap layar tablet/iPad (`md:max-w-3xl lg:max-w-4xl px-4 sm:px-6 md:px-8`).
   - Header shell, informasi umum pekerjaan (grid 2-kolom), checklist APD (grid 3-4 kolom), dan tombol aksi (tata letak horizontal berdampingan di mode read-only) memanfaatkan lebar viewport tablet secara proporsional.
   - Halaman pembuatan laporan/flow lain tetap menggunakan batas default sampai ada instruksi lanjutan.

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
