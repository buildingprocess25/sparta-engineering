# Feature Spec: Form Izin Kerja (FRM_MED_003)

## Perilaku yang disepakati

Sumber: `docs/FRM_MED_003 (Form izin kerja).xlsx`, SAT/FRM/MED/003_Rev:000_180225.
Izin bulanan Branch Engineering Support (BES/ES) berlaku untuk semua pekerjaan
rutin dan non-rutin pemohon pada bulan target. Tidak perlu mengajukan ulang
untuk setiap pekerjaan. Pengajuan bulan berikutnya tersedia kapan saja, tanpa
batas tanggal 20. Periode kalender mulai tanggal 1 hingga akhir bulan; persetujuan
lebih awal tidak membuka pekerjaan sebelum periode mulai.

Alur wajib: `PENDING_MANAGER` → `PENDING_P2K3` → `PENDING_SECRETARY` → `APPROVED`.
Tahap kedua dapat diputuskan **P2K3 atau Delegate** yang ditugaskan, bukan keduanya.
Semua tahap dapat menolak dengan alasan wajib dan mengakhiri pengajuan sebagai
`REJECTED`. Penolakan tidak menghapus keputusan sebelumnya.

Catatan sumber: P2K3/Delegate diisi apabila pekerjaan dilakukan di Branch
(Office, Warehouse, Depo, Bulky). Izin bulanan BES meliputi pekerjaan Branch
tersebut sehingga seluruh tahap berlaku untuk izin bulanan; teks lokasi bebas
pada form tidak dapat dipakai untuk melewati persetujuan.

## Identitas dan hak akses

- Pemohon diambil dari sesi ES. NIK dan nama akun dicatat pada pengajuan.
- Manager tetap mengikuti pemetaan yang sudah tersedia: akun `MANAGER` dan
  `User.branchName` sama dengan cabang pemohon, tanpa membedakan kapital.
- Tidak ditemukan pemetaan P2K3/Delegate/Sekretaris dalam skema atau seed lama.
  `WorkPermitApprover` menghubungkan NIK akun yang sudah ada, cabang, dan fungsi
  `P2K3`, `DELEGATE`, atau `SECRETARY`. Tidak ada identitas atau pemetaan otomatis.
- Konfigurasi awal melalui `scripts/configure-work-permit-approver.ts`; operator
  harus memilih target environment dan NIK nyata. Pemetaan kosong menahan izin
  pada tahap terkait; COORD/REQUESTER/admin tidak otomatis menjadi approver.
- Antrean `/dashboard/work-permits` tersedia bagi Manager atau akun dengan
  penugasan aktif. Aksi dibatasi cabang dan tahap saat ini. ES yang juga diberi
  penugasan dapat membuka antrean, tetapi tidak menyetujui izinnya sendiri.
- Setiap keputusan menyimpan NIK, nama akun, role akun, fungsi persetujuan,
  keputusan, catatan, dan waktu server dalam `approvalHistory` di luar payload
  isian. Nama/role adalah snapshot saat keputusan, bukan nama terkini saja.
- Status, timestamp versi, dan scope diperiksa dalam update yang sama. Dua
  keputusan bersamaan tidak dapat menimpa atau melewati tahap.
- Persetujuan adalah catatan keputusan akun. Tanda tangan tetap manual; tidak
  ada tanda tangan digital, gambar tanda tangan, atau klaim tanda tangan elektronik.

## Aktivasi dan tampilan

- `getActiveWorkPermit` hanya menerima `APPROVED` dengan tiga keputusan persetujuan
  berurutan dan periode bulan berjalan, milik ES sesi. Berlaku sama untuk halaman
  rutin/non-rutin, pengiriman laporan dan tindak lanjut 014/065.
- Browser storage dan parameter URL bukan bukti persetujuan. Tanpa status server
  yang aktif, kartu pekerjaan tetap terkunci. Pengiriman dari tab lama diperiksa
  ulang oleh server.
- Detail dan riwayat menampilkan tahap saat ini serta nama, fungsi, keputusan,
  catatan dan waktu setiap persetujuan. Izin disetujui bulan depan disebut belum
  aktif, bukan kedaluwarsa atau aktif bulan ini.
- Riwayat ES di `/dashboard/work-permits/history` tetap dibatasi NIK sesi dan
  dipaginasi 10 per halaman. Detail berdasarkan kode selalu mode baca.
- Form memakai bulan target yang dipilih, termasuk pengajuan bulan depan. Izin
  baru tidak menyalin isian/status izin lama. Nomor dokumen dan kolom sumber
  dipertahankan; periode tidak dibatasi tanggal 20. Tanggal kalender yang dipilih BES disimpan sebagai tanggal kerja dan menjadi bagian tanggal pada nomor izin baru. Periode aktif mengikuti kalender WIB.

## Migrasi dan konfigurasi

Skema di `docs/01_Architecture/10_Data_Models.md`. Migration menambahkan dua status,
`approvalHistory`, snapshot nama pemohon, dan tabel pemetaan approver. Izin lama
`APPROVED` yang hanya memiliki keputusan Manager dikembalikan ke `PENDING_P2K3`;
keputusan Manager lama disalin hanya jika NIK dan waktu tercatat. Tidak ada
persetujuan P2K3/Sekretaris buatan. Jika bukti Manager tidak lengkap, kembali ke
`PENDING_MANAGER`. Dokumen lama `COMPLETED` tetap historis, tidak aktif.

Konfigurasi (setelah migration pada environment terkonfirmasi):

```powershell
pnpm exec tsx scripts/configure-work-permit-approver.ts --environment development --branch BANDUNG --nik <NIK_AKUN> --role P2K3
pnpm exec tsx scripts/configure-work-permit-approver.ts --environment development --branch BANDUNG --nik <NIK_AKUN> --role SECRETARY
```

`--role DELEGATE` adalah alternatif tahap P2K3; `--disable` menonaktifkan penugasan
persis tersebut. Script memverifikasi akun dan cabang, tidak membuat akun baru.
Database tidak diubah atau migration diterapkan tanpa konfirmasi environment.

## P1 MED/003: Alur Email Outbox, Persetujuan Token, & Integrasi Checklist

Keputusan P1 MED/003:
1. **Dua Kontak Approver Cabang**:
   - Cabang Warehouse (seperti WH Parung) memiliki penugasan kontak terdaftar: satu kontak untuk tahap `P2K3` / `DELEGATE`, dan satu kontak untuk `SECRETARY`.
   - Data kontak menyimpan nama, email, cabang, NIK, dan approvalRole pada tabel `WorkPermitApprover` (didukung akun `User` terkait) sehingga dapat dikelola melalui dashboard Admin di iterasi berikutnya.
2. **Kotak Keluar Email Demo (Simulasi seperti VP)**:
   - Ketika BNM Manager menyetujui izin kerja (`PENDING_MANAGER` → `PENDING_P2K3`), sistem membuat email simulasi di tabel `DemoOutboxEmail` untuk kontak `P2K3` / `DELEGATE` yang ditugaskan di cabang pemohon.
   - Email berisi detail pengajuan (pemohon, lokasi, kegiatan, periode, APD) dan tombol **Buka halaman persetujuan** yang memuat tautan ber-token aman.
   - Setelah P2K3/Delegate menyetujui (`PENDING_P2K3` → `PENDING_SECRETARY`), sistem membuat email simulasi berikutnya untuk kontak `SECRETARY` cabang tersebut dengan token baru.
   - Riwayat pengiriman email dapat dipantau melalui halaman Kotak Keluar Email Demo (`/demo/outbox`).
   - Halaman, aksi reset, dan pengiriman simulasi hanya aktif saat `SPARTA_APP_MODE=demo` pada database development. Pengiriman memakai kontak penugasan yang tersedia di database cabang pemohon.
   - Kotak keluar dibuka dari halaman pilih akun. Daftar email dan isi pesan tampil berdampingan di desktop. Pada layar sempit, pengguna memilih pesan dari daftar untuk membuka isi pesan.
   - Untuk memulai demo baru, skrip `scripts/reset-wh-demo-work-permit.ts` dapat menampilkan pengajuan aktif milik akun BES demo WH Parung. Menambahkan `--permit-code` dan `--apply` membersihkan pengajuan demo yang dipilih beserta token dan pesan terkait. Skrip melindungi pengajuan yang selesai dan pengajuan yang terhubung ke laporan.
3. **Halaman Persetujuan Berbasis Token (Tanpa Login)**:
   - Akses via `/work-permits/approve?token=<TOKEN>`.
   - Menampilkan detail satu dokumen MED/003: pemohon, lokasi, periode, kegiatan, APD, dan riwayat persetujuan sebelumnya.
   - Halaman menampilkan urutan tahap dalam bahasa operasional. Panel keputusan berada di samping ringkasan di desktop dan setelah detail di perangkat seluler.
   - Akun penerima harus masih memiliki penugasan aktif untuk tahap dan cabang pemohon saat tautan dibuka atau keputusan disimpan.
   - Tautan memiliki masa berlaku (`expiresAt`) dan bersifat *single-use* (hanya dapat digunakan untuk satu kali keputusan).
   - Dilindungi transaksi atomik: klik ulang atau dua permintaan bersamaan tidak akan mencatat keputusan ganda atau memicu pengiriman email duplikat.
   - Jika token sudah pernah dipakai, halaman menampilkan konfirmasi waktu dan keputusan yang telah dicatat sebelumnya.
4. **Notifikasi BES & Tampilan Nomor Izin di Checklist**:
   - Setelah Sekretaris P2K3 menyetujui tahap terakhir, izin yang sudah memiliki bukti ACC seluruh tahapan muncul di lonceng notifikasi akun BES pemohon. Persetujuan tahap antara dan pengajuan yang ditolak tidak menghasilkan notifikasi persetujuan akhir.
   - Dashboard memuat jumlah notifikasi belum dibaca dari data izin kerja. Lonceng memuat notifikasi ketika dibuka dan menyegarkan daftar berkala saat dashboard terlihat.
   - Panel notifikasi memakai tab **Belum dibaca** dan **Riwayat**. Saat BES menandai notifikasi sebagai dibaca, status baca tersimpan dan item langsung berpindah ke Riwayat. Riwayat menampilkan waktu baca terbaru terlebih dahulu, dengan tautan detail izin dan PDF. Riwayat dapat dilihat kembali setelah refresh atau login di perangkat lain.
   - Notifikasi akhir dan kartu izin aktif memiliki akses ke PDF MED/003 yang dapat diunduh BES pemohon. Detail izin dari riwayat juga menyediakan unduhan untuk izin yang sudah mendapat ACC ketiga tahap. PDF dihasilkan dari isi izin dan audit nama serta waktu persetujuan. Izin bulan depan yang sudah disetujui dapat diunduh tanpa mengaktifkan checklist sebelum periodenya.
   - Kartu izin BES menggunakan komponen shadcn dengan permukaan netral, indikator status, dan tindakan yang sesuai. Notifikasi persetujuan tersedia di lonceng.
   - Saat BES membuka form checklist rutin (dari To-Do) maupun perbaikan/non-rutin (dari Buat Laporan), nomor MED/003 aktif otomatis ditampilkan secara jelas.
   - Hubungan laporan dengan izin kerja tersimpan persisten melalui `ChecklistReport.workPermitId` sehingga tetap terlihat saat detail laporan dibuka kembali.
   - Pemeriksaan keabsahan izin aktif tetap diwajibkan untuk pekerjaan rutin maupun non-rutin (perbaikan by AHO / Temuan ES).

## Validasi

Tes perilaku mencakup urutan tiga tahap, substitusi Delegate, penolakan,
self-approval dan lintas cabang, keputusan kedaluwarsa, nama/role/waktu audit,
izin lama tidak lengkap, pergantian bulan/tahun, pengajuan awal, dan gating
rutin/non-rutin tanpa storage/URL bypass. Jalankan Prisma validate/generate,
typecheck, serta tes terfokus sebelum penyelesaian.
