# Checklist & Approval Workflow

> **Status**: `Active`  
> **Terakhir diperbarui**: 2026-08-31

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin dapat mengisi checklist rutin (bulanan/mingguan) secara digital melalui sistem web, agar tidak perlu lagi menggunakan kertas dan Google Forms.
- Sebagai **ES**, saya ingin dapat melaporkan temuan kerusakan langsung dari form checklist agar dapat segera ditindaklanjuti.
- Sebagai **Engineering Coordinator / Manager / Requester**, saya ingin dapat memverifikasi dan menyetujui (approve) laporan checklist dan perbaikan secara berjenjang di dalam satu sistem yang sama.

## Scope

**Dalam scope:**
- Pengisian *Form Ijin Kerja* (SAT/FRM/MED/003) sebagai prasyarat **Mandatory (Wajib)** sebelum melanjutkan laporan non-rutin.
- Tombol 'Lewati' dihapus untuk kepatuhan SMK3 dan kebijakan kerja aman.
- Form pengisian checklist (Weekly & Monthly).
- Pemilihan Area (Office vs WHC/Gudang).
- Pencatatan status per item (Baik, Clean, Repair, Rusak, Tidak Ada).
- Alur Approval berjenjang.

**Luar scope:**
- Tanda tangan digital multi-stakeholder eksternal offline (approval digital diselesaikan via akun internal).

## Aturan Bisnis (Business Rules)

1. **Langkah Awal ES (Mandatory Izin Kerja)**: Setelah masuk SPARTA dan memilih 'Buat Laporan', ES wajib melengkapi *Form Ijin Kerja* (SAT/FRM/MED/003). Opsi lewati ditiadakan demi penegakan klausul keselamatan kerja (SMK3).
2. **Pilihan Jalur Kerja**: Setelah Form Ijin Kerja terkonfirmasi, ES melanjutkan ke pemilihan jenis laporan (**Checklist** atau **Perbaikan by AHO / Temuan ES**).
3. **Model Pengisian Data**: ES membuat "Dokumen Laporan Baru" (record baru) di dalam sistem setiap kali jadwal checklist tiba.
4. **Alur Approval (Tanpa Kerusakan)**: Jika laporan checklist 100% aman (tidak ada laporan kerusakan), maka proses approval cukup melalui **Coord** dan **Manager**, lalu status menjadi Selesai (Tidak perlu sampai ke Requester).
5. **Alur Approval (Ada Kerusakan)**: Jika terdapat temuan kerusakan, alur akan mengikuti proses yang lebih panjang (ES -> Coord -> Manager -> Requester -> Input PB/PJU -> Selesai).
6. **Otoritas & Tampilan Detail Laporan (`/dashboard/reports/[reportCode]`)**:
   - **Teknisi ES**: Hanya melihat ringkasan & *draft isian* murni yang telah diinput (hasil periksa, foto bukti, catatan, form tindak lanjut). ES tidak berwenang memberikan persetujuan (*acc*), sehingga tab/tombol **"Aksi Review" (Setujui / Tolak / Minta Revisi) disembunyikan total**. ES juga tidak dimuat dalam `ManagerSidebar`, melainkan tampilan mandiri yang bersih dengan navigasi kembali ke `/dashboard`.
   - **Reviewer (COORD, MANAGER, ADMIN_HO, SUPER_ADMIN)**: Memiliki akses penuh termasuk `ManagerSidebar` dan tab **"Aksi Review"** untuk menyetujui, meminta revisi, atau menolak laporan.

## UI & Alur Pengguna

- **Route(s)**: `/dashboard`, `/dashboard/reports/new`, `/dashboard/reports/new/work-permit`, `/dashboard/reports/new/[reportType]/[formId]`
- **Alur Laporan Rutin (To-Do List)**:
  1. PIC / ES login ke SPARTA $\rightarrow$ Dashboard utama menampilkan **Banner Form Izin Kerja (SAT/FRM/MED/003)** tepat di atas **Tugas Rutin PIC (To-Do List)** sebagai pengingat kepatuhan K3/SMK3. Jika sudah memiliki izin kerja yang di-ACC Manager (`status = APPROVED`), banner berstatus aktif dan teknisi tidak perlu mengisi ulang.
  2. **Kunci Tugas Rutin (Lock / Disabled State)**: Seluruh kartu tugas dalam To-Do List berstatus terkunci (`disabled`) dan tidak dapat diklik selama ES belum memiliki Form Izin Kerja yang berstatus `APPROVED`.
  3. Setelah Form Izin Kerja disetujui (ACC Manager), kunci kartu to-do otomatis terbuka.
  4. PIC dapat memfilter tugas: **Pending**, **Mingguan**, **Bulanan**, **Selesai**, atau **Semua**, memilih kategori **Equipment** / **Ruangan**, serta mencari berdasarkan nama alat/ruangan.
  5. PIC mengklik kartu tugas yang sudah terbuka $\rightarrow$ langsung diarahkan ke form checklist terkait tanpa perlu memilih area atau ruangan secara manual (data area, ruangan, kode form, dan nama unit sudah terisi otomatis via `taskId`).
  5. Setelah PIC melengkapi item checklist dan menekan Submit, status `ChecklistTask` otomatis diperbarui menjadi `COMPLETED`, tanggal penyelesaian tercatat, dan persentase progres dashboard bertambah secara real-time.
- **Alur Laporan Non-Rutin**:
  1. ES masuk SPARTA dan klik 'Buat Laporan Baru' di bawah panel To-Do List.
  2. ES mengisi *Form Ijin Kerja* (SAT/FRM/MED/003) secara digital (Wajib / Mandatory, tanpa opsi lewati).
  3. ES memilih jalur **Checklist** atau **Perbaikan by AHO / Temuan ES**.
  4. ES memilih **Area** (misal: Branch / Office atau Warehouse).
  5. ES memilih **Ruangan** spesifik di dalam Area tersebut (ruangan sudah default dari master data Excel, tidak dapat ditambah manual oleh user).
  6. Sistem menyaring dan hanya menampilkan **Form Checklist** yang berlaku untuk ruangan tersebut berdasarkan master `RoomFormAvailability`.
  7. ES memilih **Periode** yang tersedia (Weekly, Monthly, Triwulan / Quarterly, Semester).
  8. ES mengisi checklist dan submit laporan (laporan terikat ke `areaId` dan `roomId`).
  9. Laporan masuk antrean Approval:
     - Jika 100% aman: `Coord -> Manager -> Selesai`
     - Jika ada kerusakan: `Coord -> Manager -> Requester -> Input PB/PJU -> Selesai`

- **Alur Penyelesaian Laporan & Halaman Sukses (Completion Screen)**:
  Setelah pengisian form checklist (baik kondisi normal tanpa perbaikan maupun setelah melengkapi form tindak lanjut 014 / 065), sistem menampilkan halaman konfirmasi penyelesaian (`ReportCompletionSuccess`) dan tidak me-redirect pengguna secara mendadak ke tabel `/dashboard/reports`:
  1. **Laporan Rutin (To-Do List Task)**:
     - Badge & Judul: `Checklist Rutin Selesai` • *"Tugas Checklist Rutin Berhasil Diselesaikan!"*
     - Notifikasi bahwa kartu to-do list otomatis ditandai `COMPLETED` dan laporan masuk antrean approval Coordinator.
     - Tombol Navigasi Utama: *"Kembali ke To-Do List"* (`/dashboard`).
  2. **Laporan Non-Rutin (Insidental / Buat Laporan)**:
     - Badge & Judul: `Laporan Non-Rutin Berhasil Disimpan` • *"Laporan Non-Rutin Berhasil Disimpan!"*
     - Notifikasi bahwa laporan non-rutin telah dicatat dan diteruskan ke antrean approval Coordinator.
     - Tombol Navigasi Utama: *"Kembali ke Dashboard"* (`/dashboard`).
  3. **Ringkasan Informasi Laporan**:
     - Nomor Laporan (`reportCode`), status `Menunggu Review Coord`, objek/lokasi, cabang, dan waktu submit.
     - Informasi form tindak lanjut (total estimasi biaya Form 014 atau jumlah spare part Form 065, atau indikator kondisi baik tanpa biaya).
     - Tombol aksi tunggal: Tombol utama *"Kembali ke To-Do List"* (atau *"Kembali ke Dashboard"*). Tombol detail laporan ditiadakan agar teknisi langsung kembali melanjutkan tugas berikutnya.

## Data & API

- Model utama yang dibutuhkan: `ChecklistReport`, `ChecklistItem`, `Area`, `Room`, `RoomFormAvailability`, `User`.
- Status approval: `PENDING_COORD`, `PENDING_MANAGER`, `PENDING_REQUESTER`, `COMPLETED`, `REJECTED`.
- Periode Checklist (`ChecklistPeriod`): `WEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMESTER`.
*(Detail field didokumentasikan di `docs/01_Architecture/10_Data_Models.md`)*

## Form Checklist Tersedia

Saat ini terdapat 10 jenis form utama yang didigitalkan untuk Checklist & Perbaikan:
1. **FRM_TSM_001** (Checklist Test ATS & Pemantauan Genset - SAT/FRM/TSM/001_Rev_000_211022)
2. **FRM_TSM_002** (Genset / Warehouse)
3. **FRM_TSM_003** (Checklist Ruangan)
4. **FRM_TSM_004** (Pemakaian Daya/KWH)
5. **FRM_TSM_005** (Pompa Air)
6. **FRM_TS_016** (Checklist Pallet Mover Monthly - SAT/FRM/TS/016_Rev: 02_161020)
7. **FRM_TSM_006** (Checklist Hydrant - SAT/FRM/TSM/006_Rev_000_261022)
8. **FRM_TS_062** (Checklist Hand Pallet Monthly - SAT/FRM/TS/062_Rev : 00_161020)
9. **FRM_TSM_007** (Checklist Pemeliharaan PLTS - SAT/FRM/TSM/007_Rev_000_111122)
10. **FRM_TS_043** (Checklist Forklift Weekly - SAT/FRM/TS/043_Rev : 01_161020)
11. **FRM_TS_045** (Checklist Pallet Mover Weekly - SAT/FRM/TS/045_Rev : 01_161020)
12. **FRM_TS_029** (Checklist Forklift Monthly - SAT/FRM/TS/029_Rev : 02_161020)
13. **FRM_TS_041** (Checklist Conveyor - SAT/FRM/TS/041_Rev:01_161020)
14. **FRM_TS_063** (Checklist Exhaust Fan - SAT/FRM/TS/063_Rev:00_161020)
15. **FRM_TS_028** (Checklist Baterai Forklift & Pallet Mover - SAT/FRM/TS/028_Rev:002_161020)
16. **FRM_MED_003** (Form Izin Kerja - SAT/FRM/MED/003_Rev:000_180225) - **Mandatory**


### Form FRM_TSM_001: Pemantauan Penggunaan Genset dan Test Fungsi ATS
- **Identitas Genset**: Cabang (`branch`), Merk Genset (`merk`), Kapasitas (`kva`), dan Periode Bulan (`bulan`).
- **Log Pengoperasian Mesin (Running Log)**:
  - Tipe Operasional: `Pemanasan` / `Pemadaman` / `Test ATS`.
  - Waktu Engine: `start` & `off` (jam:menit).
  - Hour Meter: `start` & `off` (angka pembacaan).
  - Parameter: Charger Alternator (Volt), Frekuensi (Hz), Tekanan Oli / Oil Pressure (Kpa).
  - Tegangan 3 Phase: `R-S`, `S-T`, `T-R` (Volt).
  - Tegangan Single Phase: `R-N`, `S-N`, `T-N` (Volt).
  - Beban Arus (Load Ampere): `R`, `S`, `T` (A).
  - Konsumsi BBM Solar: `fuelConsumption` (Liter).
- **Pengujian Khusus Sistem ATS**:
  - Status Sistem ATS: `OK` / `NOK` (dengan opsi upload foto & tindak lanjut jika NOK).
  - Tegangan Aki saat Charge: `voltageBatteryCharge` (Volt).
  - Tegangan Aki saat Load Start: `voltageBatteryLoadStart` (Volt).
  - Durasi Perpindahan Beban PLN ke Genset: `transferDuration` (Menit/Detik, batas maksimal SOP 5 menit).
- **Catatan & Keterangan**: Catatan kondisi operasional menyeluruh dan disposisi review coordinator & manager.

### Form FRM_TS_016: Monthly Checklist Pallet Mover
- **Metadata Unit**: Nomor Unit/Serial (`unitNo`), Merk Unit (`unitBrand`), Jam Kerja Alat (`hourMeter`).
- **12 Kategori Komponen (~41 item pengecekan)**:
  1. Interview User (`In`)
  2. Hour Meter 1 (travel) (`W`)
  3. Body & Structure (`Ch&A`, `Ch`, `Ch&C`)
  4. Drive Unit (`Ch`, `Ch&A`, `Ch&Cl`)
  5. Wheel (`Ch&A`)
  6. Steering / Controller Shaft (`Ch`)
  7. Hydraulics (`Ch&A`, `Ch&Cl`)
  8. Safety Foots Pad (`Ch&A`, `Ch`)
  9. Safety Gate (`Ch`)
  10. Load Lifting & Hoist Frame (`Ch&L`)
  11. Electrical System (`Ch`)
  12. Functional Test (`Td`)
- **Tindakan Lapangan**: Setiap item menampilkan badge cara tindakan (`In`, `W`, `Ch`, `A`, `Cl`, `L`, `Td`).
- **Opsi Kondisi**: `BAIK` (OK) dan `RUSAK` (NOK). Item yang rusak wajib foto bukti, penanggung jawab, catatan, dan pilihan form tindak lanjut (`FRM_TS_065` / `FRM_TSM_014` / `REPAIR_TANPA_BIAYA`).

### Form FRM_TS_029: Monthly Checklist Forklift (SAT/FRM/TS/029_Rev : 02_161020)
- **Dasar SOP**: SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH.
- **Identitas & Metadata**:
  - `Lokasi`: Area/Gudang operasional forklift.
  - `No. Unit / Serial`: Nomor identifikasi atau serial number unit (misal `FL-01`).
  - `Merk Unit`: Merk unit forklift (misal `Toyota`, `Nichiyu`, `TCM`).
  - `Hour Meter 1 (travel)`: Nilai pembacaan HM travel pada saat inspeksi.
  - `Periode / Bulan`: Periode bulanan pelaksanaan (Jan s/d Des).
- **12 Kategori Komponen (~45 item pemeriksaan)**:
  1. Interview User (`In`)
  2. Hour Meter 1 (travel) (`W`)
  3. Body & Structure (`Ch&A`, `Ch`, `Ch&C`)
  4. Drive Unit (`Ch`, `Ch&A`, `Ch&Cl`)
  5. Wheels (`Ch&A`)
  6. Steering Control (`Ch`)
  7. Hydraulics (`Ch&A`, `Ch&Cl`, `Ch`)
  8. Standing & Seating Platform (`Ch&A`, `Ch`, `Ch&Cl`)
  9. Mast Assembly (`Ch&L`, `Ch&A`)
  10. Electrical System (`Ch`)
  11. Functional Test (`Td`)
  12. Charger Battery (`Ch&Cl`)
- **Tindakan Lapangan**: Setiap item menampilkan kode tindakan standar (`In` = Interview, `Cl` = Clean, `W` = Write, `Td` = Test Drive, `A` = Adjust, `Ch` = Check, `L` = Lubricant).
- **Opsi Kondisi & Temuan Kerusakan**:
  - Tombol pilihan kondisi: `Baik (V)`, `Rusak (X)`, `Repair (R)`, dan `Tidak Ada (T)`.
  - Khusus item Rusak / Repair: Wajib bukti foto kamera ber-watermark, penanggung jawab (Internal BES / Vendor Eksternal), dan dokumen tindak lanjut (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, atau `Repair Tanpa Biaya`).
- **Sinkronisasi Dokumen & PDF**:
  - Ekspor PDF menyertakan NRA resmi `NRA : SAT/FRM/TS/029_Rev : 02_161020`, REF NRA `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`, galeri bukti foto dokumentasi lapangan, dan 3 kolom tanda tangan bertingkat.

### Form FRM_TS_022: Checklist Genset (SAT/FRM/TS/022_Rev : 01_161020)
- **Dasar SOP**: SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH.
- **Identitas & Metadata**:
  - `Branch / Area`: Lokasi branch atau area penempatan unit genset.
  - `Tgl Pengecekan`: Tanggal pelaksanaan inspeksi genset.
  - `Merk`: Merk unit mesin genset (misal `Cummins`, `Perkins`, `Yanmar`, `CAT`).
  - `Model`: Model unit genset (misal `Silent Type 150 kVA`, `Open Type`).
  - `kVa`: Kapasitas daya genset (misal `150 kVa`, `250 kVa`).
  - `Catatan Umum`: Catatan kondisi mesin dan operasional genset saat inspeksi.
- **12 Kategori Komponen & Pemeriksaan**:
  1. `OIL LEVEL`: A. Check level oli, B. Check kekentalan oli.
  2. `FUEL SYSTEM`: A. Check level tangki bahan bakar, B. Check leaks (selang/pipa).
  3. `AIR CLEANER INDICATOR`: A. Check air cleaner indicator.
  4. `BELTS`: A. Check keretakan & tegangan tali kipas.
  5. `COOLING SYSTEM`: A. Check coolant level.
  6. `BATTERIES`: A. Check level air accu, B. Check PH air accu, C. Clean terminal battery, D. Check voltage.
  7. `GENERATOR`: A. Check & clean.
  8. `CONTROL PANEL`: A. Check meter reading (Amp, Voltage, etc) & wiring.
  9. `WARMING UP GENSET`: A. Time duration 10 minute.
  10. `CHECK VOLTAGE BATTERY / ONLOAD`: A. 24 Volt (Min 20 Volt) / 12 Volt (Min 10 Volt).
  11. `TEST ATS SYSTEM`: A. Simulasi listrik PLN Padam.
  12. `AROUND INSPECTION`: A. Inspect engine, radiator, etc.
- **Opsi Kondisi & Kode Tindak Lanjut**:
  - Pilihan kondisi: `Baik (V)` (Ok) dan `Rusak (X)` (Not good), serta `Tidak Ada (T)`.
  - Khusus item Rusak (`X`):
    - **Kode Tindak Lanjut (SOP TS/011)**: Pilihan tombol `A` (Adjust or Add), `C` (Clean), `R` (Repair), `U` (Urgent).
    - **Penanggung Jawab (AKAN DIHANDLE)**: Segmented control konsisten `BES` (Internal) atau `Eksternal` (Vendor).
    - **Dokumen Tindak Lanjut**: Pilihan Select standar (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, atau `Repair Tanpa Biaya`).
    - **Keterangan / Catatan**: Textarea catatan temuan kerusakan & gejala.
    - **Foto Bukti**: Upload foto kamera ber-watermark dengan thumbnail galeri 80x80, tombol hapus, dan modal lightbox preview.
- **Sinkronisasi Dokumen & PDF**:
  - Menyertakan NRA `SAT/FRM/TS/022_Rev : 01_161020`, REF NRA `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`, 12 kategori pemeriksaan, galeri foto temuan, dan 3 kolom approval berjenjang (Dibuat Oleh: Branch Engineering Support, Diketahui oleh: Branch Engineering Coordinator, Diperiksa Oleh: Branch Building & Maintenance Manager).

### Form FRM_TSM_013: Checklist Perawatan Peralatan Water Recycle (SAT/FRM/TSM/013_Rev_000_100123)
- **Dasar Kebijakan**: SAT/KEB/TSM/007 Kebijakan Perawatan Peralatan Water Recycle Branch/Depo/Bulky.
- **Identitas & Metadata**:
  - `Lokasi`: Branch / Depo / Bulky.
  - `Kode Lokasi`: Kode lokasi fasilitas (misal `JZ01`).
  - `Tahun & Bulan`: Periode kalender pelaksanaan inspeksi (Januari s/d Desember).
  - `Tgl Pengecekan`: Tanggal pelaksanaan inspeksi.
  - `Catatan Standar Dosis Kimia`: Panduan pemakaian bahan kimia tercantum pada header (`Pemakaian Tawas 1 kg / 1 m³` & `Pemakaian Kaporit 1 kg / 1 m³`).
- **3 Kategori Komponen & 15 Item Pemeriksaan**:
  1. **Konstruksi / Sipil & Filtrasi (10 Item)**:
     - `Ruang Filterisasi` (Kondisi: bersih/tidak bocor, Kegiatan: Cek/Kuras).
     - `Material Filter Ijuk` (Kondisi: bersih/tidak berlumut/tidak tersumbat, Kegiatan: Cek/Ganti).
     - `Material Filter Arang` (Kondisi: bersih/tidak berlumut/tidak tersumbat, Kegiatan: Cek/Ganti).
     - `Material Filter Batu Koral` (Kondisi: bersih/tidak berlumut/tidak tersumbat, Kegiatan: Cek/Ganti).
     - `Ground Tank` (Kondisi: bersih/tidak berlumut/tidak bocor, Kegiatan: Cek/Kuras).
     - `Toren / Tandon Air` (Kondisi: bersih/tidak berlumut/tidak bocor, Kegiatan: Cek/Kuras).
     - `Rangka Dudukan Toren / Tandon` (Kondisi: tidak berkarat/tidak patah, Kegiatan: Cek).
     - `Instalasi Pipa` (Kondisi: tidak bocor/tidak pecah/tidak tersumbat, Kegiatan: Cek).
     - `Stop Kran` (Kondisi: tidak patah/tidak pecah/tidak tersumbat, Kegiatan: Cek).
     - `Selang + Jet Shower + Kran` (Kondisi: tidak bocor/tidak patah/tidak tersumbat, Kegiatan: Cek).
  2. **Mekanikal & Elektrikal (4 Item)**:
     - `Pompa Air` (Kondisi: hidup dan berfungsi, Kegiatan: Tes).
     - `Automatis Pompa / Radar` (Kondisi: tidak pecah/tidak patah/tidak terbakar, Kegiatan: Tes).
     - `Instalasi Listrik` (Kondisi: tidak terbakar/tidak putus/tidak konslet, Kegiatan: Cek).
     - `Meteran Air` (Kondisi: berfungsi + angka terbaca, Kegiatan: Catat; dilengkapi input angka pembacaan meter / m³).
  3. **Chemical Treatment (1 Item)**:
     - `Tawas + Kaporite (Ratio 1:1)` (Kondisi: Pada keranjang jangan sampai habis, tambah bila perlu; Kegiatan: Cek/Ganti).
- **Opsi Kondisi & Kode Evaluasi**:
  - `V` : OK (Baik).
  - `X` : Nok / Rusak (Wajib mengisi section tindak lanjut temuan kerusakan).
  - Opsi tindakan spesifik perawatan: `Kuras` (pada tangki & ruang filter), `Ganti` (pada media filter & chemical), `Tes` (pada pompa & radar), `Catat` (pada meteran air).
- **Standar Penanganan Temuan Kerusakan (saat Nok/X dipilih)**:
  - Penanggung Jawab (AKAN DIHANDLE): Segmented button `BES` (Internal) vs `Eksternal`.
  - Foto Bukti: Kamera ber-watermark otomatis `(Water Recycle - {Area})` + thumbnail 80x80 dengan floating delete & lightbox preview modal.
  - Dokumen Tindak Lanjut: Dropdown Select standar (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, `Repair Tanpa Biaya`).
  - Catatan Kerusakan & Gejala: Textarea terstruktur.
- **Sinkronisasi Dokumen & PDF**:
  - Menyertakan NRA `SAT/FRM/TSM/013_Rev_000_100123`, REF NRA `SAT/KEB/TSM/007 Kebijakan Perawatan Peralatan Water Recycle Branch/Depo/Bulky`, 15 item inspeksi, catatan dosis kimia, foto temuan ber-watermark, dan 3 kolom approval bertingkat (Pelaksana: Branch ES, Diketahui: Branch ES Coord, Disetujui: Branch B&M Mgr).

### Form FRM_TSM_006: Checklist Hydrant (SAT/FRM/TSM/006_Rev_000_261022)
- **Dasar Kebijakan**: SAT/KEB/TSM/002 Kebijakan Perawatan Hydrant.
- **Identitas & Metadata**:
  - Baris 1: `Jenis Hydrant` (input teks, default `IHB - OHB`) & `Periode / Tahun` (`periodKey`, mis. `2026`).
  - Baris 2: Dropdown `Jenis Perawatan` (`GENERAL_MINGGUAN`, `BULANAN`, `ENAM_BULANAN`).
- **Logika Visibilitas Dinamis (Default Hidden)**:
  - Sebelum `Jenis Perawatan` dipilih, seluruh 12 kategori checklist disembunyikan (*default hidden*).
  - **General Mingguan**: Menampilkan sub-selector radio button `Mgg 1`, `Mgg 2`, `Mgg 3`, `Mgg 4` dengan rentang tanggal kalender nyata (berdasarkan bulan dan tahun aktif). Minggu yang sudah lewat otomatis terkunci (*disabled*), dan hanya menampilkan **Kategori 1** (5 item).
  - **Bulanan**: Menampilkan **Kategori 2 s/d 11** (47 item: kondisi panel, indikator, kabel, diesel, pemipaan, valve, pompa, reservoir).
  - **6 Bulanan**: Menampilkan sub-selector radio button `Semester 1` (Jan - Jun) dan `Semester 2` (Jul - Des), dan hanya menampilkan **Kategori 12** (9 item: uji tekanan aktual).
- **Tindakan Lapangan**: Menampilkan badge cara tindakan (`CH` = Check, `CL` = Clean, `INSP` = Inspeksi/Ukur, `DO IT` = Laksanakan, `MS` = Make Sure, `R` = Ready).
- **Opsi Kondisi & Temuan Kerusakan**:
  - Tombol `Baik` (OK) dan `Rusak` (NOK).
  - Khusus item yang Rusak: Wajib bukti foto kamera ber-watermark, penanggung jawab (BES/Eksternal), dan dropdown form tindak lanjut (`SAT/FRM/TSM/014`, `SAT/FRM/TS/065`, atau `Tanpa Biaya`).
  - Khusus item 5.I & 5.J (*Volted battery 1 & 2*): Disediakan field input nilai voltase (Volt).
- **Catatan & Approval**: Catatan umum pelaksanaan operasional hydrant dan tanda tangan digital pelaksana (Branch ES).

### Form FRM_TS_062: Checklist Hand Pallet Monthly (SAT/FRM/TS/062_Rev : 00_161020)
- **Dasar SOP**: SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH.
- **Identitas & Metadata**:
  - `Lokasi`: Area/Gudang tempat Hand Pallet berada.
  - `No. Unit / Serial`: Nomor identifikasi atau nomor seri unit Hand Pallet (misal `HP-01`).
  - `Merk Unit`: Merk unit Hand Pallet (misal `Krisbow`, `OPK`, `Bishamon`).
  - `Periode / Bulan`: Periode bulanan pelaksanaan (Jan s/d Des).
- **Struktur Kategori & 19 Item Pemeriksaan**:
  1. **1. NOMOR USER / IDENTITY UNIT** (1 item: `hp_identity_unit`, Tindakan: `Ch&Cl`)
  2. **2. PAINTING CONDITION** (1 item: `hp_painting_condition`, Tindakan: `Ch`)
  3. **3. BODY & STRUCTURE** (8 item: Bolted Connection, Fork, Handle, Shaft AS, Bushing, Pin Shaft, Linkage, Lubricant; Tindakan: `Ch`)
  4. **4. WHEELS** (3 item: Drive wheel, Load wheel, Roller exit; Tindakan: `Ch&Cl`)
  5. **5. HYDRAULICS** (5 item: Oil level, Oil leaks, Seal RAM, Seal Pump, Seal Control; Tindakan: `Ch`)
  6. **6. FUNCTIONAL TEST** (1 item: Operational Test Onload, Tindakan: `Td`)
- **Tindakan Lapangan**:
  - `Ch`: Check
  - `Cl`: Clean
  - `Td`: Test drive
- **Opsi Kondisi & Temuan Kerusakan (Standar Form 016)**:
  - Pilihan kondisi: `Baik (V)` dan `Rusak (X)`.
  - Item card selalu putih bersih (`bg-white border rounded-xl`).
  - Khusus item yang Rusak: Wajib bukti foto kamera ber-watermark otomatis, penanggung jawab (`BES` / `Eksternal`), dan dropdown form tindak lanjut (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, `REPAIR_TANPA_BIAYA`).
- **Approval & Verifikasi**:
  - Dibuat oleh: Br Engineering Support
  - Diperiksa oleh: Br Engineering Coord
  - Disetujui oleh: Br Building & Maintenance Mgr

### Form FRM_TS_064: Checklist Table Lifter Monthly (SAT/FRM/TS/064_Rev : 00_161020)
- **Dasar SOP**: SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH.
- **Identitas & Metadata**:
  - `Lokasi`: Area/Lokasi penempatan unit Table Lifter di warehouse.
  - `No. Unit / Serial`: Nomor identifikasi atau nomor seri unit Table Lifter (misal `TL-01`).
  - `Merk Unit`: Merk unit Table Lifter (misal `Bishamon`, `OPK`, `Noblelift`).
  - `Tanggal Pengecekan`: Tanggal pelaksanaan inspeksi.
  - `Periode / Bulan`: Periode bulanan pelaksanaan (Januari s/d Desember).
  - `Catatan Umum`: Catatan operasional keseluruhan unit.
- **Struktur 6 Kategori & 19 Item Pemeriksaan**:
  1. **1. NOMOR IDENTITY UNIT (1 item)**:
     - `Nomor Identity Unit` (Tindakan: `Ch & Cl` — Check & Clean)
  2. **2. PAINTING CONDITION (1 item)**:
     - `Painting Condition` (Tindakan: `Ch & Cl` — Check & Clean)
  3. **3. BODY & STRUCTURE (6 item)**:
     - `A. Bolted Connection & mounting secure` (Tindakan: `Ch & Cl`)
     - `B. Table Load Condition` (Tindakan: `Ch` — Check)
     - `C. Vertical Pantograph` (Tindakan: `Ch` — Check)
     - `D. Shaft pantograph` (Tindakan: `Ch` — Check)
     - `E. Bushing & Bearing Pantograph` (Tindakan: `Ch & L` — Check & Lubricant)
     - `F. Gutter / Housing condition` (Tindakan: `Ch & Cl`)
  4. **4. ELECTRICAL CONDITION (4 item)**:
     - `A. Panel condition` (Tindakan: `Ch & Cl`)
     - `B. Electrical connection` (Tindakan: `Ch` — Check)
     - `C. Switch button` (Tindakan: `Ch` — Check)
     - `D. Electric motor pump condition` (Tindakan: `Ch & Cl`)
  5. **5. HYDRAULICS (7 item)**:
     - `A. Oil Level Reservoir` (Tindakan: `Ch` — Check)
     - `B. Oil leaks` (Tindakan: `Ch` — Check)
     - `C. Seal & piston RAM` (Tindakan: `Ch` — Check)
     - `D. Seal Shaft Hydraulic Pump` (Tindakan: `Ch` — Check)
     - `E. Shaft & Coupling Connection` (Tindakan: `Ch` — Check)
     - `F. Hose hydraulic Connection` (Tindakan: `Ch` — Check)
     - `G. Cylinder RAM condition` (Tindakan: `Ch` — Check)
  6. **6. FUNCTIONAL TEST (1 item)**:
     - `A. Operational Test Onload` (Tindakan: `Tr` — Test Running)
- **Tindakan Lapangan**:
  - `Ch`: Check
  - `Cl`: Clean
  - `L`: Lubricant
  - `Tr`: Test Running
- **Opsi Kondisi & Temuan Kerusakan (Standar Equipment)**:
  - Pilihan kondisi: `Baik (V)` (OK) dan `Rusak (X)` (NOK).
  - Khusus item yang Rusak: Wajib bukti foto kamera ber-watermark otomatis `(Table Lifter - {No. Unit})`, penanggung jawab (`BES` / `Eksternal`), catatan kerusakan, dan dropdown form tindak lanjut (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, `REPAIR_TANPA_BIAYA`).
- **Approval & Verifikasi**:
  - Dibuat oleh: Branch Maintenance Support
  - Diperiksa oleh: Branch Maintenance Coordinator
  - Disetujui oleh: Branch Building & Maintenance Manager
- **Sinkronisasi Dokumen & PDF**:
  - Menyertakan NRA `SAT/FRM/TS/064_Rev : 00_161020`, REF NRA `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`, tanda watermark "INTERNAL USE ONLY", galeri foto bukti, dan 3 kolom approval bertingkat.

### Form FRM_TS_063: Checklist Exhaust Fan (SAT/FRM/TS/063_Rev : 00_161020)
- **Dasar Kebijakan**: SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH.
- **Identitas & Metadata**:
  - `Lokasi`: Area/Ruangan tempat unit Exhaust Fan terpasang (misal: `Area Charger Battery`, `Gudang Bulky`).
  - `No. Unit / Serial`: Nomor registrasi/unit unit exhaust fan (misal: `EF-01`).
  - `Merk Unit`: Brand/pabrikan unit exhaust fan (misal: `KDK`, `CKE`, `Kruger`).
  - `Tahun`: Tahun pelaksanaan inspeksi berkala (misal `2026`).
  - `Periode / Bulan`: Periode bulanan pelaksanaan (`Januari` s/d `Desember`).
- **Struktur 4 Kategori & 14 Item Pemeriksaan**:
  1. **1. NOMOR IDENTITY UNIT (1 item)**:
     - `1. Nomor Identity Unit` (Tindakan: `Ch` — Check)
  2. **2. PAINTING CONDITION (1 item)**:
     - `2. Painting Condition` (Tindakan: `Ch` — Check)
  3. **3. ALL CONDITION (11 item)**:
     - `A. Electrical & Conection` (Tindakan: `Ch` — Check)
     - `B. Mounting & Frame Motor` (Tindakan: `Ch&Cl` — Check & Clean)
     - `C. Motor Electric` (Tindakan: `Ch&Cl` — Check & Clean)
     - `D. Fan Blade & shaft` (Tindakan: `Ch&Cl` — Check & Clean)
     - `E. Bearing & Lubricant` (Tindakan: `Ch` — Check)
     - `F. Fan Belt Conection ( optional )` (Tindakan: `Adj` — Adjust)
     - `G. Pully Conection` (Tindakan: `Ch` — Check)
     - `H. Lubricant` (Tindakan: `Ch` — Check)
     - `I. Speed Condition` (Tindakan: `Ch` — Check)
     - `J. Front Grill Protection` (Tindakan: `Ch&Cl` — Check & Clean)
     - `K. Back swing protection` (Tindakan: `Ch&Cl` — Check & Clean)
  4. **4. OPERATIONAL TEST (1 item)**:
     - `A. Operational Test Runing` (Tindakan: `Tr` — Test Running)
- **Tindakan Lapangan**:
  - `Ch`: Check (Pemeriksaan fisik/visual)
  - `Cl`: Clean (Pembersihan)
  - `Ch&Cl`: Check & Clean (Pemeriksaan dan Pembersihan)
  - `Adj`: Adjust (Penyetelan)
  - `Tr`: Test Running (Uji coba operasional putaran kipas)
- **Opsi Kondisi & Temuan Kerusakan (Standar Equipment)**:
  - Pilihan kondisi: `Baik (V)` dan `Rusak (X)`.
  - Khusus item yang Rusak: Wajib bukti foto kamera ber-watermark otomatis `({Lokasi} - Exhaust Fan {No. Unit})`, penanggung jawab (`BES` / `Eksternal`), catatan temuan kerusakan, dan dropdown form tindak lanjut (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, `REPAIR_TANPA_BIAYA`).
- **Approval & Verifikasi**:
  - Dibuat oleh: Branch Maintenance Support
  - Diperiksa oleh: Branch Maintenance Coordinator
  - Disetujui oleh: Branch Building & Maintenance Manager
- **Sinkronisasi Dokumen & PDF**:
  - Menyertakan NRA `SAT/FRM/TS/063_Rev : 00_161020`, REF NRA `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`, tanda watermark "INTERNAL USE ONLY", galeri foto bukti, dan 3 kolom approval bertingkat.

### Form FRM_TS_041: Checklist Conveyor (SAT/FRM/TS/041_Rev:01_161020)
- **Dasar SOP**: SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH.
- **Divisi & Departemen**: Division : Property & Small Business Development | Departemen : Building & Maintenance.
- **Identitas & Metadata**:
  - `Warehouse`: Nama gudang / area penempatan unit conveyor (misal `WH Balaraja`).
  - `Tgl Pengecekan`: Tanggal mulai pelaksanaan inspeksi conveyor.
  - `Tgl Selesai`: Tanggal selesai checklist conveyor.
  - `Periode / Bulan`: Periode checklist bulanan (`MONTHLY`).
  - `Catatan Tambahan (Note)`: Catatan umum hasil pemeriksaan operasional conveyor.
- **Struktur 11 Kategori & 66 Item Pemeriksaan**:
  1. **1. MOTOR AC ( TANGENTIAL CHAIN) (5 item)**:
     - `A. Bolted connection - Check & mounting Secure`
     - `B. Gear & chain - Condition`
     - `B. Gear & chain - Clean & lubricate`
     - `C. Roller active & free roller`
     - `D. Main switch - Operation & condition`
  2. **2. MOTOR AC ( TEETHBELT) (4 item)**:
     - `A. Bolted connection - Check & mounting Secure`
     - `B. Pulley & teethbelt condition`
     - `C. Rolleractive - Check & Cleaning`
     - `D. Main switch - Operation & condition`
  3. **3. MOTOR DC (8 item)**:
     - `A. Operation & function - Check & clean`
     - `B. Bolted connection - Check & mounting Secure`
     - `C. Driver card - Check & mounting Secure`
     - `C. Driver card - Operation & function`
     - `C. Driver card - Check & clean`
     - `D. Jungtion box panel - Power suply condition`
     - `D. Jungtion box panel - Check & Cleaning`
     - `D. Jungtion box panel - Cooling fan check & clean`
  4. **4. EMPTY CASE CONVEYOR (6 item)**:
     - `A. Driveunit (Motor AC) - Check & mounting Secure`
     - `B. Plain chain - Check & clean`
     - `C. Guiderail - Check & mounting Secure`
     - `D. Mainswitch - Operation & condition`
     - `E. Push Button Switch Condition`
     - `F. Emergency Switch Condition`
  5. **5. BELT INCLINE/BELTSPIRAL (4 item)**:
     - `A. Motor AC - Operation & condition`
     - `A. Motor AC - Check & clean`
     - `B. Belt - Operation & condition`
     - `B. Belt - Check & clean`
  6. **6. DECLINESPIRAL (3 item)**:
     - `A. Guiderail - Check & mounting Secure`
     - `B. Sliderail - Check & mounting Secure`
     - `C. Roller gravity - Check & mounting Secure`
  7. **7. MAIN PANEL (11 item)**:
     - `A. Contactor, Circuit Breaker, Relay - Operation & condition`
     - `B. Inverter - Operation & condition`
     - `C. Power Suply condition`
     - `D. PLC condition`
     - `E. Condition, connection - Powercable`
     - `E. Condition, connection - All wiring cable`
     - `E. Condition, connection - All wiring connectors`
     - `F. Cooling fan`
     - `G. Push Button Switch Condition`
     - `H. Emergency Switch Condition`
     - `I. Interactive Display - Operation & condition`
  8. **8. SORTINGSYSTEM (11 item)**:
     - `A. Stopper - Bolted connection`
     - `A. Stopper - Mounting secure`
     - `B. Chaintransfer / popup - Operation & condition`
     - `B. Chaintransfer / popup - Mounting secure`
     - `C. Motor chain transfer / motor pop up - Operation & condition`
     - `C. Motor chain transfer / motor pop up - Mounting secure`
     - `D. Solenoid valve - Operation & condition`
     - `D. Solenoid valve - Check & clean`
     - `D. Solenoid valve - Mounting secure`
     - `E. Foto Cell - Operation & function`
     - `F. Magnetic Switch - Operation & function`
  9. **9. DISTANCESYSTEM (4 item)**:
     - `A. Sensor & reflector - Operation & condition`
     - `A. Sensor & reflector - Mounting secure`
     - `B. Barcode scanner - Operation & condition`
     - `B. Barcode scanner - Mounting secure`
  10. **10. LIFTUPGATE (4 item)**:
      - `A. Bolted connection - Check & mounting Secure`
      - `B. Polycord Condition`
      - `C. Foto Cell - Operation & function`
      - `D. Roller active - Check & clean`
  11. **11. AIRCOMPRESOR (6 item)**:
      - `A. Check Oil Leak`
      - `B. Check Air Leak`
      - `C. Check Motor Condition`
      - `D. Check Vbelt Condition`
      - `E. Water parging`
      - `F. Check Air Pressure`
- **Keterangan Kondisi & Opsi Tindakan**:
  - `V`: OK (Kondisi Baik)
  - `X`: Not Good (Rusak / NOK)
  - `A`: Adjust (Penyetelan)
  - `R`: Repair (Perbaikan)
  - `U`: Urgent (Mendesak)
  - `N`: None (Tidak Ada)
- **Penanganan Kondisi Rusak / Not Good (X)**:
  - Pelaporan temuan kerusakan wajib menyertakan foto bukti kamera ber-watermark otomatis `({Warehouse} - Conveyor)`, penanggung jawab (`BES` / `Eksternal`), catatan kerusakan, dan formulir tindak lanjut (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, atau `REPAIR_TANPA_BIAYA`).
- **Approval & Verifikasi**:
  - Dibuat oleh: Br. Technical Support
  - Diperiksa oleh: Br. Coord TS
  - Disetujui oleh: Br. B&M Mgr
- **Sinkronisasi Dokumen & PDF**:
  - Menyertakan NRA `SAT/FRM/TS/041_Rev:01_161020`, REF NRA `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`, tanda watermark "INTERNAL USE ONLY", galeri foto bukti, dan 3 kolom approval bertingkat.

### Form FRM_TSM_008: Checklist Perawatan Peralatan Unit Sewa di Warehouse/Depo/Bulky (SAT/FRM/TSM/008_Rev_000_111122)
- **Dasar Kebijakan**: SAT/KEB/TSM/004 Kebijakan Pemeliharaan Peralatan Unit Sewa di Warehouse/Depo/Bulky.
- **Identitas & Metadata**:
  - `Lokasi`: Area/Lokasi penempatan peralatan unit sewa di warehouse/depo/bulky (misal `Balaraja / Area Charger Battery`).
  - `Nama dan jenis unit`: Nama & jenis unit peralatan sewa (default: `Forklift / Reach truck`).
  - `Tahun`: Tahun pelaksanaan inspeksi berkala (misal `2026`).
  - `Periode / Bulan`: Periode bulanan pelaksanaan (`Januari` s/d `Desember`).
  - `Catatan Temuan`: Catatan kerusakan dicatat per-item pada rincian temuan kerusakan (misal: *Point 2.A: Lapisan roda mengelupas*).
- **Struktur 9 Kategori & 23 Item Pemeriksaan**:
  1. **1. LOAD WHEEL (3 item)**:
     - `A. Cek kondisi Permukaan lapisan roda` (Tindakan: `CH` — Check)
     - `B. Cek dan bersihkan AS roda dari tali plastik dan sampah` (Tindakan: `CL` — Clean)
     - `C. Cek kondisi bearing pada roda` (Tindakan: `CH` — Check)
  2. **2. DRIVE WHEEL (3 item)**:
     - `A. Cek kondisi Permukaan lapisan roda` (Tindakan: `CH` — Check)
     - `B. Cek dan bersihkan AS roda dari tali plastik dan sampah` (Tindakan: `CL` — Clean)
     - `C. Cek kondisi bearing pada roda` (Tindakan: `CH` — Check)
  3. **3. CASTER WHEEL (3 item)**:
     - `A. Cek kondisi Permukaan lapisan roda` (Tindakan: `CH` — Check)
     - `B. Cek dan bersihkan AS roda dari tali plastik dan sampah` (Tindakan: `CL` — Clean)
     - `C. Cek kondisi bearing pada roda` (Tindakan: `CH` — Check)
  4. **4. SUPPORTING WHEEL (3 item)**:
     - `A. Cek kondisi Permukaan lapisan roda` (Tindakan: `CH` — Check)
     - `B. Cek dan bersihkan AS roda dari tali plastik dan sampah` (Tindakan: `CL` — Clean)
     - `C. Cek kondisi bearing pada roda` (Tindakan: `CH` — Check)
  5. **5. RUANG KEMUDI (3 item)**:
     - `A. Cek kebersihan ruang kemudi` (Tindakan: `CH` — Check)
     - `B. Cek kebersihan panel monitor` (Tindakan: `CH` — Check)
     - `C. Cek kondisi system keamanan dan pengendali` (Tindakan: `CH` — Check)
  6. **6. SYSTEM HYDRAULIC (2 item)**:
     - `A. Test semua fungsi hydraulic` (Tindakan: `DO IT` — Lakukan)
     - `B. Cek secara visual kebocoran oli hydraulic` (Tindakan: `CH` — Check)
  7. **7. DISPLAY MONITOR (3 item)**:
     - `A. Cek Tampilan display monitor` (Tindakan: `CH` — Check)
     - `B. Cek kode error pada display monitor` (Tindakan: `CH` — Check)
     - `C. Test performa semua fungsi unit` (Tindakan: `DO IT` — Lakukan)
  8. **8. BATTERY (2 item)**:
     - `A. Cek kebersihan kondisi battery` (Tindakan: `CH` — Check)
     - `B. Cek kondisi dan performa battery` (Tindakan: `CH` — Check)
  9. **9. CHARGER BATTERY (2 item)**:
     - `A. Cek kebersihan dan kondisi charger battery` (Tindakan: `CH` — Check)
     - `B. Cek fungsi dan performa charger battery` (Tindakan: `CH` — Check)
- **Tindakan Lapangan**:
  - `CH`: Check (Pemeriksaan fisik dan visual)
  - `CL`: Clean (Pembersihan as roda dari kotoran/tali plastik)
  - `DO IT`: Lakukan (Uji coba performa / fungsi hydraulic dan unit)
- **Opsi Kondisi & Temuan Kerusakan (Unit Sewa)**:
  - Pilihan kondisi: `Baik (V)` dan `Rusak (X)`.
  - Khusus item yang Rusak: Wajib bukti foto kamera ber-watermark otomatis `({Nama Unit} - {Kategori/Item})`, penanggung jawab (`Eksternal` / Vendor Sewa atau `BES`), catatan kerusakan (misal: *Point 2.A: Lapisan roda mengelupas, unit down sudah info dept terkait untuk diteruskan ke vendor*), dan pilihan tindak lanjut.
- **Approval & Verifikasi**:
  - Dibuat oleh: Branch Engineering Support
  - Diperiksa oleh: Branch Engineering Coordinator
  - Diketahui oleh: Branch B&M Manager
- **Sinkronisasi Dokumen & PDF**:
  - Menyertakan NRA `SAT/FRM/TSM/008_Rev_000_111122`, REF NRA `SAT/KEB/TSM/004 Kebijakan Pemeliharaan Peralatan Unit Sewa di Warehouse/Depo/Bulky`, tanda watermark "INTERNAL USE ONLY", galeri foto bukti, dan 3 kolom approval bertingkat.

### Form FRM_TSM_007: Checklist Pemeliharaan PLTS
- **Dasar Kebijakan**: SAT/KEB/TSM/003 Kebijakan Perawatan PLTS di HO/Branch/Depo.
- **Identitas & Metadata**:
  - `Daya Total PLTS`: Daya kapasitas sistem PLTS dalam satuan KWp (misal 198 KWp).
  - `Tahun`: Tahun pelaksanaan inspeksi berkala.
  - `Jenis Perawatan`: 2 opsi periode dinamis:
    - `1 (satu) Bulanan`: Kategori 1–5 (Panel Surya Atap, Panel DC Protection, Panel Inverter, Panel Combiner, Panel Communication & Modem Wi-Fi).
    - `3 (tiga) Bulanan`: Kategori 6–7 (Pembersihan Panel Surya, Jalur Kabel & Tray Metal Kabel).
- **Desain & Interaksi Form**:
  - Aksen visual konsisten menggunakan Spartan Orange (`#ff8a2a`) untuk status fokus input, button handler (`BES` / `Eksternal`), dan banner informasi periode.
  - Tinggi elemen input dan dropdown disamakan (`!h-11 h-11`) mengikuti standar formulir checklist ruangan.
  - Header kartu kategori menyajikan judul dan deskripsi ringkas tanpa perulangan badge periode frekuensi.
### Form FRM_TS_043: Checklist Forklift Weekly (SAT/FRM/TS/043_Rev : 01_161020)
- **Dasar SOP**: `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`.
- **Identitas & Metadata**:
  - `No. Unit`: Nomor unit Forklift (misal `FL-01`).
  - `Branch & Lokasi`: Terisi otomatis dari konteks (misal `BANJARMASIN / Area Charger Battery`).
  - `Bulan & Tahun`: Terisi otomatis dari kalender aktif (misal `Oktober 2026`).
  - `Sub-selector Minggu`: Ditampilkan sebagai 1 shape ringkas minggu aktif (misal `Minggu 4`) di sebelah kanan Lokasi / Ruangan tanpa teks bantuan panjang.
  - `Tanggal Pelaksanaan`: Input tanggal pelaksanaan inspeksi mingguan.
  - `Hour Meter 1 (H1)`: Input jam kerja / pembacaan hour meter unit Forklift.
- **Struktur Kategori & 21 Item Pemeriksaan**:
  1. **1. CLEANING MULTI TASK HANDLE** (1 item: `Cleaning Multi Task Handle`, Tindakan: `CL/C`)
  2. **2. CLEANING DASHBOARD** (5 item: `Acces 1`, `Acces 2`, `Acces 3`, `Acces 4`, `Distribution Panel`, Tindakan: `CL/C`)
  3. **3. CLEANING COOLING FAN** (2 item: `Cooling Fan Acces`, `Cooling Fan Motor`, Tindakan: `CL/C`)
  4. **4. CLEAN & CHECK MOTOR TRACTION** (4 item: `Mounting Secure`, `Cable Connection`, `Brake Pad Condition`, `Armatures Condition`, Tindakan: `CL/C`)
  5. **5. CLEAN & CHECK MOTOR PUMP 1** (4 item: `Mounting Secure`, `Cable Connection`, `Brushes Condition`, `Armatures Condition`, Tindakan: `CL/C`)
  6. **6. CLEAN & CHECK MOTOR PUMP 2** (4 item: `Mounting Secure`, `Cable Connection`, `Brushes Condition`, `Armatures Condition`, Tindakan: `CL/C`)
  7. **7. WHEEL (RODA)** (1 item: `Cleaning`, Tindakan: `CL/C`)
- **Tindakan Lapangan**:
  - `CL/C`: Clean & Check (Bersihkan & Periksa).
- **Opsi Kondisi & Temuan Kerusakan (Standar Form Equipment)**:
  - Default kondisi awal seluruh item: `Baik (V)`.
  - Opsi: `Baik (V)` dan `Rusak (X)`.
  - Khusus item yang Rusak: Wajib bukti foto kamera ber-watermark otomatis, penanggung jawab (`BES` / `Eksternal`), catatan, dan form tindak lanjut 065.
- **Approval & Verifikasi**:
  - Dibuat oleh: Branch Engineering Support
  - Diperiksa oleh: Branch Engineering Coord
  - Disetujui oleh: Br Building & Maintenance Mgr

### Form FRM_TS_045: Checklist Pallet Mover Weekly (SAT/FRM/TS/045_Rev : 01_161020)
- **Dasar SOP**: `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`.
- **Identitas & Metadata**:
  - `No. Unit`: Nomor unit Pallet Mover (misal `PM-01`).
  - `Merk Unit`: Merk unit Pallet Mover (misal `Noblelift`).
  - `Branch & Lokasi`: Terisi otomatis dari konteks (misal `BANJARMASIN / Area Charger Battery` atau `Fresh Food`).
  - `Bulan & Tahun`: Terisi otomatis dari kalender aktif.
  - `Sub-selector Minggu`: Ditampilkan sebagai 1 shape ringkas minggu aktif (misal `Minggu 4`) di sebelah kanan Lokasi / Ruangan tanpa teks bantuan panjang.
  - `Tanggal Pelaksanaan`: Input tanggal pelaksanaan inspeksi mingguan.
  - `Hour Meter 1 (H1)`: Input jam kerja / pembacaan hour meter unit Pallet Mover.
- **Struktur Kategori & 12 Item Pemeriksaan (Tindakan CL/C)**:
  1. **1. CLEANING HANDLE OPERATION** (1 item: `Cleaning Handle Operation`, Tindakan: `CL/C`)
  2. **2. CLEANING ACCESS MODUL ROOM** (1 item: `Cleaning Access Modul Room`, Tindakan: `CL/C`)
  3. **3. CLEANING COOLING FAN ACCESS** (1 item: `Cleaning Cooling Fan Access`, Tindakan: `CL/C`)
  4. **4. DISTRIBUTION PANEL** (1 item: `Distribution Panel`, Tindakan: `CL/C`)
  5. **5. CLEAN & CHECK MOTOR TRACTION** (4 item: `Mounting secure`, `Cable connection`, `Brushes & Armatures Condition`, `Brake pad condition`, Tindakan: `CL/C`)
  6. **6. CLEAN & CHECK MOTOR PUMP** (3 item: `Mounting secure`, `Cable connection`, `Brushes & Armatures Condition`, Tindakan: `CL/C`)
  7. **7. WHEEL (RODA)** (1 item: `Cleaning`, Tindakan: `CL/C`)
- **Tindakan Lapangan**:
  - `CL/C`: Clean & Check (Bersihkan & Periksa).
- **Opsi Kondisi & Temuan Kerusakan**:
  - Seluruh item berstatus awal kosong (tanpa default Baik).
  - Opsi: `Baik (V)` dan `Rusak (X)`.
  - Khusus item yang Rusak: Panel temuan standar SPARTA terbuka dengan `AKAN DIHANDLE` (BES / Eksternal), `Foto bukti *` ber-watermark otomatis, `KETERANGAN *`, dan dropdown `FORM TINDAK LANJUT *` (065 / 014 / Tanpa Biaya).
- **Approval & Verifikasi**:
  - Dibuat oleh: Branch Engineering Support
  - Diperiksa oleh: Branch Engineering Coord
  - Disetujui oleh: Br Building & Maintenance Mgr

Data form disimpan pada `ChecklistReport.checklistPayload` dalam format JSON. Pengunggahan foto menggunakan endpoint Google Drive dan hanya terkirim setelah Laporan beralih dari status `DRAFT`.



## Alur: Checklist vs Perbaikan (Repair)

Terdapat 2 jalur utama pengisian laporan yang dibedakan secara logika meskipun secara UI sangat mirip:

1. **Jalur Checklist (Rutin)**:
   - Form 002, 003, dan 005 memiliki opsi kondisi lengkap: `BAIK`, `RUSAK`, `TIDAK_ADA`.
   - `BAIK` dan `RUSAK` wajib disertai foto (mandatory).
   - Seluruh item dalam checklist **wajib** diisi kondisinya sebelum laporan dapat disubmit.
   - Pengecualian: Form **004** murni penginputan angka daya (KWH) tanpa opsi kondisi dan tidak memerlukan foto.

2. **Jalur Perbaikan / Temuan (Ad-hoc / Repair)**:
   - Form 002, 003, dan 005 **hanya** menampilkan opsi kondisi `RUSAK`.
   - Opsi `RUSAK` wajib disertai foto temuan.
   - Berbeda dengan Checklist rutin, form Repair **tidak wajib** diisi semua itemnya. ES cukup mengisi item yang memang ditemukan rusak saja. (Minimal 1 item diisi).
   - Form 004-repair berlaku persis seperti 004 (input daya).

## ES Checklist UX Refinement

The ES checklist form should follow the interaction pattern of the Sparta
Maintenance checklist reference while keeping SPARTA Engineering's black,
silver, orange, and white visual language.

Required behavior:
- Checklist entry uses a compact mobile-first wizard surface with a header,
  progress summary, search field, category accordion, segmented condition
  controls, and a sticky bottom continue/save action.
- Pada form checklist ruangan (mis. FRM_TSM_003), setiap item langsung menampilkan input evaluasi per unit sesuai `TOTAL QTY` (default 1 unit dengan kondisi awal `BAIK`). Stepper `UNIT RUSAK` dan banner teks dihilangkan.
- Setiap unit memiliki input `Nomor Unit` (placeholder `Contoh: Unit 1`) sejajar dengan dropdown `KONDISI *` (2-kolom).
- Kondisi awal `BAIK` memastikan item yang normal sudah ter-evaluasi tanpa harus dipilih satu per satu. Pengguna cukup mengubah kondisi item yang bermasalah (misal menjadi `RUSAK`).
- Jika kondisi dipilih `BAIK`, unit tidak memerlukan foto bukti atau form lanjutan. Jika dipilih kondisi temuan (`RUSAK`, `REPAIR`, `CLEAN`, `ADJUST_OR_ADD`), form menampilkan pilihan handler (default BES), kamera foto bukti wajib, keterangan, dan pilihan form tindak lanjut (014, 065, Repair Tanpa Biaya) yang mem-prefill `nomorUnit` ke Form 065.
- Layout and interaction may mirror Sparta Maintenance, but checklist data,
  area names, and SPARTA Engineering brand styling remain owned by this
  project.
- Condition choices remain `BAIK`, `RUSAK`, and `TIDAK_ADA`; displayed labels
  are `Baik`, `Rusak`, and `Tidak Ada`.
- `BAIK` and `RUSAK` require direct camera capture evidence. The upload control
  must request browser camera permission and open a live camera preview instead
  of starting from file storage.
- Captured camera images continue to upload through the existing photo upload
  endpoint and are stored as Google Drive-backed photo IDs/URLs.
- Every captured checklist photo must be watermarked into the uploaded image.
  The watermark uses real checklist context and contains only:
  `SPARTA Engineering`, capture date/time, `Oleh: <user> - <role>`, and
  `Area: <area name>` (atau `Area: <area name> - <room name>` apabila ruangan dipilih).
- Uploaded photo previews appear inline as the image itself, without a separate
  "foto tersimpan" status chip. Tapping the preview opens a dark fullscreen
  image viewer with a close control.
- Missing required photo state must be communicated through disabled submit and
  upload status, not through an orange warning chip/card inside the item.
- While an ES user is creating or filling a report under
  `/dashboard/reports/new/**`, the bottom navigation must be hidden so the
  report flow owns the screen.
- Report flow back navigation moves one browser-history step at a time. It must
  not hardcode "Back to Dashboard" from every checklist step.
- Area/period completion indicators must only count submitted reports. `DRAFT`
  reports reserved for photo upload or in-progress form filling must not mark an
  area or period as `Selesai`.

## Form Tindak Lanjut Perbaikan (FRM_TSM_014 & FRM_TS_065)

Sesuai flowchart SPARTA Engineering, jika terdapat temuan kerusakan pada checklist:
1. **Pilihan Form Tindak Lanjut Spesifik Kategori**:
   - **Kategori Equipment / Alat Operasional**: Otomatis menggunakan `SAT/FRM/TS/065_REV:00_161020` (Form Penggantian Spare Part Equipment).
   - **Kategori Ruangan / Fasilitas Bangunan**: Otomatis menggunakan `SAT/FRM/TSM/014_REV:000_060423` (Form Estimasi Biaya Sipil & ME).
   - Opsi "Repair Tanpa Biaya" ditiadakan dari opsi tindak lanjut temuan kerusakan agar seluruh temuan kerusakan tercatat melalui form resmi (065 atau 014).

2. **Alur Halaman Rekapitulasi Tindak Lanjut (`/dashboard/reports/[reportCode]/follow-up`)**:
   - Jika checklist memiliki item rusak, setelah submit checklist user diarahkan ke halaman pengisian form lanjutan (`/dashboard/reports/[reportCode]/follow-up`) sesuai jenisnya (065 untuk unit mesin/equipment, 014 untuk ruangan/gedung). Standardisasi ini berlaku di seluruh formulir checklist (FRM_TSM_001 s.d. FRM_TSM_013, FRM_TS_016 s.d. FRM_TS_064).
   - Jika 100% aman (seluruh item BAIK), laporan langsung menuju antrean approval `PENDING_COORD`.
   - **Tampilan Step-by-Step (1 Form per Halaman/Langkah)**:
     - Form ditampilkan secara berurutan unit demi unit sesuai urutan item rusak di checklist (misal: Unit 1 AC [065] -> Unit 2 AC [065] -> Unit 1 Exhaust Fan [014]).
     - Navigasi antar unit menggunakan tombol "Sebelumnya" dan "Selanjutnya", dengan progress indicator yang jelas (e.g. "Item 1 dari 3").
     - Pada langkah terakhir, tombol berubah menjadi "Simpan Form Tindak Lanjut" untuk memfinalisasi seluruh data.
   - **Desain Mobile-First & Input Terstruktur**:
     - Menggantikan tabel horizontal yang sempit dengan kartu input vertikal yang nyaman di smartphone.
     - Form 014: Kartu rincian material disusun 2-baris (Baris 1: Nama Barang/Material & Satuan; Baris 2: Qty & Harga Satuan dengan prefix Rupiah), perhitungan subtotal otomatis, serta kemampuan menambah/menghapus baris material.
     - Form 065: Segmented control jenis perbaikan, input identitas unit 2-baris (Baris 1: Nama Unit & Merk/Brand; Baris 2: No Unit/Asset & No Tiket Problem), analisa kerusakan, tindakan, serta kartu rincian spare part 2-baris (Baris 1: Nama Part & Nomor Part/Seri; Baris 2: Asal Part via shadcn Select & Jumlah Part).
     - Header context bar follow-up ditampilkan dalam format 2-kolom x 2-baris (Branch/Depo, Lokasi, Tanggal, Pelapor) agar teks tidak terpotong.
   - Data dasar (Lokasi, Branch, Tanggal, Item Rusak, Keterangan / Rencana Aksi) di-prefill otomatis dari checklist.
   - Setelah form lanjutan disimpan, laporan dialihkan ke `PENDING_COORD` untuk proses approval berjenjang.

### Form FRM_MED_003: Form Izin Kerja (SAT/FRM/MED/003_Rev:000_180225) - Mandatory
- **Dasar Kebijakan**: SAT/KEB/MED/001 Kebijakan Persyaratan Kerja Aman (SMK3).
- **Status Alur**: **Mandatory (Wajib)** sebelum membuat laporan non-rutin. Tombol lewati ditiadakan.
- **Bagian 1: Header & Identitas Pekerjaan**:
  - Kegiatan / Pekerjaan
  - Lokasi pekerjaan
  - PIC / Pengawas SAT
  - Internal / Rekanan / Kontraktor
  - Tanggal pelaksanaan
  - Lama Pekerjaan (estimasi waktu/durasi)
- **Bagian 2: Informasi Pekerja & Persyaratan Administrasi**:
  - Daftar Nama Pekerja (hingga 5 orang pekerja)
  - Persyaratan Kompetensi & Administrasi (Checkbox):
    - Sertifikat Kompetensi
    - Safety Induction
    - Job Safety Analysis (JSA)
    - Konfirmasi Kondisi Mental Pekerja (Phobia)
    - Persyaratan Lainnya (teks)
- **Bagian 3: Jenis Pekerjaan Berisiko & APD/APK Khusus**:
  1. *Hot Work (Kerja Api)*: Lock Out, Barikade, Ventilasi, Welding Cutting Torch, Acetylene, Grinding Machine, Cutting Disk, Fire Blanket, Oxygen, Lainnya.
  2. *Work Height & Excavation (Kerja Ketinggian & Galian)*: Handrail, Platform/Alas, Alat Komunikasi, Scaffolding, Lampu Penerangan, Crane, Safety Line, Safety Sign, Safety Net, Lainnya.
  3. *Confined Space Area (Area Terbatas)*: Ventilasi Udara, Proteksi Area, Oxygen, Breathing Apparatus, Log Out, Lainnya.
  4. *High Voltage Electrical (Listrik Tegangan Tinggi)*: Instalasi Listrik, Proteksi Terminal, Proteksi Arus, Proteksi Tegangan, Alat Komunikasi, Ampere Meter, Lock Out, Proteksi Area, Proteksi Panel, Lainnya.
- **Bagian 4: Standar APD & Fire Protection**:
  - APD: Topi/Helm, Kacamata, Masker, Faceshield, Welding Facer, Apron, Ear plug/ear muff, Safety Vest, Sarung tangan bahan/kulit/karet, Safety shoes, Welding gloves, Dust mask, Body harness, Lainnya.
  - Fire Protection: APAR Dry Chemical Powder, APAR CO2, APAR Foam, Air, Pasir, Lainnya.
- **Bagian 5: Pengesahan & Tanda Tangan**:
  - Pemohon: Branch Engineering Support (BES)
  - Menyetujui: Branch Building & Maintenance Manager, P2K3/Delegate, Sekretaris P2K3
  - Catatan hasil pemeriksaan pasca pekerjaan

### Form FRM_TS_028: Monthly Checklist Battery (Baterai Forklift & Pallet Mover)
- **NRA**: `SAT/FRM/TS/028_Rev:002_161020`
- **Tujuan**: Form universal bulanan untuk memeriksa kondisi fisik dan parameter elektrikal/kimiawi baterai traksi (*traction battery*), baik untuk unit **Forklift** maupun **Pallet Mover**.
- **Metadata Header**:
  - `WH`: Lokasi gudang/warehouse.
  - `Unit`: Dropdown pilihan (`Forklift` atau `Pallet Mover`).
  - `No. Unit`: Nomor unit alat (misal: Unit 1, Unit 2).
  - `Volt`: Voltase baterai (otomatis/input: `24V` untuk Pallet Mover, `48V` untuk Forklift).
  - `Merk`: Dropdown merk unit/baterai (`Jungheinrich` atau `Crown`).
  - `Kondisi`: Kondisi umum unit baterai (input teks bebas, default kosong).
- **Tabel 1: Pemeriksaan Bagian/Komponen (14 Item Fisik)**:
  1. Cleaning permukaan battery
  2. Check short body
  3. Cleaning conector intercell
  4. Check & Cleaning pole +/-
  5. Check skun/pin socet
  6. Check kabel
  7. Check soket +/-
  8. Check end conector +/-
  9. Pelumasan pd intercell & pole +/-
  10. Check keasaman air accu
  11. Check tegangan tiap cell
  12. Check tegangan akumulasi semua cell
  13. Check volume air accu
  14. Check kondisi tray / housing battery
  - Pilihan Kondisi: `V` (OK - hijau soft), `X` (Not Good - merah/rose soft), `R` (Repair - amber soft), `U` (Urgent - abu-abu/slate soft).
- **Tabel 2: Data Point 10 & 11 (Pengukuran Cell Baterai)**:
  - Jumlah Cell Dinamis (Otomatis Terikat Dropdown `Tipe Unit` tanpa toggle manual):
    - `Pallet Mover`: 12 Cell (No. 01 s/d 12, label Grup 1 disembunyikan karena unit tunggal)
    - `Forklift`: 24 Cell (No. 01 s/d 12 Grup 1 & No. 13 s/d 24 Grup 2)
  - Parameter per Cell:
    - `B.J` (Berat Jenis air accu, misal `1.28`)
    - `Teg. Static (V)` (Tegangan per cell, misal `2.12`)
  - Baris Total: `Total Tegangan (V)` dihitung secara otomatis dari akumulasi tegangan seluruh cell.
- **Tanda Tangan Pengesahan**:
  - Dibuat Oleh: Branch Technical Support (BES)
  - Diperiksa: Branch Coordinator TS
  - Disetujui: Branch Building & Maintenance Manager


