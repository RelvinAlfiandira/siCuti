========================================================================
                      SISTEM INFORMASI CUTI GURU
                        Dokumentasi & Setup Project
========================================================================

1. DESKRIPSI PROJECT
--------------------
Sistem Informasi Cuti Guru adalah aplikasi berbasis web yang dirancang 
untuk mengelola dan memproses pengajuan cuti guru secara terstruktur. 
Sistem ini dilengkapi dengan manajemen kuota cuti, alur persetujuan 
(approval workflow) oleh Kepala Sekolah, penyesuaian jadwal mengajar, 
hingga pencatatan log eksekusi sistem.

Teknologi Utama (Tech Stack):
- Runtime / Language : Node.js (JavaScript / TypeScript)
- Database           : PostgreSQL
- ORM                : Prisma ORM
- Authentication     : Bcryptjs / NextAuth (Auth.js)


2. PRASYARAT SISTEM (PREREQUISITES)
-----------------------------------
Sebelum menjalankan aplikasi, pastikan perangkat telah terinstall:
1. Node.js (Versi 18.x atau lebih baru)
2. NPM (Node Package Manager)
3. PostgreSQL Service (Lokal atau Cloud PostgreSQL Instance)


3. KONFIGURASI ENVIRONMENT VARIABLES (.env)
-------------------------------------------
Buat file bernama `.env` pada root direktori project, lalu isi dengan 
konfigurasi berikut:

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/NAMA_DATABASE?schema=public"
NEXTAUTH_SECRET="buat-string-rahasia-bebas-di-sini"
NEXTAUTH_URL="http://localhost:3000"

Catatan: 
Sesuaikan USERNAME, PASSWORD, PORT (default: 5432), dan NAMA_DATABASE 
dengan kredensial PostgreSQL lokal Anda.


4. LANGKAH-LANGKAH MENJALANKAN PROJECT
---------------------------------------

Langkah 1: Instalasi Dependensi
-------------------------------
Buka terminal pada direktori utama project, lalu jalankan:
> npm install

Langkah 2: Sinkronisasi Database (Prisma Migration / Push)
----------------------------------------------------------
Jalankan perintah ini untuk membaca file `schema.prisma` dan membuat 
seluruh struktur tabel di database PostgreSQL secara otomatis:
> npx prisma db push

Langkah 3: Jalankan Seeding Data Awal
------------------------------------
Isi database dengan data akun awal (Kepala Sekolah & Guru) serta 
kuota cuti default dengan menjalankan skrip seed:
> node prisma/seed.js

Langkah 4: Menjalankan Server Development
-----------------------------------------
Jalankan server aplikasi di lingkungan lokal:
> npm run dev

Akses aplikasi melalui browser di alamat: http://localhost:3000


5. INFORMASI AKUN DEFAULT (HASIL SEEDING)
------------------------------------------
Setiap akun dummy hasil seeding menggunakan password default: password123

[1] Role: KEPALA_SEKOLAH
    - Nama  : Drs. Ahmad Fauzi, M.Pd.
    - Email : ks@sekolah.sch.id
    - NIP   : 196501011990011001
    - Akses : Verifikasi, menyetujui (approve), & menolak (reject) cuti.

[2] Role: GURU (Matematika)
    - Nama  : Budi Santoso
    - Email : budi@sekolah.sch.id
    - NIP   : 198003012005011002
    - Akses : Mengajukan cuti, cek sisa kuota, & riwayat pengajuan.

[3] Role: GURU (Bahasa Indonesia)
    - Nama  : Sri Wahyuni
    - Email : sri@sekolah.sch.id
    - NIP   : 198505152008012003

[4] Role: GURU (IPA)
    - Nama  : Eko Prasetyo
    - Email : eko@sekolah.sch.id
    - NIP   : 199001202015011004


6. UTILITAS MANAGEMEN DATABASE (PRISMA STUDIO)
-----------------------------------------------
Untuk melihat, memantau, atau mengedit data tabel PostgreSQL secara 
visual melalui GUI Web, jalankan perintah:
> npx prisma studio

Aplikasi Dashboard Prisma Studio akan terbuka secara otomatis pada 
alamat: http://localhost:5555


========================================================================
                        Dibuat untuk Dokumentasi Internal
========================================================================