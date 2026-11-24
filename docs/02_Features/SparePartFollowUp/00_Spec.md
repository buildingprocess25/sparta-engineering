# Form 065 (Perbaikan / Penggantian Spare Part Equipment) & Tindak Lanjut Pekerjaan

Keputusan Pak Iqbal, 17 November 2026 & pembaruan workflow V8 (24 November 2026). Berlaku untuk temuan rutin dan non-rutin.

## Alur yang disepakati

1. BES mengirim checklist dan melengkapi usulan **Form 065 (Form Perbaikan / Penggantian Spare Part Equipment)** atau **Form 014 (Estimasi Biaya Sipil & ME)**. Identitas equipment (`namaUnit`, `merk`, `nomorUnit`) diprefill otomatis dari master `Equipment` apabila tersedia. Hasil checklist menjadi dokumen pendukung dalam laporan yang sama.
2. Pilihan **Repair Tanpa Biaya** (`REPAIR_TANPA_BIAYA`) tersedia secara eksplisit pada seluruh form checklist tanpa menggabungkan routing otomatis Form 014 (ruangan/bangunan) dan Form 065 (equipment). Laporan yang hanya berisi kondisi aman atau `REPAIR_TANPA_BIAYA` mengikuti `BEC → Manager → Selesai`.
3. Seluruh pengisian Form 065 — baik jenis **Perbaikan** (`PERBAIKAN`) maupun **Penggantian Spare Part** (`PENGGANTIAN_SPARE_PART`) — mengikuti persetujuan **BEC/Koordinator (`COORD`) → Manager → WHM/DWHM (`REQUESTER`)** di cabang laporan.
4. ACC Manager meneruskan usulan Form 014 maupun Form 065 ke `PENDING_REQUESTER`, tidak menyelesaikan pekerjaan.
5. Setelah ACC Requester:
   - **Form 014**: status menjadi `WAITING_PJU` (**Menunggu PJU**). BES mencatat tahap **PJU Online** (`PROCESS_PJU`), lalu memulai pekerjaan (`START_WORK` → `IN_PROGRESS`) setelah izin kerja K3 (`MED/003`) terverifikasi aktif.
   - **Form 065**: status menjadi `WAITING_PB` apabila ada part dengan asal `PB`, selain itu `WAITING_PARTS`. Pada `WAITING_PB`, BES mencatat **Proses PB** (`PROCESS_PB` → `WAITING_PARTS`). Pada `WAITING_PARTS`, BES mencatat **Pengambilan Stock Barang** (`PICKUP_STOCK`), lalu memulai perbaikan unit (`START_WORK` → `IN_PROGRESS`) setelah izin kerja K3 (`MED/003`) terverifikasi aktif.
   - Setiap tahapan (`PROCESS_PJU`, `PROCESS_PB`, `PICKUP_STOCK`, `START_WORK`, `FINISH_WORK`) mencatat **timestamp server (`performedAt`)** dan **identitas pelaksana (`actorNik`, `actorName`)** di `executionHistory`. Tidak ada kewajiban unggah foto bukti sebelum pekerjaan dimulai (`START_WORK`).
6. **Bukti Penyelesaian Pekerjaan (`FINISH_WORK` → `COMPLETED`)**:
   Laporan tidak dapat berstatus `COMPLETED` sebelum bukti penyelesaian lengkap dan tervalidasi di frontend maupun backend:
   - **Form 014**: foto saat pekerjaan (`workPhotos`), foto bon pembelian (`receiptPhotos`), bukti transfer pengembalian dana (`refundTransferPhotos`), dan actual pembelian barang dalam Rupiah (`actualPurchaseAmount`).
   - **Form 065**: konfirmasi & nama penerima serah terima unit selesai (`handoverConfirmed`, `handoverRecipient`), foto dengan unit saat perbaikan (`repairWithUnitPhotos`), dan foto selfie dengan user (`selfieWithUserPhotos`).
   - Seluruh referensi foto bukti penyelesaian diverifikasi kepemilikannya terhadap `drivePhotoFileIds` laporan terkait.
   - Setiap unggah foto `COMPLETION_EVIDENCE` melalui `POST /api/photos/upload` menyinkronkan dan mengembalikan `reportVersion` (`updatedAt.toISOString()`) terbaru ke klien sehingga submit `FINISH_WORK` tetap menjaga optimistic concurrency control (OCC) tanpa kehilangan isian form atau memicu error versi usang palsu. Error konflik versi laporan dipisahkan tegas dari error ketidaksesuaian status pelaksanaan maupun ketidaklengkapan bukti penyelesaian.
7. Riwayat keputusan menyimpan NIK, nama, peran akun, tahap, keputusan, catatan (wajib untuk revisi/tolak, opsional saat ACC BEC, Manager, maupun Requester), dan waktu dalam `approvalHistory`. Pembaruan status memakai transaksi dan pemeriksaan versi atomik. Laporan yang telah berstatus `COMPLETED` bersifat final dan tidak dimutasi.
8. Requester dapat meminta revisi atau menolak pada tahapnya. Revisi kembali melalui Koordinator dan Manager; keputusan lama tetap menjadi riwayat.
9. PDF & Google Drive menggunakan status, approval, histori pelaksanaan, dan bukti penyelesaian tersimpan. Dokumen sebelum penyelesaian tidak diberi label Final.

## Pending Decisions (Belum Dikonfirmasi — Tidak Dikarang)

1. **Form 065 tanpa spare part (`jenis === "PERBAIKAN"`) pasca ACC Requester**: Saat ini tetap masuk `WAITING_PARTS` agar BES dapat melanjutkan `START_WORK → IN_PROGRESS → Bukti Penyelesaian → COMPLETED`. Perlu konfirmasi apakah jenis `PERBAIKAN` tanpa part harus langsung melompati `WAITING_PARTS` ke `IN_PROGRESS` atau tetap melalui `WAITING_PARTS`.
2. **PJU tanpa pengembalian dana**: Saat ini keempat bukti Form 014 (termasuk `refundTransferPhotos`) diberlakukan wajib sesuai spesifikasi. Perlu konfirmasi aturan pengecualian apabila `actualPurchaseAmount === estimasi` atau tidak ada sisa dana pengembalian.
3. **Laporan tindak lanjut gabungan (Form 014 + Form 065 dalam satu laporan)**: Saat ini setelah ACC Requester mengikuti jalur `WAITING_PJU` dan saat `FINISH_WORK` mewajibkan bukti penyelesaian untuk jenis form yang ada. Perlu konfirmasi alur eksekusi paralel apabila satu laporan memiliki item 014 dan item 065 dengan part PB sekaligus.

## Rencana implementasi dan verifikasi

- [x] Perluas status dan kolom audit laporan melalui migration additive.
- [x] Uji penolakan urutan salah, cabang salah, versi usang, dan ACC Manager yang belum menutup laporan.
- [x] Terapkan tahap Requester, pelaksanaan BES, akses dokumen pendukung, dan label status pada titik masuk normal.
- [x] Uji alur STOCK/PB, rutin/non-rutin, revisi, serta laporan tanpa tindak lanjut; jalankan TypeScript check.
- [x] Periksa integrasi PDF dan izin kerja; dokumentasikan demo dan kebutuhan migration.
