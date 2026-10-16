import { prisma } from '@/lib/prisma';
import {
  IPagoRepository,
  CreatePagoData,
  CreateGastoData,
} from '../domain/pago.repository.interface';
import { PagoServicio, PagoHistorialItem } from '../domain/pago.entity';

export class PrismaPagoRepository implements IPagoRepository {
  constructor(private readonly db: any = prisma) {}

  async findRecentDuplicate(servicioId: string, monto: number, ventanaSegundos: number): Promise<boolean> {
    const ventanaAtras = new Date(Date.now() - ventanaSegundos * 1000);
    const pagoDuplicado = await this.db.pagos_servicios.findFirst({
      where: {
        servicio_id: servicioId,
        monto_pagado: monto,
        fecha_pago: {
          gte: ventanaAtras,
        },
      },
    });
    return !!pagoDuplicado;
  }

  async createPago(data: CreatePagoData): Promise<PagoServicio> {
    const p = await this.db.pagos_servicios.create({
      data: {
        servicio_id: data.servicio_id,
        usuario_id: data.usuario_id,
        monto_pagado: data.monto_pagado,
        fecha_pago: data.fecha_pago,
        comprobante_url: data.comprobante_url ?? null,
        observaciones: data.observaciones ?? null,
      },
    });

    return {
      id: p.id,
      servicio_id: p.servicio_id,
      usuario_id: p.usuario_id,
      monto_pagado: Number(p.monto_pagado),
      fecha_pago: p.fecha_pago,
      comprobante_url: p.comprobante_url,
      observaciones: p.observaciones,
    };
  }

  async createGasto(data: CreateGastoData): Promise<void> {
    await this.db.gastos.create({
      data: {
        descripcion: data.descripcion.slice(0, 200),
        monto: data.monto,
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
      },
      orderBy: {
        fecha_pago: 'desc',
      },
    });

    return historial.map((p: any) => ({
      id: p.id,
      monto_pagado: Number(p.monto_pagado),
      fecha_pago: (p.fecha_pago || new Date()).toISOString(),
      comprobante_url: p.comprobante_url,
      observaciones: p.observaciones,
      usuario: {
        nombre: p.usuarios.nombre,
        email: p.usuarios.email,
      },
    }));
  }
}

export const defaultPagoRepository = new PrismaPagoRepository();
