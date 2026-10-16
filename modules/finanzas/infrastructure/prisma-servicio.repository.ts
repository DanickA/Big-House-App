import { prisma } from '@/lib/prisma';
import {
  IServicioRepository,
  CreateServicioData,
  UpdateServicioData,
} from '../domain/servicio.repository.interface';
import { Servicio, ServicioConEstado, ResumenServicios, EstadoVencimiento } from '../domain/servicio.entity';

export class PrismaServicioRepository implements IServicioRepository {
  constructor(private readonly db: any = prisma) {}

  async findById(id: string): Promise<Servicio | null> {
    const s = await this.db.servicios.findUnique({
      where: { id },
    });
    if (!s) return null;
    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta,
      numero_factura: s.numero_factura,
      monto: Number(s.monto),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
    };
  }

  async findAndLockById(id: string): Promise<Servicio | null> {
    // Pessimistic Locking: SELECT ... FOR UPDATE
    const rows = await this.db.$queryRaw`
      SELECT id, nombre_servicio, fecha_vencimiento, periodicidad_meses, dia_vencimiento, estado
      FROM servicios
      WHERE id = ${id}::uuid
      FOR UPDATE
    `;
    const s = (rows as any[])?.[0];
    if (!s) return null;
    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta ?? null,
      numero_factura: s.numero_factura ?? null,
      monto: Number(s.monto || 0),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
    };
  }

  async findServiciosConEstado(): Promise<{ servicios: ServicioConEstado[]; resumen: ResumenServicios }> {
    const rawServicios = await this.db.servicios.findMany({
      include: {
        pagos_servicios: {
          orderBy: { fecha_pago: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        fecha_vencimiento: 'asc',
      },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let totalPresupuestoMensual = 0;
    let totalProximosVencimientos = 0;
    let cuentasVencidas = 0;
    let cuentasPorVencer = 0;
    let cuentasAlDia = 0;

    const servicios: ServicioConEstado[] = rawServicios.map((s: any) => {
      const montoNum = Number(s.monto);
      const periodicidad = s.periodicidad_meses || 1;

      totalPresupuestoMensual += montoNum / periodicidad;
      totalProximosVencimientos += montoNum;

      const fVenc = new Date(s.fecha_vencimiento);
      fVenc.setHours(0, 0, 0, 0);

      const diffTime = fVenc.getTime() - hoy.getTime();
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let estadoVencimiento: EstadoVencimiento = 'AL_DIA';
      if (s.estado === 'PAGADO') {
        estadoVencimiento = 'PAGADO';
      } else if (diasRestantes < 0) {
        estadoVencimiento = 'VENCIDO';
        cuentasVencidas++;
      } else if (diasRestantes <= 4) {
        estadoVencimiento = 'POR_VENCER';
        cuentasPorVencer++;
      } else {
        estadoVencimiento = 'AL_DIA';
        cuentasAlDia++;
      }

      const ultimoPagoRaw = s.pagos_servicios?.[0];
      const ultimoPago = ultimoPagoRaw
        ? {
            fecha_pago: (ultimoPagoRaw.fecha_pago || new Date()).toISOString(),
            monto_pagado: Number(ultimoPagoRaw.monto_pagado),
            comprobante_url: ultimoPagoRaw.comprobante_url,
          }
        : null;

      return {
        id: s.id,
        nombre_servicio: s.nombre_servicio,
        numero_cuenta: s.numero_cuenta,
        numero_factura: s.numero_factura,
        monto: montoNum,
        fecha_vencimiento: fVenc.toISOString(),
        estado: s.estado,
        periodicidad_meses: periodicidad,
        dia_vencimiento: s.dia_vencimiento,
        diasRestantes,
        estadoVencimiento,
        ultimoPago,
      };
    });

    const resumen: ResumenServicios = {
      totalServicios: servicios.length,
      totalPresupuestoMensual: Math.round(totalPresupuestoMensual * 100) / 100,
      totalProximosVencimientos: Math.round(totalProximosVencimientos * 100) / 100,
      cuentasVencidas,
      cuentasPorVencer,
      cuentasAlDia,
    };

    return { servicios, resumen };
  }

  async create(data: CreateServicioData): Promise<Servicio> {
    const s = await this.db.servicios.create({
      data: {
        nombre_servicio: data.nombre_servicio,
        monto: data.monto,
        fecha_vencimiento: data.fecha_vencimiento,
        periodicidad_meses: data.periodicidad_meses ?? 1,
        dia_vencimiento: data.dia_vencimiento ?? null,
        numero_cuenta: data.numero_cuenta ?? null,
        numero_factura: data.numero_factura ?? null,
        estado: data.estado ?? 'PENDIENTE',
      },
    });

    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta,
      numero_factura: s.numero_factura,
      monto: Number(s.monto),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
    };
  }

  async update(id: string, data: UpdateServicioData): Promise<Servicio> {
    const s = await this.db.servicios.update({
      where: { id },
      data,
    });

    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta,
      numero_factura: s.numero_factura,
      monto: Number(s.monto),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.servicios.delete({
      where: { id },
    });
  }
}

export const defaultServicioRepository = new PrismaServicioRepository();
