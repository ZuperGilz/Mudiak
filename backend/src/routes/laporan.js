import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Endpoint laporan hanya dapat diakses oleh Administrator
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /api/laporan
 * Mengembalikan data analitik & statistik pemesanan tiket:
 * 1. Total Pesanan (berstatus CONFIRMED)
 * 2. Total Pendapatan (akumulasi harga tiket dari pesanan CONFIRMED)
 * 3. Total Tiket Terjual
 * 4. Pendapatan per Operator Bus
 * 5. Jadwal Terpopuler (diurutkan berdasarkan jumlah tiket terjual terbanyak)
 */
router.get('/', async (req, res) => {
  try {
    // 1. Ambil seluruh pesanan aktif (CONFIRMED) beserta relasi jadwal, bus, operator, dan tiket
    const pesananAktif = await prisma.pesanan.findMany({
      where: { status: 'CONFIRMED' },
      include: {
        tiketList: true,
        jadwal: {
          include: {
            bus: {
              include: {
                operator: { select: { id: true, nama: true, email: true } },
              },
            },
            rute: {
              include: {
                asal: { select: { nama: true } },
                tujuan: { select: { nama: true } },
              },
            },
          },
        },
      },
    });

    // 2. Kalkulasi Ringkasan Umum
    const totalPesanan = pesananAktif.length;
    let totalPendapatan = 0;
    let totalTiketTerjual = 0;

    // Map untuk agregasi pendapatan per operator
    const operatorMap = {};
    // Map untuk agregasi jadwal terpopuler
    const jadwalMap = {};

    for (const p of pesananAktif) {
      totalPendapatan += p.totalHarga;
      const jumlahTiket = p.tiketList.length;
      totalTiketTerjual += jumlahTiket;

      // a. Agregasi Operator
      const op = p.jadwal.bus.operator;
      if (!operatorMap[op.id]) {
        operatorMap[op.id] = {
          operatorId: op.id,
          namaOperator: op.nama,
          emailOperator: op.email,
          totalPesanan: 0,
          totalTiket: 0,
          totalPendapatan: 0,
        };
      }
      operatorMap[op.id].totalPesanan += 1;
      operatorMap[op.id].totalTiket += jumlahTiket;
      operatorMap[op.id].totalPendapatan += p.totalHarga;

      // b. Agregasi Jadwal Terpopuler
      const j = p.jadwal;
      if (!jadwalMap[j.id]) {
        jadwalMap[j.id] = {
          jadwalId: j.id,
          rute: `${j.rute.asal.nama} → ${j.rute.tujuan.nama}`,
          tanggal: j.tanggal,
          jamBerangkat: j.jamBerangkat,
          busNama: j.bus.nama,
          operatorNama: op.nama,
          harga: j.harga,
          tiketTerjual: 0,
          pendapatan: 0,
        };
      }
      jadwalMap[j.id].tiketTerjual += jumlahTiket;
      jadwalMap[j.id].pendapatan += p.totalHarga;
    }

    // 3. Pastikan seluruh operator yang terdaftar di sistem muncul di laporan
    const allOperators = await prisma.user.findMany({
      where: { role: 'OPERATOR' },
      select: { id: true, nama: true, email: true },
    });

    for (const op of allOperators) {
      if (!operatorMap[op.id]) {
        operatorMap[op.id] = {
          operatorId: op.id,
          namaOperator: op.nama,
          emailOperator: op.email,
          totalPesanan: 0,
          totalTiket: 0,
          totalPendapatan: 0,
        };
      }
    }

    const pendapatanPerOperator = Object.values(operatorMap).sort(
      (a, b) => b.totalPendapatan - a.totalPendapatan
    );

    const jadwalTerpopuler = Object.values(jadwalMap).sort(
      (a, b) => b.tiketTerjual - a.tiketTerjual
    );

    return res.json({
      ringkasan: {
        totalPesanan,
        totalTiketTerjual,
        totalPendapatan,
      },
      pendapatanPerOperator,
      jadwalTerpopuler,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat laporan admin', error: error.message });
  }
});

export default router;
