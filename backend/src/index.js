import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db.js';
import authRoutes from './routes/auth.js';
import kotaRoutes from './routes/kota.js';
import userRoutes from './routes/users.js';
import busRoutes from './routes/bus.js';
import jadwalRoutes from './routes/jadwal.js';
import pesananRoutes from './routes/pesanan.js';
import laporanRoutes from './routes/laporan.js';
import { authenticate, authorize } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware standar
app.use(cors());
app.use(express.json());

// Root & Health Check Endpoint
app.get(['/', '/api'], (req, res) => {
  res.json({
    name: 'Mudiak Backend API',
    status: 'online',
    version: '1.0.0',
    description: 'API resmi platform tiket travel Mudiak & PO AYAH (Minangkabau)',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      bus: '/api/bus',
      kota: '/api/kota',
      jadwal: '/api/jadwal',
      pesanan: '/api/pesanan',
      laporan: '/api/laporan',
    },
  });
});

/**
 * Endpoint Health Check
 * Mengembalikan status server serta verifikasi koneksi database dengan menghitung total kota & user.
 */
app.get(['/health', '/api/health'], async (req, res) => {
  try {
    const totalUser = await prisma.user.count();
    const totalKota = await prisma.kota.count();

    return res.json({
      status: 'ok',
      message: 'Mudiak Backend API berjalan normal',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        stats: {
          totalUser,
          totalKota,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal terhubung ke database Neon',
      error: error.message,
    });
  }
});

// Daftarkan Routes (didukung dengan prefix /api maupun langsung agar fleksibel terhadap konfigurasi Vercel)
const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/kota`, kotaRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/bus`, busRoutes);
  app.use(`${prefix}/jadwal`, jadwalRoutes);
  app.use(`${prefix}/pesanan`, pesananRoutes);
  app.use(`${prefix}/laporan`, laporanRoutes);
};

registerRoutes('/api');
registerRoutes('');

/**
 * Endpoint uji coba otorisasi peran
 */
app.get(['/api/admin/check', '/admin/check'], authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ message: 'Akses khusus Admin terverifikasi', user: req.user });
});

app.get(['/api/operator/check', '/operator/check'], authenticate, authorize('OPERATOR'), (req, res) => {
  res.json({ message: 'Akses khusus Operator terverifikasi', user: req.user });
});

app.get(['/api/penumpang/check', '/penumpang/check'], authenticate, authorize('PENUMPANG'), (req, res) => {
  res.json({ message: 'Akses khusus Penumpang terverifikasi', user: req.user });
});

// 404 Fallback Handler dalam format JSON
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan di server Mudiak API.`,
    availableRoutes: ['/', '/health', '/api/kota', '/api/jadwal', '/api/bus', '/api/pesanan', '/api/auth'],
  });
});

// Jalankan server jika dijalankan langsung (bukan di lingkungan serverless Vercel atau unit test)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server Mudiak berjalan di port ${PORT}`);
  });
}

export default app;
