import assert from 'node:assert/strict';
import prisma from './db.js';

const BASE_URL = 'http://localhost:5000/api';

async function testJadwalOperator() {
  console.log('Memulai verifikasi API Manajemen Jadwal & Rute Operator...');

  // 1. Ambil kota Padang & Bukittinggi
  const padang = await prisma.kota.findUnique({ where: { nama: 'Padang' } });
  const bkt = await prisma.kota.findUnique({ where: { nama: 'Bukittinggi' } });
  assert.ok(padang && bkt, 'Kota Padang & Bukittinggi harus ada');

  // 2. Login Operator 1 (PO ANS)
  const loginOp1 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ans@mudiak.id', password: 'password123' }),
  });
  const op1Token = (await loginOp1.json()).token;

  // 3. Tambahkan 1 bus untuk Operator 1
  const platBus = `BA ${Math.floor(1000 + Math.random() * 9000)} JDW`;
  const addBus = await fetch(`${BASE_URL}/bus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({
      nama: 'ANS Test Jadwal Bus',
      platNomor: platBus,
      kapasitas: 24,
      kelas: 'Eksekutif',
    }),
  });
  assert.equal(addBus.status, 201);
  const busId = (await addBus.json()).bus.id;

  // 4. Operator 1 membuat Jadwal Keberangkatan
  const tglTest = '2026-10-25';
  const jamTest = '09:00';
  const createJadwalRes = await fetch(`${BASE_URL}/jadwal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({
      asalId: padang.id,
      tujuanId: bkt.id,
      busId: busId,
      tanggal: tglTest,
      jamBerangkat: jamTest,
      harga: 40000,
    }),
  });
  assert.equal(createJadwalRes.status, 201, 'Jadwal harus berhasil dibuat (201)');
  const createdJadwal = (await createJadwalRes.json()).jadwal;
  const jadwalId = createdJadwal.id;

  // 5. Verifikasi Auto-Generate Kursi
  assert.equal(createdJadwal.kursiList.length, 24, 'Harus ter-generate otomatis 24 kursi');
  assert.equal(createdJadwal.kursiList[0].nomorKursi, '1');
  assert.equal(createdJadwal.kursiList[23].nomorKursi, '24');
  assert.equal(createdJadwal.kursiList[0].status, 'TERSEDIA');

  // 6. Validasi Anti-Bentrok: Buat jadwal lagi dengan bus, tanggal, dan jam yang sama
  const bentrokRes = await fetch(`${BASE_URL}/jadwal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({
      asalId: padang.id,
      tujuanId: bkt.id,
      busId: busId,
      tanggal: tglTest,
      jamBerangkat: jamTest,
      harga: 40000,
    }),
  });
  assert.equal(bentrokRes.status, 400, 'Jadwal bentrok harus ditolak HTTP 400');
  const bentrokData = await bentrokRes.json();
  assert.ok(bentrokData.message.includes('sudah dijadwalkan'), 'Pesan error harus menjelaskan jadwal bentrok');

  // 7. Verifikasi Integrasi ke Pencarian Tiket 06
  const searchCheck = await fetch(
    `${BASE_URL}/jadwal/search?asalId=${padang.id}&tujuanId=${bkt.id}&tanggal=${tglTest}`
  );
  assert.equal(searchCheck.status, 200);
  const searchResults = (await searchCheck.json()).jadwal;
  assert.ok(searchResults.some((j) => j.id === jadwalId), 'Jadwal yang dibuat harus muncul di hasil pencarian publik');
  const searchFound = searchResults.find((j) => j.id === jadwalId);
  assert.equal(searchFound.kursiTersedia, 24);
  assert.equal(searchFound.harga, 40000);

  // 8. Operator 1 Mengubah Jadwal (Jam diubah ke 09:30)
  const editJadwalRes = await fetch(`${BASE_URL}/jadwal/${jadwalId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({
      jamBerangkat: '09:30',
      harga: 45000,
    }),
  });
  assert.equal(editJadwalRes.status, 200, 'Edit jadwal harus sukses (200)');
  const editedJadwal = (await editJadwalRes.json()).jadwal;
  assert.equal(editedJadwal.jamBerangkat, '09:30');
  assert.equal(editedJadwal.harga, 45000);

  // 9. Operator 1 Menghapus Jadwal
  const delJadwalRes = await fetch(`${BASE_URL}/jadwal/${jadwalId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${op1Token}` },
  });
  assert.equal(delJadwalRes.status, 200, 'Hapus jadwal harus sukses (200)');

  // Verifikasi kursi juga ikut terhapus
  const sisaKursi = await prisma.kursi.count({ where: { jadwalId } });
  assert.equal(sisaKursi, 0, 'Kursi jadwal harus bersih terhapus');

  // 10. Bersihkan Bus pengujian
  await fetch(`${BASE_URL}/bus/${busId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${op1Token}` },
  });

  console.log('✔ Seluruh alur Manajemen Jadwal & Rute Operator berhasil diverifikasi!');
}

testJadwalOperator()
  .catch((err) => {
    console.error('❌ Gagal dalam test jadwal operator:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
