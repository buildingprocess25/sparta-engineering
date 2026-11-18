# Usulan penggantian spare part Form 065

Keputusan Pak Iqbal, 17 November 2026. Berlaku untuk temuan rutin dan non-rutin.

## Alur yang disepakati

1. BES mengirim checklist dan melengkapi usulan Form 065. Hasil checklist menjadi dokumen pendukung dalam laporan yang sama dan dapat dibuka dari usulan.
2. Form 065 dengan jenis `PENGGANTIAN_SPARE_PART` mengikuti BEC/Koordinator (`COORD`) → Manager → WHM/DWHM (`REQUESTER`) di cabang laporan. Form tanpa usulan penggantian tetap mengikuti persetujuan sebelumnya.
3. ACC Manager meneruskan usulan ke `PENDING_REQUESTER`, tidak menyelesaikan pekerjaan.
4. ACC Requester menghasilkan `WAITING_PB` jika setidaknya satu part membutuhkan PB; selain itu `WAITING_PARTS`. Pemilihan STOCK/PB sebelum ACC adalah rencana usulan, bukan pelaksanaan pengadaan.
5. Setelah ACC Requester, BES pemilik dapat mencatat proses PB, alokasi part, mulai pekerjaan (`IN_PROGRESS`), lalu penyelesaian (`COMPLETED`). Semua part harus dinyatakan siap sebelum mulai pekerjaan. Izin aktif diperiksa kembali saat BES mencatat proses.
6. Riwayat keputusan menyimpan NIK, nama, peran akun, tahap, keputusan, catatan, dan waktu dalam kolom server tersendiri. Riwayat pelaksanaan mencatat aktor, tindakan, status sebelum/sesudah, waktu, dan catatan. Pembaruan memakai transaksi dan pemeriksaan versi agar keputusan tidak tertimpa.
7. Requester dapat meminta revisi atau menolak hanya pada tahapnya. Revisi kembali melalui Koordinator dan Manager; keputusan lama tetap menjadi riwayat, bukan ACC untuk isian baru.
8. PDF menggunakan status dan keputusan tersimpan. Dokumen sebelum penyelesaian tidak diberi label Final.

## Keputusan yang masih terbuka

- Waktu pengajuan dan urutan ACC Form 014; alur saat ini dipertahankan.
- Bukti wajib dan verifikator penutupan; belum menambahkan kewajiban foto/dokumen maupun ACC penutupan baru. BES menyatakan pekerjaan selesai dan dapat mengisi catatan.
- Aturan khusus perbaikan tanpa biaya; jenis 065 PERBAIKAN tetap pada alur sebelumnya, tidak diasumsikan sebagai penggantian part.
- Integrasi stok/PB aktual belum tersedia. Tahap dan pencatatan proses di SPARTA tidak melakukan transaksi inventory atau mengirim PB ke sistem lain.

## Rencana implementasi dan verifikasi

- [x] Perluas status dan kolom audit laporan melalui migration additive.
- [x] Uji penolakan urutan salah, cabang salah, versi usang, dan ACC Manager yang belum menutup laporan.
- [x] Terapkan tahap Requester, pelaksanaan BES, akses dokumen pendukung, dan label status pada titik masuk normal.
- [x] Uji alur STOCK/PB, rutin/non-rutin, revisi, serta laporan tanpa tindak lanjut; jalankan TypeScript check.
- [x] Periksa integrasi PDF dan izin kerja; dokumentasikan demo dan kebutuhan migration.
