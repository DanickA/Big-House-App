import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getOAuth2Client } from '@/lib/google-auth';
import { encryptToken, decryptToken } from '@/lib/crypto';

function toDateOnlyString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getAuthenticatedCalendarClient(usuarioId: string) {
  if (!prisma?.conexiones_google?.findUnique) return null;

  const conexion = await prisma.conexiones_google.findUnique({
    where: { usuario_id: usuarioId },
  });

  if (!conexion) return null;

  // Descifrar tokens si estaban cifrados con AES-256-GCM
  const accessToken = decryptToken(conexion.access_token);
  const refreshToken = decryptToken(conexion.refresh_token);

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  oauth2Client.on('tokens', async (newTokens) => {
    try {
      await prisma.conexiones_google.update({
        where: { usuario_id: usuarioId },
        data: {
          access_token: newTokens.access_token
            ? encryptToken(newTokens.access_token)
            : conexion.access_token,
          ...(newTokens.refresh_token
            ? { refresh_token: encryptToken(newTokens.refresh_token) }
            : {}),
          ...(newTokens.expiry_date
            ? { token_expira: new Date(newTokens.expiry_date) }
            : {}),
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
    console.error('Error al eliminar evento de Google Calendar:', error);
    return { deleted: false };
  }
}
