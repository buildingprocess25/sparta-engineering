# Vision & Scope

## Visi Produk

Sistem **SPARTA** (Sistem Terpusat) bertujuan untuk **mendigitalisasi seluruh aktivitas checklist engineering** yang sebelumnya dilakukan secara manual (print form, isi tulis tangan, foto, dan upload ke Google Forms). Sistem ini akan menjadi satu wadah terpusat (single source of truth) untuk proses monitoring, pelaporan, dan approval terkait fasilitas dan equipment engineering di berbagai area operasional (Office, Warehouse, Depo, dll).

## Target Pengguna (Role)

Sistem ini akan diakses oleh 6 peran (role) utama:

1. **ES (Engineering Support)**
   - Eksekutor utama di lapangan.
   - Bertugas melakukan rutinitas checklist (bulanan/mingguan) dan mencatat temuan kerusakan.
   - *Catatan:* Dapat mengisi "Form Ijin Kerja" sebagai langkah awal (bersifat opsional/kondisional).
2. **Engineering Coordinator (Coord)**
   - Melakukan verifikasi dan approval pertama (COORD APPROVED) terhadap laporan checklist atau temuan kerusakan dari ES.
3. **Manager (Mgr)**
   - Melakukan approval tingkat kedua (MGR APPROVED) setelah koordinator.
4. **Requester (Req)**
   - Pihak peminta/terkait yang melakukan approval tahap akhir (REQ APPROVED).
5. **Admin HO (Head Office)**
   - User di kantor pusat yang memonitor keseluruhan data dan dapat melakukan tindakan perbaikan (Perbaikan by AHO). Hak akses tinggi.
6. **Super Admin**
   - Administrator sistem (memiliki hak akses penuh, kurang lebih sama dengan Admin HO) untuk mengelola pengaturan dasar sistem.

## Scope (Dalam Lingkup)

Fitur dan kapabilitas utama yang akan dibangun:

1. **Manajemen Form & Ijin Kerja**: Digitalisasi "Form Ijin Kerja" (Opsional, relasi sistematik masih dalam konfirmasi).
2. **Digitalisasi Checklist**: 
   - Konversi format Excel "Form Checklist Ruangan" (dan form lainnya) menjadi antarmuka web interaktif.
   - Mendukung berbagai area (Office vs WHC/WH/Depo/Bulky/Store Hub).
   - Mendukung berbagai periode (Monthly vs Weekly).
   - Input status per item (Contoh: V=Baik, C=Clean, R=Repair, X=Rusak, T=Tidak Ada).
3. **Alur Pelaporan Kerusakan**:
   - Pencatatan "Apakah ada kerusakan?".
   - Jika "YA", alur berlanjut ke pencatatan perbaikan (Repair Tanpa Biaya, dsb).
4. **Sistem Approval Berjenjang (Workflow)**:
   - Alur persetujuan terstruktur: `ES -> COORD APPROVED -> MGR APPROVED -> REQ APPROVED -> INPUT PB/PJU -> SELESAI`.

## Out of Scope

<!-- Apa yang secara eksplisit TIDAK akan dibangun atau ditangani. (Akan didefinisikan kemudian) -->
_Akan didefinisikan lebih lanjut jika ada integrasi atau fitur di luar batasan sistem ini._

## Metrik Keberhasilan

- Penghentian total penggunaan kertas (paperless) untuk checklist engineering.
- Penghapusan penggunaan Google Forms untuk pelaporan.
- Peningkatan kecepatan dan akurasi approval kerusakan melalui sistem terpusat.
