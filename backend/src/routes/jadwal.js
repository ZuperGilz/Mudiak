import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/jadwal/search
 * Endpoint Publik: Pencarian jadwal bus berdasarkan asalId, tujuanId, dan tanggal (YYYY-MM-DD).
 * Mengembalikan daftar jadwal lengkap dengan operator, bus, rute, harga, dan kalkulasi sisa kursi.
 */
router.get('/search', async (req, res) => {
  try {
    const { asalId, tujuanId, tanggal } = req.query;

    if (!asalId || !tujuanId || !tanggal) {
      return res.status(400).json({
        message: 'Parameter asalId, tujuanId, dan tanggal wajib disertakan',
      });
    }

    const aId = parseInt(asalId, 10);
    const tId = parseInt(tujuanId, 10);

    if (isNaN(aId) || isNaN(tId)) {
      return res.status(400).json({ message: 'asalId dan tujuanId harus berupa angka' });
    }

    // 1. Cari rute yang menghubungkan asalId dan tujuanId
    const rute = await prisma.rute.findUnique({
      where: {
        asalId_tujuanId: {
          asalId: aId,
          tujuanId: tId,
        },
      },
    });

    if (!rute) {
      return res.json({ jadwal: [] });
    }

    // 2. Cari jadwal pada rute dan tanggal tersebut dengan status AKTIF
    const jadwalList = await prisma.jadwal.findMany({
      where: {
        ruteId: rute.id,
        tanggal: tanggal.trim(),
        status: 'AKTIF',
      },
      include: {
        bus: {
          select: {
            id: true,
            nama: true,
            platNomor: true,
            kapasitas: true,
            kelas: true,
            operator: {
              select: {
                id: true,
                nama: true,
              },
            },
          },
        },
        rute: {
          include: {
            asal: { select: { id: true, nama: true } },
            tujuan: { select: { id: true, nama: true } },
          },
        },
        kursiList: {
          select: {
            id: true,
            nomorKursi: true,
            status: true,
          },
        },
      },
      orderBy: { jamBerangkat: 'asc' },
    });

    // 3. Format respons dan hitung sisa kursi tersedia
    const formatted = jadwalList.map((j) => {
      const totalKursi = j.kursiList.length || j.bus.kapasitas;
      const kursiTersedia = j.kursiList.length > 0
        ? j.kursiList.filter((k) => k.status === 'TERSEDIA').length
        : j.bus.kapasitas;

      return {
        id: j.id,
        tanggal: j.tanggal,
        jamBerangkat: j.jamBerangkat,
        harga: j.harga,
        status: j.status,
        bus: {
          id: j.bus.id,
          nama: j.bus.nama,
          platNomor: j.bus.platNomor,
          kelas: j.bus.kelas,
          kapasitas: j.bus.kapasitas,
          operatorNama: j.bus.operator.nama,
        },
        rute: {
          id: j.rute.id,
          asal: j.rute.asal.nama,
          tujuan: j.rute.tujuan.nama,
          jarakKm: j.rute.jarakKm,
        },
        totalKursi,
        kursiTersedia,
      };
    });

    return res.json({ jadwal: formatted });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal melakukan pencarian jadwal', error: error.message });
  }
});

/**
 * GET /api/jadwal
 * Mengambil daftar jadwal milik operator yang sedang login (atau seluruh jadwal jika Admin).
 */
router.get('/', authenticate, authorize('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'OPERATOR') {
      where.bus = { operatorId: req.user.id };
    }

    const jadwalList = await prisma.jadwal.findMany({
      where,
      include: {
        bus: {
          select: {
            id: true,
            nama: true,
            platNomor: true,
            kapasitas: true,
            kelas: true,
            operator: { select: { id: true, nama: true } },
          },
        },
        rute: {
          include: {
            asal: { select: { id: true, nama: true } },
            tujuan: { select: { id: true, nama: true } },
          },
        },
        kursiList: true,
        _count: {
          select: { pesananList: true },
        },
      },
      orderBy: [{ tanggal: 'desc' }, { jamBerangkat: 'asc' }],
    });

    const formatted = jadwalList.map((j) => {
      const totalKursi = j.kursiList.length || j.bus.kapasitas;
      const kursiTersedia = j.kursiList.filter((k) => k.status === 'TERSEDIA').length;
      return {
        id: j.id,
        tanggal: j.tanggal,
        jamBerangkat: j.jamBerangkat,
        harga: j.harga,
        status: j.status,
        bus: j.bus,
        rute: {
          id: j.rute.id,
          asal: j.rute.asal.nama,
          tujuan: j.rute.tujuan.nama,
        },
        totalKursi,
        kursiTersedia,
        totalPesanan: j._count.pesananList,
      };
    });

    return res.json({ jadwal: formatted });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat daftar jadwal', error: error.message });
  }
});

/**
 * POST /api/jadwal
 * Operator membuat jadwal baru:
 * - Pilih asalId, tujuanId (dari master kota)
 * - Pilih busId (milik operator)
 * - Tentukan tanggal (YYYY-MM-DD), jamBerangkat (HH:mm), harga (flat)
 * - Auto-generate kursi (1..Kapasitas)
 * - Validasi anti-bentrok: bus tidak boleh dobel jadwal di tanggal & jam sama
 */
router.post('/', authenticate, authorize('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const { asalId, tujuanId, busId, tanggal, jamBerangkat, harga } = req.body;

    if (!asalId || !tujuanId || !busId || !tanggal || !jamBerangkat || !harga) {
      return res.status(400).json({
        message: 'Kota asal, kota tujuan, bus, tanggal, jam berangkat, dan harga wajib diisi',
      });
    }

    const aId = parseInt(asalId, 10);
    const tId = parseInt(tujuanId, 10);
    const bId = parseInt(busId, 10);
    const hargaNum = parseInt(harga, 10);

    if (isNaN(aId) || isNaN(tId) || isNaN(bId) || isNaN(hargaNum)) {
      return res.status(400).json({ message: 'Format data input numerik tidak valid' });
    }

    if (aId === tId) {
      return res.status(400).json({ message: 'Kota asal dan kota tujuan tidak boleh sama' });
    }

    if (hargaNum <= 0) {
      return res.status(400).json({ message: 'Harga tiket harus lebih besar dari 0' });
    }

    // 1. Verifikasi Bus dan Kepemilikannya
    const bus = await prisma.bus.findUnique({ where: { id: bId } });
    if (!bus) {
      return res.status(404).json({ message: 'Armada bus tidak ditemukan' });
    }

    if (req.user.role === 'OPERATOR' && bus.operatorId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda bukan pemilik armada bus ini' });
    }

    const tanggalClean = tanggal.trim();
    const jamClean = jamBerangkat.trim();

    // 2. Validasi Anti-Bentrok: Bus tidak boleh memiliki jadwal lain pada tanggal & jam yang sama
    const bentrok = await prisma.jadwal.findUnique({
      where: {
        busId_tanggal_jamBerangkat: {
          busId: bId,
          tanggal: tanggalClean,
          jamBerangkat: jamClean,
        },
      },
    });

    if (bentrok) {
      return res.status(400).json({
        message: `Armada bus '${bus.nama} (${bus.platNomor})' sudah dijadwalkan pada tanggal ${tanggalClean} jam ${jamClean}. Silakan pilih jam atau bus lain.`,
      });
    }

    // 3. Cari atau buat entitas Rute (upsert)
    const rute = await prisma.rute.upsert({
      where: {
        asalId_tujuanId: {
          asalId: aId,
          tujuanId: tId,
        },
      },
      update: {},
      create: {
        asalId: aId,
        tujuanId: tId,
      },
    });

    // 4. Generate data kursi otomatis sesuai kapasitas bus
    const kursiData = Array.from({ length: bus.kapasitas }, (_, i) => ({
      nomorKursi: String(i + 1),
      status: 'TERSEDIA',
    }));

    // 5. Buat Jadwal beserta seluruh kursinya dalam 1 transaksi
    const jadwalBaru = await prisma.jadwal.create({
      data: {
        busId: bId,
        ruteId: rute.id,
        tanggal: tanggalClean,
        jamBerangkat: jamClean,
        harga: hargaNum,
        status: 'AKTIF',
        kursiList: {
          create: kursiData,
        },
      },
      include: {
        bus: true,
        rute: {
          include: {
            asal: true,
            tujuan: true,
          },
        },
        kursiList: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return res.status(201).json({
      message: `Jadwal berhasil dibuat dengan ${bus.kapasitas} kursi tersedia secara otomatis`,
      jadwal: jadwalBaru,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal membuat jadwal keberangkatan', error: error.message });
  }
});

/**
 * PUT /api/jadwal/:id
 * Mengubah jadwal (jam, tanggal, harga, status)
 */
router.put('/:id', authenticate, authorize('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { jamBerangkat, tanggal, harga, status } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID jadwal tidak valid' });
    }

    const jadwal = await prisma.jadwal.findUnique({
      where: { id },
      include: { bus: true },
    });

    if (!jadwal) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    }

    if (req.user.role === 'OPERATOR' && jadwal.bus.operatorId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda bukan pemilik jadwal ini' });
    }

    const newTanggal = tanggal ? tanggal.trim() : jadwal.tanggal;
    const newJam = jamBerangkat ? jamBerangkat.trim() : jadwal.jamBerangkat;
    const newHarga = harga ? parseInt(harga, 10) : jadwal.harga;
    const newStatus = status ? status.trim() : jadwal.status;

    // Cek anti-bentrok jika tanggal atau jam berubah
    if (newTanggal !== jadwal.tanggal || newJam !== jadwal.jamBerangkat) {
      const bentrok = await prisma.jadwal.findFirst({
        where: {
          busId: jadwal.busId,
          tanggal: newTanggal,
          jamBerangkat: newJam,
          NOT: { id },
        },
      });

      if (bentrok) {
        return res.status(400).json({
          message: `Bus '${jadwal.bus.nama}' sudah memiliki jadwal lain pada tanggal ${newTanggal} jam ${newJam}`,
        });
      }
    }

    const updated = await prisma.jadwal.update({
      where: { id },
      data: {
        tanggal: newTanggal,
        jamBerangkat: newJam,
        harga: newHarga,
        status: newStatus,
      },
    });

    return res.json({
      message: 'Jadwal berhasil diperbarui',
      jadwal: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui jadwal', error: error.message });
  }
});

/**
 * DELETE /api/jadwal/:id
 * Menghapus jadwal keberangkatan bus (dengan proteksi jika sudah memiliki pesanan)
 */
router.delete('/:id', authenticate, authorize('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID jadwal tidak valid' });
    }

    const jadwal = await prisma.jadwal.findUnique({
      where: { id },
      include: {
        bus: true,
        pesananList: true,
      },
    });

    if (!jadwal) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    }

    if (req.user.role === 'OPERATOR' && jadwal.bus.operatorId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda bukan pemilik jadwal ini' });
    }

    if (jadwal.pesananList.length > 0) {
      return res.status(400).json({
        message: 'Jadwal tidak dapat dihapus karena sudah memiliki tiket penumpang yang dipesan. Silakan ubah status menjadi BATAL.',
      });
    }

    // Hapus seluruh kursi terkait jadwal lalu hapus jadwal
    await prisma.kursi.deleteMany({ where: { jadwalId: id } });
    await prisma.jadwal.delete({ where: { id } });

    return res.json({ message: 'Jadwal keberangkatan berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menghapus jadwal', error: error.message });
  }
});

/**
 * GET /api/jadwal/:id
 * Endpoint Publik: Mengambil detail jadwal spesifik beserta daftar kursi.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID jadwal tidak valid' });
    }

    const j = await prisma.jadwal.findUnique({
      where: { id },
      include: {
        bus: {
          include: {
            operator: { select: { id: true, nama: true } },
          },
        },
        rute: {
          include: {
            asal: { select: { id: true, nama: true } },
            tujuan: { select: { id: true, nama: true } },
          },
        },
        kursiList: {
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!j) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    }

    const kursiTersedia = j.kursiList.filter((k) => k.status === 'TERSEDIA').length;

    return res.json({
      jadwal: {
        id: j.id,
        tanggal: j.tanggal,
        jamBerangkat: j.jamBerangkat,
        harga: j.harga,
        status: j.status,
        bus: {
          id: j.bus.id,
          nama: j.bus.nama,
          platNomor: j.bus.platNomor,
          kelas: j.bus.kelas,
          kapasitas: j.bus.kapasitas,
          operatorNama: j.bus.operator.nama,
        },
        rute: {
          id: j.rute.id,
          asal: j.rute.asal.nama,
          tujuan: j.rute.tujuan.nama,
          jarakKm: j.rute.jarakKm,
        },
        kursiList: j.kursiList,
        kursiTersedia,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat detail jadwal', error: error.message });
  }
});

/**
 * GET /api/jadwal/:id/manifest
 * Mengambil manifest penumpang untuk jadwal tertentu:
 * - Terisolasi: Hanya pemilik jadwal (operator) atau Admin yang bisa mengakses
 * - Menampilkan daftar penumpang aktif (nama, noHp, nomor kursi, kode booking, status boarding)
 */
router.get('/:id/manifest', authenticate, authorize('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID jadwal tidak valid' });
    }

    const jadwal = await prisma.jadwal.findUnique({
      where: { id },
      include: {
        bus: {
          include: {
            operator: { select: { id: true, nama: true } },
          },
        },
        rute: {
          include: {
            asal: { select: { nama: true } },
            tujuan: { select: { nama: true } },
          },
        },
      },
    });

    if (!jadwal) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    }

    if (req.user.role === 'OPERATOR' && jadwal.bus.operatorId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda bukan pemilik jadwal ini' });
    }

    // Ambil seluruh tiket dari pesanan yang berstatus CONFIRMED pada jadwal ini
    const tiketList = await prisma.tiket.findMany({
      where: {
        pesanan: {
          jadwalId: id,
          status: 'CONFIRMED',
        },
      },
      include: {
        kursi: { select: { id: true, nomorKursi: true } },
        pesanan: {
          select: {
            id: true,
            kodeBooking: true,
            namaKontak: true,
            noHpKontak: true,
            status: true,
            penumpang: { select: { nama: true, email: true, noHp: true } },
          },
        },
      },
      orderBy: { kursi: { id: 'asc' } },
    });

    const manifest = tiketList.map((t) => ({
      tiketId: t.id,
      kursiId: t.kursi.id,
      nomorKursi: t.kursi.nomorKursi,
      kodeBooking: t.pesanan.kodeBooking,
      namaPenumpang: t.pesanan.namaKontak,
      noHp: t.pesanan.noHpKontak,
      statusBarang: t.statusBarang, // 'BELUM_BOARDING' | 'BOARDING'
      akunPenumpang: t.pesanan.penumpang.nama,
    }));

    const totalPenumpang = manifest.length;
    const sudahBoarding = manifest.filter((m) => m.statusBarang === 'BOARDING').length;
    const belumBoarding = totalPenumpang - sudahBoarding;

    return res.json({
      jadwal: {
        id: jadwal.id,
        tanggal: jadwal.tanggal,
        jamBerangkat: jadwal.jamBerangkat,
        bus: {
          nama: jadwal.bus.nama,
          platNomor: jadwal.bus.platNomor,
          kelas: jadwal.bus.kelas,
          kapasitas: jadwal.bus.kapasitas,
        },
        rute: {
          asal: jadwal.rute.asal.nama,
          tujuan: jadwal.rute.tujuan.nama,
        },
      },
      stats: {
        totalPenumpang,
        sudahBoarding,
        belumBoarding,
      },
      manifest,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat manifest penumpang', error: error.message });
  }
});

/**
 * PATCH /api/jadwal/tiket/:tiketId/boarding
 * Menandai tiket sudah boarding atau belum boarding:
 * - Terisolasi: Hanya operator pemilik jadwal terkait atau Admin yang dapat mengubah
 */
router.patch('/tiket/:tiketId/boarding', authenticate, authorize('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const tiketId = parseInt(req.params.tiketId, 10);
    const { status } = req.body; // 'BOARDING' | 'BELUM_BOARDING'

    if (isNaN(tiketId)) {
      return res.status(400).json({ message: 'ID tiket tidak valid' });
    }

    const tiket = await prisma.tiket.findUnique({
      where: { id: tiketId },
      include: {
        kursi: true,
        pesanan: {
          include: {
            jadwal: {
              include: { bus: true },
            },
          },
        },
      },
    });

    if (!tiket) {
      return res.status(404).json({ message: 'Tiket tidak ditemukan' });
    }

    // Cek kepemilikan
    if (req.user.role === 'OPERATOR' && tiket.pesanan.jadwal.bus.operatorId !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak: Anda bukan operator bus untuk tiket ini' });
    }

    const statusBarangBaru = status === 'BOARDING' ? 'BOARDING' : 'BELUM_BOARDING';

    const updated = await prisma.tiket.update({
      where: { id: tiketId },
      data: { statusBarang: statusBarangBaru },
    });

    return res.json({
      message: `Status boarding tiket Kursi ${tiket.kursi.nomorKursi} berhasil diubah menjadi ${statusBarangBaru}`,
      tiket: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui status boarding', error: error.message });
  }
});

export default router;
