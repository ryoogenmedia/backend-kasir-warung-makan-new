# 📘 MANUAL — Backend RM Siantar Minang Jaya

Panduan lengkap instalasi dan penggunaan backend API untuk aplikasi Rumah Makan Siantar Minang Jaya.

---

## 📋 Prasyarat

Pastikan perangkat Anda sudah terinstal:

| Kebutuhan | Versi Minimal | Cek Versi |
|---|---|---|
| **Node.js** | v18+ | `node -v` |
| **npm** | v9+ | `npm -v` |
| **MySQL / MariaDB** | v8 / v10.4+ | (lihat Laragon / phpMyAdmin) |
| **Git** | Terbaru | `git --version` |

> Jika menggunakan **Laragon**, MySQL/MariaDB sudah tersedia secara otomatis.

---

## ⚙️ Instalasi

### 1. Clone / Buka Project

Jika belum ada di lokal, clone repository:

```bash
git clone <URL_REPOSITORY>
cd backend-rm-siantar-minang
```

Atau jika sudah ada, cukup buka folder project.

### 2. Install Dependensi

```bash
npm install
```

Tunggu hingga semua package terinstal.

### 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan konfigurasi:

```env
# Koneksi Database
DATABASE_URL="mysql://root:@localhost:3306/db_rm_siantar_minang"

# JWT Secret (ganti dengan string acak yang kuat)
JWT_SECRET="your_super_secret_jwt_key_here"

# Port server berjalan
PORT=3001
```

> **Tips:** Untuk `DATABASE_URL`, format lengkapnya adalah:
> `mysql://[username]:[password]@[host]:[port]/[nama_database]`
>
> Jika menggunakan Laragon dengan password kosong: `mysql://root:@localhost:3306/db_rm_siantar`

### 4. Buat Database

Buka **phpMyAdmin** (via Laragon) atau MySQL client lain, lalu buat database baru:

```sql
CREATE DATABASE db_rm_siantar_minang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Setup Prisma & Migrasi Database

Generate Prisma client dan push skema ke database:

```bash
npx prisma generate
npx prisma db push
```

### 6. Jalankan Database Seeder

Isi database dengan data awal (akun default, menu contoh, dll):

```bash
npx prisma db seed
```

### 7. Jalankan Server (Development)

```bash
npm run start:dev
```

Jika berhasil, Anda akan melihat output seperti:

```
[NestApplication] Nest application successfully started
Application is running on: http://localhost:3001
```

---

## 🔑 Akun Default (Hasil Seeder)

Semua akun menggunakan password: **`password123`**

### Superadmin
| Email | Role |
|---|---|
| `muhbintang650@gmail.com` | SUPERADMIN |
| `superadmin2@rmsiantar.com` | SUPERADMIN |

### Staff Operasional
| Email | Role |
|---|---|
| `admin1@rmsiantar.com` | ADMIN |
| `kasir1@rmsiantar.com` | KASIR |
| `kitchen1@rmsiantar.com` | KITCHEN |
| `driver1@rmsiantar.com` | DRIVER |

### Customer Contoh
| Email | Role |
|---|---|
| `customer1@example.com` | CUSTOMER |
| `customer2@example.com` | CUSTOMER |
| `customer3@example.com` | CUSTOMER |

> Tersedia hingga `customer30@example.com` dengan riwayat pesanan untuk simulasi.

---

## 🛠️ Perintah Berguna

### Reset & Isi Ulang Database

Gunakan perintah ini untuk **menghapus semua data** dan mulai dari awal (cocok untuk testing):

```bash
npx prisma migrate reset
```

> Perintah ini akan: drop semua tabel → buat ulang → jalankan seeder otomatis.

### Alternatif Reset (tanpa migrasi):

```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Lihat Database via Prisma Studio (GUI)

```bash
npx prisma studio
```

Buka browser di `http://localhost:5555` untuk melihat & edit data secara visual.

### Format Kode

```bash
npm run format
```

---

## 🚀 Mode Production

### 1. Build Aplikasi

```bash
npm run build
```

### 2. Buat Folder Upload

```bash
mkdir -p uploads/menus uploads/promos
```

### 3. Jalankan dengan PM2

```bash
# Install PM2 (jika belum)
npm install -g pm2

# Jalankan aplikasi
pm2 start dist/src/main.js --name "rm-siantar-backend"

# Atau gunakan npm script
npm run start:prod
```

### 4. Update Database di Production

Jika ada perubahan skema:

```bash
npx prisma db push
```

---

## 📡 Penggunaan API

### Base URL

```
http://localhost:3001
```

### Autentikasi

Setelah login, sertakan token JWT di setiap request yang membutuhkan autentikasi:

```http
Authorization: Bearer <TOKEN_JWT>
```

### Contoh: Login

**Request:**
```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin1@rmsiantar.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin Staff 1",
    "email": "admin1@rmsiantar.com",
    "role": "ADMIN"
  }
}
```

### Contoh: Ambil Daftar Menu

```http
GET http://localhost:3001/menus
```

### Contoh: Scan QR Meja (Guest Mode)

```http
GET http://localhost:3001/guest/qr/5
```

Response:
```json
{
  "guest_token": "xxxx-yyyy-zzzz",
  "table_id": 5,
  "table_name": "Meja 5"
}
```

---

## 📁 Struktur Folder Upload

Foto menu dan promo disimpan secara lokal:

```
uploads/
├── menus/      ← Foto menu makanan & minuman
└── promos/     ← Banner gambar promo
```

Akses publik: `http://localhost:3001/uploads/menus/<nama-file>`

---

## ❓ Troubleshooting

### Error: `Can't connect to database`
- Pastikan MySQL / MariaDB sudah berjalan (cek Laragon)
- Periksa kembali `DATABASE_URL` di file `.env`

### Error: `PORT already in use`
- Ganti nilai `PORT` di `.env` ke angka lain, misalnya `3002`

### Seeder gagal
- Pastikan database sudah dibuat terlebih dahulu
- Jalankan `npx prisma db push` sebelum `npx prisma db seed`

### WhatsApp Bot tidak terhubung
- Buka browser dan akses endpoint QR WhatsApp
- Scan QR dengan aplikasi WhatsApp di HP
- Pastikan WhatsApp yang digunakan sudah terhubung internet
