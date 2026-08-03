# 🍽️ Backend — RM Siantar Minang Jaya

REST API Backend untuk Sistem Informasi Pemesanan Menu Rumah Makan Siantar Minang Jaya, dilengkapi integrasi Chatbot WhatsApp dan mode pemesanan via QR Code meja.

---

## 🧰 Tech Stack

| Teknologi | Keterangan |
|---|---|
| **NestJS** | Framework Node.js berbasis TypeScript |
| **TypeScript** | Bahasa pemrograman utama |
| **Prisma ORM** | ORM untuk interaksi database |
| **MySQL / MariaDB** | Database relasional |
| **JWT + Passport.js** | Autentikasi & otorisasi |
| **Socket.io** | Komunikasi real-time (WebSocket) |
| **Baileys (WhatsApp)** | Integrasi bot WhatsApp |
| **bcryptjs** | Enkripsi password |
| **qrcode** | Generator QR Code meja |

---

## 🔐 Role & Otorisasi

| Role | Deskripsi |
|---|---|
| `SUPERADMIN` | Akses penuh termasuk konfigurasi sistem & audit log |
| `ADMIN` | Kelola menu, user, meja, promo, monitoring order |
| `KASIR` | Verifikasi pembayaran, input cash, cetak struk |
| `KITCHEN` | Lihat & update status pesanan masuk (real-time) |
| `DRIVER` | Lihat order delivery, update status pengiriman |
| `CUSTOMER` | Melakukan pemesanan, tracking, riwayat transaksi |
| `GUEST` | User tanpa login via scan QR Code meja |

---

## 📘 Panduan Instalasi & Penggunaan (Manual Book)

### 📋 Prasyarat

Pastikan perangkat Anda sudah terinstal:

| Kebutuhan | Versi Minimal | Cek Versi |
|---|---|---|
| **Node.js** | v18+ | `node -v` |
| **npm** | v9+ | `npm -v` |
| **MySQL / MariaDB** | v8 / v10.4+ | (lihat Laragon / phpMyAdmin) |
| **Git** | Terbaru | `git --version` |

> Jika menggunakan **Laragon**, MySQL/MariaDB sudah tersedia secara otomatis.

---

### ⚙️ Instalasi & Setup

#### 1. Clone / Buka Project
Buka folder project backend di local environment Anda.

#### 2. Install Dependensi
```bash
npm install
```

#### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan konfigurasi koneksi database dan JWT secret:
```env
DATABASE_URL="mysql://root:@localhost:3306/db_rm_siantar_minang"
JWT_SECRET="your_super_secret_jwt_key_here"
PORT=3001
```

#### 4. Buat Database
Buka **phpMyAdmin** (via Laragon) atau MySQL client lain, lalu buat database baru:
```sql
CREATE DATABASE db_rm_siantar_minang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 5. Setup Prisma & Migrasi Database
Generate Prisma client dan push skema ke database:
```bash
npx prisma generate
npx prisma db push
```

#### 6. Jalankan Database Seeder
Isi database dengan data awal (akun default, menu contoh, dll):
```bash
npx prisma db seed
```

#### 7. Jalankan Server (Development)
```bash
npm run start:dev
```
Jika berhasil, server akan berjalan di `http://localhost:3001`.

---

### 🔑 Akun Default (Hasil Seeder)

Semua akun menggunakan password: **`password123`**

#### Superadmin
| Email | Role |
|---|---|
| `muhbintang650@gmail.com` | SUPERADMIN |
| `superadmin2@rmsiantar.com` | SUPERADMIN |

#### Staff Operasional
| Email | Role |
|---|---|
| `admin1@rmsiantar.com` | ADMIN |
| `kasir1@rmsiantar.com` | KASIR |
| `kitchen1@rmsiantar.com` | KITCHEN |
| `driver1@rmsiantar.com` | DRIVER |

#### Customer Contoh
| Email | Role |
|---|---|
| `customer1@example.com` | CUSTOMER |
| `customer2@example.com` | CUSTOMER |
| `customer3@example.com` | CUSTOMER |

---

### 🛠️ Perintah Berguna

#### Reset & Isi Ulang Database
```bash
npx prisma migrate reset
```
> Perintah ini akan menghapus semua data, drop semua tabel, membuat ulang tabel, dan menjalankan seeder otomatis.

Alternatif Reset (tanpa migrasi):
```bash
npx prisma db push --force-reset
npx prisma db seed
```

#### Lihat Database via Prisma Studio (GUI)
```bash
npx prisma studio
```
Buka browser di `http://localhost:5555` untuk mengelola data secara visual.

### 🚀 Panduan Deployment Production (Backend)

Untuk menjalankan backend di lingkungan production (seperti VPS Linux / Windows Server), ikuti langkah-langkah berikut:

#### 1. Setup Environment Variables (`.env`)
Pastikan file `.env` di server production menggunakan konfigurasi production, terutama database hosting dan JWT Secret yang kuat:
```env
PORT=3001
DATABASE_URL="mysql://username_prod:password_prod@host_prod:3306/db_rm_siantar_minang"
JWT_SECRET="isi_dengan_string_random_yang_sangat_panjang_dan_aman"
```

#### 2. Jalankan Build Project
Build project NestJS menjadi file JavaScript yang telah dioptimasi di folder `/dist`:
```bash
npm run build
```

#### 3. Sinkronisasi Database (Prisma)
Jalankan migrasi skema database ke database production Anda:
```bash
npx prisma generate
npx prisma db push
```
*(Catatan: Jika Anda menggunakan prisma migrate, gunakan `npx prisma migrate deploy`)*

#### 4. Siapkan Folder Uploads & Izin Akses
Buat folder untuk menampung gambar menu dan banner promo yang diupload oleh admin, serta pastikan folder tersebut memiliki izin tulis (write permission):
```bash
mkdir -p uploads/menus uploads/promos
```

#### 5. Kelola Server Menggunakan PM2 (Process Manager)
Gunakan PM2 agar aplikasi backend NestJS tetap berjalan di background dan otomatis restart jika server reboot atau aplikasi crash:

```bash
# Install PM2 secara global (jika belum)
npm install -g pm2

# Jalankan aplikasi NestJS menggunakan PM2
pm2 start dist/src/main.js --name "rm-siantar-backend"

# Simpan list proses PM2 agar otomatis berjalan saat OS startup
pm2 save
pm2 startup
```

Beberapa perintah PM2 yang berguna:
```bash
pm2 status                     # Melihat status aplikasi yang berjalan
pm2 logs rm-siantar-backend    # Melihat log aktivitas secara real-time
pm2 restart rm-siantar-backend # Restart aplikasi
pm2 stop rm-siantar-backend    # Menghentikan aplikasi
```

#### 6. Konfigurasi Reverse Proxy Nginx (Opsional / Direkomendasikan)
Agar API dapat diakses secara aman lewat port 80/443 (HTTP/HTTPS) dan mendukung SSL, gunakan Nginx sebagai reverse proxy. Contoh konfigurasi server block Nginx:
```nginx
server {
    listen 80;
    server_name api.rmsiantar.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads/ {
        alias /path/to/backend-kasir-warung-makan/uploads/;
        access_log off;
        expires max;
    }
}
```

---

### ❓ Troubleshooting

- **Error: `Can't connect to database`**: Pastikan MySQL berjalan di Laragon dan database URL sudah sesuai di `.env`.
- **Error: `PORT already in use`**: Ganti nilai `PORT` di `.env` ke angka lain (misal `3002`).
- **WhatsApp Bot tidak terhubung**: Hubungkan via scan QR WhatsApp pada dashboard admin.

---

## 🗄️ Skema Database

### 1. `users`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID unik user |
| `name` | varchar | Nama lengkap |
| `email` | varchar | Email (unique) |
| `password` | varchar | Password (hashed) |
| `phone` | varchar | Nomor HP (opsional) |
| `role` | enum | `SUPERADMIN`, `ADMIN`, `KASIR`, `KITCHEN`, `DRIVER`, `CUSTOMER` |
| `created_at` | datetime | Waktu dibuat |

### 2. `categories`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID kategori |
| `name` | varchar | Nama kategori (Makanan, Minuman, dll) |
| `created_at` | datetime | Waktu dibuat |

### 3. `menus`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID menu |
| `category_id` (FK → categories) | bigint | Kategori menu |
| `name` | varchar | Nama menu |
| `price` | decimal | Harga |
| `description` | text | Deskripsi menu |
| `image` | varchar | Path foto menu |
| `is_available` | boolean | Ketersediaan menu |
| `created_at` | datetime | Waktu dibuat |

### 4. `tables`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID meja |
| `name` | varchar | Nama/nomor meja |
| `qr_code` | text | URL / data QR Code |
| `status` | enum | `aktif`, `nonaktif` |

### 5. `guest_sessions`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID sesi tamu |
| `table_id` (FK → tables) | bigint | Meja yang digunakan |
| `token` | varchar | Token sesi guest |
| `created_at` | datetime | Waktu sesi dibuat |

### 6. `carts`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID cart |
| `user_id` (FK → users) | bigint | Pemilik cart |

### 7. `cart_items`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID item |
| `cart_id` (FK → carts) | bigint | Relasi ke cart |
| `menu_id` (FK → menus) | bigint | Menu yang dipilih |
| `qty` | int | Jumlah |
| `note` | text | Catatan khusus (opsional) |

### 8. `orders`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID pesanan |
| `user_id` (FK → users) | bigint | Customer (jika login) |
| `table_id` (FK → tables) | bigint | Meja (dine-in) |
| `guest_id` (FK → guest_sessions) | bigint | Sesi guest (jika tanpa login) |
| `order_type` | enum | `dine-in`, `take-away`, `delivery` |
| `order_source` | enum | `app`, `chatbot`, `qr` |
| `status` | enum | `pending`, `confirmed`, `cooking`, `ready`, `delivering`, `completed`, `cancelled` |
| `total_price` | decimal | Total harga |
| `created_at` | datetime | Waktu pesan |

### 9. `order_items`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID item |
| `order_id` (FK → orders) | bigint | Relasi ke pesanan |
| `menu_id` (FK → menus) | bigint | Menu yang dipesan |
| `qty` | int | Jumlah |
| `price` | decimal | Harga saat order |
| `note` | text | Catatan khusus |

### 10. `payments`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID pembayaran |
| `order_id` (FK → orders) | bigint | Relasi ke pesanan |
| `method` | enum | `cash`, `transfer`, `e-wallet` |
| `status` | enum | `unpaid`, `paid`, `refunded` |
| `amount` | decimal | Jumlah dibayarkan |
| `paid_at` | datetime | Waktu pembayaran |

### 11. `deliveries`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID pengiriman |
| `order_id` (FK → orders) | bigint | Pesanan yang dikirim |
| `driver_id` (FK → users) | bigint | Driver yang ditugaskan |
| `address` | text | Alamat tujuan |
| `status` | enum | `assigned`, `delivering`, `done` |

### 12. `promos`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID promo |
| `code` | varchar | Kode voucher |
| `discount` | decimal | Besaran diskon (%) |
| `min_order` | decimal | Minimum order |
| `expired_at` | datetime | Tanggal kedaluwarsa |
| `is_active` | boolean | Status aktif |

### 13. `reviews`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID review |
| `user_id` (FK → users) | bigint | Pemberi review |
| `order_id` (FK → orders) | bigint | Pesanan yang direview |
| `rating` | int | Bintang (1–5) |
| `comment` | text | Komentar |
| `created_at` | datetime | Waktu review |

### 14. `chatbot_sessions`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID sesi chatbot |
| `user_id` (FK → users) | bigint | User terkait |
| `session_id` | varchar | ID sesi WhatsApp |
| `created_at` | datetime | Waktu sesi |

### 15. `audit_logs`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` (PK) | bigint | ID log |
| `user_id` (FK → users) | bigint | User yang melakukan aksi |
| `action` | varchar | Aksi yang dilakukan |
| `entity` | varchar | Nama entity (tabel) |
| `entity_id` | bigint | ID entity |
| `created_at` | datetime | Waktu aksi |

---

## 📡 API Endpoints

Base URL: `http://localhost:3001`

### 🔐 AUTH
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Daftar akun baru |
| `POST` | `/auth/login` | Public | Login & mendapat JWT token |
| `GET` | `/auth/me` | Authenticated | Profil user yang sedang login |

### 🍽️ MENU
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/menus` | Public | Daftar semua menu |
| `GET` | `/menus/:id` | Public | Detail menu berdasarkan ID |
| `POST` | `/menus` | ADMIN | Tambah menu baru (dengan upload foto) |
| `PUT` | `/menus/:id` | ADMIN | Edit menu |
| `DELETE` | `/menus/:id` | ADMIN | Hapus menu |

### 🗂️ CATEGORY
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/categories` | Public | Daftar semua kategori |
| `POST` | `/categories` | ADMIN | Tambah kategori baru |
| `PUT` | `/categories/:id` | ADMIN | Edit kategori |
| `DELETE` | `/categories/:id` | ADMIN | Hapus kategori |

### 🛒 CART
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/cart` | Authenticated | Lihat isi keranjang |
| `POST` | `/cart/add` | Authenticated | Tambah item ke keranjang |
| `PUT` | `/cart/update` | Authenticated | Update jumlah item |
| `DELETE` | `/cart/remove` | Authenticated | Hapus item dari keranjang |

### 📦 ORDERS
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/orders` | Authenticated / Guest | Buat pesanan baru |
| `GET` | `/orders` | ADMIN / KASIR / KITCHEN | Daftar semua pesanan |
| `GET` | `/orders/:id` | Authenticated | Detail pesanan |
| `PUT` | `/orders/:id/status` | ADMIN / KITCHEN | Update status pesanan |
| `GET` | `/orders/my` | CUSTOMER | Riwayat pesanan milik sendiri |

### 💳 PAYMENTS
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/payments` | KASIR | Catat pembayaran |
| `GET` | `/payments/:order_id` | Authenticated | Detail pembayaran per order |
| `PUT` | `/payments/:id/status` | KASIR | Update status pembayaran |

### 🚚 DELIVERY
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/deliveries` | DRIVER / ADMIN | Daftar pengiriman aktif |
| `POST` | `/deliveries/assign` | ADMIN | Tugaskan driver ke order |
| `PUT` | `/deliveries/status` | DRIVER | Update status pengiriman |

### 🪑 TABLES
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/tables` | Public | Daftar meja |
| `POST` | `/tables` | ADMIN | Tambah meja baru |
| `GET` | `/tables/:id/qr` | ADMIN | Generate / tampilkan QR Code meja |
| `PUT` | `/tables/:id` | ADMIN | Edit data meja |
| `DELETE` | `/tables/:id` | ADMIN | Hapus meja |

### 👤 GUEST SESSION
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/guest/qr/:table_id` | Public | Scan QR meja → buat sesi guest + dapat token |
| `GET` | `/guest/session/:id` | Guest | Lihat detail sesi guest |

### 🎟️ PROMO / VOUCHER
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/promos` | Public | Daftar promo aktif |
| `POST` | `/promos` | ADMIN | Buat promo baru |
| `PUT` | `/promos/:id` | ADMIN | Edit promo |
| `DELETE` | `/promos/:id` | ADMIN | Hapus promo |
| `POST` | `/promos/apply` | Authenticated | Validasi & terapkan kode promo |

### 🤖 CHATBOT (WhatsApp)
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/whatsapp/send` | ADMIN | Kirim pesan manual via WhatsApp |
| `GET` | `/whatsapp/status` | ADMIN | Status koneksi bot WhatsApp |
| `POST` | `/whatsapp/webhook` | Internal | Webhook penerima pesan masuk |

### 📊 DASHBOARD
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/dashboard/stats` | ADMIN / SUPERADMIN | Statistik pendapatan, order, user |
| `GET` | `/dashboard/orders/today` | ADMIN / KASIR | Pesanan hari ini |

### 🔔 NOTIFICATIONS
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | Daftar notifikasi user |
| `PUT` | `/notifications/:id/read` | Authenticated | Tandai notifikasi sudah dibaca |

### 📝 REVIEWS
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `POST` | `/reviews` | CUSTOMER | Beri ulasan & rating pesanan |
| `GET` | `/reviews/menu/:menu_id` | Public | Lihat ulasan per menu |

### 📋 AUDIT LOGS
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/audit-logs` | SUPERADMIN | Lihat semua log aktivitas sistem |

---

## 🔄 Alur Status Pesanan

```
pending → confirmed → cooking → ready → delivering → completed
                                              ↓
                                          cancelled (kapan saja)
```

---

## 🌐 WebSocket Events (Real-time)

| Event | Arah | Deskripsi |
|---|---|---|
| `order:new` | Server → Client | Pesanan baru masuk |
| `order:status_update` | Server → Client | Status pesanan berubah |
| `kitchen:update` | Server → Kitchen | Notifikasi ke dapur |
| `payment:confirmed` | Server → Client | Pembayaran dikonfirmasi |

---

## 📁 Struktur Upload

```
uploads/
├── menus/      ← Foto menu makanan & minuman
└── promos/     ← Banner gambar promo
```

Akses publik: `http://localhost:3001/uploads/menus/<filename>`
