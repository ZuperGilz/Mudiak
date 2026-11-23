import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

async function testUsersFlow() {
  console.log('Memulai verifikasi API Manajemen User & Verifikasi Operator...');

  // 1. Coba akses tanpa token -> 401
  const noTokenRes = await fetch(`${BASE_URL}/users`);
  assert.equal(noTokenRes.status, 401, 'GET /users tanpa token harus 401');

  // 2. Login sebagai Penumpang dan coba akses -> 403
  const loginPenumpang = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@gmail.com', password: 'password123' }),
  });
  const penumpangToken = (await loginPenumpang.json()).token;

  const penumpangAccess = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${penumpangToken}` },
  });
  assert.equal(penumpangAccess.status, 403, 'Penumpang mengakses /users harus 403');

  // 3. Login sebagai Admin
  const loginAdmin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mudiak.id', password: 'password123' }),
  });
  const adminData = await loginAdmin.json();
  const adminToken = adminData.token;
  const adminId = adminData.user.id;

  // 4. Admin mendapatkan daftar user
  const getUsersRes = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(getUsersRes.status, 200, 'Admin harus berhasil mengambil daftar user');
  const usersList = (await getUsersRes.json()).users;
  assert.ok(Array.isArray(usersList), 'Response harus memuat list users');

  // 5. Operator Baru Mendaftar (status PENDING)
  const testOpEmail = `po_test_${Date.now()}@mudiak.id`;
  const regOp = await fetch(`${BASE_URL}/auth/register-operator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: 'PO Transport Minang Test',
      email: testOpEmail,
      password: 'password123',
      noHp: '081299998888',
    }),
  });
  assert.equal(regOp.status, 201, 'Registrasi operator baru berhasil');
  const newOpUser = (await regOp.json()).user;
  assert.equal(newOpUser.status, 'PENDING');

  // 6. Coba login saat PENDING -> Ditolak (403)
  const loginPending = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testOpEmail, password: 'password123' }),
  });
  assert.equal(loginPending.status, 403, 'Login operator pending harus 403');

  // 7. Admin memverifikasi operator (status -> ACTIVE)
  const verifyRes = await fetch(`${BASE_URL}/users/${newOpUser.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'ACTIVE' }),
  });
  assert.equal(verifyRes.status, 200, 'Admin berhasil mengubah status menjadi ACTIVE');
  const verifyData = await verifyRes.json();
  assert.equal(verifyData.user.status, 'ACTIVE');

  // 8. Operator kini bisa login dengan sukses (200)
  const loginVerified = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testOpEmail, password: 'password123' }),
  });
  assert.equal(loginVerified.status, 200, 'Operator terverifikasi harus bisa login');
  assert.ok((await loginVerified.json()).token, 'Harus mendapatkan token JWT');

  // 9. Admin memblokir operator (status -> BLOCKED)
  const blockRes = await fetch(`${BASE_URL}/users/${newOpUser.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'BLOCKED' }),
  });
  assert.equal(blockRes.status, 200, 'Admin berhasil memblokir operator');

  // Operator terblokir tidak bisa login -> 403
  const loginBlocked = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testOpEmail, password: 'password123' }),
  });
  assert.equal(loginBlocked.status, 403, 'Operator diblokir dilarang login');

  // 10. Admin mengedit profil user
  const editUserRes = await fetch(`${BASE_URL}/users/${newOpUser.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nama: 'PO Transport Minang Renamed',
      email: testOpEmail,
      noHp: '081299990000',
      role: 'OPERATOR',
    }),
  });
  assert.equal(editUserRes.status, 200, 'Admin berhasil mengedit data profil pengguna');
  const editedData = await editUserRes.json();
  assert.equal(editedData.user.nama, 'PO Transport Minang Renamed');

  // 11. Proteksi: Admin tidak boleh menghapus atau memblokir akun sendiri
  const selfBlockRes = await fetch(`${BASE_URL}/users/${adminId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'BLOCKED' }),
  });
  assert.equal(selfBlockRes.status, 400, 'Admin dilarang memblokir akun sendiri');

  const selfDeleteRes = await fetch(`${BASE_URL}/users/${adminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(selfDeleteRes.status, 400, 'Admin dilarang menghapus akun sendiri');

  // 12. Admin menghapus user yang telah diuji
  const deleteOpRes = await fetch(`${BASE_URL}/users/${newOpUser.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(deleteOpRes.status, 200, 'Admin berhasil menghapus pengguna pengujian');

  console.log('✔ Seluruh alur API Manajemen User & Verifikasi Operator berhasil diverifikasi!');
}

testUsersFlow().catch((err) => {
  console.error('❌ Gagal dalam test users flow:', err);
  process.exit(1);
});
