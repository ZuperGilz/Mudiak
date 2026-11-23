import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

async function testBusFlow() {
  console.log('Memulai verifikasi API Manajemen Armada Bus & Isolasi Multi-Tenant...');

  // 1. Akses tanpa token -> 401
  const noToken = await fetch(`${BASE_URL}/bus`);
  assert.equal(noToken.status, 401, 'GET /bus tanpa token harus 401');

  // 2. Akses oleh Penumpang -> 403
  const loginPenumpang = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@gmail.com', password: 'password123' }),
  });
  const penumpangToken = (await loginPenumpang.json()).token;

  const penumpangAccess = await fetch(`${BASE_URL}/bus`, {
    headers: { Authorization: `Bearer ${penumpangToken}` },
  });
  assert.equal(penumpangAccess.status, 403, 'Penumpang dilarang akses /bus (403)');

  // 3. Login Operator 1 (PO ANS)
  const loginOp1 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ans@mudiak.id', password: 'password123' }),
  });
  const op1Token = (await loginOp1.json()).token;

  // 4. Operator 1 menambah bus baru
  const platUnik1 = `BA ${Math.floor(1000 + Math.random() * 9000)} AN`;
  const addBusRes = await fetch(`${BASE_URL}/bus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({
      nama: 'ANS Royal Class 01',
      platNomor: platUnik1,
      kapasitas: 28,
      kelas: 'Eksekutif',
    }),
  });
  assert.equal(addBusRes.status, 201, 'Operator 1 harus berhasil menambahkan bus (201)');
  const op1Bus = (await addBusRes.json()).bus;
  assert.equal(op1Bus.platNomor, platUnik1);
  assert.equal(op1Bus.kapasitas, 28);

  // 5. Coba tambah bus dengan plat nomor sama -> 400
  const dupPlatRes = await fetch(`${BASE_URL}/bus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({
      nama: 'ANS Duplikat',
      platNomor: platUnik1,
      kapasitas: 30,
      kelas: 'Ekonomi',
    }),
  });
  assert.equal(dupPlatRes.status, 400, 'Plat nomor duplikat harus ditolak 400');

  // 6. Buat Operator 2 (PO NPM) dan login
  const op2Email = `npm_${Date.now()}@mudiak.id`;
  const regOp2 = await fetch(`${BASE_URL}/auth/register-operator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: 'PO NPM Padang Panjang',
      email: op2Email,
      password: 'password123',
      noHp: '081255556666',
    }),
  });
  const op2Id = (await regOp2.json()).user.id;

  // Verifikasi Operator 2 via Admin agar aktif
  const loginAdmin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mudiak.id', password: 'password123' }),
  });
  const adminToken = (await loginAdmin.json()).token;

  await fetch(`${BASE_URL}/users/${op2Id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'ACTIVE' }),
  });

  // Login Operator 2
  const loginOp2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: op2Email, password: 'password123' }),
  });
  const op2Token = (await loginOp2.json()).token;

  // 7. Cek Isolasi: Operator 2 mengambil daftar bus miliknya -> Bus milik Operator 1 TIDAK boleh ada
  const getOp2Buses = await fetch(`${BASE_URL}/bus`, {
    headers: { Authorization: `Bearer ${op2Token}` },
  });
  const op2BusesList = (await getOp2Buses.json()).buses;
  assert.equal(op2BusesList.length, 0, 'Operator 2 belum punya bus, daftar harus kosong');

  // 8. Cek Proteksi Kepemilikan: Operator 2 mencoba mengedit bus milik Operator 1 -> 403
  const tryEditOther = await fetch(`${BASE_URL}/bus/${op1Bus.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op2Token}`,
    },
    body: JSON.stringify({
      nama: 'Dibajak',
      platNomor: op1Bus.platNomor,
      kapasitas: 20,
    }),
  });
  assert.equal(tryEditOther.status, 403, 'Mengedit bus operator lain harus ditolak 403');

  // Operator 2 mencoba menghapus bus milik Operator 1 -> 403
  const tryDeleteOther = await fetch(`${BASE_URL}/bus/${op1Bus.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${op2Token}` },
  });
  assert.equal(tryDeleteOther.status, 403, 'Menghapus bus operator lain harus ditolak 403');

  // 9. Operator 1 mengedit bus miliknya sendiri -> 200
  const editOp1 = await fetch(`${BASE_URL}/bus/${op1Bus.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({
      nama: 'ANS Royal Class V2',
      platNomor: op1Bus.platNomor,
      kapasitas: 32,
      kelas: 'Super Eksekutif',
    }),
  });
  assert.equal(editOp1.status, 200, 'Operator 1 berhasil mengedit bus miliknya');
  const editedBus = (await editOp1.json()).bus;
  assert.equal(editedBus.nama, 'ANS Royal Class V2');
  assert.equal(editedBus.kapasitas, 32);

  // 10. Operator 1 menghapus bus miliknya sendiri -> 200
  const deleteOp1 = await fetch(`${BASE_URL}/bus/${op1Bus.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${op1Token}` },
  });
  assert.equal(deleteOp1.status, 200, 'Operator 1 berhasil menghapus bus miliknya');

  // Bersihkan Operator 2 dummy
  await fetch(`${BASE_URL}/users/${op2Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  console.log('✔ Seluruh alur API Manajemen Armada Bus & Isolasi Operator berhasil diverifikasi!');
}

testBusFlow().catch((err) => {
  console.error('❌ Gagal dalam test bus flow:', err);
  process.exit(1);
});
