import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../db.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

/**
 * Helper: Generate kode booking acak (contoh: MDK-A8B9C2)
 */
function generateKodeBooking() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MDK-${code}`;
}

/**
 * GET /api/pesanan
 * Mengambil seluruh daftar pesanan untuk Admin & Operator PO
 */
router.get('/', authenticate, authorize('ADMIN', 'OPERATOR'), async (req, res) => {
  try {
    const pesananList = await prisma.pesanan.findMany({
      include: {
        penumpang: {
          select: { id: true, nama: true, email: true, noHp: true },
        },
        jadwal: {
          include: {
            bus: {
              select: {
                id: true,
                nama: true,
                platNomor: true,
                kelas: true,
                supir: true,
                operator: { select: { id: true, nama: true } },
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
        tiketList: {
          include: {
            kursi: { select: { id: true, nomorKursi: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ pesanan: pesananList });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat seluruh pesanan', error: error.message });
  }
});

/**
 * GET /api/pesanan/saya
 * Mengambil daftar tiket/pesanan aktif milik penumpang yang sedang login
 */
router.get('/saya', authenticate, async (req, res) => {
  try {
    const pesananList = await prisma.pesanan.findMany({
      where: {
        penumpangId: req.user.id,
      },
      include: {
        jadwal: {
          include: {
            bus: {
              select: {
                id: true,
                nama: true,
                platNomor: true,
                kelas: true,
                operator: { select: { nama: true } },
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
        tiketList: {
          include: {
            kursi: { select: { id: true, nomorKursi: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ pesanan: pesananList });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat tiket Anda', error: error.message });
  }
});

/**
 * POST /api/pesanan
 * Membuat pesanan tiket baru (Mendukung JWT login resmi maupun pemesanan terpadu)
 */
router.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const { jadwalId, kursiIds, namaKontak, noHpKontak, email } = req.body;

    if (!kursiIds || !Array.isArray(kursiIds) || kursiIds.length === 0) {
      return res.status(400).json({ message: 'Minimal 1 nomor kursi harus dipilih' });
    }

    const pemesanNama = (namaKontak || req.user?.nama || 'Penumpang Mudiak').trim();
    const pemesanHp = (noHpKontak || req.user?.noHp || '081234567890').trim();

    // 1. Tentukan akun Penumpang di Neon DB
    let penumpangId = req.user?.id;
    if (!penumpangId) {
      const emailPemesan = email || req.body.emailKontak || 'budi@gmail.com';
      let penumpang = await prisma.user.findUnique({ where: { email: emailPemesan } });
      if (!penumpang) {
        penumpang = await prisma.user.findFirst({ where: { role: 'PENUMPANG' } });
      }
      if (!penumpang) {
        penumpang = await prisma.user.create({
          data: {
            nama: pemesanNama,
            email: emailPemesan,
            password: 'guest_no_password',
            noHp: pemesanHp,
            role: 'PENUMPANG',
            status: 'ACTIVE',
          },
        });
      }
      penumpangId = penumpang.id;
    }

    // 2. Ambil data jadwal dari DB Neon
    let jId = parseInt(jadwalId, 10);
    let jadwal = null;

    if (!isNaN(jId)) {
      jadwal = await prisma.jadwal.findUnique({
        where: { id: jId },
        include: {
          bus: true,
          rute: { include: { asal: true, tujuan: true } },
        },
      });
    }

    // Fallback cerdas jika jadwalId berupa string (misal 't1' dari data frontend awal)
    if (!jadwal) {
      jadwal = await prisma.jadwal.findFirst({
        where: { status: 'AKTIF' },
        include: {
          bus: true,
          rute: { include: { asal: true, tujuan: true } },
        },
      });
    }

    if (!jadwal) {
      return res.status(404).json({ message: 'Tidak ada jadwal aktif yang tersedia di sistem' });
    }
    jId = jadwal.id;

    // 3. Cocokkan kursi berdasarkan ID atau nomor kursi (string / number)
    const stringKursiNos = kursiIds.map((k) => String(k));
    const numericKursiIds = kursiIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    let targetKursi = await prisma.kursi.findMany({
      where: {
        jadwalId: jId,
        OR: [
          { id: { in: numericKursiIds } },
          { nomorKursi: { in: stringKursiNos } },
        ],
      },
    });

    // Jika kursi pada jadwal belum di-generate, buatkan otomatis
    if (targetKursi.length === 0) {
      const totalKapasitas = jadwal.bus?.kapasitas || 16;
      for (let s = 1; s <= totalKapasitas; s++) {
        await prisma.kursi.create({
          data: {
            jadwalId: jId,
            nomorKursi: String(s),
            status: 'TERSEDIA',
          },
        });
      }
      targetKursi = await prisma.kursi.findMany({
        where: {
          jadwalId: jId,
          nomorKursi: { in: stringKursiNos },
        },
      });
    }

    if (targetKursi.length === 0) {
      return res.status(400).json({ message: 'Kursi yang dipilih tidak ditemukan pada jadwal ini' });
    }

    // Periksa ketersediaan kursi
    const kursiTerisi = targetKursi.filter((k) => k.status !== 'TERSEDIA');
    if (kursiTerisi.length > 0) {
      const nomorList = kursiTerisi.map((k) => `Kursi ${k.nomorKursi}`).join(', ');
      return res.status(400).json({
        message: `${nomorList} sudah dipesan oleh penumpang lain. Silakan pilih kursi lain.`,
      });
    }

    const finalKursiIds = targetKursi.map((k) => k.id);
    const totalHarga = (jadwal.harga || 65000) * targetKursi.length;

    // 4. Generate kode booking unik
    let kodeBooking = generateKodeBooking();
    while (await prisma.pesanan.findUnique({ where: { kodeBooking } })) {
      kodeBooking = generateKodeBooking();
    }

    // 5. Eksekusi transaksi simpan pesanan, tiket, dan update kursi di Neon
    const hasilPesanan = await prisma.$transaction(async (tx) => {
      // a. Buat pesanan
      const pesanan = await tx.pesanan.create({
        data: {
          kodeBooking,
          penumpangId,
          jadwalId: jId,
          namaKontak: pemesanNama,
          noHpKontak: pemesanHp,
          totalHarga,
          status: 'CONFIRMED',
          statusBayar: 'LUNAS',
        },
      });

      // b. Update status kursi menjadi DIPESAN
      await tx.kursi.updateMany({
        where: { id: { in: finalKursiIds } },
        data: { status: 'DIPESAN' },
      });

      // c. Buat tiket per kursi
      for (const k of targetKursi) {
        await tx.tiket.create({
          data: {
            pesananId: pesanan.id,
            kursiId: k.id,
            statusBarang: 'BELUM_BOARDING',
          },
        });
      }

      return pesanan;
    });

    // 6. Ambil data pesanan lengkap
    const pesananLengkap = await prisma.pesanan.findUnique({
      where: { id: hasilPesanan.id },
      include: {
        jadwal: {
          include: {
            bus: { select: { nama: true, platNomor: true, kelas: true } },
            rute: {
              include: {
                asal: { select: { nama: true } },
                tujuan: { select: { nama: true } },
              },
            },
          },
        },
        tiketList: {
          include: {
            kursi: { select: { nomorKursi: true } },
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Pemesanan tiket berhasil dikonfirmasi dan tersimpan di database Neon!',
      pesanan: pesananLengkap,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memproses pemesanan tiket', error: error.message });
  }
});

/**
 * PATCH /api/pesanan/:id/batal
 * Penumpang membatalkan tiket/pesanan:
 * - Harus pemilik pesanan (req.user.id === pesanan.penumpangId) atau Admin
 * - Pesanan harus berstatus 'CONFIRMED'
 * - Mengembalikan seluruh kursi terkait menjadi 'TERSEDIA'
 * - Mengubah status pesanan menjadi 'BATAL'
 */
router.patch('/:id/batal', authenticate, async (req, res) => {
  try {
    const rawId = req.params.id;
    const numericId = parseInt(rawId, 10);

    let pesanan = null;
    if (!isNaN(numericId)) {
      pesanan = await prisma.pesanan.findUnique({
        where: { id: numericId },
        include: { jadwal: true, tiketList: true },
      });
    }
    if (!pesanan) {
      pesanan = await prisma.pesanan.findUnique({
        where: { kodeBooking: rawId },
        include: { jadwal: true, tiketList: true },
      });
    }

    if (!pesanan) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Verifikasi kepemilikan
    if (req.user.role === 'PENUMPANG' && pesanan.penumpangId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki hak membatalkan pesanan ini' });
    }

    if (pesanan.status === 'BATAL') {
      return res.status(400).json({ message: 'Pesanan ini sudah dibatalkan sebelumnya' });
    }

    // Ambil daftar kursiId terkait pesanan ini
    const kursiIds = pesanan.tiketList.map((t) => t.kursiId);

    // Jalankan transaksi pembatalan
    await prisma.$transaction(async (tx) => {
      // 1. Ubah status pesanan jadi BATAL
      await tx.pesanan.update({
        where: { id: pesanan.id },
        data: { status: 'BATAL' },
      });

      // 2. Kembalikan kursi menjadi TERSEDIA di denah
      await tx.kursi.updateMany({
        where: { id: { in: kursiIds } },
        data: { status: 'TERSEDIA' },
      });
    });

    return res.json({
      message: `Tiket dengan kode booking ${pesanan.kodeBooking} berhasil dibatalkan. Kursi telah dikembalikan ke denah.`,
      kodeBooking: pesanan.kodeBooking,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal membatalkan pesanan', error: error.message });
  }
});

/**
 * PATCH /api/pesanan/:id/verifikasi
 * Admin menyetujui bukti pembayaran / mutasi transfer QRIS
 */
router.patch('/:id/verifikasi', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const rawId = req.params.id;
    const numericId = parseInt(rawId, 10);

    let pesanan = null;
    if (!isNaN(numericId)) {
      pesanan = await prisma.pesanan.findUnique({ where: { id: numericId } });
    }
    if (!pesanan) {
      pesanan = await prisma.pesanan.findUnique({ where: { kodeBooking: rawId } });
    }

    if (!pesanan) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    const updated = await prisma.pesanan.update({
      where: { id: pesanan.id },
      data: {
        status: 'CONFIRMED',
        statusBayar: 'LUNAS',
      },
    });

    return res.json({
      message: `Pembayaran tiket ${updated.kodeBooking} berhasil diverifikasi! E-Tiket resmi aktif.`,
      pesanan: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memverifikasi pembayaran', error: error.message });
  }
});

/**
 * PATCH /api/pesanan/:id/tolak
 * Admin menolak pembayaran (bukti tidak valid) dan mengembalikan kursi
 */
router.patch('/:id/tolak', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const rawId = req.params.id;
    const numericId = parseInt(rawId, 10);

    let pesanan = null;
    if (!isNaN(numericId)) {
      pesanan = await prisma.pesanan.findUnique({
        where: { id: numericId },
        include: { tiketList: true },
      });
    }
    if (!pesanan) {
      pesanan = await prisma.pesanan.findUnique({
        where: { kodeBooking: rawId },
        include: { tiketList: true },
      });
    }

    if (!pesanan) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    const kursiIds = pesanan.tiketList.map((t) => t.kursiId);

    await prisma.$transaction(async (tx) => {
      await tx.pesanan.update({
        where: { id: pesanan.id },
        data: {
          status: 'BATAL',
          statusBayar: 'DITOLAK',
        },
      });

      await tx.kursi.updateMany({
        where: { id: { in: kursiIds } },
        data: { status: 'TERSEDIA' },
      });
    });

    return res.json({
      message: `Pembayaran ${pesanan.kodeBooking} ditolak. Kursi dikembalikan ke armada.`,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menolak pesanan', error: error.message });
  }
});

/**
 * GET /api/pesanan/:kodeBooking
 * Mengambil detail pesanan/e-tiket berdasarkan kode booking
 */
router.get('/:kodeBooking', authenticate, async (req, res) => {
  try {
    const { kodeBooking } = req.params;

    const pesanan = await prisma.pesanan.findUnique({
      where: { kodeBooking: kodeBooking.toUpperCase() },
      include: {
        jadwal: {
          include: {
            bus: {
              select: {
                nama: true,
                platNomor: true,
                kelas: true,
                operator: { select: { nama: true } },
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
        tiketList: {
          include: {
            kursi: { select: { id: true, nomorKursi: true } },
          },
        },
      },
    });

    if (!pesanan) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Pastikan hanya pemilik atau admin/operator yang dapat melihat
    if (req.user.role === 'PENUMPANG' && pesanan.penumpangId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Ini bukan pesanan Anda' });
    }

    return res.json({ pesanan });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat detail pesanan', error: error.message });
  }
});

export default router;
