import { IUnitOfWork } from '@/modules/shared';
import { prisma, PrismaDbClient } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly db: PrismaClient = prisma) {}

  async run<T>(work: (txContext: PrismaDbClient) => Promise<T>): Promise<T> {
    return this.db.$transaction(async (tx) => {
      return work(tx);
    });
  }
}

export const defaultUnitOfWork = new PrismaUnitOfWork();
