'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { uploadComprobante } from '@/lib/storage';

export type EstadoVencimiento = 'VENCIDO' | 'POR_VENCER' | 'AL_DIA' | 'PAGADO';

export type ServicioConEstado = {
  id: string;
  nombre_servicio: string;
  numero_cuenta: string | null;
  numero_factura: string | null;
  monto: number;
  fecha_vencimiento: string; // ISO string
  estado: string;
  periodicidad_meses: number;
  dia_vencimiento: number | null;
  diasRestantes: number;
  estadoVencimiento: EstadoVencimiento;
  ultimoPago?: {
    fecha_pago: string;
    monto_pagado: number;
    comprobante_url: string | null;
  } | null;
};

export type ResumenServicios = {
  totalServicios: number;
  totalPresupuestoMensual: number;
  totalProximosVencimientos: number;
  cuentasVencidas: number;
  cuentasPorVencer: number;
  cuentasAlDia: number;
};

/**
 * Calcula la próxima fecha de vencimiento después de registrar un pago.
 * Regla de negocio:
 * 1. Fecha base: Tomamos la fecha del pago realizado (o fecha actual).
 * 2. Avance del ciclo: Sumamos la cantidad de periodicidad_meses.
 * 3. Ajuste de corte: Si el servicio tiene un dia_vencimiento fijado, se fija ese día
 *    específico en el mes resultante (protegiendo meses más cortos como febrero o meses de 30 días).
 */
export async function calcularProximaFechaVencimiento(
  fechaPago: Date,
  periodicidadMeses: number = 1,
  diaVencimiento?: number | null
): Promise<Date> {
  const meses = Math.max(1, periodicidadMeses || 1);
  const base = new Date(fechaPago);
  base.setHours(0, 0, 0, 0);

  const targetYear = base.getFullYear();
  const targetMonth = base.getMonth() + meses;

  // Si tiene un día de vencimiento asignado, usarlo; de lo contrario el día de la fecha de pago
  const diaDeseado =
    diaVencimiento && diaVencimiento >= 1 && diaVencimiento <= 31
      ? diaVencimiento
      : base.getDate();

  // Obtener el último día del mes destino para evitar desbordamientos
  const ultimoDiaMesDestino = new Date(targetYear, targetMonth + 1, 0).getDate();
  const diaFinal = Math.min(diaDeseado, ultimoDiaMesDestino);

  return new Date(targetYear, targetMonth, diaFinal);
}

// 1. Obtener todos los servicios con cálculo dinámico de días y badges de estado
export async function getServicios(): Promise<{
  success: boolean;
  servicios: ServicioConEstado[];
  resumen: ResumenServicios;
  error?: string;
}> {
  try {
    const rawServicios = await prisma.servicios.findMany({
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

    const servicios: ServicioConEstado[] = rawServicios.map((s) => {
      const montoNum = Number(s.monto);
      const periodicidad = s.periodicidad_meses || 1;

      // Normalizar costo mensual equivalente
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

      const ultimoPagoRaw = s.pagos_servicios[0];
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

    return {
      success: true,
      servicios,
      resumen,
    };
  } catch (error: any) {
    console.error('Error al obtener servicios:', error);
    return {
      success: false,
      servicios: [],
      resumen: {
        totalServicios: 0,
        totalPresupuestoMensual: 0,
        totalProximosVencimientos: 0,
        cuentasVencidas: 0,
        cuentasPorVencer: 0,
        cuentasAlDia: 0,
      },
      error: error?.message || 'No se pudieron obtener los servicios',
    };
  }
}

// 2. Registrar un nuevo servicio recurrente
export async function createServicio(formData: FormData) {
  try {
    const nombre_servicio = (formData.get('nombre_servicio') as string)?.trim();
    const montoRaw = formData.get('monto') as string;
    const fecha_vencimiento_raw = formData.get('fecha_vencimiento') as string;
    const periodicidad_meses = parseInt((formData.get('periodicidad_meses') as string) || '1', 10);
    const numero_cuenta = (formData.get('numero_cuenta') as string)?.trim() || null;
    const numero_factura = (formData.get('numero_factura') as string)?.trim() || null;
    const dia_vencimiento_raw = formData.get('dia_vencimiento') as string;

    if (!nombre_servicio) {
      return { success: false, error: 'El nombre del servicio es obligatorio' };
    }

    const monto = parseFloat(montoRaw);
    if (isNaN(monto) || monto <= 0) {
      return { success: false, error: 'Ingresa un monto válido mayor a 0' };
    }

    if (!fecha_vencimiento_raw) {
      return { success: false, error: 'Selecciona una fecha de vencimiento inicial' };
    }

    const [year, month, day] = fecha_vencimiento_raw.split('-').map(Number);
    const fecha_vencimiento = new Date(year, month - 1, day);
    fecha_vencimiento.setHours(0, 0, 0, 0);

    let dia_vencimiento = dia_vencimiento_raw ? parseInt(dia_vencimiento_raw, 10) : day;
    if (isNaN(dia_vencimiento) || dia_vencimiento < 1 || dia_vencimiento > 31) {
      dia_vencimiento = day;
    }

    const nuevoServicio = await prisma.servicios.create({
      data: {
        nombre_servicio,
        monto,
        fecha_vencimiento,
        periodicidad_meses: isNaN(periodicidad_meses) || periodicidad_meses < 1 ? 1 : periodicidad_meses,
        dia_vencimiento,
        numero_cuenta,
        numero_factura,
        estado: 'PENDIENTE',
      },
    });

    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');

    return { success: true, data: nuevoServicio };
  } catch (error: any) {
    console.error('Error al crear servicio:', error);
    return { success: false, error: error?.message || 'No se pudo crear el servicio' };
  }
}

// 3. Registrar Pago con Transacción Atómica (prisma.$transaction)
export async function registrarPagoServicio(formData: FormData) {
  try {
    const servicio_id = formData.get('servicio_id') as string;
    const monto_pagado_raw = formData.get('monto_pagado') as string;
    const fecha_pago_raw = formData.get('fecha_pago') as string;
    const observaciones = (formData.get('observaciones') as string)?.trim() || null;
    const comprobanteFile = formData.get('comprobante') as File | null;

    if (!servicio_id) {
      return { success: false, error: 'Identificador del servicio requerido' };
    }

    const monto_pagado = parseFloat(monto_pagado_raw);
    if (isNaN(monto_pagado) || monto_pagado <= 0) {
      return { success: false, error: 'Ingresa un monto pagado válido' };
    }

    // Resolver usuario activo
    let usuario_id: string;
    const session = await getSession();
    if (session?.userId) {
      usuario_id = session.userId;
    } else {
      const usuarioBase = await prisma.usuarios.findFirst();
      if (!usuarioBase) {
        return { success: false, error: 'No hay usuarios registrados para asociar el pago' };
      }
      usuario_id = usuarioBase.id;
    }

    // Procesar fecha de pago
    let fecha_pago: Date;
    if (fecha_pago_raw) {
      const [y, m, d] = fecha_pago_raw.split('-').map(Number);
      fecha_pago = new Date(y, m - 1, d);
    } else {
      fecha_pago = new Date();
    }
    fecha_pago.setHours(12, 0, 0, 0);

    // Subir comprobante (a Cloudinary o local en public/uploads/comprobantes) si existe
    let comprobante_url: string | null = null;
    if (comprobanteFile && comprobanteFile.size > 0) {
      try {
        comprobante_url = await uploadComprobante(comprobanteFile);
      } catch (uploadErr: any) {
        console.error('Error al subir comprobante:', uploadErr);
        return {
          success: false,
          error: `Error al subir el comprobante (${uploadErr?.message || 'Error de almacenamiento'}). Verifica la configuración de Cloudinary.`,
        };
      }
    }

    // Ejecutar Transacción Atómica
    const resultadoTransaccion = await prisma.$transaction(async (tx) => {
      // 1. Obtener el servicio actual
      const servicio = await tx.servicios.findUnique({
        where: { id: servicio_id },
      });

      if (!servicio) {
        throw new Error('El servicio especificado no existe');
      }

      // 2. Insertar en pagos_servicios
      const nuevoPago = await tx.pagos_servicios.create({
        data: {
          servicio_id,
          usuario_id,
          monto_pagado,
          fecha_pago,
          comprobante_url,
          observaciones,
        },
      });

      // 3. Insertar en gastos (reflejar salida global en categoría 'SERVICIOS')
      const descripcionGasto = observaciones
        ? `Pago ${servicio.nombre_servicio}: ${observaciones}`
        : `Pago de servicio: ${servicio.nombre_servicio}`;

      await tx.gastos.create({
        data: {
          descripcion: descripcionGasto.slice(0, 200),
          monto: monto_pagado,
          fecha: fecha_pago,
          categoria: 'SERVICIOS',
          usuario_id,
          servicio_id,
        },
      });

      // 4. Calcular nueva fecha de vencimiento
      // Regla: Fecha base = fecha de este pago, suma periodicidad_meses, ajusta a dia_vencimiento
      const periodicidad = servicio.periodicidad_meses || 1;
      const diaVenc = servicio.dia_vencimiento;
      const nuevaFechaVencimiento = await calcularProximaFechaVencimiento(
        fecha_pago,
        periodicidad,
        diaVenc
      );

      // 5. Actualizar servicios con la nueva fecha y dejar el ciclo listo en 'PENDIENTE'
      const servicioActualizado = await tx.servicios.update({
        where: { id: servicio_id },
        data: {
          fecha_vencimiento: nuevaFechaVencimiento,
          estado: 'PENDIENTE',
        },
      });

      return {
        pago: nuevoPago,
        servicio: servicioActualizado,
      };
    });

    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');

    return {
      success: true,
      data: {
        pagoId: resultadoTransaccion.pago.id,
        proximoVencimiento: resultadoTransaccion.servicio.fecha_vencimiento.toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Error en registrarPagoServicio:', error);
    return {
      success: false,
      error: error?.message || 'Error al procesar la transacción de pago',
    };
  }
}

// 4. Obtener Historial Cronológico de Pagos de un Servicio
export async function getHistorialPagos(servicioId: string) {
  try {
    const historial = await prisma.pagos_servicios.findMany({
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

    const pagosSerializados = historial.map((p) => ({
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

    return { success: true, data: pagosSerializados };
  } catch (error: any) {
    console.error('Error al obtener historial de pagos:', error);
    return { success: false, error: 'No se pudo cargar el historial de pagos', data: [] };
  }
}

// 5. Actualizar un Servicio
export async function updateServicio(servicioId: string, formData: FormData) {
  try {
    const nombre_servicio = (formData.get('nombre_servicio') as string)?.trim();
    const montoRaw = formData.get('monto') as string;
    const periodicidad_meses = parseInt((formData.get('periodicidad_meses') as string) || '1', 10);
    const numero_cuenta = (formData.get('numero_cuenta') as string)?.trim() || null;
    const numero_factura = (formData.get('numero_factura') as string)?.trim() || null;
    const dia_vencimiento_raw = formData.get('dia_vencimiento') as string;
    const fecha_vencimiento_raw = formData.get('fecha_vencimiento') as string;

    if (!nombre_servicio) {
      return { success: false, error: 'El nombre es obligatorio' };
    }

    const monto = parseFloat(montoRaw);
    if (isNaN(monto) || monto <= 0) {
      return { success: false, error: 'Monto inválido' };
    }

    const dataToUpdate: any = {
      nombre_servicio,
      monto,
      periodicidad_meses: isNaN(periodicidad_meses) || periodicidad_meses < 1 ? 1 : periodicidad_meses,
      numero_cuenta,
      numero_factura,
    };

    if (dia_vencimiento_raw) {
      const dv = parseInt(dia_vencimiento_raw, 10);
      if (!isNaN(dv) && dv >= 1 && dv <= 31) {
        dataToUpdate.dia_vencimiento = dv;
      }
    }

    if (fecha_vencimiento_raw) {
      const [y, m, d] = fecha_vencimiento_raw.split('-').map(Number);
      const fv = new Date(y, m - 1, d);
      fv.setHours(0, 0, 0, 0);
      dataToUpdate.fecha_vencimiento = fv;
    }

    const servicioActualizado = await prisma.servicios.update({
      where: { id: servicioId },
      data: dataToUpdate,
    });

    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');

    return { success: true, data: servicioActualizado };
  } catch (error: any) {
    console.error('Error al actualizar servicio:', error);
    return { success: false, error: 'No se pudo actualizar el servicio' };
  }
}

// 6. Eliminar un Servicio
export async function deleteServicio(servicioId: string) {
  try {
    await prisma.servicios.delete({
      where: { id: servicioId },
    });

    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar servicio:', error);
    return { success: false, error: 'No se pudo eliminar el servicio' };
  }
}
