# Checklist & Approval Workflow

> **Status**: `Active`  
> **Terakhir diperbarui**: 2026-08-31

## User Story

- Sebagai **Engineering Support (ES)**, saya ingin dapat mengisi checklist rutin (bulanan/mingguan) secara digital melalui sistem web, agar tidak perlu lagi menggunakan kertas dan Google Forms.
- Sebagai **ES**, saya ingin dapat melaporkan temuan kerusakan langsung dari form checklist agar dapat segera ditindaklanjuti.
- Sebagai **Engineering Coordinator / Manager / Requester**, saya ingin dapat memverifikasi dan menyetujui (approve) laporan checklist dan perbaikan secara berjenjang di dalam satu sistem yang sama.

## Scope

**Dalam scope:**
- Keputusan awal untuk mengisi atau melewati *Form Ijin Kerja* sebagai langkah opsional/kondisional pada alur ES.
- Form pengisian checklist (Weekly & Monthly).
- Pemilihan Area (Office vs WHC/Gudang).
- Pencatatan status per item (Baik, Clean, Repair, Rusak, Tidak Ada).
- Alur Approval berjenjang.

**Luar scope:**
- Persistensi detail *Form Ijin Kerja* lengkap masih akan dipisahkan ke iterasi berikutnya.

## Aturan Bisnis (Business Rules)

1. **Langkah Awal ES**: Setelah masuk SPARTA, ES melihat pilihan untuk mengisi *Form Ijin Kerja* atau melewatinya jika tidak diperlukan.
2. **Pilihan Jalur Kerja**: Setelah keputusan *Form Ijin Kerja*, ES memilih antara **Checklist** atau **Perbaikan by AHO / Temuan ES**.
3. **Model Pengisian Data**: ES membuat "Dokumen Laporan Baru" (record baru) di dalam sistem setiap kali jadwal checklist tiba.
4. **Alur Approval (Tanpa Kerusakan)**: Jika laporan checklist 100% aman (tidak ada laporan kerusakan), maka proses approval cukup melalui **Coord** dan **Manager**, lalu status menjadi Selesai (Tidak perlu sampai ke Requester).
5. **Alur Approval (Ada Kerusakan)**: Jika terdapat temuan kerusakan, alur akan mengikuti proses yang lebih panjang (ES -> Coord -> Manager -> Requester -> Input PB/PJU -> Selesai).

## UI & Alur Pengguna

- **Route(s)**: `/dashboard`, `/dashboard/checklist`
- **Alur Kasar**:
  1. ES masuk SPARTA.
  2. ES memilih untuk mengisi atau melewati *Form Ijin Kerja*.
  3. ES memilih jalur **Checklist** atau **Perbaikan by AHO / Temuan ES**.
  4. ES pilih Area dan Jenis Form.
  5. ES mengisi matriks kondisi barang.
  6. Submit (membuat Laporan Baru).
  7. Laporan masuk antrean Approval:
     - Jika 100% aman: `Coord -> Manager -> Selesai`
     - Jika ada kerusakan: `Coord -> Manager -> Requester -> Input PB/PJU -> Selesai`

## Data & API

- Model utama yang dibutuhkan: `ChecklistReport`, `ChecklistItem`, `Area`, `User`.
- Status approval: `PENDING_COORD`, `PENDING_MANAGER`, `PENDING_REQUESTER`, `COMPLETED`, `REJECTED`.
*(Detail field akan didokumentasikan lebih lanjut di `docs/01_Architecture/10_Data_Models.md`)*

## FRM_TSM_003 Checklist Ruangan

`FRM_TSM_003` is the first digital checklist form. It is available for Office Monthly and warehouse-family Monthly flows.

The digital condition choices are:
- `BAIK`
- `RUSAK`
- `TIDAK_ADA`

`BAIK` and `RUSAK` require at least one uploaded photo. `TIDAK_ADA` does not require a photo.

Checklist item results are stored as one JSON payload on `ChecklistReport.checklistPayload`; this form does not create one `ChecklistItem` row per item.

Photos are uploaded to Google Drive only after a draft report has been reserved. Photo URLs shown in the application use `/api/photos/[fileId]`.

## ES Checklist UX Refinement

The ES checklist form should follow the interaction pattern of the Sparta
Maintenance checklist reference while keeping SPARTA Engineering's black,
silver, orange, and white visual language.

Required behavior:
- Checklist entry uses a compact mobile-first wizard surface with a header,
  progress summary, search field, category accordion, segmented condition
  controls, and a sticky bottom continue/save action.
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
  `Area: <area name>`.
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
