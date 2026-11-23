import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed data awal PO AYAH untuk Mudiak:
 * - 1 Admin
 * - 1 Operator (PO AYAH Padang)
 * - 1 Penumpang
 * - 8 Kota di Sumatera Barat
 * - Rute Utama
 * - 16 Armada Microbus PO AYAH beserta Sopir & Kapasitas (16-18)
 * - Jadwal keberangkatan & Kursi
 */
async function main() {
  console.log('Menjalankan database seed PO AYAH untuk Mudiak...');

  // Bersihkan data lama
  await prisma.tiket.deleteMany();
  await prisma.pesanan.deleteMany();
  await prisma.kursi.deleteMany();
  await prisma.jadwal.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.rute.deleteMany();
  await prisma.kota.deleteMany();
  await prisma.user.deleteMany();

  // Hash password standar
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. Seed 3 Akun Pengguna
  const admin = await prisma.user.create({
    data: {
      nama: 'Administrator Mudiak',
      email: 'admin@mudiak.id',
      password: passwordHash,
      noHp: '081234567890',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const operator = await prisma.user.create({
    data: {
      nama: 'PO AYAH Padang',
      email: 'ayah@mudiak.id',
      password: passwordHash,
      noHp: '081270410000',
      role: 'OPERATOR',
      status: 'ACTIVE',
    },
  });

  const penumpang = await prisma.user.create({
    data: {
      nama: 'Budi Minang',
      email: 'budi@gmail.com',
      password: passwordHash,
      noHp: '081234567892',
      role: 'PENUMPANG',
      status: 'ACTIVE',
    },
  });

  console.log(`Pengguna di-seed: Admin (${admin.email}), Operator (${operator.email}), Penumpang (${penumpang.email})`);

  // 2. Seed Master Kota
  const daftarKota = [
    'Padang',
    'Bukittinggi',
    'Payakumbuh',
    'Solok',
    'Padang Panjang',
    'Batusangkar',
    'Pariaman',
    'Sawahlunto',
  ];

  const kotaMap = {};
  for (const namaKota of daftarKota) {
    const k = await prisma.kota.create({
      data: { nama: namaKota },
    });
    kotaMap[namaKota] = k.id;
  }
  console.log(`Berhasil men-seed ${daftarKota.length} master kota Sumatera Barat.`);

  // 3. Seed Rute
  const rutePadangBukittinggi = await prisma.rute.create({
    data: {
      asalId: kotaMap['Padang'],
      tujuanId: kotaMap['Bukittinggi'],
      jarakKm: 95,
    },
  });

  const rutePadangPayakumbuh = await prisma.rute.create({
    data: {
      asalId: kotaMap['Padang'],
      tujuanId: kotaMap['Payakumbuh'],
      jarakKm: 124,
    },
  });

  const rutePadangSolok = await prisma.rute.create({
    data: {
      asalId: kotaMap['Padang'],
      tujuanId: kotaMap['Solok'],
      jarakKm: 68,
    },
  });

  // 4. Seed 16 Armada Bus & Supir PO AYAH (Wawancara Lapangan)
  const armadaList = [
    { plat: 'BA 7041 AB', supir: 'ANDI', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7094 FA', supir: 'EDO', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7091 NA', supir: 'EDI', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7210 EA', supir: 'MUL', kap: 18, depan: 2, kelas: 'Super Executive' },
    { plat: 'BA 7212 TA', supir: 'BEN', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7256 LA', supir: 'ANDI GAMPANG', kap: 18, depan: 2, kelas: 'Super Executive' },
    { plat: 'BA 7074 BO', supir: 'HEND SAKATO', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7573 FB', supir: 'EF. KAMPAI', kap: 18, depan: 3, kelas: 'Super Executive (3 Depan)' },
    { plat: 'BA 7093 NB', supir: 'BOY', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7832 ZA', supir: 'PUTRA', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7202 LB', supir: 'WANDA', kap: 18, depan: 2, kelas: 'Super Executive' },
    { plat: 'BA 7150 QA', supir: 'AGUS', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7101 EB', supir: 'AL', kap: 18, depan: 2, kelas: 'Super Executive' },
    { plat: 'BA 7212 TB', supir: 'SAIPUL', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
    { plat: 'BA 7809 RA', supir: 'FAPLY', kap: 18, depan: 3, kelas: 'Super Executive (3 Depan)' },
    { plat: 'BA 7075 LC', supir: 'BOY', kap: 16, depan: 2, kelas: 'Eksekutif Travel' },
  ];

  const createdBuses = [];
  for (let i = 0; i < armadaList.length; i++) {
    const a = armadaList[i];
    const b = await prisma.bus.create({
      data: {
        operatorId: operator.id,
        nama: `PO AYAH Travel ${String(i + 1).padStart(2, '0')}`,
        platNomor: a.plat,
        kapasitas: a.kap,
        kursiDepan: a.depan,
        kelas: a.kelas,
        supir: a.supir,
      },
    });
    createdBuses.push(b);
  }
  console.log(`Berhasil men-seed ${createdBuses.length} armada travel PO AYAH beserta supir.`);

  // 5. Seed Jadwal & Kursi Otomatis di Beberapa Rute & Tanggal Populer
  const daftarJadwal = [
    // Padang -> Bukittinggi
    { bus: createdBuses[0], rute: rutePadangBukittinggi, tanggal: '2026-11-16', jam: '08:00', harga: 65000 },
    { bus: createdBuses[1], rute: rutePadangBukittinggi, tanggal: '2026-11-16', jam: '09:30', harga: 65000 },
    { bus: createdBuses[3], rute: rutePadangBukittinggi, tanggal: '2026-11-16', jam: '11:00', harga: 75000 },
    { bus: createdBuses[0], rute: rutePadangBukittinggi, tanggal: '2026-11-23', jam: '08:00', harga: 65000 },
    { bus: createdBuses[1], rute: rutePadangBukittinggi, tanggal: '2026-11-23', jam: '10:00', harga: 65000 },
    { bus: createdBuses[0], rute: rutePadangBukittinggi, tanggal: '2026-11-25', jam: '08:00', harga: 65000 },
    { bus: createdBuses[1], rute: rutePadangBukittinggi, tanggal: '2026-11-25', jam: '13:30', harga: 65000 },

    // Padang -> Payakumbuh
    { bus: createdBuses[2], rute: rutePadangPayakumbuh, tanggal: '2026-11-16', jam: '08:00', harga: 70000 },
    { bus: createdBuses[2], rute: rutePadangPayakumbuh, tanggal: '2026-11-23', jam: '08:30', harga: 70000 },
    { bus: createdBuses[4], rute: rutePadangPayakumbuh, tanggal: '2026-11-25', jam: '10:00', harga: 70000 },

    // Padang -> Solok
    { bus: createdBuses[5], rute: rutePadangSolok, tanggal: '2026-11-16', jam: '07:00', harga: 55000 },
    { bus: createdBuses[5], rute: rutePadangSolok, tanggal: '2026-11-23', jam: '07:00', harga: 55000 },
  ];

  let totalKursiCreated = 0;
  for (const j of daftarJadwal) {
    const jadwal = await prisma.jadwal.create({
      data: {
        busId: j.bus.id,
        ruteId: j.rute.id,
        tanggal: j.tanggal,
        jamBerangkat: j.jam,
        harga: j.harga,
        status: 'AKTIF',
      },
    });

    const kursiData = [];
    for (let s = 1; s <= j.bus.kapasitas; s++) {
      kursiData.push({
        jadwalId: jadwal.id,
        nomorKursi: String(s),
        status: 'TERSEDIA',
      });
      totalKursiCreated++;
    }
    await prisma.kursi.createMany({ data: kursiData });
  }

  console.log(`Berhasil men-seed ${daftarJadwal.length} jadwal dan ${totalKursiCreated} kursi di database.`);
}

main()
  .catch((e) => {
    console.error('Gagal menjalankan seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
