import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import webpush from 'web-push';

export async function GET(request: Request) {
  try {
    // Validar algún token de seguridad para el cron (opcional)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const ahora = new Date();

    const pendientes = await prisma.recordatorios_evento.findMany({
      where: {
        enviado: false,
        fecha_programada: {
          lte: ahora,
        },
      },
      include: {
        evento: {
          include: {
            participantes: true,
            creador: true,
          },
        },
      },
    });

    if (pendientes.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay recordatorios pendientes', procesados: 0 });
    }

    const hasEmailConfig = Boolean(process.env.RESEND_API_KEY);
    const hasPushConfig = Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
    );

    // Si ningún canal de notificación está configurado, responder 503 sin mutar destructivamente los registros
    if (!hasEmailConfig && !hasPushConfig) {
      console.warn('Cron recordatorios: No hay servicios de notificación configurados (RESEND_API_KEY / VAPID).');
      return NextResponse.json(
        {
          success: false,
          error: 'Servicios de notificación no configurados (RESEND_API_KEY y llaves VAPID ausentes). No se modificaron los recordatorios pendientes.',
          pendientes: pendientes.length,
          procesados: 0,
        },
        { status: 503 }
      );
    }

    let resend: Resend | null = null;
    if (hasEmailConfig) {
      resend = new Resend(process.env.RESEND_API_KEY);
    }

    if (hasPushConfig) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:soporte@bighouseapp.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );
    }

    let procesados = 0;
    let omitidos = 0;

    for (const recordatorio of pendientes) {
      const evento = recordatorio.evento;
      const usuariosAnotificar = [
        ...evento.participantes,
        ...(evento.creador ? [evento.creador] : []),
      ];
      // Remover duplicados por ID
      const unicos = Array.from(new Map(usuariosAnotificar.map((u) => [u.id, u])).values());

      let enviadoExitosamente = false;

      if (recordatorio.tipo_canal === 'EMAIL') {
        if (!resend) {
          console.warn(`Omitiendo recordatorio ${recordatorio.id} (EMAIL): RESEND_API_KEY no configurado.`);
          omitidos++;
          continue;
        }

        try {
          for (const usuario of unicos) {
            if (!usuario.email) continue;
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL || 'BigHouse App <no-reply@resend.dev>',
              to: usuario.email,
              subject: `Recordatorio: ${evento.titulo}`,
              html: `<p>Hola ${usuario.nombre}, te recordamos que tienes el evento <b>${evento.titulo}</b> programado.</p>`,
            });
          }
          enviadoExitosamente = true;
        } catch (emailErr) {
          console.error(`Error enviando email para recordatorio ${recordatorio.id}:`, emailErr);
        }
      } else if (recordatorio.tipo_canal === 'PUSH') {
        if (!hasPushConfig) {
          console.warn(`Omitiendo recordatorio ${recordatorio.id} (PUSH): Llaves VAPID no configuradas.`);
          omitidos++;
          continue;
        }

        try {
          for (const usuario of unicos) {
            const suscripciones = await prisma.suscripciones_push.findMany({
              where: { usuario_id: usuario.id },
            });
            const payload = JSON.stringify({
              title: evento.titulo,
              body: 'Evento próximo en tu calendario',
            });
            for (const sub of suscripciones) {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                  },
                  payload
                );
              } catch (e: any) {
                // Si la suscripción expiró (410 Gone / 404 Not Found), removerla
                if (e?.statusCode === 410 || e?.statusCode === 404) {
                  await prisma.suscripciones_push.delete({ where: { id: sub.id } }).catch(() => {});
                }
              }
            }
          }
          enviadoExitosamente = true;
        } catch (pushErr) {
          console.error(`Error enviando push para recordatorio ${recordatorio.id}:`, pushErr);
        }
      }

      if (enviadoExitosamente) {
        // Marcar como enviado únicamente cuando el canal procesó el envío
        await prisma.recordatorios_evento.update({
          where: { id: recordatorio.id },
          data: { enviado: true },
        });
        procesados++;
      }
    }

    if (procesados === 0 && pendientes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo procesar ningún recordatorio porque los canales requeridos no están configurados.',
          pendientes: pendientes.length,
          procesados: 0,
          omitidos,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      pendientes: pendientes.length,
      procesados,
      omitidos,
    });
  } catch (error: any) {
    console.error('Error procesando cron de recordatorios:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
