/* eslint-disable @typescript-eslint/no-explicit-any */
import { IUnitOfWork } from '@/modules/shared';
import { prisma } from '@/lib/prisma';

export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly db: any = prisma) {}

  async run<T>(work: (txContext?: any) => Promise<T>): Promise<T> {
    return this.db.$transaction(async (tx: any) => {
      return work(tx);
    });
  }
}

export const defaultUnitOfWork = new PrismaUnitOfWork();
