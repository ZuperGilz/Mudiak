import { PrismaClient } from '@prisma/client';

// Pola singleton untuk Prisma Client agar tidak memicu memory leak atau kehabisan koneksi di lingkungan serverless
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
