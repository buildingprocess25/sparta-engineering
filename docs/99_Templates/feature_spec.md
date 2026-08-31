# Feature Spec Template

Gunakan template ini setiap kali memulai pengerjaan fitur baru.
Salin file ini ke: `docs/02_Features/<NamaFitur>/00_Spec.md`

---

# [Nama Fitur]

> **Status**: `Draft` | `In Review` | `Approved` | `Implemented`  
> **Terakhir diperbarui**: YYYY-MM-DD

## User Story

> Sebagai **[tipe pengguna]**, saya ingin **[aksi/tujuan]** sehingga **[manfaat]**.

## Scope

Apa yang termasuk dalam fitur ini dan apa yang **tidak** termasuk.

**Dalam scope:**
- ...

**Luar scope:**
- ...

## UI & Alur Pengguna

Jelaskan alur dari sudut pandang pengguna. Sertakan wireframe atau deskripsi
setiap halaman/komponen yang terlibat.

- **Route(s)**: `/path/ke/halaman`
- **Komponen utama**: `NamaKomponen`
- **State/interaksi penting**: ...

## Logika & Aturan Bisnis

Jelaskan aturan-aturan penting yang mengatur perilaku fitur ini.

- ...

## Data & API

Jelaskan model Prisma yang digunakan, Server Actions, atau Route Handlers.

| Aksi | Lokasi | Keterangan |
|---|---|---|
| `createX` | `app/.../actions.ts` | Membuat entitas X baru |

### Perubahan Skema Prisma

> Jika ada perubahan pada `prisma/schema.prisma`, dokumentasikan juga di
> `docs/01_Architecture/10_Data_Models.md`.

## Verifikasi

Bagaimana kita tahu fitur ini sudah berjalan dengan benar?

- [ ] ...
- [ ] ...
