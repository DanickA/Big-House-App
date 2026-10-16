'use server';

import { revalidatePath } from 'next/cache';
import { resolveSessionUser } from '@/lib/auth-guard';
import { toActionResponse } from '@/modules/shared';
import {
  GetEventosCalendarioUseCase,
  GetProximosEventosLobbyUseCase,
  CrearEventoUseCase,
  EliminarEventoFisicoUseCase,
  EventoUnificado,
  TipoPlantilla,
} from '@/modules/calendario';

export type { EventoUnificado };

const getEventosCalendarioUC = new GetEventosCalendarioUseCase();
const getProximosEventosLobbyUC = new GetProximosEventosLobbyUseCase();
const crearEventoUC = new CrearEventoUseCase();
const eliminarEventoFisicoUC = new EliminarEventoFisicoUseCase();

// 1. Obtener eventos unificados del mes (Eventos propios + Riegos + Vencimiento de Facturas)
export async function getEventosCalendario(
  mes: number,
  anio: number
): Promise<{ success: boolean; data: EventoUnificado[]; error?: string }> {
  const result = await getEventosCalendarioUC.execute(mes, anio);
  if (!result.success) {
    return { success: false, data: [], error: result.error.message };
  }
  return { success: true, data: result.data };
}

// 2. Obtener los próximos eventos para la tarjeta del Lobby
export async function getProximosEventosLobby(limit = 3): Promise<{
  success: boolean;
  totalEventosSemana: number;
  proximos: EventoUnificado[];
}> {
  const result = await getProximosEventosLobbyUC.execute(limit);
  if (!result.success) {
    return { success: false, totalEventosSemana: 0, proximos: [] };
  }
  return {
    success: true,
    totalEventosSemana: result.data.totalEventosSemana,
    proximos: result.data.proximos,
  };
}

// 3. Crear un evento manual con el formulario contextual
export async function createEvento(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const titulo = (formData.get('titulo') as string)?.trim();
  const descripcion = (formData.get('descripcion') as string)?.trim() || null;
  const tipo_plantilla_str = (formData.get('tipo_plantilla') as string) || 'EVENTO';
  const fecha_inicio_str = formData.get('fecha_inicio') as string;
  const fecha_fin_str = formData.get('fecha_fin') as string;
  const todo_el_dia = formData.get('todo_el_dia') === 'true';
  const color = (formData.get('color') as string) || '#5F6F52';
  const ubicacion = (formData.get('ubicacion') as string)?.trim() || null;
  const participante_id = (formData.get('participante_id') as string) || null;

  if (!titulo || !fecha_inicio_str) {
    return { success: false, error: 'El título y la fecha son obligatorios' };
  }

  const fecha_inicio = new Date(fecha_inicio_str);
  const fecha_fin = fecha_fin_str ? new Date(fecha_fin_str) : new Date(fecha_inicio.getTime() + 60 * 60 * 1000);

  const tipo_plantilla = (Object.values(TipoPlantilla).includes(tipo_plantilla_str as TipoPlantilla)
    ? tipo_plantilla_str
    : 'EVENTO') as TipoPlantilla;

  const result = await crearEventoUC.execute({
    titulo,
    descripcion: descripcion || undefined,
    tipo_plantilla,
    fecha_inicio,
    fecha_fin,
    todo_el_dia,
    color,
    ubicacion: ubicacion || undefined,
    creador_id: auth.user.userId,
    participantes_ids: participante_id ? [participante_id] : [],
  });

  if (result.success) {
    revalidatePath('/calendario');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 4. Eliminar un evento manual
export async function deleteEvento(id: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const result = await eliminarEventoFisicoUC.execute(id);

  if (result.success) {
    revalidatePath('/calendario');
    revalidatePath('/');
  }

  return toActionResponse(result);
}
