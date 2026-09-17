# SPARTA Engineering - Authentication Specification

## 1. Pendahuluan
Modul SPARTA Engineering untuk sementara memakai autentikasi lokal berbasis
tabel `User` milik database `sparta-engineering`. Integrasi **SPARTA Login
Portal** (`login-sparta`) dan endpoint SSO yang sudah ada tidak dihapus, tetapi
dinonaktifkan dari jalur login utama sampai integrasi lintas modul dilanjutkan.

Target iterasi ini adalah membuat user dapat login memakai email dan password,
mendapat sesi lokal, lalu diarahkan ke dashboard sesuai role.

## 2. Alur Pengguna (User Flow)
1. **Unauthenticated Visit**: Jika user yang belum memiliki sesi aktif
   mengunjungi URL privat seperti `/dashboard`, mereka di-redirect ke `/login`.
2. **Landing Page (`/`)**: Menampilkan pengenalan modul SPARTA Engineering.
   Tombol "Login" mengarah ke `/login`.
3. **Login Page (`/login`)**: Menampilkan form lokal dengan field:
   - Email
   - Password
4. **Credential Check**:
   - Sistem mencari user berdasarkan `User.email`.
   - Sistem membandingkan password input dengan `User.passwordHash`
     menggunakan `bcryptjs`.
   - Jika valid, sistem membuat sesi lokal berisi `userId`, `email`, dan
     `role`.
5. **Dashboard (`/dashboard`)**: Pengguna diarahkan ke dashboard. Route ini
   membaca role dari session:
   - `ES` melihat dashboard ES yang sudah ada.
   - `COORD`, `MANAGER`, `REQUESTER`, `ADMIN_HO`, dan `SUPER_ADMIN` melihat
     placeholder dashboard role-based sampai dashboard khusus dibuat.
6. **Logout**: Pengguna dapat membuka menu profile/avatar di kanan atas
   dashboard dan memilih `Logout`. Sistem menghapus cookie session lokal lalu
   mengarahkan pengguna ke `/login`.

## 2.1 SSO Pending State

Kode SSO tetap dipertahankan untuk kelanjutan integrasi:

- Route `/auth/sso/callback` tetap ada.
- Environment `SPARTA_API_URL` dan `APP_BASE_URL` tetap didokumentasikan.
- `/login` tidak menampilkan tombol SSO pada iterasi ini.
- Tidak ada redirect otomatis ke `login-sparta` dari jalur login utama.

## 3. Manajemen Sesi Lokal (Session Management)
Sesi lokal diatur secara mandiri menggunakan **JSON Web Token (JWT)**.
- **Library**: `jose`
- **Secret**: Diambil dari `.env` (`SESSION_SECRET`).
- **Penyimpanan**: *HttpOnly, Secure, SameSite=Lax* Cookie (misal: `sparta_engineering_session`).
- **Proteksi**: File `middleware.ts` diletakkan di *root* proyek untuk mem-parsing token dari cookie, memvalidasinya dengan `SESSION_SECRET`, dan melindungi rute `/dashboard` dan turunannya.

## 4. Sinkronisasi Pengguna SSO

Sinkronisasi pengguna ke `login-sparta` sedang dipending bersama integrasi SSO.
Script yang sudah ada boleh tetap berada di repository, tetapi tidak menjadi
bagian dari jalur login aktif pagi ini.

## 5. Variabel Lingkungan (`.env`)
Implementasi tidak boleh di-hardcode. Harus ada variabel berikut:
- `SESSION_SECRET`: Kunci enkripsi untuk JWT sesi lokal.
- `SPARTA_API_URL`: URL utama menuju SPARTA Login Portal.
- `APP_BASE_URL`: URL lokal modul Engineering.
- `LOGIN_DATABASE_URL`: URL database `login-sparta`, hanya dipakai ketika
  sinkronisasi SSO diaktifkan kembali.

## 5.1 Akun Simulasi Head Office

Seed database menyediakan akun simulasi untuk menguji alur login dan dashboard
role-based. Semua akun memakai `branchName` dan `location` bernilai
`HEAD OFFICE`, serta password awal `12345678` yang disimpan sebagai hash
`bcrypt`.

| Role | Email |
|---|---|
| ES | `es@admin.com` |
| COORD | `coord@admin.com` |
| MANAGER | `manager@admin.com` |
| REQUESTER | `requester@admin.com` |
| ADMIN_HO | `admin@admin.com` |

## 6. Penanganan Error (Error Handling)
- Jika email atau password kosong, tampilkan pesan "Email dan password wajib
  diisi."
- Jika email tidak ditemukan atau password salah, tampilkan pesan umum
  "Email atau password tidak sesuai." agar tidak membocorkan keberadaan akun.
- Jika server/database gagal, tampilkan pesan "Login belum bisa diproses.
  Coba lagi beberapa saat."
- Error SSO tetap ditangani oleh callback lama, tetapi tidak dipakai pada jalur
  login aktif.
- Logout harus selalu menghapus session lokal dan kembali ke `/login`.

## 7. Visual Direction

Halaman login wajib mengikuti identitas SPARTA Engineering: hitam, silver/abu,
orange, dan putih. Biru Alfamart tidak menjadi warna dominan pada modul ini.
Login harus terasa seperti tool operasional premium: ringkas, jelas, mudah
dibaca, dan nyaman dipakai di mobile.

Landing page (`/`) mengikuti visual direction yang sama agar tidak terasa
seperti modul berbeda. Logo/brand mark harus dipakai sebagai asset file dari
`public/assets/`, bukan text badge inline, sehingga asset resmi dapat diganti
tanpa mengubah struktur halaman.

Landing page harus memakai copy yang natural untuk user operasional, bukan
bahasa status internal seperti "fokus hari ini" atau "role-based". Hindari kata
"toko" karena modul Engineering dipakai untuk area operasional lebih luas.
Login page juga harus menghindari narasi teknis internal seperti status SSO,
JWT, role routing, atau struktur tabel database. Copy login cukup menjelaskan
bahwa pengguna masuk memakai email dan password akun Engineering.
