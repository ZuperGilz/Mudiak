import assert from 'node:assert/strict';
import prisma from './db.js';

const BASE_URL = 'http://localhost:5000/api';

async function testLaporanFlow() {
  console.log('Memulai verifikasi API Laporan & Statistik Admin...');

  // 1. Coba akses tanpa token -> 401
  const noToken = await fetch(`${BASE_URL}/laporan`);
  assert.equal(noToken.status, 401, 'Akses tanpa token harus 401');

  // 2. Coba akses dengan token Penumpang -> 403
  const loginPenumpang = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@gmail.com', password: 'password123' }),
  });
  const penumpangToken = (await loginPenumpang.json()).token;

  const accessPenumpang = await fetch(`${BASE_URL}/laporan`, {
    headers: { Authorization: `Bearer ${penumpangToken}` },
  });
  assert.equal(accessPenumpang.status, 403, 'Penumpang dilarang akses laporan (403)');

  // 3. Login Admin
  const loginAdmin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mudiak.id', password: 'password123' }),
  });
  const adminToken = (await loginAdmin.json()).token;

  // 4. Siapkan data transaksi pesanan untuk diuji
  const padang = await prisma.kota.findUnique({ where: { nama: 'Padang' } });
  const bkt = await prisma.kota.findUnique({ where: { nama: 'Bukittinggi' } });
  const op1 = await prisma.user.findUnique({ where: { email: 'ans@mudiak.id' } });
  const userPenumpang = await prisma.user.findUnique({ where: { email: 'budi@gmail.com' } });

  const bus = await prisma.bus.create({
    data: {
      operatorId: op1.id,
      nama: 'ANS Royal Analytics 01',
      platNomor: `BA ${Math.floor(1000 + Math.random() * 9000)} LAP`,
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
      tanggal: '2026-11-20',
      jamBerangkat: '13:00',
      harga: 50000,
      status: 'AKTIF',
      kursiList: {
        create: Array.from({ length: 20 }, (_, i) => ({
          nomorKursi: String(i + 1),
          status: 'TERSEDIA',
        })),
      },
    },
    include: { kursiList: { orderBy: { id: 'asc' } } },
  });

  // Buat Pesanan: 2 kursi x 50.000 = 100.000
  const pesanan = await prisma.pesanan.create({
    data: {
      kodeBooking: `MDK-TST${Math.floor(100 + Math.random() * 900)}`,
      penumpangId: userPenumpang.id,
      jadwalId: jadwal.id,
      namaKontak: 'Budi Test Analytics',
      noHpKontak: '081299990000',
      totalHarga: 100000,
      status: 'CONFIRMED',
      statusBayar: 'SUDAH_BAYAR',
      tiketList: {
        create: [
          { kursiId: jadwal.kursiList[0].id, statusBarang: 'BELUM_BOARDING' },
          { kursiId: jadwal.kursiList[1].id, statusBarang: 'BELUM_BOARDING' },
        ],
      },
    },
  });

  // 5. Admin Mengambil Laporan (/api/laporan)
  const getLaporanRes = await fetch(`${BASE_URL}/laporan`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(getLaporanRes.status, 200, 'Admin harus berhasil mengambil laporan (200)');
  const laporanData = await getLaporanRes.json();

  // Validasi ringkasan
  assert.ok(laporanData.ringkasan.totalPesanan >= 1, 'Total pesanan harus terhitung');
  assert.ok(laporanData.ringkasan.totalPendapatan >= 100000, 'Total pendapatan harus mencakup 100.000');
  assert.ok(laporanData.ringkasan.totalTiketTerjual >= 2, 'Total tiket harus mencakup 2 tiket');

  // Validasi per operator
  const opReport = laporanData.pendapatanPerOperator.find((o) => o.operatorId === op1.id);
  assert.ok(opReport, 'Operator PO ANS harus tercatat di laporan');
  assert.ok(opReport.totalPendapatan >= 100000);
  assert.ok(opReport.totalTiket >= 2);

  // Validasi jadwal terpopuler
  const popJadwal = laporanData.jadwalTerpopuler.find((j) => j.jadwalId === jadwal.id);
  assert.ok(popJadwal, 'Jadwal yang baru dipesan harus masuk dalam daftar populer');
  assert.equal(popJadwal.tiketTerjual, 2);
  assert.equal(popJadwal.pendapatan, 100000);

  // 6. Bersihkan data uji
  await prisma.tiket.deleteMany({ where: { pesananId: pesanan.id } });
  await prisma.pesanan.delete({ where: { id: pesanan.id } });
  await prisma.kursi.deleteMany({ where: { jadwalId: jadwal.id } });
  await prisma.jadwal.delete({ where: { id: jadwal.id } });
  await prisma.bus.delete({ where: { id: bus.id } });

  console.log('✔ Seluruh alur API Laporan & Statistik Admin berhasil diverifikasi!');
}

testLaporanFlow()
  .catch((err) => {
    console.error('❌ Gagal dalam test laporan flow:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
