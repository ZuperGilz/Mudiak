import assert from 'node:assert/strict';
import prisma from './db.js';

/**
 * Uji verifikasi dasar database seed dan integritas data skema awal.
 */
async function runCheck() {
  console.log('Memulai validasi data seed backend...');

  // 1. Verifikasi pengguna seed
  const users = await prisma.user.findMany();
  assert.equal(users.length, 3, 'Harus ada 3 akun pengguna ter-seed');

  const admin = users.find(u => u.role === 'ADMIN');
  const operator = users.find(u => u.role === 'OPERATOR');
  const penumpang = users.find(u => u.role === 'PENUMPANG');

  assert.ok(admin, 'Admin harus ada');
  assert.equal(admin.email, 'admin@mudiak.id');

  assert.ok(operator, 'Operator harus ada');
  assert.equal(operator.status, 'ACTIVE');

  assert.ok(penumpang, 'Penumpang harus ada');
  assert.equal(penumpang.role, 'PENUMPANG');

  // 2. Verifikasi master kota
  const kotaList = await prisma.kota.findMany();
  assert.equal(kotaList.length, 6, 'Harus ada 6 master kota');

  console.log('✔ Semua pengecekan data seed backend berhasil!');
}

runCheck()
  .catch((err) => {
    console.error('❌ Pengecekan data gagal:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
