import { PrismaClient } from '@prisma/client';

// Inisialisasi Prisma Client tunggal untuk digunakan di seluruh aplikasi backend
const prisma = new PrismaClient();

export default prisma;
