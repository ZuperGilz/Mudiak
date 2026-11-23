import jwt from 'jsonwebtoken';
import prisma from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mudiak-rahasia-sumbar-2026';

/**
 * Middleware untuk memverifikasi Authorization Bearer Token.
 * Menyimpan data pengguna di `req.user` jika valid.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak: Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, nama: true, email: true, noHp: true, role: true, status: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Pengguna tidak ditemukan' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ message: 'Akun Anda telah diblokir' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau telah kedaluwarsa' });
  }
}

/**
 * Middleware untuk membatasi endpoint berdasarkan role.
 * @param  {...string} allowedRoles - Daftar role yang diizinkan (ADMIN, OPERATOR, PENUMPANG)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak: Peran tidak memiliki izin untuk tindakan ini' });
    }
    next();
  };
}

/**
 * Middleware autentikasi opsional:
 * Jika Bearer token valid disediakan, user akan disimpan di `req.user`.
 * Jika tidak ada token atau token guest, request tetap dilanjutkan tanpa melempar 401.
 */
export async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, nama: true, email: true, noHp: true, role: true, status: true },
    });

    if (user && user.status !== 'BLOCKED') {
      req.user = user;
    }
  } catch (err) {
    // Abaikan error parsing token pada optional authenticate
  }
  next();
}
