# Mudiak — Pemesanan Tiket Bus Sumatera Barat

Website pemesanan tiket bus untuk rute-rute di daerah Sumatera Barat dengan 3 role: **Admin**, **Operator**, dan **Penumpang**.

## Struktur Proyek

```
Mudiak/
├── backend/    # API Server (Express ESM + Prisma ORM + SQLite)
├── frontend/   # Web App (React + Vite + Tailwind CSS)
└── docs/       # Dokumentasi implementasi & tiket
```

## Persyaratan Lingkungan
- Node.js >= 20.x
- npm >= 10.x

## Cara Menjalankan

### 1. Menjalankan Backend

Buka terminal pertama:
```bash
cd backend
npm install
npm run prisma:migrate # otomatis membuat database dev.db dan menjalankan seed
npm run dev
```
Backend API akan berjalan di: `http://localhost:5000`  
Endpoint health check: `http://localhost:5000/health`

### 2. Menjalankan Frontend

Buka terminal kedua:
```bash
cd frontend
npm install
npm run dev
```
Buka browser pada URL yang ditampilkan Vite (biasanya `http://localhost:5173`).

---

## Akun Seed untuk Demo

Semua akun seed menggunakan password yang sama: `password123`

| Role | Nama | Email | Password | Status |
|---|---|---|---|---|
| **Admin** | Administrator Mudiak | `admin@mudiak.id` | `password123` | ACTIVE |
| **Operator** | PO ANS Padang | `ans@mudiak.id` | `password123` | ACTIVE (Terverifikasi) |
| **Penumpang** | Budi Minang | `budi@gmail.com` | `password123` | ACTIVE |

### Data Master Kota (Seed Awal)
1. Padang
2. Bukittinggi
3. Payakumbuh
4. Solok
5. Padang Panjang
6. Batusangkar
