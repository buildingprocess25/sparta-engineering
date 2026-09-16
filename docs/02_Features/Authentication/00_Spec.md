# SPARTA Engineering - Authentication & SSO Specification

## 1. Pendahuluan
Modul SPARTA Engineering tidak memiliki sistem manajemen *password* maupun form login secara mandiri. Semua proses autentikasi (pengecekan kredensial) ditangani oleh sistem terpusat, yaitu **SPARTA Login Portal** (`login-sparta`). Dokumen ini menjabarkan spesifikasi alur autentikasi dan manajemen sesi lokal untuk modul Engineering.

## 2. Alur Pengguna (User Flow)
1. **Unauthenticated Visit**: Jika user yang belum memiliki sesi aktif mengunjungi URL privat (seperti `/dashboard`), mereka akan di-redirect ke `/login`.
2. **Landing Page (`/`)**: Menampilkan pengenalan modul SPARTA Engineering. Terdapat tombol "Login" yang mengarah ke `/login`.
3. **Login Page (`/login`)**: Halaman statis berdesain SPARTA Engineering dengan tombol tunggal: "Masuk via SPARTA SSO".
4. **SSO Redirect**: Klik tombol SSO akan memicu redirect browser ke `<SPARTA_API_URL>/v1/modules/engineering/launch`.
5. **SSO Callback (`/auth/sso/callback`)**:
   - `login-sparta` me-redirect user kembali dengan membawa `?token=...`.
   - Modul Engineering menukar token tersebut via API POST ke `<SPARTA_API_URL>/v1/sso/exchange`.
   - Jika valid, modul akan menerima data `email` pengguna.
   - Modul mencari email tersebut di tabel `User` lokal. Jika ditemukan, sesi lokal dibuat.
6. **Dashboard (`/dashboard`)**: Pengguna dapat mengakses modul.

## 3. Manajemen Sesi Lokal (Session Management)
Sesuai dengan arsitektur `sparta-maintenance`, sesi lokal diatur secara mandiri menggunakan **JSON Web Token (JWT)**.
- **Library**: `jose`
- **Secret**: Diambil dari `.env` (`SESSION_SECRET`).
- **Penyimpanan**: *HttpOnly, Secure, SameSite=Lax* Cookie (misal: `sparta_engineering_session`).
- **Proteksi**: File `middleware.ts` diletakkan di *root* proyek untuk mem-parsing token dari cookie, memvalidasinya dengan `SESSION_SECRET`, dan melindungi rute `/dashboard` dan turunannya.

## 4. Ekspor Data Pengguna (SSO User Sync)
Mengingat *database* SSO berada di `login-sparta` dan dikelola oleh tim yang sama, diperlukan sinkronisasi data *user*.
1. **Script Ekspor**: Pembuatan script `scripts/export-users-sso.ts` di modul `sparta-engineering` yang mengambil seluruh `User` dan mengonversinya menjadi `user-export-template.csv` sesuai standar kontrak SSO.
2. **Import ke SPARTA Portal**: Script ekspor akan dilengkapi dengan mekanisme atau instruksi langsung untuk memasukkan *(seed/import)* CSV tersebut ke dalam database `login-sparta`. Hal ini menjamin bahwa pengguna yang baru saja kita injeksi di modul *Engineering* dapat segera dikenali oleh portal terpusat.

## 5. Variabel Lingkungan (`.env`)
Implementasi tidak boleh di-hardcode. Harus ada variabel berikut:
- `SESSION_SECRET`: Kunci enkripsi untuk JWT sesi lokal.
- `SPARTA_API_URL`: URL utama menuju SPARTA Login Portal.
- `APP_BASE_URL`: URL lokal modul Engineering.

## 6. Penanganan Error (Error Handling)
- Jika token SSO tidak valid atau kadaluwarsa (400 `SSO_TOKEN_EXPIRED`), tampilkan pesan *error* "Token SSO kadaluwarsa" di halaman `/login`.
- Jika email pengguna berhasil diverifikasi dari SSO tetapi tidak ada di database lokal Engineering, tampilkan pesan *error* "Akun Anda tidak memiliki akses ke modul Engineering".
