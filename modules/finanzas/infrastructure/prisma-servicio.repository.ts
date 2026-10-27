import { prisma, PrismaDbClient } from '@/lib/prisma';
import { roundMoney, isValidId } from '@/modules/shared';
import {
  IServicioRepository,
  CreateServicioData,
  UpdateServicioData,
} from '../domain/servicio.repository.interface';
import {
  Servicio,
  ServicioConEstado,
  ResumenServicios,
  EstadoVencimiento,
  UltimoPagoDTO,
} from '../domain/servicio.entity';

interface LockedServicioRow {
  id: string;
  nombre_servicio: string;
  numero_cuenta?: string | null;
  numero_factura?: string | null;
  monto: unknown;
  fecha_vencimiento: Date;
  periodicidad_meses: number | null;
  dia_vencimiento: number | null;
  estado: string;
  responsable_id?: string | null;
}

export class PrismaServicioRepository implements IServicioRepository {
  constructor(private readonly db: PrismaDbClient = prisma) {}

  async findById(id: string): Promise<Servicio | null> {
    const s = await this.db.servicios.findUnique({
      where: { id },
      include: {
        responsable: {
          select: { id: true, nombre: true },
        },
      },
    });
    if (!s || s.activo === false) return null;
    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta,
      numero_factura: s.numero_factura,
      monto: roundMoney(Number(s.monto)),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
      responsable_id: s.responsable_id ?? null,
      responsable: s.responsable ? { id: s.responsable.id, nombre: s.responsable.nombre } : null,
    };
  }

  async findAndLockById(id: string): Promise<Servicio | null> {
    if (!isValidId(id)) return null;
    // Pessimistic Locking: SELECT ... FOR UPDATE
    const rows = (await this.db.$queryRaw`
      SELECT id, nombre_servicio, monto, fecha_vencimiento, periodicidad_meses, dia_vencimiento, estado, responsable_id
      FROM servicios
      WHERE id = ${id}::uuid AND activo = true
      FOR UPDATE
    `) as LockedServicioRow[];
    const s = rows?.[0];
    if (!s) return null;
    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta ?? null,
      numero_factura: s.numero_factura ?? null,
      monto: roundMoney(Number(s.monto || 0)),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
      responsable_id: s.responsable_id ?? null,
    };
  }

  async findServiciosConEstado(
    periodoMes?: string
  ): Promise<{ servicios: ServicioConEstado[]; resumen: ResumenServicios }> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let targetYear = hoy.getFullYear();
    let targetMonth = hoy.getMonth() + 1; // 1-12
    if (periodoMes && /^\d{4}-\d{2}$/.test(periodoMes)) {
      const [y, m] = periodoMes.split('-').map(Number);
      if (m >= 1 && m <= 12) {
        targetYear = y;
        targetMonth = m;
      }
    }

    const startOfTargetMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
    const endOfTargetMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);

    const rawServicios = await this.db.servicios.findMany({
      where: { activo: true },
      include: {
        responsable: {
          select: { id: true, nombre: true },
        },
        pagos_servicios: {
          include: {
            usuarios: {
              select: { id: true, nombre: true },
            },
          },
          orderBy: { fecha_pago: 'desc' },
          take: 60,
        },
      },
      orderBy: {
        fecha_vencimiento: 'asc',
      },
    });

    let totalPresupuestoMensual = 0;
    let totalProximosVencimientos = 0;
    let cuentasVencidas = 0;
    let cuentasPorVencer = 0;
    let cuentasAlDia = 0;
    let totalRealPagadoMes = 0;
    let totalPorPagarMes = 0;
    let diferenciaPresupuestoGlobal = 0;

    const servicios: ServicioConEstado[] = rawServicios.map((s) => {
      const montoNum = roundMoney(Number(s.monto));
      const periodicidad = s.periodicidad_meses || 1;

      totalPresupuestoMensual = roundMoney(totalPresupuestoMensual + montoNum / periodicidad);
      totalProximosVencimientos = roundMoney(totalProximosVencimientos + montoNum);

      const fVencRaw = new Date(s.fecha_vencimiento);
      // Preservar la fecha pura en UTC sin distorsión de huso horario local
      const fVencUTC = new Date(
        Date.UTC(fVencRaw.getUTCFullYear(), fVencRaw.getUTCMonth(), fVencRaw.getUTCDate())
      );
      const hoyUTC = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
      const diffTime = fVencUTC.getTime() - hoyUTC.getTime();
      const diasRestantes = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const listaPagos = s.pagos_servicios || [];
      const ultimoPagoRaw = listaPagos[0];

      const mapPagoToDTO = (pRaw: (typeof listaPagos)[number]): UltimoPagoDTO => {
        const mPagado = roundMoney(Number(pRaw.monto_pagado));
        const mPresup =
          pRaw.monto_presupuestado !== null && pRaw.monto_presupuestado !== undefined
            ? roundMoney(Number(pRaw.monto_presupuestado))
            : montoNum;
        return {
          id: pRaw.id,
          fecha_pago: (pRaw.fecha_pago || new Date()).toISOString(),
          monto_pagado: mPagado,
          monto_presupuestado: mPresup,
          diferencia_presupuesto: roundMoney(mPagado - mPresup),
          comprobante_url: pRaw.comprobante_url,
          observaciones: pRaw.observaciones ?? null,
          pagado_por: pRaw.usuarios?.nombre ?? undefined,
        };
      };

      const ultimoPago = ultimoPagoRaw ? mapPagoToDTO(ultimoPagoRaw) : null;

      // Buscar si hubo pago dentro del mes consultado [startOfTargetMonth, endOfTargetMonth)
      const pagoEnMesRaw = listaPagos.find((p) => {
        if (!p.fecha_pago) return false;
        const fp = new Date(p.fecha_pago);
        return fp >= startOfTargetMonth && fp < endOfTargetMonth;
      });

      const pagoMesConsultado = pagoEnMesRaw ? mapPagoToDTO(pagoEnMesRaw) : null;
      const pagadoEnMesConsultado = !!pagoMesConsultado;

      if (pagoMesConsultado) {
        totalRealPagadoMes = roundMoney(totalRealPagadoMes + pagoMesConsultado.monto_pagado);
        diferenciaPresupuestoGlobal = roundMoney(
          diferenciaPresupuestoGlobal + (pagoMesConsultado.diferencia_presupuesto ?? 0)
        );
      } else {
        totalPorPagarMes = roundMoney(totalPorPagarMes + montoNum);
      }

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

      const enMora = estadoVencimiento === 'VENCIDO';
      const diasEnMora = enMora ? Math.abs(diasRestantes) : 0;

      return {
        id: s.id,
        nombre_servicio: s.nombre_servicio,
        numero_cuenta: s.numero_cuenta,
        numero_factura: s.numero_factura,
        monto: montoNum,
        fecha_vencimiento: fVencUTC.toISOString(),
        estado: s.estado,
        periodicidad_meses: periodicidad,
        dia_vencimiento: s.dia_vencimiento,
        responsable_id: s.responsable_id ?? null,
        responsable: s.responsable ? { id: s.responsable.id, nombre: s.responsable.nombre } : null,
        diasRestantes,
        enMora,
        diasEnMora,
        estadoVencimiento,
        ultimoPago,
        pagadoEnMesConsultado,
        pagoMesConsultado,
        diferenciaPresupuestoMes: pagoMesConsultado
          ? pagoMesConsultado.diferencia_presupuesto ?? 0
          : null,
      };
    });

    const resumen: ResumenServicios = {
      totalServicios: servicios.length,
      totalPresupuestoMensual: roundMoney(totalPresupuestoMensual),
      totalProximosVencimientos: roundMoney(totalProximosVencimientos),
      cuentasVencidas,
      cuentasPorVencer,
      cuentasAlDia,
      totalRealPagadoMes: roundMoney(totalRealPagadoMes),
      totalPorPagarMes: roundMoney(totalPorPagarMes),
      diferenciaPresupuestoGlobal: roundMoney(diferenciaPresupuestoGlobal),
    };

    return { servicios, resumen };
  }

  async create(data: CreateServicioData): Promise<Servicio> {
    const s = await this.db.servicios.create({
      data: {
        nombre_servicio: data.nombre_servicio,
        monto: roundMoney(data.monto),
        fecha_vencimiento: data.fecha_vencimiento,
        periodicidad_meses: data.periodicidad_meses ?? 1,
        dia_vencimiento: data.dia_vencimiento ?? null,
        numero_cuenta: data.numero_cuenta ?? null,
        numero_factura: data.numero_factura ?? null,
        responsable_id: data.responsable_id ?? null,
        estado: data.estado ?? 'PENDIENTE',
        activo: true,
      },
      include: {
        responsable: {
          select: { id: true, nombre: true },
        },
      },
    });

    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta,
      numero_factura: s.numero_factura,
      monto: roundMoney(Number(s.monto)),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
      responsable_id: s.responsable_id ?? null,
      responsable: s.responsable ? { id: s.responsable.id, nombre: s.responsable.nombre } : null,
    };
  }

  async update(id: string, data: UpdateServicioData): Promise<Servicio> {
    const payload: UpdateServicioData = {
      ...data,
      ...(data.monto !== undefined && { monto: roundMoney(data.monto) }),
    };
    const s = await this.db.servicios.update({
      where: { id },
      data: payload,
    });

    return {
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta,
      numero_factura: s.numero_factura,
      monto: roundMoney(Number(s.monto)),
      fecha_vencimiento: s.fecha_vencimiento,
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses || 1,
      dia_vencimiento: s.dia_vencimiento,
      responsable_id: s.responsable_id ?? null,
    };
  }

  async delete(id: string): Promise<void> {
    const pagosCount =
      typeof this.db.pagos_servicios?.count === 'function'
        ? await this.db.pagos_servicios.count({ where: { servicio_id: id } })
        : 0;

    if (pagosCount > 0) {
      // Baja lógica contable: preserva el historial de pagos_servicios y gastos asociados
      await this.db.servicios.update({
        where: { id },
        data: { activo: false, estado: 'INACTIVO' },
      });
      return;
    }

    await this.db.servicios.delete({
      where: { id },
    });
  }
}

export const defaultServicioRepository = new PrismaServicioRepository();
