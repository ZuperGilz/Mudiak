import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

async function testKotaFlow() {
  console.log('Memulai verifikasi API CRUD Kota...');

  // 1. Get Kota secara publik
  const getPubRes = await fetch(`${BASE_URL}/kota`);
  assert.equal(getPubRes.status, 200, 'GET /kota harus publik (200)');
  const pubData = await getPubRes.json();
  assert.ok(Array.isArray(pubData.kota), 'Harus mengembalikan array kota');
  const initialCount = pubData.kota.length;

  // 2. Coba POST tanpa token -> 401
  const noTokenRes = await fetch(`${BASE_URL}/kota`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama: 'Kota Rahasia' }),
  });
  assert.equal(noTokenRes.status, 401, 'POST /kota tanpa token harus 401');

  // 3. Login sebagai Admin
  const loginAdmin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mudiak.id', password: 'password123' }),
  });
  const adminToken = (await loginAdmin.json()).token;

  // 4. Tambah Kota Baru sebagai Admin
  const namaKotaBaru = `Pariaman_${Date.now()}`;
  const addRes = await fetch(`${BASE_URL}/kota`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ nama: namaKotaBaru }),
  });
  assert.equal(addRes.status, 201, 'POST /kota dengan admin harus 201');
  const addData = await addRes.json();
  assert.equal(addData.kota.nama, namaKotaBaru);
  const kotaId = addData.kota.id;

  // 5. Coba tambah kota duplikat -> 400
  const dupRes = await fetch(`${BASE_URL}/kota`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ nama: namaKotaBaru }),
  });
  assert.equal(dupRes.status, 400, 'Tambah kota duplikat harus ditolak 400');

  // 6. Edit nama kota -> 200
  const namaUpdated = `${namaKotaBaru}_Update`;
  const editRes = await fetch(`${BASE_URL}/kota/${kotaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ nama: namaUpdated }),
  });
  assert.equal(editRes.status, 200, 'PUT /kota/:id harus 200');
  const editData = await editRes.json();
  assert.equal(editData.kota.nama, namaUpdated);

  // 7. Hapus kota -> 200
  const delRes = await fetch(`${BASE_URL}/kota/${kotaId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  assert.equal(delRes.status, 200, 'DELETE /kota/:id harus 200');

  // 8. Cek kembali jumlah kota harus sama seperti awal
  const getPubFinal = await fetch(`${BASE_URL}/kota`);
  const finalData = await getPubFinal.json();
  assert.equal(finalData.kota.length, initialCount, 'Jumlah kota harus kembali ke awal');

  console.log('✔ Seluruh alur API CRUD Kota berhasil diverifikasi!');
}

testKotaFlow().catch((err) => {
  console.error('❌ Gagal dalam test kota:', err);
  process.exit(1);
});
