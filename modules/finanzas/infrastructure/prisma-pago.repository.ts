import { prisma, PrismaDbClient } from '@/lib/prisma';
import { roundMoney } from '@/modules/shared';
import {
  IPagoRepository,
  CreatePagoData,
  CreateGastoData,
} from '../domain/pago.repository.interface';
import { PagoServicio, PagoHistorialItem, GastoHogar } from '../domain/pago.entity';

export class PrismaPagoRepository implements IPagoRepository {
  constructor(private readonly db: PrismaDbClient = prisma) {}

  async findRecentDuplicate(
    servicioId: string,
    monto: number,
    ventanaSegundos: number
  ): Promise<boolean> {
    const ventanaAtras = new Date(Date.now() - ventanaSegundos * 1000);
    const pagoDuplicado = await this.db.pagos_servicios.findFirst({
      where: {
        servicio_id: servicioId,
        monto_pagado: roundMoney(monto),
        fecha_pago: {
          gte: ventanaAtras,
        },
      },
    });
    return !!pagoDuplicado;
  }

  async createPago(data: CreatePagoData): Promise<PagoServicio> {
    const montoPagado = roundMoney(data.monto_pagado);
    const p = await this.db.pagos_servicios.create({
      data: {
        servicio_id: data.servicio_id,
        usuario_id: data.usuario_id,
        monto_pagado: montoPagado,
        ...(data.monto_presupuestado !== undefined &&
          data.monto_presupuestado !== null && {
            monto_presupuestado: roundMoney(data.monto_presupuestado),
          }),
        fecha_pago: data.fecha_pago,
        comprobante_url: data.comprobante_url ?? null,
        observaciones: data.observaciones ?? null,
      },
    });

    return {
      id: p.id,
      servicio_id: p.servicio_id,
      usuario_id: p.usuario_id,
      monto_pagado: roundMoney(Number(p.monto_pagado)),
      monto_presupuestado:
        p.monto_presupuestado !== undefined && p.monto_presupuestado !== null
          ? roundMoney(Number(p.monto_presupuestado))
          : data.monto_presupuestado ?? null,
      fecha_pago: p.fecha_pago,
      comprobante_url: p.comprobante_url,
      observaciones: p.observaciones,
    };
  }

  async createGasto(data: CreateGastoData): Promise<void> {
    await this.db.gastos.create({
      data: {
        descripcion: data.descripcion.slice(0, 200),
        monto: roundMoney(data.monto),
        fecha: data.fecha,
        categoria: data.categoria,
        usuario_id: data.usuario_id,
        servicio_id: data.servicio_id ?? null,
      },
    });
  }

  async findHistorialByServicio(servicioId: string): Promise<PagoHistorialItem[]> {
    const historial = await this.db.pagos_servicios.findMany({
      where: { servicio_id: servicioId },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        servicios: {
          select: {
            monto: true,
          },
        },
      },
      orderBy: {
        fecha_pago: 'desc',
      },
    });

    return historial.map((p) => {
      const montoPagado = roundMoney(Number(p.monto_pagado));
      const montoPresupuestado =
        p.monto_presupuestado !== null && p.monto_presupuestado !== undefined
          ? roundMoney(Number(p.monto_presupuestado))
          : p.servicios?.monto !== undefined
          ? roundMoney(Number(p.servicios.monto))
          : null;

      return {
        id: p.id,
        monto_pagado: montoPagado,
        monto_presupuestado: montoPresupuestado,
        diferencia_presupuesto:
          montoPresupuestado !== null ? roundMoney(montoPagado - montoPresupuestado) : 0,
        fecha_pago: (p.fecha_pago || new Date()).toISOString(),
        comprobante_url: p.comprobante_url,
        observaciones: p.observaciones,
        usuario: {
          nombre: p.usuarios.nombre,
          email: p.usuarios.email,
        },
      };
    });
  }

  async findGastosByMonth(year: number, month: number): Promise<GastoHogar[]> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 1, 0, 0, 0, 0);

    const rows = await this.db.gastos.findMany({
      where: {
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

    return rows.map((g) => ({
      id: g.id,
      descripcion: g.descripcion,
      monto: roundMoney(Number(g.monto)),
      fecha: (g.fecha || new Date()).toISOString(),
      categoria: g.categoria,
      usuario_id: g.usuario_id,
      servicio_id: g.servicio_id ?? null,
      usuario: g.usuarios
        ? {
            id: g.usuarios.id,
            nombre: g.usuarios.nombre,
          }
        : null,
    }));
  }

  async deleteGasto(id: string): Promise<void> {
    await this.db.gastos.delete({
      where: { id },
    });
  }
}

export const defaultPagoRepository = new PrismaPagoRepository();
