import assert from 'node:assert/strict';
import prisma from './db.js';

const BASE_URL = 'http://localhost:5000/api';

async function testBookingFlow() {
  console.log('Memulai verifikasi API Pemesanan Tiket & Denah Kursi...');

  // 1. Ambil kota & operator
  const padang = await prisma.kota.findUnique({ where: { nama: 'Padang' } });
  const bkt = await prisma.kota.findUnique({ where: { nama: 'Bukittinggi' } });
  const operator = await prisma.user.findUnique({ where: { email: 'ans@mudiak.id' } });

  // 2. Buat Bus & Jadwal untuk pengujian
  const bus = await prisma.bus.create({
    data: {
      operatorId: operator.id,
      nama: 'ANS Test Booking 01',
      platNomor: `BA ${Math.floor(1000 + Math.random() * 9000)} BK`,
      kapasitas: 20,
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
      tanggal: '2026-10-30',
      jamBerangkat: '07:30',
      harga: 30000,
      status: 'AKTIF',
      kursiList: {
        create: Array.from({ length: 20 }, (_, i) => ({
          nomorKursi: String(i + 1),
          status: 'TERSEDIA',
        })),
      },
    },
    include: {
      kursiList: { orderBy: { id: 'asc' } },
    },
  });

  const kursi1 = jadwal.kursiList[0];
  const kursi2 = jadwal.kursiList[1];

  // 3. Login sebagai Penumpang
  const loginPenumpang = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@gmail.com', password: 'password123' }),
  });
  const penumpangToken = (await loginPenumpang.json()).token;

  // 4. Coba pesan tanpa token -> 401
  const noAuthBooking = await fetch(`${BASE_URL}/pesanan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jadwalId: jadwal.id,
      kursiIds: [kursi1.id],
      namaKontak: 'Budi Minang',
      noHpKontak: '081234567892',
    }),
  });
  assert.equal(noAuthBooking.status, 401, 'Pemesanan tanpa token harus ditolak 401');

  // 5. Penumpang memesan 2 kursi sekaligus (kursi 1 dan kursi 2)
  const bookingRes = await fetch(`${BASE_URL}/pesanan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${penumpangToken}`,
    },
    body: JSON.stringify({
      jadwalId: jadwal.id,
      kursiIds: [kursi1.id, kursi2.id],
      namaKontak: 'Budi Minang & Keluarga',
      noHpKontak: '081234567892',
    }),
  });
  assert.equal(bookingRes.status, 201, 'Pemesanan harus berhasil (201)');
  const bookingData = await bookingRes.json();
  const pesanan = bookingData.pesanan;

  assert.ok(pesanan.kodeBooking.startsWith('MDK-'), 'Kode booking harus berformat MDK-XXXXXX');
  assert.equal(pesanan.totalHarga, 60000, 'Total harga 2 kursi x 30.000 = 60.000');
  assert.equal(pesanan.status, 'CONFIRMED');
  assert.equal(pesanan.statusBayar, 'SUDAH_BAYAR');
  assert.equal(pesanan.tiketList.length, 2, 'Harus terbentuk 2 tiket');

  // 6. Verifikasi kursi sekarang berstatus DIPESAN di database
  const cekKursi1 = await prisma.kursi.findUnique({ where: { id: kursi1.id } });
  const cekKursi2 = await prisma.kursi.findUnique({ where: { id: kursi2.id } });
  assert.equal(cekKursi1.status, 'DIPESAN', 'Kursi 1 harus berubah status jadi DIPESAN');
  assert.equal(cekKursi2.status, 'DIPESAN', 'Kursi 2 harus berubah status jadi DIPESAN');

  // 7. Coba pesan lagi kursi yang sama -> Harus DITOLAK (400)
  const doubleBookingRes = await fetch(`${BASE_URL}/pesanan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${penumpangToken}`,
    },
    body: JSON.stringify({
      jadwalId: jadwal.id,
      kursiIds: [kursi1.id],
      namaKontak: 'Penumpang Lain',
      noHpKontak: '081299990000',
    }),
  });
  assert.equal(doubleBookingRes.status, 400, 'Pemesanan kursi yang sudah terisi harus ditolak 400');
  const doubleData = await doubleBookingRes.json();
  assert.ok(doubleData.message.includes('sudah dipesan'));

  // 8. Cek Detail Pesanan lewat kode booking
  const getPesananRes = await fetch(`${BASE_URL}/pesanan/${pesanan.kodeBooking}`, {
    headers: { Authorization: `Bearer ${penumpangToken}` },
  });
  assert.equal(getPesananRes.status, 200, 'Get pesanan by kode booking harus 200');
  const detailPesanan = (await getPesananRes.json()).pesanan;
  assert.equal(detailPesanan.kodeBooking, pesanan.kodeBooking);

  // 9. Bersihkan data pengujian
  await prisma.tiket.deleteMany({ where: { pesananId: pesanan.id } });
  await prisma.pesanan.delete({ where: { id: pesanan.id } });
  await prisma.kursi.deleteMany({ where: { jadwalId: jadwal.id } });
  await prisma.jadwal.delete({ where: { id: jadwal.id } });
  await prisma.bus.delete({ where: { id: bus.id } });

  console.log('✔ Seluruh alur API Pemesanan Tiket & Validasi Kursi berhasil diverifikasi!');
}

testBookingFlow()
  .catch((err) => {
    console.error('❌ Gagal dalam test booking flow:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
