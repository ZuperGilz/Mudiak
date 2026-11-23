import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

async function testAuthFlow() {
  console.log('Memulai pengetesan alur API Auth...');

  // 1. Register Penumpang Baru
  const testEmailPenumpang = `penumpang_${Date.now()}@test.com`;
  const regPenumpangRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: 'Umar Test',
      email: testEmailPenumpang,
      password: 'password123',
      noHp: '081211112222',
    }),
  });
  const regPenumpangData = await regPenumpangRes.json();
  assert.equal(regPenumpangRes.status, 201, 'Registrasi penumpang harus status 201');
  assert.equal(regPenumpangData.user.role, 'PENUMPANG');
  assert.equal(regPenumpangData.user.status, 'ACTIVE');

  // 2. Register Operator Baru (harus status PENDING)
  const testEmailOperator = `operator_${Date.now()}@test.com`;
  const regOperatorRes = await fetch(`${BASE_URL}/auth/register-operator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: 'PO Singgalang Test',
      email: testEmailOperator,
      password: 'password123',
      noHp: '081233334444',
    }),
  });
  const regOperatorData = await regOperatorRes.json();
  assert.equal(regOperatorRes.status, 201, 'Registrasi operator harus status 201');
  assert.equal(regOperatorData.user.role, 'OPERATOR');
  assert.equal(regOperatorData.user.status, 'PENDING');

  // 3. Operator PENDING mencoba login -> harus ditolak 403
  const loginPendingRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmailOperator,
      password: 'password123',
    }),
  });
  assert.equal(loginPendingRes.status, 403, 'Operator pending harus ditolak 403 saat login');
  const loginPendingData = await loginPendingRes.json();
  assert.ok(loginPendingData.message.includes('menunggu verifikasi'));

  // 4. Login Admin Seed -> Berhasil
  const loginAdminRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@mudiak.id',
      password: 'password123',
    }),
  });
  assert.equal(loginAdminRes.status, 200, 'Login admin seed harus sukses');
  const loginAdminData = await loginAdminRes.json();
  assert.ok(loginAdminData.token, 'Token JWT admin harus ada');
  const adminToken = loginAdminData.token;

  // 5. Cek otorisasi: Admin mengakses endpoint admin -> 200
  const adminCheckRes = await fetch('http://localhost:5000/api/admin/check', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminCheckRes.status, 200, 'Admin harus diizinkan akses /api/admin/check');

  // 6. Cek otorisasi: Admin mencoba mengakses endpoint operator -> 403
  const operatorCheckByAdminRes = await fetch('http://localhost:5000/api/operator/check', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(operatorCheckByAdminRes.status, 403, 'Admin dilarang masuk /api/operator/check');

  // 7. Login Operator Seed Terverifikasi -> Berhasil
  const loginOpRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ans@mudiak.id',
      password: 'password123',
    }),
  });
  assert.equal(loginOpRes.status, 200, 'Login operator seed aktif harus sukses');
  const opToken = (await loginOpRes.json()).token;

  const opCheckRes = await fetch('http://localhost:5000/api/operator/check', {
    headers: { Authorization: `Bearer ${opToken}` },
  });
  assert.equal(opCheckRes.status, 200, 'Operator aktif harus diizinkan akses /api/operator/check');

  console.log('✔ Seluruh alur otentikasi & otorisasi berhasil diverifikasi!');
}

testAuthFlow().catch((err) => {
  console.error('❌ Gagal dalam test auth:', err);
  process.exit(1);
});
