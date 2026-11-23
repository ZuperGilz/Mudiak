import assert from 'node:assert/strict';
import prisma from './db.js';

const BASE_URL = 'http://localhost:5000/api';

async function testSearchFlow() {
  console.log('Memulai verifikasi API Pencarian Jadwal Publik...');

  // 1. Cek validasi parameter pencarian
  const badReq = await fetch(`${BASE_URL}/jadwal/search`);
  assert.equal(badReq.status, 400, 'Pencarian tanpa query param harus 400');

  // Ambil data kota Padang dan Bukittinggi dari seed
  const padang = await prisma.kota.findUnique({ where: { nama: 'Padang' } });
  const bkt = await prisma.kota.findUnique({ where: { nama: 'Bukittinggi' } });
  assert.ok(padang && bkt, 'Kota Padang dan Bukittinggi harus ada di DB');

  // 2. Pencarian tanggal kosong -> harus mengembalikan array kosong
  const searchEmpty = await fetch(
    `${BASE_URL}/jadwal/search?asalId=${padang.id}&tujuanId=${bkt.id}&tanggal=2026-10-15`
  );
  assert.equal(searchEmpty.status, 200, 'Pencarian harus berhasil (200)');
  const emptyData = await searchEmpty.json();
  assert.deepEqual(emptyData.jadwal, [], 'Jadwal harus berupa array kosong jika belum ada data');

  // 3. Masukkan data dummy sementara untuk menguji hasil pencarian
  const operator = await prisma.user.findUnique({ where: { email: 'ans@mudiak.id' } });
  const bus = await prisma.bus.create({
    data: {
      operatorId: operator.id,
      nama: 'ANS Demo Bus 01',
      platNomor: `BA ${Math.floor(1000 + Math.random() * 9000)} DM`,
      kapasitas: 28,
      kelas: 'Eksekutif',
    },
  });

  const rute = await prisma.rute.upsert({
    where: {
      asalId_tujuanId: { asalId: padang.id, tujuanId: bkt.id },
    },
    update: {},
    create: {
      asalId: padang.id,
      tujuanId: bkt.id,
      jarakKm: 90,
    },
  });

  const testTanggal = '2026-10-20';
  const jadwal = await prisma.jadwal.create({
    data: {
      busId: bus.id,
      ruteId: rute.id,
      tanggal: testTanggal,
      jamBerangkat: '08:30',
      harga: 35000,
      status: 'AKTIF',
      kursiList: {
        create: Array.from({ length: 28 }, (_, i) => ({
          nomorKursi: `${i + 1}`,
          status: 'TERSEDIA',
        })),
      },
    },
  });

  // 4. Uji Pencarian Publik (tanpa token / login)
  const searchRes = await fetch(
    `${BASE_URL}/jadwal/search?asalId=${padang.id}&tujuanId=${bkt.id}&tanggal=${testTanggal}`
  );
  assert.equal(searchRes.status, 200, 'Pencarian publik jadwal harus 200');
  const searchData = await searchRes.json();
  assert.equal(searchData.jadwal.length, 1, 'Harus menemukan 1 jadwal');
  const found = searchData.jadwal[0];
  assert.equal(found.id, jadwal.id);
  assert.equal(found.jamBerangkat, '08:30');
  assert.equal(found.harga, 35000);
  assert.equal(found.kursiTersedia, 28);
  assert.equal(found.bus.operatorNama, 'PO ANS Padang');

  // 5. Uji detail jadwal
  const detailRes = await fetch(`${BASE_URL}/jadwal/${jadwal.id}`);
  assert.equal(detailRes.status, 200, 'Detail jadwal harus 200');
  const detailData = await detailRes.json();
  assert.equal(detailData.jadwal.kursiList.length, 28);
  assert.equal(detailData.jadwal.kursiTersedia, 28);

  // 6. Bersihkan data uji
  await prisma.kursi.deleteMany({ where: { jadwalId: jadwal.id } });
  await prisma.jadwal.delete({ where: { id: jadwal.id } });
  await prisma.bus.delete({ where: { id: bus.id } });

  console.log('✔ Seluruh alur API Pencarian Jadwal Publik berhasil diverifikasi!');
}

testSearchFlow().catch((err) => {
  console.error('❌ Gagal dalam test search flow:', err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
