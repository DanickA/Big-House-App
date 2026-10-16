'use server';

import { revalidatePath } from 'next/cache';
import { resolveSessionUser } from '@/lib/auth-guard';
import { toActionResponse, calcularProximaFechaVencimientoPura } from '@/modules/shared';
import {
  GetServiciosUseCase,
  CreateServicioUseCase,
  UpdateServicioUseCase,
  DeleteServicioUseCase,
  GetHistorialPagosUseCase,
  RegistrarPagoServicioUseCase,
  ServicioConEstado,
  ResumenServicios,
  EstadoVencimiento,
} from '@/modules/finanzas';

export type { EstadoVencimiento, ServicioConEstado, ResumenServicios };

const getServiciosUC = new GetServiciosUseCase();
const createServicioUC = new CreateServicioUseCase();
const updateServicioUC = new UpdateServicioUseCase();
const deleteServicioUC = new DeleteServicioUseCase();
const getHistorialPagosUC = new GetHistorialPagosUseCase();
const registrarPagoServicioUC = new RegistrarPagoServicioUseCase();

/**
 * Calcula la próxima fecha de vencimiento después de registrar un pago.
 * Preservado con async para compatibilidad con llamadas existentes desde Server Actions o tests.
 */
export async function calcularProximaFechaVencimiento(
  fechaPago: Date,
  periodicidadMeses: number = 1,
  diaVencimiento?: number | null
): Promise<Date> {
  return calcularProximaFechaVencimientoPura(fechaPago, periodicidadMeses, diaVencimiento);
}

// 1. Obtener todos los servicios con cálculo dinámico de días y badges de estado
export async function getServicios(): Promise<{
  success: boolean;
  servicios: ServicioConEstado[];
  resumen: ResumenServicios;
  error?: string;
}> {
  const result = await getServiciosUC.execute();
  if (!result.success) {
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
      error: result.error.message,
    };
  }
  return {
    success: true,
    servicios: result.data.servicios,
    resumen: result.data.resumen,
  };
}

// 2. Registrar un nuevo servicio recurrente
export async function createServicio(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const nombre_servicio = formData.get('nombre_servicio') as string;
  const monto = parseFloat(formData.get('monto') as string);
  const fecha_vencimiento_raw = formData.get('fecha_vencimiento') as string;
  const periodicidad_meses = parseInt((formData.get('periodicidad_meses') as string) || '1', 10);
  const numero_cuenta = formData.get('numero_cuenta') as string | null;
  const numero_factura = formData.get('numero_factura') as string | null;
  const dia_vencimiento_raw = formData.get('dia_vencimiento') as string | null;

  const result = await createServicioUC.execute({
    nombre_servicio,
    monto,
    fecha_vencimiento_raw,
    periodicidad_meses,
    numero_cuenta,
    numero_factura,
    dia_vencimiento_raw,
  });

  if (result.success) {
    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

export type RegistrarPagoResponse = {
  success: boolean;
  data?: { pagoId: string; proximoVencimiento: string };
  error?: string;
  code?: string;
  proximoVencimiento?: string;
  estado?: string;
};

// 3. Registrar Pago con Transacción Atómica
export async function registrarPagoServicio(formData: FormData): Promise<RegistrarPagoResponse> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const servicio_id = formData.get('servicio_id') as string;
  const monto_pagado = parseFloat(formData.get('monto_pagado') as string);
  const fecha_pago_raw = formData.get('fecha_pago') as string | null;
  const observaciones = formData.get('observaciones') as string | null;
  const comprobanteFile = formData.get('comprobante') as File | null;
  const fecha_vencimiento_esperada = formData.get('fecha_vencimiento_esperada') as string | null;

  const result = await registrarPagoServicioUC.execute({
    servicio_id,
    monto_pagado,
    usuario_id: auth.user.userId,
    fecha_pago_raw,
    observaciones,
    comprobanteFile,
    fecha_vencimiento_esperada,
  });

  if (result.success) {
    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');
  }

  return toActionResponse(result) as RegistrarPagoResponse;
}

// 4. Obtener Historial Cronológico de Pagos de un Servicio
export async function getHistorialPagos(servicioId: string) {
  const result = await getHistorialPagosUC.execute(servicioId);
  return toActionResponse(result);
}

// 5. Actualizar un Servicio
export async function updateServicio(servicioId: string, formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const nombre_servicio = formData.get('nombre_servicio') as string;
  const monto = parseFloat(formData.get('monto') as string);
  const periodicidad_meses = parseInt((formData.get('periodicidad_meses') as string) || '1', 10);
  const numero_cuenta = formData.get('numero_cuenta') as string | null;
  const numero_factura = formData.get('numero_factura') as string | null;
  const dia_vencimiento_raw = formData.get('dia_vencimiento') as string | null;
  const fecha_vencimiento_raw = formData.get('fecha_vencimiento') as string | null;

  const result = await updateServicioUC.execute({
    id: servicioId,
    nombre_servicio,
    monto,
    periodicidad_meses,
    numero_cuenta,
    numero_factura,
    dia_vencimiento_raw,
    fecha_vencimiento_raw,
  });

  if (result.success) {
    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 6. Eliminar un Servicio
export async function deleteServicio(servicioId: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const result = await deleteServicioUC.execute(servicioId);
  if (result.success) {
    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');
  }

  return toActionResponse(result);
}
