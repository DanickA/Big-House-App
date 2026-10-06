import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function getNormalizedConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Si la URL contiene sslmode=require sin uselibpqcompat, normalizamos a sslmode=verify-full
  // para evitar la advertencia de depreciación de node-postgres (pg v8/v9) y garantizar SSL seguro.
  if (url.includes('sslmode=require') && !url.includes('uselibpqcompat=')) {
    return url.replace('sslmode=require', 'sslmode=verify-full');
  }

  return url;
}

const connectionString = getNormalizedConnectionString();

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;