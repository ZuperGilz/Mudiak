-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PENUMPANG',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kota" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Rute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asalId" INTEGER NOT NULL,
    "tujuanId" INTEGER NOT NULL,
    "jarakKm" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rute_asalId_fkey" FOREIGN KEY ("asalId") REFERENCES "Kota" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rute_tujuanId_fkey" FOREIGN KEY ("tujuanId") REFERENCES "Kota" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "operatorId" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "platNomor" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "kelas" TEXT NOT NULL DEFAULT 'Ekonomi',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bus_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jadwal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "busId" INTEGER NOT NULL,
    "ruteId" INTEGER NOT NULL,
    "tanggal" TEXT NOT NULL,
    "jamBerangkat" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Jadwal_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Jadwal_ruteId_fkey" FOREIGN KEY ("ruteId") REFERENCES "Rute" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kursi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jadwalId" INTEGER NOT NULL,
    "nomorKursi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TERSEDIA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kursi_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "Jadwal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pesanan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kodeBooking" TEXT NOT NULL,
    "penumpangId" INTEGER NOT NULL,
    "jadwalId" INTEGER NOT NULL,
    "namaKontak" TEXT NOT NULL,
    "noHpKontak" TEXT NOT NULL,
    "totalHarga" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "statusBayar" TEXT NOT NULL DEFAULT 'SUDAH_BAYAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pesanan_penumpangId_fkey" FOREIGN KEY ("penumpangId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pesanan_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "Jadwal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tiket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pesananId" INTEGER NOT NULL,
    "kursiId" INTEGER NOT NULL,
    "statusBarang" TEXT NOT NULL DEFAULT 'BELUM_BOARDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tiket_pesananId_fkey" FOREIGN KEY ("pesananId") REFERENCES "Pesanan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tiket_kursiId_fkey" FOREIGN KEY ("kursiId") REFERENCES "Kursi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Kota_nama_key" ON "Kota"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Rute_asalId_tujuanId_key" ON "Rute"("asalId", "tujuanId");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_platNomor_key" ON "Bus"("platNomor");

-- CreateIndex
CREATE UNIQUE INDEX "Jadwal_busId_tanggal_jamBerangkat_key" ON "Jadwal"("busId", "tanggal", "jamBerangkat");

-- CreateIndex
CREATE UNIQUE INDEX "Kursi_jadwalId_nomorKursi_key" ON "Kursi"("jadwalId", "nomorKursi");

-- CreateIndex
CREATE UNIQUE INDEX "Pesanan_kodeBooking_key" ON "Pesanan"("kodeBooking");

-- CreateIndex
CREATE UNIQUE INDEX "Tiket_kursiId_key" ON "Tiket"("kursiId");
