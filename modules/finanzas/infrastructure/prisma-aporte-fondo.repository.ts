import { prisma, PrismaDbClient } from '@/lib/prisma';
import { roundMoney } from '@/modules/shared';
import {
  IAporteFondoRepository,
  CreateAporteFondoData,
} from '../domain/aporte-fondo.repository.interface';
import { AporteFondoComun } from '../domain/aporte-fondo.entity';

export class PrismaAporteFondoRepository implements IAporteFondoRepository {
  constructor(private readonly db: PrismaDbClient = prisma) {}

  async findByMonth(year: number, month: number): Promise<AporteFondoComun[]> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 1, 0, 0, 0, 0);
    const periodoMes = `${year}-${String(month).padStart(2, '0')}`;

    const rows = await this.db.ingresos.findMany({
      where: {
        fuente: 'FONDO_COMUN',
        fecha: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    return rows.map((r) => ({
      id: r.id,
      usuario_id: r.usuario_id,
      usuario: r.usuarios
        ? {
            id: r.usuarios.id,
            nombre: r.usuarios.nombre,
          }
        : null,
      monto: roundMoney(Number(r.monto)),
      fecha: (r.fecha || new Date()).toISOString(),
      periodo_mes: periodoMes,
      descripcion: r.descripcion,
      comprobante_url: r.comprobante_url ?? null,
    }));
  }

  async create(data: CreateAporteFondoData): Promise<AporteFondoComun> {
    const year = data.fecha.getFullYear();
    const month = data.fecha.getMonth() + 1;
    const periodoMes = `${year}-${String(month).padStart(2, '0')}`;

    const r = await this.db.ingresos.create({
      data: {
        usuario_id: data.usuario_id,
        monto: roundMoney(data.monto),
        fecha: data.fecha,
        descripcion: data.descripcion.slice(0, 200),
        fuente: 'FONDO_COMUN',
        comprobante_url: data.comprobante_url ?? null,
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return {
      id: r.id,
      usuario_id: r.usuario_id,
      usuario: r.usuarios
        ? {
            id: r.usuarios.id,
            nombre: r.usuarios.nombre,
          }
        : null,
      monto: roundMoney(Number(r.monto)),
      fecha: (r.fecha || new Date()).toISOString(),
      periodo_mes: periodoMes,
      descripcion: r.descripcion,
      comprobante_url: r.comprobante_url ?? null,
    };
  }

  async delete(id: string): Promise<void> {
    if (typeof this.db.ingresos.deleteMany === 'function') {
      await this.db.ingresos.deleteMany({
        where: { id, fuente: 'FONDO_COMUN' },
      });
      return;
    }
    await this.db.ingresos.delete({
      where: { id },
    });
  }
}

export const defaultAporteFondoRepository = new PrismaAporteFondoRepository();
