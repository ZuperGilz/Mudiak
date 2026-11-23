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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kota', kotaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/pesanan', pesananRoutes);
app.use('/api/laporan', laporanRoutes);

/**
 * Endpoint uji coba otorisasi peran
 */
app.get('/api/admin/check', authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ message: 'Akses khusus Admin terverifikasi', user: req.user });
});

app.get('/api/operator/check', authenticate, authorize('OPERATOR'), (req, res) => {
  res.json({ message: 'Akses khusus Operator terverifikasi', user: req.user });
});

app.get('/api/penumpang/check', authenticate, authorize('PENUMPANG'), (req, res) => {
  res.json({ message: 'Akses khusus Penumpang terverifikasi', user: req.user });
});

/**
 * Endpoint Health Check
 * Mengembalikan status server serta verifikasi koneksi database dengan menghitung total kota & user.
 */
app.get('/health', async (req, res) => {
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
      message: 'Gagal terhubung ke database',
      error: error.message,
    });
  }
});

// Jalankan server jika dijalankan langsung (bukan di lingkungan serverless Vercel atau unit test)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server Mudiak berjalan di port ${PORT}`);
  });
}

export default app;
