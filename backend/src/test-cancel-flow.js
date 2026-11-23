import assert from 'node:assert/strict';
import prisma from './db.js';

const BASE_URL = 'http://localhost:5000/api';

async function testCancelFlow() {
  console.log('Memulai verifikasi API Tiket Saya & Pembatalan Tiket Penumpang...');

  // 1. Ambil data pendukung
  const padang = await prisma.kota.findUnique({ where: { nama: 'Padang' } });
  const bkt = await prisma.kota.findUnique({ where: { nama: 'Bukittinggi' } });
  const operator = await prisma.user.findUnique({ where: { email: 'ans@mudiak.id' } });

  // 2. Buat Bus & Jadwal
  const bus = await prisma.bus.create({
    data: {
      operatorId: operator.id,
      nama: 'ANS Bus Uji Batal',
      platNomor: `BA ${Math.floor(1000 + Math.random() * 9000)} BTL`,
      kapasitas: 16,
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
      tanggal: '2026-11-05',
      jamBerangkat: '10:00',
      harga: 35000,
      status: 'AKTIF',
      kursiList: {
        create: Array.from({ length: 16 }, (_, i) => ({
          nomorKursi: String(i + 1),
          status: 'TERSEDIA',
        })),
      },
    },
    include: {
      kursiList: { orderBy: { id: 'asc' } },
    },
  });

  const targetKursi = jadwal.kursiList[0]; // Kursi nomor 1

  // 3. Login Penumpang
  const loginPenumpang = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@gmail.com', password: 'password123' }),
  });
  const penumpangToken = (await loginPenumpang.json()).token;

  // 4. Penumpang Memesan Kursi
  const orderRes = await fetch(`${BASE_URL}/pesanan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${penumpangToken}`,
    },
    body: JSON.stringify({
      jadwalId: jadwal.id,
      kursiIds: [targetKursi.id],
      namaKontak: 'Budi Minang',
      noHpKontak: '081234567892',
    }),
  });
  assert.equal(orderRes.status, 201);
  const pesanan = (await orderRes.json()).pesanan;

  // 5. Cek Tiket Saya (/api/pesanan/saya) -> Pesanan harus muncul
  const myTicketsRes = await fetch(`${BASE_URL}/pesanan/saya`, {
    headers: { Authorization: `Bearer ${penumpangToken}` },
  });
  assert.equal(myTicketsRes.status, 200);
  const myTickets = (await myTicketsRes.json()).pesanan;
  assert.ok(myTickets.some((p) => p.id === pesanan.id), 'Pesanan baru harus muncul di daftar tiket aktif');

  // Kursi harus berstatus DIPESAN
  const kursiBefore = await prisma.kursi.findUnique({ where: { id: targetKursi.id } });
  assert.equal(kursiBefore.status, 'DIPESAN');

  // 6. Penumpang Membatalkan Tiket (PATCH /api/pesanan/:id/batal)
  const cancelRes = await fetch(`${BASE_URL}/pesanan/${pesanan.id}/batal`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${penumpangToken}` },
  });
  assert.equal(cancelRes.status, 200, 'Pembatalan harus berhasil (200)');
  const cancelData = await cancelRes.json();
  assert.ok(cancelData.message.includes('berhasil dibatalkan'));

  // 7. Verifikasi Kursi Kembali Jadi TERSEDIA
  const kursiAfter = await prisma.kursi.findUnique({ where: { id: targetKursi.id } });
  assert.equal(kursiAfter.status, 'TERSEDIA', 'Kursi yang dibatalkan harus kembali berstatus TERSEDIA');

  // 8. Cek Tiket Saya Kembali -> Tiket yang sudah batal TIDAK BOLEH muncul lagi (riwayat aktif saja)
  const myTicketsAfterRes = await fetch(`${BASE_URL}/pesanan/saya`, {
    headers: { Authorization: `Bearer ${penumpangToken}` },
  });
  const myTicketsAfter = (await myTicketsAfterRes.json()).pesanan;
  assert.equal(
    myTicketsAfter.some((p) => p.id === pesanan.id),
    false,
    'Tiket yang dibatalkan tidak boleh muncul di daftar tiket aktif'
  );

  // 9. Bersihkan data uji
  await prisma.tiket.deleteMany({ where: { pesananId: pesanan.id } });
  await prisma.pesanan.delete({ where: { id: pesanan.id } });
  await prisma.kursi.deleteMany({ where: { jadwalId: jadwal.id } });
  await prisma.jadwal.delete({ where: { id: jadwal.id } });
  await prisma.bus.delete({ where: { id: bus.id } });

  console.log('✔ Seluruh alur Tiket Saya & Pembatalan Penumpang berhasil diverifikasi!');
}

testCancelFlow()
  .catch((err) => {
    console.error('❌ Gagal dalam test cancel flow:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
