# Design Spec: FRM_TS_062 Monthly Checklist Hand Pallet

> **Status**: Approved  
> **Form Code**: `FRM_TS_062`  
> **NRA**: `SAT/FRM/TS/062_Rev : 00_161020`  
> **Reff NRA**: `SAT/SOP/TS/011 Prosedur Monitoring Perawatan Dan Perbaikan Equipment Branch/Depo/Bulky/WH`  
> **Tanggal**: 2026-09-28  

---

## 1. Background & Purpose

Formulir `FRM_TS_062` digunakan oleh Engineering Support (ES) untuk melakukan pengecekan berkala bulanan (Monthly Checklist) pada unit **Hand Pallet** di cabang/warehouse. 

Formulir ini didigitalkan mengacu pada template resmi Excel `/Users/anaskhalif/Downloads/Form/FRM_TS_062.xls` dengan mengadopsi standar UI/UX mobile-first yang telah disetujui pada `FRM_TS_016` (Pallet Mover) dan `FRM_TSM_006` (Hydrant).

---

## 2. Struktur Data & Kategori (19 Item / 6 Kategori)

Mengikuti isi sheet `MONTHLY HALLET` pada file Excel sumber:

### Kategori 1: 1. NOMOR USER / IDENTITY UNIT (1 item)
- `hp_identity_unit`: "Nomor User / Identity Unit" (Tindakan: `Ch&Cl` - Check & Clean)

### Kategori 2: 2. PAINTING CONDITION (1 item)
- `hp_painting_condition`: "Painting Condition" (Tindakan: `Ch` - Check)

### Kategori 3: 3. BODY & STRUCTURE (8 item)
- `hp_body_bolted`: "A. Bolted Connection & mounting secure" (Tindakan: `Ch` - Check)
- `hp_body_fork`: "B. Fork" (Tindakan: `Ch` - Check)
- `hp_body_handle`: "C. Handle" (Tindakan: `Ch` - Check)
- `hp_body_shaft`: "D. Shaft ( AS )" (Tindakan: `Ch` - Check)
- `hp_body_bushing`: "E. All Bushing" (Tindakan: `Ch` - Check)
- `hp_body_pin_shaft`: "F. All Pin Shaft" (Tindakan: `Ch` - Check)
- `hp_body_linkage`: "G. Linkage" (Tindakan: `Ch` - Check)
- `hp_body_lubricant`: "H. Lubricant" (Tindakan: `Ch` - Check)

### Kategori 4: 4. WHEELS (3 item)
- `hp_wheels_drive`: "A. Drive wheel ( Lining & Bearing condition )" (Tindakan: `Ch&Cl` - Check & Clean)
- `hp_wheels_load`: "B. Load wheel ( Lining & Bearing condition )" (Tindakan: `Ch&Cl` - Check & Clean)
- `hp_wheels_roller_exit`: "C. Roller exit ( Lining condition )" (Tindakan: `Ch&Cl` - Check & Clean)

### Kategori 5: 5. HYDRAULICS (5 item)
- `hp_hydraulics_oil_level`: "A. Oil level" (Tindakan: `Ch` - Check)
- `hp_hydraulics_oil_leaks`: "B. Oil leaks" (Tindakan: `Ch` - Check)
- `hp_hydraulics_seal_ram`: "C. Seal & piston RAM" (Tindakan: `Ch` - Check)
- `hp_hydraulics_seal_pump`: "D. Seal & piston Pump" (Tindakan: `Ch` - Check)
- `hp_hydraulics_seal_control`: "E. Seal & Piston Control" (Tindakan: `Ch` - Check)

### Kategori 6: 6. FUNCTIONAL TEST (1 item)
- `hp_functional_onload`: "A. Operational Test Onload" (Tindakan: `Td` - Test Drive)

---

## 3. UI/UX Rules & Visual Design (Standard Form 016)

1. **Card Background**:
   - Item cards harus selalu berlatar belakang **putih bersih** (`bg-white border border-[#e6e2de] rounded-xl p-3.5 shadow-xs`).
   - DILARANG menggunakan background kemerahan (`bg-[#fffafa]`) saat kondisi `RUSAK`.

2. **Kondisi Baik / Rusak**:
   - Pilihan: `Baik (V)` dan `Rusak (X)`.
   - Warna tombol saat dipilih:
     - `Baik`: `bg-[#ecfdf5] border-[#10b981] text-[#047857]`
     - `Rusak`: `bg-[#fef2f2] border-[#ef4444] text-[#b91c1c]`

3. **Sub-form Temuan Kerusakan (Saat Kondisi = Rusak)**:
   - Header: `Detail Temuan Kerusakan & Tindak Lanjut` dengan garis pemisah tipis.
   - **Foto Bukti Temuan \***: Menggunakan tombol kamera `CameraCaptureButton` dengan live preview & watermark otomatis.
   - **Akan Dihandle Oleh \***: Segmented pill toggle `BES (Internal)` vs `Eksternal / Vendor` (warna oranye SPARTA `#ff8a2a` saat aktif).
   - **Tindak Lanjut \***: Dropdown Shadcn penuh (`w-full h-11`) dengan opsi:
     - `Form Penggantian Spare Part (065)`
     - `Form Estimasi Biaya ME (014)`
     - `Repair Tanpa Biaya (Internal)`
   - **Catatan Temuan / Kerusakan**: Input catatan temuan kerusakan.

4. **Header Info Unit**:
   - Lokasi: Otomatis dari nama area.
   - No. Unit / Serial: Input text wajib diisi (mis. `HP-01`).
   - Merk Unit: Input text (mis. `Krisbow`, `OPK`, `Bishamon`).
   - Periode Bulan: Badge bulan aktif kalender.

5. **Petunjuk Cara Tindakan**:
   - Diletakkan dalam card terpisah di bawah bar pencarian persis seperti Form 016.
   - Format teks polos tanpa warna latar belakang: `Petunjuk Cara Tindakan: Ch =Check • Cl =Clean • Td =Test drive`.

6. **Quick-fill Feature**:
   - Tombol `✓ Tandai Semua di Kategori Ini Baik` pada header accordion tiap kategori untuk efisiensi ES di lapangan.

7. **Catatan & Approval Footer**:
   - Field Catatan Umum.
   - Info pengesahan berjenjang tanpa warna badge (teks netral):
     - Dibuat oleh: Br Engineering Support (Pelaksana)
     - Diperiksa oleh: Br Engineering Coord (Reviewer)
     - Disetujui oleh: Br Building & Maintenance Mgr (Approver)
   - Label NRA & REF NRA resmi.

---

## 4. Rencana Implementasi

1. `lib/checklists/frm-ts-062.ts`: Definisi item, kategori, kode tindakan, konversi payload, dan validasi.
2. `components/es-dashboard/frm-ts-062-form.tsx`: Komponen form interaktif mobile-first.
3. `lib/actions/checklist.ts`: Tambahkan `FRM_TS_062` ke validasi payload checklist.
4. `app/dashboard/reports/new/[reportType]/[formId]/page.tsx`: Route handler untuk merender `FrmTs062Form`.
5. Update `docs/02_Features/Checklist/00_Spec.md`.
