'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { resolveSessionUser } from '@/lib/auth-guard';
import {
  toActionResponse,
  calcularProximaFechaVencimientoPura,
  roundMoney,
  parseLocalDate,
  isValidId,
  type ActionResponse,
} from '@/modules/shared';
import {
  GetServiciosUseCase,
  CreateServicioUseCase,
  UpdateServicioUseCase,
  DeleteServicioUseCase,
  GetHistorialPagosUseCase,
  RegistrarPagoServicioUseCase,
  GetFondoComunMesUseCase,
  RegistrarAporteFondoUseCase,
  DeleteAporteFondoUseCase,
  defaultPagoRepository,
  ServicioConEstado,
  ResumenServicios,
  EstadoVencimiento,
  AporteFondoComun,
  ResumenFondoComunMes,
  PagoHistorialItem,
  GastoHogar,
} from '@/modules/finanzas';

export type {
  EstadoVencimiento,
  ServicioConEstado,
  ResumenServicios,
  AporteFondoComun,
  ResumenFondoComunMes,
  PagoHistorialItem,
  GastoHogar,
};

const getServiciosUC = new GetServiciosUseCase();
const createServicioUC = new CreateServicioUseCase();
const updateServicioUC = new UpdateServicioUseCase();
const deleteServicioUC = new DeleteServicioUseCase();
const getHistorialPagosUC = new GetHistorialPagosUseCase();
const registrarPagoServicioUC = new RegistrarPagoServicioUseCase();
const getFondoComunMesUC = new GetFondoComunMesUseCase();
const registrarAporteFondoUC = new RegistrarAporteFondoUseCase();
const deleteAporteFondoUC = new DeleteAporteFondoUseCase();

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

// 1. Obtener todos los servicios con cálculo dinámico de días, estado y proyección mensual opcional
export async function getServicios(periodoMes?: string): Promise<{
  success: boolean;
  servicios: ServicioConEstado[];
  resumen: ResumenServicios;
  error?: string;
}> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
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
        totalRealPagadoMes: 0,
        totalPorPagarMes: 0,
        diferenciaPresupuestoGlobal: 0,
      },
      error: auth.error,
    };
  }

  const result = await getServiciosUC.execute(periodoMes);
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
        totalRealPagadoMes: 0,
        totalPorPagarMes: 0,
        diferenciaPresupuestoGlobal: 0,
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
  const responsable_id = formData.get('responsable_id') as string | null;

  const result = await createServicioUC.execute({
    nombre_servicio,
    monto,
    fecha_vencimiento_raw,
    periodicidad_meses,
    numero_cuenta,
    numero_factura,
    dia_vencimiento_raw,
    responsable_id,
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
  data?: {
    pagoId: string;
    proximoVencimiento: string;
    montoPresupuestado?: number;
    diferenciaPresupuesto?: number;
  };
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
export async function getHistorialPagos(servicioId: string): Promise<ActionResponse<PagoHistorialItem[]>> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }
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
  const responsable_id = formData.get('responsable_id') as string | null;

  const result = await updateServicioUC.execute({
    id: servicioId,
    nombre_servicio,
    monto,
    periodicidad_meses,
    numero_cuenta,
    numero_factura,
    dia_vencimiento_raw,
    fecha_vencimiento_raw,
    responsable_id,
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

  if (auth.user.rol !== 'ADMIN') {
    const srv = await prisma.servicios?.findUnique?.({
      where: { id: servicioId },
      select: { responsable_id: true },
    });
    if (srv?.responsable_id && srv.responsable_id !== auth.user.userId) {
      return {
        success: false,
        error: 'Solo un administrador o el habitante responsable puede eliminar este servicio.',
        code: 'FORBIDDEN',
      };
    }
  }

  const result = await deleteServicioUC.execute(servicioId);
  if (result.success) {
    revalidatePath('/finanzas');
    revalidatePath('/servicios');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 7. Obtener Fondo Común del Mes (Presupuesto = Suma de aportes del mes)
export async function getFondoComunMes(periodoMes?: string): Promise<{
  success: boolean;
  data?: ResumenFondoComunMes;
  error?: string;
}> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return {
      success: false,
      error: auth.error,
    };
  }

  const result = await getFondoComunMesUC.execute(periodoMes);
  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
    };
  }
  return {
    success: true,
    data: result.data,
  };
}

// 8. Registrar un Aporte al Fondo Común con soporte/comprobante
export async function registrarAporteFondo(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const targetUsuarioId = (formData.get('usuario_id') as string) || auth.user.userId;
  if (auth.user.rol !== 'ADMIN' && targetUsuarioId !== auth.user.userId) {
    return {
      success: false,
      error: 'No tienes autorización para registrar aportes a nombre de otro habitante.',
      code: 'FORBIDDEN',
    };
  }
  const usuario_id = targetUsuarioId;

  const monto = parseFloat(formData.get('monto') as string);
  const periodo_mes = formData.get('periodo_mes') as string | null;
  const fecha_raw = formData.get('fecha') as string | null;
  const descripcion = formData.get('descripcion') as string | null;
  const comprobanteFile = formData.get('comprobante') as File | null;

  const result = await registrarAporteFondoUC.execute({
    usuario_id,
    monto,
    periodo_mes,
    fecha_raw,
    descripcion,
    comprobanteFile,
  });

  if (result.success) {
    revalidatePath('/finanzas');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 9. Eliminar un Aporte del Fondo Común
export async function deleteAporteFondo(aporteId: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  if (auth.user.rol !== 'ADMIN') {
    const aporte = await prisma.ingresos.findUnique({
      where: { id: aporteId },
      select: { usuario_id: true, fuente: true },
    });
    if (!aporte || (aporte.fuente && aporte.fuente !== 'FONDO_COMUN')) {
      return { success: false, error: 'Aporte no encontrado.', code: 'NOT_FOUND' };
    }
    if (aporte.usuario_id !== auth.user.userId) {
      return {
        success: false,
        error: 'Solo puedes eliminar tus propios aportes o requieres rol de administrador.',
        code: 'FORBIDDEN',
      };
    }
  }

  const result = await deleteAporteFondoUC.execute(aporteId);
  if (result.success) {
    revalidatePath('/finanzas');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 10. Obtener Gastos Generales del Hogar por Mes (F-19)
export async function getGastosMes(periodoMes?: string): Promise<{
  success: boolean;
  gastos: GastoHogar[];
  totalGastosMes: number;
  error?: string;
}> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, gastos: [], totalGastosMes: 0, error: auth.error };
  }

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (periodoMes && /^\d{4}-\d{2}$/.test(periodoMes)) {
    const [y, m] = periodoMes.split('-').map(Number);
    if (m >= 1 && m <= 12) {
      year = y;
      month = m;
    }
  }

  try {
    const gastos = defaultPagoRepository.findGastosByMonth
      ? await defaultPagoRepository.findGastosByMonth(year, month)
      : [];
    const totalGastosMes = roundMoney(gastos.reduce((acc, g) => acc + g.monto, 0));
    return { success: true, gastos, totalGastosMes };
  } catch {
    return {
      success: false,
      gastos: [],
      totalGastosMes: 0,
      error: 'No se pudieron obtener los gastos del mes',
    };
  }
}

// 11. Registrar un Gasto General del Hogar (F-19)
export async function registrarGastoGeneral(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const descripcion = ((formData.get('descripcion') as string) || '').trim();
  const monto = roundMoney(parseFloat((formData.get('monto') as string) || '0'));
  const categoria = ((formData.get('categoria') as string) || 'OTROS').trim().toUpperCase();
  const fecha_raw = (formData.get('fecha') as string) || null;

  if (!descripcion) {
    return { success: false, error: 'La descripción del gasto es obligatoria', code: 'VALIDATION_ERROR' };
  }
  if (isNaN(monto) || monto <= 0) {
    return { success: false, error: 'Ingresa un monto de gasto válido mayor a 0', code: 'VALIDATION_ERROR' };
  }

  const fecha = fecha_raw ? parseLocalDate(fecha_raw) : new Date();
  if (isNaN(fecha.getTime())) {
    return { success: false, error: 'Fecha de gasto inválida', code: 'VALIDATION_ERROR' };
  }

  try {
    await defaultPagoRepository.createGasto({
      descripcion: descripcion.slice(0, 200),
      monto,
      fecha,
      categoria: categoria.slice(0, 50),
      usuario_id: auth.user.userId,
      servicio_id: null,
    });
    revalidatePath('/finanzas');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'No se pudo registrar el gasto general', code: 'INTERNAL_SERVER_ERROR' };
  }
}

// 12. Eliminar un Gasto General del Hogar (F-19)
export async function deleteGastoGeneral(gastoId: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }
  if (!isValidId(gastoId)) {
    return { success: false, error: 'Identificador de gasto inválido', code: 'VALIDATION_ERROR' };
  }

  if (auth.user.rol !== 'ADMIN') {
    const gasto = await prisma.gastos?.findUnique?.({
      where: { id: gastoId.trim() },
      select: { usuario_id: true, servicio_id: true },
    });
    if (!gasto) {
      return { success: false, error: 'Gasto no encontrado', code: 'NOT_FOUND' };
    }
    if (gasto.servicio_id) {
      return {
        success: false,
        error: 'Los asientos de pago de servicios solo pueden ser gestionados por un administrador.',
        code: 'FORBIDDEN',
      };
    }
    if (gasto.usuario_id !== auth.user.userId) {
      return {
        success: false,
        error: 'Solo puedes eliminar los gastos registrados por ti o requieres rol de administrador.',
        code: 'FORBIDDEN',
      };
    }
  }

  try {
    if (defaultPagoRepository.deleteGasto) {
      await defaultPagoRepository.deleteGasto(gastoId.trim());
    }
    revalidatePath('/finanzas');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'No se pudo eliminar el gasto', code: 'INTERNAL_SERVER_ERROR' };
  }
}
