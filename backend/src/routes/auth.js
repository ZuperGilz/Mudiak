import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mudiak-rahasia-sumbar-2026';

/**
 * Register Penumpang
 * Status otomatis 'ACTIVE'
 */
router.post('/register', async (req, res) => {
  try {
    const { nama, email, password, noHp } = req.body;
    if (!nama || !email || !password || !noHp) {
      return res.status(400).json({ message: 'Semua kolom wajib diisi' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        noHp,
        role: 'PENUMPANG',
        status: 'ACTIVE',
      },
      select: { id: true, nama: true, email: true, noHp: true, role: true, status: true },
    });

    return res.status(201).json({
      message: 'Registrasi penumpang berhasil, silakan login',
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
});

/**
 * Register Operator
 * Status default 'PENDING' sampai diverifikasi oleh Admin
 */
router.post('/register-operator', async (req, res) => {
  try {
    const { nama, email, password, noHp } = req.body;
    if (!nama || !email || !password || !noHp) {
      return res.status(400).json({ message: 'Semua kolom wajib diisi' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        noHp,
        role: 'OPERATOR',
        status: 'PENDING',
      },
      select: { id: true, nama: true, email: true, noHp: true, role: true, status: true },
    });

    return res.status(201).json({
      message: 'Pendaftaran operator berhasil. Akun Anda sedang menunggu persetujuan Admin.',
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
});

/**
 * Login Semua Role (ADMIN, OPERATOR, PENUMPANG)
 * Cek password bcrypt, verifikasi status operator tidak PENDING/BLOCKED
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Validasi status akun operator
    if (user.role === 'OPERATOR' && user.status === 'PENDING') {
      return res.status(403).json({
        message: 'Akun operator Anda masih menunggu verifikasi dari Administrator',
      });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        message: 'Akun Anda telah dinonaktifkan oleh Administrator',
      });
    }

    // Buat JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      noHp: user.noHp,
      role: user.role,
      status: user.status,
    };

    return res.json({
      message: 'Login berhasil',
      token,
      user: userProfile,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
});

/**
 * Get Profile Pengguna yang sedang login
 */
router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: req.user });
});

export default router;
