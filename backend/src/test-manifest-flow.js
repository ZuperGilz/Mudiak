import assert from 'node:assert/strict';
import prisma from './db.js';

const BASE_URL = 'http://localhost:5000/api';

async function testManifestFlow() {
  console.log('Memulai verifikasi API Manifest & Boarding Operator...');

  // 1. Ambil data pendukung
  const padang = await prisma.kota.findUnique({ where: { nama: 'Padang' } });
  const bkt = await prisma.kota.findUnique({ where: { nama: 'Bukittinggi' } });
  const operator1 = await prisma.user.findUnique({ where: { email: 'ans@mudiak.id' } });

  // 2. Login Operator 1
  const loginOp1 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ans@mudiak.id', password: 'password123' }),
  });
  const op1Token = (await loginOp1.json()).token;

  // 3. Buat Bus & Jadwal untuk Operator 1
  const bus = await prisma.bus.create({
    data: {
      operatorId: operator1.id,
      nama: 'ANS Bus Manifest Test',
      platNomor: `BA ${Math.floor(1000 + Math.random() * 9000)} MNF`,
      kapasitas: 12,
      kelas: 'Eksekutif',
    },
  });

  const rute = await prisma.rute.upsert({
    where: { asalId_tujuanId: { asalId: padang.id, tujuanId: bkt.id } },
    update: {},
    create: { asalId: padang.id, tujuanId: bkt.id },
  });

  const jadwal = await prisma.jadwal.create({
    data: {
      busId: bus.id,
      ruteId: rute.id,
      tanggal: '2026-11-10',
      jamBerangkat: '08:00',
      harga: 30000,
      status: 'AKTIF',
      kursiList: {
        create: Array.from({ length: 12 }, (_, i) => ({
          nomorKursi: String(i + 1),
          status: 'TERSEDIA',
        })),
      },
    },
    include: { kursiList: { orderBy: { id: 'asc' } } },
  });

  // 4. Login Penumpang dan Pesan 2 Kursi (Kursi 1 & 2)
  const loginPenumpang = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@gmail.com', password: 'password123' }),
  });
  const penumpangToken = (await loginPenumpang.json()).token;

  const orderRes = await fetch(`${BASE_URL}/pesanan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${penumpangToken}`,
    },
    body: JSON.stringify({
      jadwalId: jadwal.id,
      kursiIds: [jadwal.kursiList[0].id, jadwal.kursiList[1].id],
      namaKontak: 'Budi Minang Manifest',
      noHpKontak: '081299998888',
    }),
  });
  assert.equal(orderRes.status, 201);
  const pesanan = (await orderRes.json()).pesanan;

  // 5. Operator 1 Membuka Manifest Jadwal
  const getManifestRes = await fetch(`${BASE_URL}/jadwal/${jadwal.id}/manifest`, {
    headers: { Authorization: `Bearer ${op1Token}` },
  });
  assert.equal(getManifestRes.status, 200, 'Operator 1 harus berhasil membuka manifest (200)');
  const manifestData = await getManifestRes.json();

  assert.equal(manifestData.stats.totalPenumpang, 2, 'Total manifest harus memuat 2 penumpang');
  assert.equal(manifestData.stats.sudahBoarding, 0, 'Awalnya belum ada yang boarding');
  assert.equal(manifestData.stats.belumBoarding, 2);

  const penumpang1 = manifestData.manifest[0];
  const penumpang2 = manifestData.manifest[1];
  assert.equal(penumpang1.namaPenumpang, 'Budi Minang Manifest');
  assert.equal(penumpang1.nomorKursi, '1');
  assert.equal(penumpang1.kodeBooking, pesanan.kodeBooking);
  assert.equal(penumpang1.statusBarang, 'BELUM_BOARDING');

  // 6. Buat Operator 2 sementara untuk menguji isolasi
  const op2Email = `op2_mnf_${Date.now()}@mudiak.id`;
  const regOp2 = await fetch(`${BASE_URL}/auth/register-operator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nama: 'PO Lain Test',
      email: op2Email,
      password: 'password123',
      noHp: '081200001111',
    }),
  });
  const op2Id = (await regOp2.json()).user.id;

  // Aktifkan Operator 2 via Admin
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

  const loginOp2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: op2Email, password: 'password123' }),
  });
  const op2Token = (await loginOp2.json()).token;

  // Operator 2 mencoba membuka manifest jadwal Operator 1 -> HARUS DITOLAK (403)
  const op2ManifestAccess = await fetch(`${BASE_URL}/jadwal/${jadwal.id}/manifest`, {
    headers: { Authorization: `Bearer ${op2Token}` },
  });
  assert.equal(op2ManifestAccess.status, 403, 'Operator lain dilarang melihat manifest (403)');

  // Operator 2 mencoba mengubah status boarding tiket Operator 1 -> HARUS DITOLAK (403)
  const op2BoardingAccess = await fetch(`${BASE_URL}/jadwal/tiket/${penumpang1.tiketId}/boarding`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op2Token}`,
    },
    body: JSON.stringify({ status: 'BOARDING' }),
  });
  assert.equal(op2BoardingAccess.status, 403, 'Operator lain dilarang toggle boarding tiket ini (403)');

  // 7. Operator 1 Menandai Penumpang 1 Sudah BOARDING
  const setBoardingRes = await fetch(`${BASE_URL}/jadwal/tiket/${penumpang1.tiketId}/boarding`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${op1Token}`,
    },
    body: JSON.stringify({ status: 'BOARDING' }),
  });
  assert.equal(setBoardingRes.status, 200, 'Operator 1 berhasil menandai boarding (200)');
  const updatedTiket = (await setBoardingRes.json()).tiket;
  assert.equal(updatedTiket.statusBarang, 'BOARDING');

  // 8. Cek Manifest Kembali -> stats sudahBoarding menjadi 1
  const reCheckManifest = await fetch(`${BASE_URL}/jadwal/${jadwal.id}/manifest`, {
    headers: { Authorization: `Bearer ${op1Token}` },
  });
  const reData = await reCheckManifest.json();
  assert.equal(reData.stats.sudahBoarding, 1);
  assert.equal(reData.stats.belumBoarding, 1);
  assert.equal(reData.manifest[0].statusBarang, 'BOARDING');

  // 9. Bersihkan data pengujian
  await prisma.tiket.deleteMany({ where: { pesananId: pesanan.id } });
  await prisma.pesanan.delete({ where: { id: pesanan.id } });
  await prisma.kursi.deleteMany({ where: { jadwalId: jadwal.id } });
  await prisma.jadwal.delete({ where: { id: jadwal.id } });
  await prisma.bus.delete({ where: { id: bus.id } });
  await fetch(`${BASE_URL}/users/${op2Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  console.log('✔ Seluruh alur Manifest & Boarding Operator berhasil diverifikasi!');
}

testManifestFlow()
  .catch((err) => {
    console.error('❌ Gagal dalam test manifest flow:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
