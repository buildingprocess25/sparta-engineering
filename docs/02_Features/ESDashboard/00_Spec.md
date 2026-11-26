# ES Dashboard Launcher

> **Status**: `Active`
> **Terakhir diperbarui**: 2026-11-25

## V14 — ES Dashboard & Navigation Enhancement

- Dashboard, tiga pilihan aktivitas, izin kerja, dan empat menu navigasi tetap. Checklist Rutin tetap pusat pengerjaan PIC; General Checklist dan Perbaikan/Temuan tidak berubah.
- `/dashboard/reports` untuk ES adalah daftar laporan sendiri (termasuk draft berkode), pencarian, filter status, jenis PIC/rutin, general dan non-rutin, serta bulan pembuatan. Aksi menggunakan detail laporan existing V13. Role reviewer tetap memakai halaman sebelumnya.
- `/dashboard/activity` menjadi timeline lintas laporan milik ES dengan timestamp pengiriman siap review, approval, revisi, dan pelaksanaan yang valid. Tidak menggunakan `updatedAt` sebagai timestamp historis. Link lama `?tab=completed|overdue` menuju Checklist Rutin dengan filter status; `revision|submitted` menuju Laporan.
- `/dashboard/preventive` menggunakan task PIC yang benar-benar tersimpan, berdasarkan **bulan tanggal target dalam WIB**, bukan laporan incidental atau general tanpa task. Tugas CANCELLED dikecualikan; PENDING melewati target menjadi Terlewat. Tidak membangkitkan tugas historis, mingguan yang belum terbentuk, atau mengubah aturan penugasan. Kuartal/semester dihitung sekali di bulan batas target. Tidak ada target berarti persentase tidak tersedia.
- Sudah Preventif tetap mengikuti `ChecklistTask.COMPLETED` (saat checklist dikirim); menunggu ACC dan belum final ditampilkan terpisah sebagai subset, bukan tambahan denominator. Ketepatan waktu hanya berdasarkan `completedAt` yang tercatat.
- Kalender menampilkan tanggal target, multi-status pada satu tanggal, rincian tugas, dan link laporan milik user. Tren enam bulan berdasarkan task tercatat, bukan snapshot historis: status aktual dapat berubah jika tugas lama diselesaikan belakangan. Statistik bukan seluruh rencana PIC yang belum dibangkitkan.
- Evaluasi membuka `/dashboard/checklists?month=YYYY-MM&status=PENDING|OVERDUE` dengan data target tercatat dan filter awal. Bulan historis/future hanya lihat; bulan berjalan tetap membutuhkan izin kerja aktif dan penugasan aktif. Akses Checklist Rutin biasa tanpa month tetap memakai service existing.
- Backend approval, otorisasi detail/foto/PDF, schema dan validasi existing tidak berubah. Tidak ada data dummy pada UI produksi.
- Verifikasi: unit test metrik, typecheck, docs guard, regression existing, UAT mobile/desktop dan isolasi akun. V14 belum dianggap lulus UAT hanya karena patch diterapkan.

## V14.1 — Light workspace dan Dashboard operasional

- Halaman ES Dashboard, Laporan, Aktivitas, dan Preventif memakai token light workspace yang terisolasi: kartu putih, teks gelap, aksen oranye, warna status semantik. Tema root, halaman reviewer, serta flow bisnis tidak diubah.
- Dashboard menempatkan tiga pilihan aktivitas tepat setelah izin kerja; Checklist Rutin dapat dibuka untuk melihat penugasan, Perbaikan/Temuan dan General Checklist memerlukan izin APPROVED. Jalur laporan baru existing tetap dapat diakses.
- Ringkasan To Do List memakai permukaan terang dan menautkan status tugas ke Checklist Rutin; analitik lengkap tetap di Preventif.
- Tidak ada migration, perubahan API, atau definisi perhitungan preventif.

## V14.2 — Penyempurnaan UX ES

- Dashboard mempertahankan Form Izin Kerja dan tiga pilihan aktivitas. To Do List PIC menjadi ringkasan status dan maksimal tiga tugas prioritas (terlewat dahulu, lalu batas waktu terdekat), dengan akses langsung sesuai izin MED/003. Seluruh daftar, pencarian dan filter tetap berada pada Checklist Rutin. Rekap progres yang duplikat di Dashboard digabungkan ke ringkasan To Do List.
- Laporan tetap berorientasi dokumen, status terkini, tindak lanjut, dokumentasi dan PDF; tidak ada perubahan flow atau approval.
- Aktivitas default tujuh hari kalender terakhir WIB, dengan pilihan hari ini, kemarin, bulan ini, bulan tertentu, atau rentang tanggal (maksimal 366 hari). Server hanya mengirim kejadian dalam rentang yang dipilih, tetap dari laporan milik ES. Filter jenis dan pencarian nomor laporan, objek, kejadian, pelaksana dan catatan; kelompok tanggal lalu laporan, urutan kronologis terlama ke terbaru per kelompok. Kelompok dapat dibuka/tutup, tampil 20 kelompok per halaman muat-lanjut; tautan detail satu kali per kelompok. Timestamp yang hilang tidak diisi. Query histori JSON existing masih membaca laporan milik ES; optimasi indeks/penyimpanan event terpisah bukan scope perubahan ini.
- Kalender Preventif memakai highlight soft hijau (semua selesai checklist), oranye (ada target belum selesai), merah (ada terlewat), tanpa highlight untuk tanggal kosong; prioritas merah > oranye > hijau. Klik tanggal tetap membuka rincian tugas dengan status masing-masing.
- Tren Preventif memberi fokus dan detail target/aktual/belum/terlewat pada hover atau fokus keyboard. Klik bulan memperbarui periode ringkasan, kalender, objek dan evaluasi tanpa memindahkan jendela grafik; dropdown bulan menggeser jendela enam bulan. Periode tanpa target tampil —. Data aktual dan definisi metrik tetap existing.
- Seluruh perubahan menggunakan light workspace ES dan komponen existing. Tidak ada migration, dependency tambahan, perubahan role lain, atau mutasi data laporan.

## V14.3 — Standardisasi shadcn UI (tahap 1)

- Checklist Rutin memakai Button/Input shared; Terlewat menggunakan warna merah konsisten dengan Dashboard dan Preventif. Kontrol tren Preventif memakai Button shared dengan handler filter dan klik existing.
- Konfirmasi keputusan reviewer menggunakan AlertDialog shadcn Base UI shared dan feedback sukses/gagal memakai Alert. Server action, payload, validasi catatan, guard approval dan callback tetap; pengiriman ganda diblokir saat proses berjalan atau sudah berhasil.
- Tidak ada perubahan database, role, routing atau status approval. Build, unit test dan UAT browser wajib diverifikasi di workspace lokal sebelum rilis.

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin saat masuk SPARTA langsung diarahkan ke pilihan kerja utama, agar saya bisa mulai dari Form Ijin Kerja, Checklist, atau Perbaikan by AHO / Temuan ES tanpa mencari menu.
- Sebagai **ES**, saya ingin alur dashboard mengikuti flow operasional yang sudah dipakai di engineering, agar sistem digital terasa sama dengan proses kerja lapangan.

## Scope Phase 1

**Dalam scope:**

- Route `/dashboard` sebagai layar awal ES.
- Route `/dashboard/reports/new` sebagai layar awal pembuatan laporan baru.
- Route `/dashboard/reports/new/checklist/area` untuk pemilihan area checklist.
- Route `/dashboard/reports/new/repair/area` untuk pemilihan area perbaikan / temuan.
- Tampilan mobile-first.
- Pilihan awal untuk mengisi atau melewati Form Ijin Kerja.
- Pilihan workflow: Checklist atau Perbaikan by AHO / Temuan ES.
- Preview pilihan area: Office dan WHC / WH / Depo / Bulky / Store Hub / Gudang Anak.
- Sinyal periode form: Monthly dan Weekly sesuai area.
- Area dan periode diambil dari database, bukan array hardcoded sebagai source of truth.
- Visual direction SPARTA: black, silver, orange, white, luxury, elegant, glassmorphism.
- Polish visual yang natural: gunakan pola mobile app yang familiar (app bar, welcome panel, CTA utama, rekap, stats, bottom navigation) dan hindari glow/dekorasi berlebihan, novelty badge, serta pattern dashboard generik yang terlihat AI-generated.

**Luar scope Phase 1:**

- Submit form ke database.
- Upload foto.
- Matriks checklist detail.
- Approval action untuk Coord, Manager, Requester.
- Input PB/PJU aktual.
- Auth role sungguhan (pengambilan ES NIK untuk tracking).

## Fitur Baru (Phase 2 & Phase 3)

- **Preventive Tracker**: Dashboard menampilkan widget yang merekap persentase penyelesaian tugas preventif berdasarkan `ChecklistReport` (kategori PREVENTIVE) untuk `periodKey` minggu/bulan berjalan.
- **Area Locking (Checklist Rutin)**: Pada flow Checklist Rutin, area yang periode preventifnya sudah lengkap di-lock (disabled dengan status ✅ Selesai).
- **Incidental Freedom**: Flow Perbaikan/Temuan (Incidental) bebas dari locking dan dapat dipilih kapan saja.
- **Todo & Activity Segregation (Phase 3 & UI Revamp)**:
  - Todo List Dashboard (`/dashboard`) hanya menampilkan tugas aktif (`PENDING` yang belum terlewat). Kartu metrik `Sudah Preventif` pada `TodoListPanel` menautkan ke `/dashboard/activity?tab=completed`.
  - Tugas yang sudah `COMPLETED` (`Sudah Preventif`) atau `OVERDUE` (`Terlewat`) dialihkan ke menu Aktivitas (`/dashboard/activity`).
  - Halaman Aktivitas dirancang mobile-first yang bersih dan ergonomis (tanpa shape/banner raksasa seperti dashboard), mengadopsi pola modern mobile list:
    - **Header**: Terintegrasi rapi dengan `DashboardHeader` menampilkan judul "Aktivitas" dan badge/count jumlah riwayat dengan jarak/ritme spasial yang seimbang.
    - **Search Bar**: Berada langsung di bawah header untuk pencarian cepat berdasarkan nama alat, ruangan, kode formulir, atau cabang.
    - **Filter status**. `Terkirim`, `Sudah Preventif`, `Terlewat`, dan `Perlu Revisi` tampil dalam baris tab. Status aktif berwarna oranye, dan status lain memakai latar perak dengan teks gelap. `Perlu Revisi` menampilkan jumlah laporan. Filter `Equipment` dan `Ruangan` tampil untuk tab `Terkirim`, `Sudah Preventif`, dan `Terlewat`.
    - **Looping History Cards**: Setiap riwayat ditampilkan sebagai kartu mandiri (`rounded-xl`, white surface, border halus, soft shadow) dengan icon squircle di sisi kiri, identitas objek, kode form/periode, status badge (emerald `Sudah Preventif` untuk `COMPLETED`, rose untuk `OVERDUE`), label waktu `Preventif:` atau `Batas:`, serta akses langsung ke detail laporan (`reportCode`). Empty state tab `COMPLETED` menampilkan pesan `Belum Ada Hasil Preventif`.
- **Halaman Checklist Rutin PIC (`/dashboard/checklists`)**:
  - Halaman khusus role `ES` (`app/dashboard/checklists/page.tsx` dan `components/es-dashboard/checklist-routine-view.tsx`) untuk memantau, mencari, memfilter, dan membuka tugas preventif PIC (mengecualikan tugas `CANCELLED`).
  - Menyediakan 4 kartu ringkasan (`Total tugas`, `Belum Preventif`, `Sudah Preventif`, `Terlewat`), kolom pencarian, filter dropdown `SpartaFilterSelect` (`Jenis objek`: Equipment/Ruangan, `Periode`: Mingguan/Bulanan/3 Bulanan/6 Bulanan, dan `Area kerja` berdasarkan `areaName` dari `lib/tasks/todo-service.ts`), pill filter status, serta tombol `Reset filter`.
  - Jika izin kerja `MED/003` belum berstatus `APPROVED`, daftar dan riwayat tetap dapat dilihat dengan banner informasi, sedangkan pengerjaan tugas aktif tetap terkunci (`Menunggu izin MED/003`). Akses `/dashboard/reports/new/checklist/area` tanpa `?catalog=general` diarahkan ke `/dashboard/checklists`.
- **Responsive Tablet Dashboard ES (`/dashboard`)**:
  - Halaman dashboard utama ES dibuat responsif adaptif terhadap layar tablet/iPad (`md:max-w-3xl lg:max-w-4xl px-4 sm:px-6 md:px-8`).
  - Welcome Panel & Work Permit Banner memanfaatkan ruang horizontal tablet secara proporsional.
  - To-Do List PIC menampilkan kartu tugas dalam layout 2-kolom (`md:grid-cols-2`) dengan metrik 4-kolom.
  - Bagian bawah menampilkan Rekap Progres Preventif & Stats Laporan berdampingan secara seimbang (`md:grid md:grid-cols-2 md:gap-4`).
  - Bottom Navigation melebar proporsional (`md:max-w-xl`) tanpa membuat tombol terdistorsi.
- **Responsive Tablet Halaman Aktivitas ES (`/dashboard/activity`)**:
  - Halaman riwayat aktivitas ES dibuat responsif adaptif terhadap layar tablet/iPad (`md:max-w-3xl lg:max-w-4xl px-4 sm:px-6 md:px-8`).
  - Kolom pencarian dan tiga filter status mengikuti lebar kontainer tablet.
  - Kartu riwayat aktivitas checklist (`ActivityHistoryView`) ditampilkan dalam tata letak responsif 2-kolom di tablet (`grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3`), memanfaatkan lebar viewport tablet secara optimal tanpa kolom sempit memanjang.
  - Tampilan kosong (empty state) dan total count footer selaras dengan batas kontainer tablet.
- **Responsive Tablet Halaman Mulai Laporan ES (`/dashboard/reports/new`)**:
  - Container shell `ReportFlowShell` dibuat responsif adaptif terhadap layar tablet/iPad (`max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl px-4 sm:px-6 md:px-8`) menggantikan batasan kaku `max-w-lg`.
  - Header kartu hitam ("Mulai Laporan") memanfaatkan ruang horizontal tablet dengan padding lapang (`p-5 sm:p-6 md:p-8`), rounded corner (`rounded-2xl md:rounded-3xl`), dan tipografi proporsional.
  - Kartu putih alur kerja (`NewReportFlow`) menggunakan padding adaptif (`p-4 sm:p-6 md:p-8`).
  - Banner Form Izin Kerja pada Langkah 1 tertata rapi dalam flex horizontal di tablet dengan tombol aksi yang ergonomis.
  - Pilihan aktivitas pada Langkah 2 (**Pilih Aktivitas**) bertransformasi menjadi grid 3-kolom di tablet (`grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4`) dengan kartu mandiri `ReportChoiceCard`: **Checklist Rutin** (`/dashboard/checklists`, selalu dapat dibuka untuk melihat jadwal/status tugas PIC), **Perbaikan / Temuan** (`/dashboard/reports/new/repair/area`), dan **General Checklist** (`/dashboard/reports/new/checklist/area?catalog=general`). Kedua jalur non-rutin diaktifkan setelah izin kerja disetujui.
  - Footer kebijakan keselamatan melebar proporsional mengikuti lebar kontainer tablet.

## Aturan Bisnis

1. ES masuk SPARTA dan melihat flow kerja yang dimulai dari keputusan Form Ijin Kerja.
2. Form Ijin Kerja bersifat opsional/kondisional untuk Phase 1 UI: user dapat memilih "Isi Form" atau "Lewati".
3. Setelah keputusan Form Ijin Kerja, ES memilih salah satu jalur:
   - Checklist
   - Perbaikan by AHO / Temuan ES
4. Setelah memilih jalur, ES memilih area spesifik:
   - Office
   - WHC
   - WH
   - Depo
   - Bulky
   - Store Hub
   - Gudang Anak
5. Office diarahkan ke form Monthly.
6. Area warehouse-family menampilkan pilihan Monthly dan Weekly.

## UI & Alur Pengguna

- **Route:** `/dashboard`, `/dashboard/checklists`
- **Report flow routes:**
  - `/dashboard/reports/new`
  - `/dashboard/reports/new/checklist/area?catalog=general` (katalog General Checklist bulanan; akses tanpa `?catalog=general` dialihkan ke `/dashboard/checklists`)
  - `/dashboard/reports/new/repair/area`
- **Alur Phase 1:**
  1. ES melihat dashboard enterprise shell.
  2. ES menekan `Buat Laporan Baru` dan berpindah ke `/dashboard/reports/new`.
  3. ES memilih `Isi Form Ijin Kerja` atau `Lewati`.
  4. ES memilih `Checklist` atau `Perbaikan by AHO / Temuan ES`.
  5. Sistem memindahkan ES ke halaman pemilihan area sesuai jenis laporan.
  6. ES memilih area spesifik dari data database.
  7. Jika report type adalah Checklist:
     - Office hanya menampilkan Monthly.
     - Area warehouse-family menampilkan Monthly dan Weekly.
  8. CTA `Lanjutkan` aktif setelah pilihan wajib lengkap.

## Implementation Boundaries

- `app/dashboard/page.tsx` hanya boleh menjadi route-level Server Component untuk mengambil data dan menyusun komponen halaman.
- Komponen visual dashboard ES harus berada di `components/es-dashboard/` dan dipisah berdasarkan tanggung jawab: shell, header, welcome panel, guided flow, progress summary, stats, dan bottom navigation.
- State interaktif flow laporan hanya boleh berada di Client Component kecil yang memang membutuhkan event handler. Step utama flow laporan harus menggunakan route page agar URL, browser back, dan refresh tetap bermakna.
- Data area dan periode checklist harus datang dari `lib/es-dashboard-data.ts`, bukan dari array hardcoded di komponen UI.
- Props yang dikirim dari Server Component ke Client Component harus berupa data serializable minimal.

## Data & API

Phase berikutnya menggunakan data database:

- Area diambil dari model `Area` dengan `isActive = true`.
- Opsi period diambil dari relasi `AreaChecklistAvailability`.
- Area berlaku global untuk semua cabang.
- UI tidak menjadikan array hardcoded sebagai source of truth.

## Acceptance Criteria

- `/dashboard` dapat dibuka dan menampilkan ES launcher mobile-first.
- `/` mengarahkan user ke `/dashboard`.
- Tampilan menggunakan palette dan material yang tercatat di `DESIGN.md`.
- File Excel lokal di `data/` tetap ignored dan tidak masuk commit.
- `pnpm lint`, `pnpm typecheck`, dan `pnpm build` lolos.

## Quality Gate

- `app/dashboard/page.tsx` harus tetap tipis dan mudah dibaca.
- Flow pilihan laporan harus tetap data-driven dari database.
- Jika database belum bisa diakses, UI harus menampilkan unavailable state dan tidak crash.
- Refactor visual tidak boleh mengubah business flow tanpa update spec.

## V14.3.1 - V14.3.3B: Code Stabilization and UI Consistency

### Objective
Improve code reliability, React component stability, and TypeScript
type safety without changing the existing business workflow.

### Implementation
- Resolve 65 ESLint errors across dashboard components, services,
  and regression test scripts.
- Resolve TypeScript compilation errors.
- Improve React state synchronization and component lifecycle.
- Standardize work permit payload types and approval history rendering.
- Introduce reusable work permit status synchronization hooks.
- Improve report review modal state management.
- Improve dashboard SLA and report filtering stability.
- Preserve existing Form MED/003, Form 014, and Form 065 workflows.

### Reusable Modules
- lib/work-permits/ui-payload.ts
- lib/work-permits/use-client-work-permit.ts

### Business Workflow Constraints
- Preserve existing routine and non-routine report workflows.
- Preserve existing work permit requirements.
- Preserve existing approval hierarchy and server-side authorization.
- Preserve existing follow-up, revision, and resubmission rules.
- No database schema or migration changes.

### Verification Results
- Git diff check: PASS
- TypeScript: PASS
- ESLint errors: 0 (quiet mode)
- DDD documentation guard unit tests: PASS
- Next.js production build: PASS

### Known Limitations
- Full ESLint warning review remains pending.
- Next.js workspace root warning remains pending.
- Business workflow regression testing and UAT remain pending.

### Next Development
- V14.4: Sonner and global shadcn alert standardization.
- V14.5: Full shadcn component standardization.
- V14.6: Regression testing and UAT.

## V14.4A: Global Shadcn Sonner

- Add a single global Sonner Toaster in the root layout.
- Replace native work permit error and validation alerts with Sonner.
- Retain SpartaAlertDialog for confirmation dialogs.
- Preserve existing approval workflow and authorization.
- No database schema or API contract changes.
- Production build and browser regression tests remain pending.

## V14.4B: Work Permit Action Feedback

- Add loading, success and error feedback using Sonner.
- Update the same toast when an approval request completes.
- Show success only after a successful server response.
- Preserve approval stages, validation and authorization.
- Handle uncertain request outcomes without claiming success.
- Browser regression testing remains pending.

## V14.4C: Work Permit Confirmation Dialog

- Reuse SpartaAlertDialog for approval and rejection confirmation.
- Validate rejection notes before displaying confirmation.
- Prevent duplicate decision submissions using a synchronous lock.
- Preserve existing server actions and approval stages.
- Cancel confirmation without submitting a decision.
- Retain Sonner loading, success, warning and error feedback.
- Browser regression testing remains pending.

## V14.5A: Work Permit Shadcn Controls

- Replace native buttons with the shared shadcn Button.
- Replace search input with shadcn Input.
- Replace approval notes textarea and label with shared components.
- Associate approval notes label with its input.
- Preserve existing event handlers, controlled values and validation.
- Retain existing SPARTA visual styling where possible.
- No changes to database, server actions or approval stages.
- Table and detail dialog migration remain separate tasks.
- Browser regression testing remains pending.

## V14.5B: Work Permit Table and Detail Dialog

- Replace the native work permit table with shared shadcn Table components.
- Preserve table columns, filters, risk indicators and XLSX export.
- Replace the custom detail modal with a controlled shadcn Dialog.
- Add accessible dialog title and description.
- Nest SpartaAlertDialog within the detail dialog.
- Prevent detail dismissal and notes editing while processing decisions.
- Retain existing approval actions and authorization.
- No changes to database schema, API contracts or business stages.
- Browser regression testing remains pending.

## V14.5C: ES Dashboard and Checklist Controls

- Standardize shared checklist controls using shadcn Button,
  Input and Textarea.
- Preserve equipment quantity controls and unit identification.
- Preserve BES and external handler selection.
- Preserve photo preview, photo removal and findings descriptions.
- Standardize Todo List period, object and search controls.
- Retain existing routine task status and work permit gating.
- Preserve required photo and description validation.
- No changes to checklist payloads, server actions or database.
- Browser regression testing remains pending.

## V14.5D: Report Detail and Follow-up Shadcn Controls

- Standardize report detail buttons, inputs, labels and tables.
- Standardize Form 014 and Form 065 editor controls.
- Preserve existing material and spare part calculations.
- Preserve existing equipment identity prefill.
- Preserve PJU, PB, stock pickup and work execution handlers.
- Standardize report review labels and checklist tables.
- Preserve approval, rejection, revision and resubmission rules.
- Preserve PDF synchronization and completion evidence.
- Retain existing report review decision presentation.
- No changes to database schema, API or business workflow.
- Browser regression testing remains pending.

## V14.5E.1: Report Review Confirmation Standardization

- Replace inline report review confirmation with SpartaAlertDialog.
- Preserve existing approval, rejection and revision handlers.
- Preserve mandatory decision note validation.
- Keep validation and server errors visible inside the dialog.
- Prevent dialog dismissal while a decision is processing.
- Preserve existing report refresh and success feedback.
- No changes to database, API or approval stages.
- Browser regression testing remains pending.

## V14.5E.3: Dedicated Checklist and Work Permit Controls

- Standardize controls across 17 dedicated form components.
- Convert 295 native controls to shared shadcn components.
- Preserve existing JSX handlers, values and validation.
- Retain native safety checkboxes and date/time inputs.
- Retain specialized input semantics.
- Preserve photo upload and preview behavior.
- Preserve existing report routing and approval stages.
- Table and custom modal migration remain separate tasks.
- Browser regression testing remains pending.
