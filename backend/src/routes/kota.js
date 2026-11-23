import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/kota
 * Mengambil seluruh daftar master kota (Publik - dibutuhkan juga untuk dropdown pencarian tiket)
 */
router.get('/', async (req, res) => {
  try {
    const kotaList = await prisma.kota.findMany({
      orderBy: { nama: 'asc' },
    });
    return res.json({ kota: kotaList });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data kota', error: error.message });
  }
});

/**
 * POST /api/kota
 * Menambah kota baru (Khusus Admin)
 */
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama || !nama.trim()) {
      return res.status(400).json({ message: 'Nama kota wajib diisi' });
    }

    const namaBersih = nama.trim();

    // Validasi duplikasi (case-insensitive checking)
    const existing = await prisma.kota.findFirst({
      where: { nama: { equals: namaBersih } },
    });

    if (existing) {
      return res.status(400).json({ message: `Kota '${namaBersih}' sudah terdaftar` });
    }

    const baru = await prisma.kota.create({
      data: { nama: namaBersih },
    });

    return res.status(201).json({
      message: 'Kota berhasil ditambahkan',
      kota: baru,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menambahkan kota', error: error.message });
  }
});

/**
 * PUT /api/kota/:id
 * Mengubah nama kota (Khusus Admin)
 */
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID kota tidak valid' });
    }

    if (!nama || !nama.trim()) {
      return res.status(400).json({ message: 'Nama kota wajib diisi' });
    }

    const namaBersih = nama.trim();

    // Cek kota target
    const target = await prisma.kota.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ message: 'Kota tidak ditemukan' });
    }

    // Cek duplikasi dengan kota lain
    const existing = await prisma.kota.findFirst({
      where: {
        nama: { equals: namaBersih },
        NOT: { id },
      },
    });

    if (existing) {
      return res.status(400).json({ message: `Kota '${namaBersih}' sudah digunakan oleh data lain` });
    }

    const updated = await prisma.kota.update({
      where: { id },
      data: { nama: namaBersih },
    });

    return res.json({
      message: 'Nama kota berhasil diperbarui',
      kota: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui kota', error: error.message });
  }
});

/**
 * DELETE /api/kota/:id
 * Menghapus kota (Khusus Admin)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID kota tidak valid' });
    }

    const target = await prisma.kota.findUnique({
      where: { id },
      include: {
        ruteAsal: true,
        ruteTujuan: true,
      },
    });

    if (!target) {
      return res.status(404).json({ message: 'Kota tidak ditemukan' });
    }

    // Cek jika kota sudah terikat pada rute perjalanan
    if (target.ruteAsal.length > 0 || target.ruteTujuan.length > 0) {
      return res.status(400).json({
        message: 'Kota tidak dapat dihapus karena sudah memiliki rute jadwal perjalanan aktif',
      });
    }

    await prisma.kota.delete({ where: { id } });

    return res.json({ message: `Kota '${target.nama}' berhasil dihapus` });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menghapus kota', error: error.message });
  }
});

export default router;
