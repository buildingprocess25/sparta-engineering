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

## UI & Alur Pengguna

- **Route(s)**: `/dashboard`, `/dashboard/reports/new`, `/dashboard/reports/new/work-permit`, `/dashboard/reports/new/[reportType]/[formId]`
- **Alur Laporan Rutin (To-Do List)**:
  1. PIC / ES login ke SPARTA $\rightarrow$ Dashboard utama menampilkan **Banner Form Izin Kerja (SAT/FRM/MED/003)** tepat di atas **Tugas Rutin PIC (To-Do List)** sebagai pengingat kepatuhan K3/SMK3 dengan tombol "Isi Form Izin Kerja".
  2. **Kunci Tugas Rutin (Lock / Disabled State)**: Seluruh kartu tugas dalam To-Do List berstatus terkunci (`disabled`) dan tidak dapat diklik selama ES belum mengisi Form Izin Kerja (`sparta_work_permit` belum terisi pada sesi aktif). Panel menampilkan pesan peringatan K3 beserta indikator gembok pada kartu tugas.
  3. Setelah Form Izin Kerja terisi dan terkonfirmasi, kunci kartu to-do otomatis terbuka.
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
13. **FRM_MED_003** (Form Izin Kerja - SAT/FRM/MED/003_Rev:000_180225) - **Mandatory**


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
  - `Sub-selector Minggu`: Radio/segmented control `Minggu 1` s/d `Minggu 5`.
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
  - Khusus item yang Rusak: Wajib bukti foto kamera ber-watermark otomatis, penanggung jawab (`BES` / `Eksternal`), catatan, dan dropdown form tindak lanjut (`SAT/FRM/TS/065`, `SAT/FRM/TSM/014`, `REPAIR_TANPA_BIAYA`).
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
  - `Sub-selector Minggu`: Terkunci otomatis sesuai minggu berjalan (`Minggu 1` s/d `Minggu 5`).
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
1. **Pilihan Form Tindak Lanjut per Unit**:
   - `SAT/FRM/TSM/014_REV:000_060423` (Form Estimasi Biaya Sipil & ME)
   - `SAT/FRM/TS/065_REV:00_161020` (Form Penggantian Spare Part Equipment)
   - `REPAIR_TANPA_BIAYA` (Perbaikan tanpa biaya)

2. **Alur Halaman Rekapitulasi Tindak Lanjut (`/dashboard/reports/[reportCode]/follow-up`)**:
   - Jika checklist memiliki item dengan form 014 atau 065, setelah submit checklist user diarahkan ke halaman pengisian form lanjutan.
   - Jika tidak ada (semua baik atau repair tanpa biaya), laporan langsung menuju antrean approval `PENDING_COORD`.
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

