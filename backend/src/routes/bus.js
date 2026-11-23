import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Seluruh rute manajemen armada bus dikhususkan untuk OPERATOR (dan ADMIN jika diperlukan inspeksi)
router.use(authenticate, authorize('OPERATOR', 'ADMIN'));

/**
 * GET /api/bus
 * Mengambil daftar armada bus.
 * Terisolasi: Operator hanya melihat bus miliknya sendiri (req.user.id).
 * Admin dapat melihat semua atau memfilter berdasarkan operatorId.
 */
router.get('/', async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'OPERATOR') {
      where.operatorId = req.user.id;
    } else if (req.query.operatorId) {
      where.operatorId = parseInt(req.query.operatorId, 10);
    }

    const buses = await prisma.bus.findMany({
      where,
      include: {
        operator: {
          select: { id: true, nama: true, email: true },
        },
        _count: {
          select: { jadwal: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ buses });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat armada bus', error: error.message });
  }
});

/**
 * POST /api/bus
 * Menambah armada bus baru milik operator yang sedang login.
 */
router.post('/', async (req, res) => {
  try {
    const { nama, platNomor, kapasitas, kelas, supir, kursiDepan } = req.body;

    if (!nama || !platNomor || !kapasitas) {
      return res.status(400).json({ message: 'Nama bus, nomor plat, dan kapasitas wajib diisi' });
    }

    const capNum = parseInt(kapasitas, 10);
    if (isNaN(capNum) || capNum <= 0 || capNum > 60) {
      return res.status(400).json({ message: 'Kapasitas kursi harus berupa angka antara 1 sampai 60' });
    }

    const platBersih = platNomor.trim().toUpperCase();

    // Validasi plat nomor unik global
    const existingPlat = await prisma.bus.findUnique({
      where: { platNomor: platBersih },
    });
    if (existingPlat) {
      return res.status(400).json({ message: `Bus dengan nomor plat '${platBersih}' sudah terdaftar` });
    }

    const bus = await prisma.bus.create({
      data: {
        operatorId: req.user.id,
        nama: nama.trim(),
        platNomor: platBersih,
        kapasitas: capNum,
        kursiDepan: kursiDepan ? parseInt(kursiDepan, 10) : 2,
        kelas: kelas?.trim() || 'Eksekutif Travel',
        supir: supir?.trim() || null,
      },
      include: {
        operator: {
          select: { id: true, nama: true, email: true },
        },
      },
    });

    return res.status(201).json({
      message: 'Armada bus berhasil ditambahkan',
      bus,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menambahkan armada bus', error: error.message });
  }
});

/**
 * PUT /api/bus/:id
 * Mengubah data armada bus milik operator.
 * Memastikan bus milik operator yang bersangkutan (isolasi multi-tenant).
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama, platNomor, kapasitas, kelas, supir, kursiDepan } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID bus tidak valid' });
    }

    if (!nama || !platNomor || !kapasitas) {
      return res.status(400).json({ message: 'Nama bus, nomor plat, dan kapasitas wajib diisi' });
    }

    const capNum = parseInt(kapasitas, 10);
    if (isNaN(capNum) || capNum <= 0 || capNum > 60) {
      return res.status(400).json({ message: 'Kapasitas kursi harus berupa angka antara 1 sampai 60' });
    }

    // Cek kepemilikan bus
    const bus = await prisma.bus.findUnique({ where: { id } });
    if (!bus) {
      return res.status(404).json({ message: 'Bus tidak ditemukan' });
    }

    if (req.user.role === 'OPERATOR' && bus.operatorId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda bukan pemilik bus ini' });
    }

    const platBersih = platNomor.trim().toUpperCase();

    // Cek duplikasi plat nomor pada bus lain
    const existingPlat = await prisma.bus.findFirst({
      where: {
        platNomor: platBersih,
        NOT: { id },
      },
    });
    if (existingPlat) {
      return res.status(400).json({ message: `Bus dengan nomor plat '${platBersih}' sudah digunakan oleh bus lain` });
    }

    const updated = await prisma.bus.update({
      where: { id },
      data: {
        nama: nama.trim(),
        platNomor: platBersih,
        kapasitas: capNum,
        kursiDepan: kursiDepan ? parseInt(kursiDepan, 10) : 2,
        kelas: kelas?.trim() || 'Eksekutif Travel',
        supir: supir !== undefined ? (supir?.trim() || null) : undefined,
      },
    });

    return res.json({
      message: 'Data bus berhasil diperbarui',
      bus: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui data bus', error: error.message });
  }
});

/**
 * DELETE /api/bus/:id
 * Menghapus armada bus milik operator.
 * Proteksi: Memeriksa kepemilikan dan apakah bus sudah terikat ke jadwal aktif.
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID bus tidak valid' });
    }

    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        jadwal: true,
      },
    });

    if (!bus) {
      return res.status(404).json({ message: 'Bus tidak ditemukan' });
    }

    if (req.user.role === 'OPERATOR' && bus.operatorId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda bukan pemilik bus ini' });
    }

    if (bus.jadwal.length > 0) {
      return res.status(400).json({
        message: 'Bus tidak dapat dihapus karena sudah memiliki jadwal keberangkatan aktif',
      });
    }

    await prisma.bus.delete({ where: { id } });

    return res.json({ message: `Armada bus '${bus.nama} (${bus.platNomor})' berhasil dihapus` });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menghapus bus', error: error.message });
  }
});

export default router;
