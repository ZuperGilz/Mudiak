# MUDIAK — Tiket Bus Ranah Minang (Frontend Demo)

Proyek **React + JavaScript + Vite** dengan desain responsif berdasarkan 6 contoh antarmuka HTML, screenshot, dan design system yang diberikan pengguna. Termasuk tiga area terpisah: **Pelanggan**, **Operator PO**, dan **Super Admin**.

## Menjalankan di VS Code

Buka folder `mudiak-vite-frontend` dengan VS Code, lalu di terminal jalankan:

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite (biasanya **http://localhost:5173**). Untuk membangun versi produksi statis:

```bash
npm run build
npm run preview
```

Node.js **18+** diperlukan. Browser modern direkomendasikan.

## Akun demo

| Role | Email | Password demo | Setelah login |
|---|---|---|---|
| Pelanggan | `pelanggan@mudiak.test` | `demo12345` | Beranda & Tiket Saya |
| Operator PO | `operator@mudiak.test` | `demo12345` | `/operator` |
| Super Admin | `admin@mudiak.test` | `demo12345` | `/admin` |

Login menggunakan *password demo bersama*, bukan autentikasi sungguhan. Pendaftaran pelanggan langsung masuk ke aplikasi, pendaftaran operator baru berstatus `pending` dan perlu persetujuan Admin; setelah disetujui login dengan password demo `demo12345`. **Jangan gunakan email/password asli di prototipe ini.**

## Halaman

### Pelanggan
- `/` atau `/jadwal`: landing page, cari kota/tanggal, filter PO, urut jadwal, katalog armada
- `/login`, `/daftar`: login tiga role, pendaftaran pelanggan/operator, contoh akun
- `/pesan/:id`: denah 32 kursi interaktif, manifest, data pemesan, checkout
- `/pembayaran`: metode pembayaran simulasi dan konfirmasi pemesanan
- `/tiket-saya`: e-tiket, kode booking, kursi, penumpang, cetak/simpan PDF melalui menu browser, batalkan simulasi
- `/rute`: rute dan mitra PO
- `/bantuan`: FAQ dan form bantuan simulasi
- `/profil`: profil pelanggan dan logout

### Operator PO
- `/operator`: dashboard ringkasan
- `/operator/armada`: tambah/edit/hapus bus dan status kesiapan
- `/operator/jadwal`: buat/edit/tutup jadwal, pemeriksaan konflik bus dalam 3 jam
- `/operator/manifest`: cari penumpang, boarding manual, validasi kode booking, cetak dan ekspor CSV
- `/operator/laporan`: metrik tiket, laporan dan grafik
- `/operator/pengaturan`: profil perusahaan dan akun

### Admin
- `/admin`: KPI, grafik transaksi, distribusi role, persetujuan PO, pemesanan terbaru
- `/admin/pengguna`: cari/filter, tambah pelanggan, edit, hapus (tanpa riwayat booking), detail, aktif/nonaktif pengguna
- `/admin/operator`: setujui/tolak operator dan akun terkait
- `/admin/armada`: semua bus, status kesiapan
- `/admin/rute`: tambah/edit/hapus rute
- `/admin/jadwal`: monitor/aktifkan/nonaktifkan jadwal
- `/admin/pemesanan`: data tiket, detail, pembatalan
- `/admin/pembayaran`: metode, transaksi, nominal demo, ekspor CSV
- `/admin/laporan`: grafik kinerja PO/rute dan ekspor CSV
- `/admin/pengaturan`: konfigurasi layanan dan reset seluruh dataset demo

## Alur demonstrasi yang disarankan

1. Cari **Padang → Bukittinggi**, tanggal **16 November 2026**.
2. Pilih sebuah jadwal, klik kursi yang tersedia, isi nama pemesan dan penumpang.
3. Login sebagai Pelanggan jika belum masuk, lalu pilih metode pembayaran demo dan konfirmasi.
4. Buka **Tiket Saya** untuk melihat e-tiket, kode booking, mencetak atau membatalkan tiket.
5. Keluar, login Operator PO dan buka **Manifest & Boarding**. Untuk data contoh tanggal 20 Nov gunakan perjalanan Padang → Bukittinggi dan kode `MDK-8842-SB`.
6. Keluar, login Admin untuk mencoba persetujuan PO, laporan, dan manajemen data.

## Struktur proyek

```text
mudiak-vite-frontend/
├── index.html
├── package.json
├── README.md
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── components/UI.jsx
    ├── context/AppContext.jsx
    ├── data/seed.js
    ├── utils/helpers.js
    └── pages/
        ├── Customer.jsx
        ├── Operator.jsx
        └── Admin.jsx
```

## Batasan penting (frontend saja)

- **Belum ada backend, database, email, pengiriman WhatsApp, payment gateway, otorisasi aman, maupun sesi server.** Role protection di frontend hanya untuk demonstrasi dan **bisa dimanipulasi melalui browser**.
- Semua data disimpan pada `localStorage`, sesi demo pada `sessionStorage`. Akun/booking yang dibuat muncul pada tab dengan profil browser yang sama; tidak sinkron ke perangkat lain.
- Semua pembayaran, tiket, pelat, tarif, nama, kontak, kapasitas dan keberangkatan adalah **data contoh**, bukan inventaris/jadwal real-time. Status lunas dan verifikasi operator bukan bukti transaksi/izin nyata.
- Fitur **Cetak / Simpan PDF** memanfaatkan fungsi Print / Save as PDF browser, bukan generator PDF dari server.
- **Ekspor Excel** pada demo disediakan sebagai **CSV** yang dapat dibuka di Excel.
- Foto panorama pada hero menggunakan URL gambar dari HTML desain referensi; jika koneksi eksternal tidak tersedia, background gradient tetap tampil.
- Untuk produksi perlu backend (misalnya Express/Laravel), database relasional, autentikasi yang benar, RBAC di server, validasi integritas kursi/transaksi, payment provider, API jadwal, dan audit log.
