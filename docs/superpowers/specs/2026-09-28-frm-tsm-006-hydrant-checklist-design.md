# Design Spec: FRM_TSM_006 Checklist Hydrant Refinement

**Tanggal**: 28 September 2026  
**Status**: Disetujui (Approved)  
**Dokumen Referensi**:
- Formulir Excel: `SAT/FRM/TSM/006_Rev_000_261022` (`FRM_TSM_006.xls`)
- Kebijakan Operasional: `SAT/KEB/TSM/002 Kebijakan Perawatan Hydrant`
- Dokumen Fitur: `docs/02_Features/Checklist/00_Spec.md`

---

## 1. Latar Belakang & Masalah

Pada implementasi sebelumnya, form `FRM_TSM_006` (Checklist Hydrant) merender seluruh 12 kategori pengecekan (~61 item) secara sekaligus dalam satu tampilan panjang saat user memilih periode bulanan.

Sesuai dokumen standar operasional formulir `SAT/FRM/TSM/006_Rev_000_261022`, perawatan hydrant terbagi menjadi 3 frekuensi operasional:
1. **General Mingguan (Bagian A)**: Pengecekan mingguan (*Test Hydrant Indicator* - 5 item) yang dilakukan rutin per minggu (Mgg 1 s/d Mgg 4).
2. **Bulanan (Bagian B)**: Pengecekan panel, instrumen, instalasi kabel, mesin diesel, pemipaan, valve, pompa, dan reservoir (Kategori 2 s/d 11 - 47 item).
3. **6 Bulanan (Bagian C)**: Pengujian semburan tekanan aktual (*Test Tekanan Hydrant Actual* - 9 item) yang dilakukan setiap semester (Semester 1 atau Semester 2).

Kebutuhan lapangan bagi staf Engineering Support (ES):
- Daftar checklist 1–12 **default tersembunyi (*hidden*)** sampai jenis perawatan dipilih.
- Form dipecah berdasarkan jenis perawatan agar teknisi di lapangan hanya perlu mengisi dan memvalidasi item yang relevan dengan jadwal kunjungannya saat itu tanpa harus terbebani form 61 item sekaligus.
- Untuk perawatan mingguan, ada pemilihan minggu yang menghitung kalender nyata berdasarkan bulan dan tahun berjalan, serta mengunci minggu-minggu yang sudah lewat agar data historis tidak diisi terlambat tanpa otorisasi.

---

## 2. Struktur Antarmuka & Kontrol (UI/UX)

### 2.1 Header Identitas & Pengaturan Form
* **Baris 1 (2 Kolom Responsif)**:
  - `Jenis Hydrant`: Input teks (default value `"IHB - OHB"`).
  - `Periode / Tahun`: Display / input tahun berjalan (mis. `2026`).
* **Baris 2 (Dropdown Jenis Perawatan)**:
  - Dropdown `Select`:
    - Placeholder: `"-- Pilih Jenis Perawatan --"`
    - Opsi:
      - `GENERAL_MINGGUAN` (*General Mingguan*)
      - `BULANAN` (*Bulanan*)
      - `ENAM_BULANAN` (*6 Bulanan*)

### 2.2 Kondisi Awal (Default Hidden)
* Jika `jenisPerawatan` bernilai kosong (`null` atau placeholder):
  - Area checklist 1–12 **tersembunyi total**.
  - Ditampilkan kartu instruksi (*empty state*) yang memandu ES untuk memilih jenis perawatan terlebih dahulu.

### 2.3 Baris 3: Sub-Selector Dinamis & Logika Kalender Nyata

#### A. Opsi `GENERAL_MINGGUAN`
* Menampilkan radio button pill: `Mgg 1`, `Mgg 2`, `Mgg 3`, `Mgg 4`.
* **Kalkulasi Hari Nyata Berdasarkan Bulan & Tahun Aktif**:
  - Mengambil jumlah hari riil pada bulan dan tahun aktif (`daysInMonth = new Date(year, monthIndex, 0).getDate()`).
  - Rentang tanggal:
    - **Mgg 1**: Tanggal `1` s/d `7` (label: `Mgg 1 (1 - 7 [Bulan])`)
    - **Mgg 2**: Tanggal `8` s/d `14` (label: `Mgg 2 (8 - 14 [Bulan])`)
    - **Mgg 3**: Tanggal `15` s/d `21` (label: `Mgg 3 (15 - 21 [Bulan])`)
    - **Mgg 4**: Tanggal `22` s/d `daysInMonth` (label: `Mgg 4 (22 - [daysInMonth] [Bulan])`)
* **Aturan Lock / Disable**:
  - Minggu sebelum minggu berjalan otomatis berstatus `disabled` (warna abu-abu, kursor `not-allowed`, badge/ikon "Lewat").
  - Minggu berjalan otomatis menjadi nilai default yang aktif.
  - Minggu mendatang tetap dapat dipilih jika ada penugasan atau jadwal khusus.

#### B. Opsi `BULANAN`
* Tidak memerlukan sub-selector radio button tambahan.
* Menampilkan badge indikator periode bulanan aktif (mis. `September 2026`).

#### C. Opsi `ENAM_BULANAN`
* Menampilkan radio button pill:
  - `Semester 1 (Jan - Jun)`
  - `Semester 2 (Jul - Des)`
* Default terpilih otomatis mendeteksi bulan saat ini:
  - Bulan 1–6 (Januari – Juni): Default `SEMESTER_1`.
  - Bulan 7–12 (Juli – Desember): Default `SEMESTER_2`.

---

## 3. Pemetaan Kategori Checklist Berdasarkan Jenis Perawatan

| Jenis Perawatan | Kategori yang Ditampilkan | Jumlah Item | Keterangan & Catatan Khusus |
| :--- | :--- | :---: | :--- |
| **General Mingguan** | **Kategori 1**: *TEST HYDRANT INDICATOR (setiap 1 minggu)* | 5 item | Tes pompa elektrik 2 dt, jockey 2 dt, diesel 5 mnt, pressure gauge, kebocoran |
| **Bulanan** | **Kategori 2 s/d 11**: Kondisi Panel, Indikator Panel, Kabel Koneksi, Panel Mesin Diesel, Mesin Diesel, Pemipaan, Gate Valve, Pompa-pompa, Mounting Body, Water Reservoir | 47 item | Item 5.I & 5.J menyertakan input Voltase Baterai 1 & 2 (Volt) |
| **6 Bulanan** | **Kategori 12**: *TEST TEKANAN HYDRANT ACTUAL (setiap 6 Bulan)* | 9 item | Uji otomatis panel, pilar hydrant, selang & nozel, semburan tekanan air, pompa aktif |

---

## 4. Validasi & Payload Data

1. **Progress Bar & Evaluasi**:
   - Jumlah total item dan progress bar dihitung secara dinamis hanya berdasarkan kategori yang aktif pada jenis perawatan terpilih:
     - Mingguan: total 5 item.
     - Bulanan: total 47 item.
     - 6 Bulanan: total 9 item.
2. **Validasi Tombol Submit**:
   - Seluruh item yang aktif wajib berstatus `BAIK` atau `RUSAK`.
   - Item berstatus `RUSAK` wajib melampirkan foto bukti ber-watermark, penanggung jawab (`BES` / `EKSTERNAL`), catatan temuan, dan pilihan form tindak lanjut (`FRM_TS_065` / `FRM_TSM_014` / `REPAIR_TANPA_BIAYA`).
3. **Struktur Payload**:
   Menyimpan parameter tambahan di `ChecklistPayload`:
   ```json
   {
     "formCode": "FRM_TSM_006",
     "formName": "Checklist Hydrant",
     "jenisHydrant": "IHB - OHB",
     "jenisPerawatan": "GENERAL_MINGGUAN",
     "subPeriod": "MGG_4",
     "subPeriodLabel": "Mgg 4 (22 - 30 September 2026)",
     "items": [ ... ]
   }
   ```
