import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mudiak-rahasia-sumbar-2026';

/**
 * Tes mandiri otentikasi & otorisasi backend
 */
async function runAuthCheck() {
  console.log('Memulai verifikasi auth backend...');

  // 1. Cek login akun seed
  const admin = await prisma.user.findUnique({ where: { email: 'admin@mudiak.id' } });
  assert.ok(admin, 'Admin seed harus ada');
  const adminPassMatch = await bcrypt.compare('password123', admin.password);
  assert.equal(adminPassMatch, true, 'Password admin harus cocok dengan password123');

  // 2. Simulasi operator pending
  const dummyPendingEmail = `pending-${Date.now()}@mudiak.id`;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);
  const pendingOp = await prisma.user.create({
    data: {
      nama: 'PO Pending Travel',
      email: dummyPendingEmail,
      password: hash,
      noHp: '081299990001',
      role: 'OPERATOR',
      status: 'PENDING',
    },
  });

  assert.equal(pendingOp.status, 'PENDING');
  console.log('Operator pending berhasil dibuat dan diuji.');

  // Bersihkan akun dummy
  await prisma.user.delete({ where: { id: pendingOp.id } });

  console.log('✔ Verifikasi auth backend berhasil!');
}

runAuthCheck()
  .catch((e) => {
    console.error('❌ Gagal verifikasi auth:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
