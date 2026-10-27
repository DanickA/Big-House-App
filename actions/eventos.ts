'use server';

import { resolveSessionUser } from '@/lib/auth-guard';
import {
  GetEventosCalendarioUseCase,
  GetProximosEventosLobbyUseCase,
  EventoUnificado,
} from '@/modules/calendario';

export type { EventoUnificado };

const getEventosCalendarioUC = new GetEventosCalendarioUseCase();
const getProximosEventosLobbyUC = new GetProximosEventosLobbyUseCase();

// 1. Obtener eventos unificados del mes (Eventos propios + Riegos + Vencimiento de Facturas)
export async function getEventosCalendario(
  mes: number,
  anio: number
): Promise<{ success: boolean; data: EventoUnificado[]; error?: string }> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, data: [], error: auth.error };
  }
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
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, totalEventosSemana: 0, proximos: [] };
  }
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
