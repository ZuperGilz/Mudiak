import { Router } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Seluruh rute manajemen pengguna membutuhkan hak akses ADMIN
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /api/users
 * Mengambil daftar seluruh user dengan opsi filter `role` dan `status`.
 */
router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            buses: true,
            pesanan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat data pengguna', error: error.message });
  }
});

/**
 * PATCH /api/users/:id/status
 * Memperbarui status akun (misalnya ACTIVE, PENDING, BLOCKED)
 * Digunakan terutama untuk verifikasi operator (PENDING -> ACTIVE) atau memblokir operator (BLOCKED).
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID pengguna tidak valid' });
    }

    const validStatuses = ['ACTIVE', 'PENDING', 'BLOCKED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status tidak valid. Pilihan: ${validStatuses.join(', ')}` });
    }

    // Mencegah admin memblokir dirinya sendiri secara tidak sengaja
    if (req.user.id === id && status === 'BLOCKED') {
      return res.status(400).json({ message: 'Tidak dapat memblokir akun administrator Anda sendiri' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, nama: true, email: true, role: true, status: true },
    });

    let pesan = `Status pengguna ${updated.nama} berhasil diubah menjadi ${status}`;
    if (status === 'ACTIVE' && user.status === 'PENDING') {
      pesan = `Operator ${updated.nama} berhasil diverifikasi dan kini aktif.`;
    } else if (status === 'BLOCKED') {
      pesan = `Pengguna ${updated.nama} berhasil diblokir.`;
    }

    return res.json({ message: pesan, user: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui status pengguna', error: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Mengubah data pengguna (nama, noHp, email, role, opsional password baru)
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nama, email, noHp, role, password } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID pengguna tidak valid' });
    }

    if (!nama || !email || !noHp || !role) {
      return res.status(400).json({ message: 'Nama, email, noHp, dan role wajib diisi' });
    }

    const validRoles = ['ADMIN', 'OPERATOR', 'PENUMPANG'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Role tidak valid. Pilihan: ${validRoles.join(', ')}` });
    }

    // Cek duplikasi email pada user lain
    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Email sudah digunakan oleh pengguna lain' });
    }

    const dataUpdate = {
      nama,
      email,
      noHp,
      role,
    };

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      dataUpdate.password = await bcrypt.hash(password.trim(), salt);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataUpdate,
      select: { id: true, nama: true, email: true, noHp: true, role: true, status: true },
    });

    return res.json({ message: 'Data pengguna berhasil diperbarui', user: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui pengguna', error: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Menghapus pengguna (dengan proteksi agar admin tidak menghapus diri sendiri)
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID pengguna tidak valid' });
    }

    if (req.user.id === id) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun administrator Anda sendiri' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    await prisma.user.delete({ where: { id } });

    return res.json({ message: `Pengguna ${user.nama} berhasil dihapus` });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menghapus pengguna', error: error.message });
  }
});

export default router;
