'use server';

import { revalidatePath } from 'next/cache';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { resolveSessionUser } from '@/lib/auth-guard';
import { getOAuth2Client } from '@/lib/google-auth';
import { TipoPlantilla, EstadoEvento } from '@prisma/client';

export type EstadoConexionGoogle = {
  conectada: boolean;
  ultima_sync: Date | null;
  email?: string;
};

function toDateOnlyString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getAuthenticatedCalendarClient(usuarioId: string) {
  if (!prisma?.conexiones_google?.findUnique) return null;

  const conexion = await prisma.conexiones_google.findUnique({
    where: { usuario_id: usuarioId },
  });

  if (!conexion) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: conexion.access_token,
    refresh_token: conexion.refresh_token,
  });

  oauth2Client.on('tokens', async (newTokens) => {
    try {
      await prisma.conexiones_google.update({
        where: { usuario_id: usuarioId },
        data: {
          access_token: newTokens.access_token ?? conexion.access_token,
          ...(newTokens.refresh_token ? { refresh_token: newTokens.refresh_token } : {}),
          ...(newTokens.expiry_date ? { token_expira: new Date(newTokens.expiry_date) } : {}),
        },
      });
    } catch (err) {
      console.error('Error al actualizar tokens refrescados de Google:', err);
    }
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  return {
    calendar,
    calendarId: conexion.calendar_id || 'primary',
  };
}

/**
 * Obtiene el estado actual de la conexión de Google Calendar para el usuario en sesión
 */
export async function obtenerEstadoConexionGoogle(): Promise<EstadoConexionGoogle> {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { conectada: false, ultima_sync: null };
    }
    const conexion = await prisma.conexiones_google.findUnique({
      where: { usuario_id: auth.user.userId },
      select: {
        ultima_sync: true,
      },
    });

    if (!conexion) {
      return { conectada: false, ultima_sync: null };
    }

    return {
      conectada: true,
      ultima_sync: conexion.ultima_sync,
    };
  } catch {
    return { conectada: false, ultima_sync: null };
  }
}

/**
 * Sincroniza los eventos desde Google Calendar a BigHouse App (Importación de Entrada)
 * Soporta ventana centrada en el mes/año consultado para Stale-While-Revalidate.
 */
export async function sincronizarEventosGoogle(
  targetUsuarioId?: string,
  mes?: number,
  anio?: number
) {
  try {
    let usuarioId = targetUsuarioId;
    if (!usuarioId) {
      const auth = await resolveSessionUser();
      if (!auth.ok) {
        return { success: false, error: auth.error };
      }
      usuarioId = auth.user.userId;
    }

    const clientCtx = await getAuthenticatedCalendarClient(usuarioId);
    if (!clientCtx) {
      return { success: false, error: 'No hay una cuenta de Google Calendar conectada' };
    }

    const { calendar, calendarId } = clientCtx;

    let timeMin: string;
    let timeMax: string;

    if (mes && anio) {
      // Ventana centrada en el mes consultado (-15 días antes del inicio y +45 días tras el fin)
      timeMin = new Date(anio, mes - 1, -15, 0, 0, 0).toISOString();
      timeMax = new Date(anio, mes, 45, 23, 59, 59).toISOString();
    } else {
      const ahora = new Date();
      timeMin = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      timeMax = new Date(ahora.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    // 1. Sincronización de Salida (Push): Exportar eventos locales pendientes hacia Google Calendar
    const eventosLocalesPendientes = await prisma.eventos.findMany({
      where: {
        creador_id: usuarioId,
        google_event_id: null,
        estado: EstadoEvento.ACTIVO,
        ...(mes && anio
          ? {
              fecha_inicio: {
                gte: new Date(anio, mes - 1, -15, 0, 0, 0),
                lte: new Date(anio, mes, 45, 23, 59, 59),
              },
            }
          : {}),
      },
    });

    let exportados = 0;
    for (const ev of eventosLocalesPendientes) {
      try {
        const pushRes = await pushEventoAGoogleCalendar(usuarioId, ev.id);
        if (pushRes.synced) {
          exportados++;
        }
      } catch (err) {
        console.warn(`[Sync] Error al exportar evento local ${ev.id} a Google:`, err);
      }
    }

    // 2. Sincronización de Entrada (Pull): Importar eventos desde Google Calendar a BigHouse App
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const items = response.data.items ?? [];
    let sincronizados = 0;

    for (const item of items) {
      if (!item.id) continue;

      if (item.status === 'cancelled') {
        await prisma.eventos.updateMany({
          where: { google_event_id: item.id },
          data: { estado: EstadoEvento.CANCELADO },
        });
        continue;
      }

      const inicioStr = item.start?.dateTime || item.start?.date;
      const finStr = item.end?.dateTime || item.end?.date || inicioStr;

      if (!inicioStr || !finStr) continue;

      const todoElDia = !item.start?.dateTime;
      const inicio = todoElDia ? new Date(`${inicioStr}T00:00:00`) : new Date(inicioStr);
      let fin = todoElDia ? new Date(`${finStr}T23:59:59`) : new Date(finStr);

      // En Google Calendar los eventos de todo el día tienen end.date exclusivo (día siguiente)
      if (todoElDia && item.end?.date && item.start?.date && item.end.date > item.start.date) {
        const finExclusivo = new Date(`${item.end.date}T00:00:00`);
        finExclusivo.setMilliseconds(-1);
        if (finExclusivo >= inicio) {
          fin = finExclusivo;
        }
      }

      await prisma.eventos.upsert({
        where: { google_event_id: item.id },
        update: {
          titulo: item.summary || '(Sin título de Google)',
          descripcion: item.description || null,
          fecha_inicio: inicio,
          fecha_fin: fin,
          todo_el_dia: todoElDia,
          ubicacion: item.location || null,
          estado: EstadoEvento.ACTIVO,
        },
        create: {
          titulo: item.summary || '(Sin título de Google)',
          descripcion: item.description || null,
          fecha_inicio: inicio,
          fecha_fin: fin,
          todo_el_dia: todoElDia,
          ubicacion: item.location || null,
          tipo_plantilla: TipoPlantilla.EVENTO,
          estado: EstadoEvento.ACTIVO,
          color: '#6EB5A5',
          creador_id: usuarioId,
          google_event_id: item.id,
        },
      });

      sincronizados++;
    }

    await prisma.conexiones_google.update({
      where: { usuario_id: usuarioId },
      data: { ultima_sync: new Date() },
    });

    try {
      revalidatePath('/calendario');
      revalidatePath('/');
    } catch {}

    return {
      success: true,
      count: sincronizados + exportados,
      importados: sincronizados,
      exportados,
    };
  } catch (error: unknown) {
    console.error('Error al sincronizar Google Calendar:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al sincronizar';
    return { success: false, error: mensaje };
  }
}

/**
 * Sincronización de Salida (Push): Crea o actualiza un evento local en Google Calendar
 */
export async function pushEventoAGoogleCalendar(
  usuarioId: string,
  eventoId: string
): Promise<{ synced: boolean; googleEventId?: string | null; requiresReconnect?: boolean }> {
  try {
    const clientCtx = await getAuthenticatedCalendarClient(usuarioId);
    if (!clientCtx) {
      return { synced: false };
    }

    const evento = await prisma.eventos?.findUnique?.({
      where: { id: eventoId },
    });

    if (!evento || !evento.fecha_inicio) {
      return { synced: false };
    }

    const { calendar, calendarId } = clientCtx;
    const inicio = new Date(evento.fecha_inicio);
    const fin = evento.fecha_fin ? new Date(evento.fecha_fin) : new Date(inicio.getTime() + 3600000);

    let startPayload: { date?: string; dateTime?: string };
    let endPayload: { date?: string; dateTime?: string };

    if (evento.todo_el_dia) {
      const startDateStr = toDateOnlyString(inicio);
      const endExclusive = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() + 1);
      const endDateStr = toDateOnlyString(endExclusive);
      startPayload = { date: startDateStr };
      endPayload = { date: endDateStr };
    } else {
      startPayload = { dateTime: inicio.toISOString() };
      endPayload = { dateTime: fin.toISOString() };
    }

    const requestBody = {
      summary: evento.titulo,
      description: evento.descripcion || undefined,
      location: evento.ubicacion || undefined,
      start: startPayload,
      end: endPayload,
    };

    if (evento.google_event_id) {
      await calendar.events.patch({
        calendarId,
        eventId: evento.google_event_id,
        requestBody,
      });
      return { synced: true, googleEventId: evento.google_event_id };
    } else {
      const inserted = await calendar.events.insert({
        calendarId,
        requestBody,
      });
      const newGoogleId = inserted.data.id || null;
      if (newGoogleId) {
        await prisma.eventos.update({
          where: { id: eventoId },
          data: { google_event_id: newGoogleId },
        });
      }
      return { synced: true, googleEventId: newGoogleId };
    }
  } catch (error: any) {
    const msg = String(error?.message || '');
    if (msg.includes('Insufficient Permission') || error?.code === 403) {
      console.warn('Permisos de escritura insuficientes en Google Calendar. Reconexión requerida.');
      return { synced: false, requiresReconnect: true };
    }
    console.error('Error al exportar evento a Google Calendar:', error);
    return { synced: false };
  }
}

/**
 * Elimina un evento de Google Calendar cuando se borra o cancela en BigHouse App
 */
export async function deleteEventoEnGoogleCalendar(
  usuarioId: string,
  googleEventId?: string | null
): Promise<{ deleted: boolean }> {
  try {
    if (!googleEventId) return { deleted: false };

    const clientCtx = await getAuthenticatedCalendarClient(usuarioId);
    if (!clientCtx) return { deleted: false };

    const { calendar, calendarId } = clientCtx;
    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,
    });
    return { deleted: true };
  } catch (error: any) {
    if (error?.code === 404 || error?.code === 410) {
      return { deleted: true };
    }
    console.error('Error al eliminar evento en Google Calendar:', error);
    return { deleted: false };
  }
}

/**
 * Permite copiar/exportar en 1 toque un recordatorio del hogar (Planta o Servicio) a Google Calendar
 */
export async function exportarRecordatorioHogarAGoogle(input: {
  titulo: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  fecha: string | Date;
  color?: string;
}) {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const baseDate = new Date(input.fecha);
    const inicio = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    const fin = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

    const creado = await prisma.eventos.create({
      data: {
        titulo: input.titulo,
        descripcion: input.descripcion || null,
        ubicacion: input.ubicacion || null,
        tipo_plantilla: TipoPlantilla.EVENTO,
        estado: EstadoEvento.ACTIVO,
        fecha_inicio: inicio,
        fecha_fin: fin,
        todo_el_dia: true,
        color: input.color || '#6EB5A5',
        creador_id: auth.user.userId,
      },
    });

    const syncRes = await pushEventoAGoogleCalendar(auth.user.userId, creado.id);
    revalidatePath('/calendario');
    revalidatePath('/');

    return {
      success: true,
      syncedToGoogle: syncRes.synced,
      requiresReconnect: syncRes.requiresReconnect,
      data: creado,
    };
  } catch (error: unknown) {
    console.error('Error exportando recordatorio a Google Calendar:', error);
    return { success: false, error: 'No se pudo exportar el recordatorio' };
  }
}

/**
 * Desconecta la cuenta de Google Calendar y elimina los tokens guardados
 */
export async function desconectarGoogleCalendar() {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    await prisma.conexiones_google.deleteMany({
      where: { usuario_id: auth.user.userId },
    });

    revalidatePath('/calendario');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error al desconectar Google Calendar:', error);
    return { success: false, error: 'No se pudo desconectar Google Calendar' };
  }
}
