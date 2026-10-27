'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { resolveSessionUser } from '@/lib/auth-guard';
import { toActionResponse } from '@/modules/shared';
import {
  TipoPlantilla,
  EstadoEvento,
  CanalRecordatorio,
  OpcionRecurrenciaEdicion,
  CrearEventoUseCase,
  ActualizarEventoUseCase,
  CancelarEventoLogicoUseCase,
  EliminarEventoFisicoUseCase,
  ToggleSubtareaUseCase,
  DetallesEvento,
} from '@/modules/calendario';

export type EventoData = {
  titulo: string;
  descripcion?: string;
  tipo_plantilla: TipoPlantilla;
  estado?: EstadoEvento;
  fecha_inicio: Date;
  fecha_fin: Date;
  todo_el_dia: boolean;
  color: string;
  ubicacion?: string;
  recurrencia?: string;
  detalles?: DetallesEvento;
  creador_id?: string;
  participantes_ids?: string[];
  externos?: { nombre: string; contacto?: string }[];
  subtareas?: { descripcion: string; asignado_id?: string; completado?: boolean }[];
  recordatorios?: { tipo_canal: CanalRecordatorio; minutos_anticipacion: number }[];
};

export type { OpcionRecurrenciaEdicion };

const crearEventoUC = new CrearEventoUseCase();
const actualizarEventoUC = new ActualizarEventoUseCase();
const cancelarEventoLogicoUC = new CancelarEventoLogicoUseCase();
const eliminarEventoFisicoUC = new EliminarEventoFisicoUseCase();
const toggleSubtareaUC = new ToggleSubtareaUseCase();

export async function obtenerEventosMes(fechaInicio: Date, fechaFin: Date) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }
  try {
    const eventos = await prisma.eventos.findMany({
      where: {
        fecha_inicio: { gte: fechaInicio },
        fecha_fin: { lte: fechaFin },
      },
      include: {
        creador: { select: { id: true, nombre: true } },
        participantes: { select: { id: true, nombre: true } },
        externos: true,
        subtareas: { include: { asignado: { select: { id: true, nombre: true } } } },
        recordatorios: true,
      },
      orderBy: { fecha_inicio: 'asc' },
    });
    return { success: true, data: eventos };
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return { success: false, error: 'No se pudieron obtener los eventos' };
  }
}

import {
  pushEventoAGoogleCalendar,
  deleteEventoEnGoogleCalendar,
} from '@/lib/google-calendar-sync';

export async function crearEvento(data: EventoData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const result = await crearEventoUC.execute({
    ...data,
    creador_id: auth.user.userId,
  });

  let googleSynced = false;
  if (result.success) {
    if (result.data?.id) {
      try {
        const pushRes = await pushEventoAGoogleCalendar(auth.user.userId, result.data.id);
        googleSynced = pushRes.synced;
      } catch (err) {
        console.warn('Error al exportar a Google Calendar:', err);
      }
    }
    try {
      revalidatePath('/calendario');
      revalidatePath('/');
    } catch {}
  }

  const response = toActionResponse(result);
  return {
    ...response,
    googleSynced,
  };
}

export async function actualizarEvento(
  id: string,
  data: Partial<EventoData>,
  opcionRecurrencia: OpcionRecurrenciaEdicion = 'SIN_RECURRENCIA'
) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  if (auth.user.rol !== 'ADMIN') {
    const previo = await prisma.eventos?.findUnique?.({ where: { id } });
    if (previo?.creador_id && previo.creador_id !== auth.user.userId) {
      return {
        success: false,
        error: 'Solo el creador del evento o un administrador puede modificarlo.',
        code: 'FORBIDDEN',
      };
    }
  }

  const result = await actualizarEventoUC.execute(id, data, opcionRecurrencia);

  let googleSynced = false;
  if (result.success) {
    const targetId = result.data?.id || id;
    try {
      const pushRes = await pushEventoAGoogleCalendar(auth.user.userId, targetId);
      googleSynced = pushRes.synced;
    } catch (err) {
      console.warn('Error al exportar actualización a Google Calendar:', err);
    }
    try {
      revalidatePath('/calendario');
      revalidatePath('/');
    } catch {}
  }

  const response = toActionResponse(result);
  return {
    ...response,
    googleSynced,
  };
}

export async function cancelarEventoLogico(id: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code, googleDeleted: false };
  }

  const previo = await prisma.eventos?.findUnique?.({ where: { id } });
  if (auth.user.rol !== 'ADMIN' && previo?.creador_id && previo.creador_id !== auth.user.userId) {
    return {
      success: false,
      error: 'Solo el creador del evento o un administrador puede cancelarlo.',
      code: 'FORBIDDEN',
      googleDeleted: false,
    };
  }
  const result = await cancelarEventoLogicoUC.execute(id);

  let googleDeleted = false;
  if (result.success) {
    if (previo?.google_event_id) {
      try {
        const delRes = await deleteEventoEnGoogleCalendar(auth.user.userId, previo.google_event_id);
        googleDeleted = Boolean(delRes.deleted);
      } catch (err) {
        console.warn('Error al eliminar evento en Google Calendar:', err);
      }
    }
    try {
      revalidatePath('/calendario');
      revalidatePath('/');
    } catch {}
  }

  const response = toActionResponse(result);
  return {
    ...response,
    googleDeleted,
  };
}

export async function eliminarEventoFisico(id: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code, googleDeleted: false };
  }

  const previo = await prisma.eventos?.findUnique?.({ where: { id } });
  if (auth.user.rol !== 'ADMIN' && previo?.creador_id && previo.creador_id !== auth.user.userId) {
    return {
      success: false,
      error: 'Solo el creador del evento o un administrador puede eliminarlo.',
      code: 'FORBIDDEN',
      googleDeleted: false,
    };
  }
  const result = await eliminarEventoFisicoUC.execute(id);

  let googleDeleted = false;
  if (result.success) {
    if (previo?.google_event_id) {
      try {
        const delRes = await deleteEventoEnGoogleCalendar(auth.user.userId, previo.google_event_id);
        googleDeleted = Boolean(delRes.deleted);
      } catch (err) {
        console.warn('Error al eliminar evento en Google Calendar:', err);
      }
    }
    try {
      revalidatePath('/calendario');
      revalidatePath('/');
    } catch {}
  }

  const response = toActionResponse(result);
  return {
    ...response,
    googleDeleted,
  };
}

export async function toggleEstadoSubtarea(id: string, completado: boolean) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const result = await toggleSubtareaUC.execute(id, completado);

  if (result.success) {
    revalidatePath('/calendario');
  }

  return toActionResponse(result);
}
