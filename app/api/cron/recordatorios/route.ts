import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { Resend } from 'resend';
// import webpush from 'web-push';

// Configurar Web Push (asegurarse de tener las variables en .env)
// webpush.setVapidDetails(
//   'mailto:tucorreo@ejemplo.com',
//   process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
//   process.env.VAPID_PRIVATE_KEY!
// );

// const resend = new Resend(process.env.RESEND_API_KEY);

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
          }
        },
      },
    });

    if (pendientes.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay recordatorios pendientes', procesados: 0 });
    }

    let procesados = 0;

    for (const recordatorio of pendientes) {
      const evento = recordatorio.evento;
      const usuariosAnotificar = [...evento.participantes, evento.creador];
      // Remover duplicados por ID
      const unicos = Array.from(new Map(usuariosAnotificar.map(u => [u.id, u])).values());

      for (const usuario of unicos) {
        if (recordatorio.tipo_canal === 'EMAIL') {
          // Lógica real de Resend
          /*
          await resend.emails.send({
            from: 'HogarApp <no-reply@tu-dominio.com>',
            to: usuario.email,
            subject: `Recordatorio: ${evento.titulo}`,
            html: `<p>Hola ${usuario.nombre}, te recordamos que tienes el evento <b>${evento.titulo}</b> pronto.</p>`
          });
          */
          console.log(`Simulando envío de EMAIL a ${usuario.email} para el evento ${evento.titulo}`);
        } else if (recordatorio.tipo_canal === 'PUSH') {
          // Lógica de Web Push
          /*
          const suscripciones = await prisma.suscripciones_push.findMany({ where: { usuario_id: usuario.id } });
          const payload = JSON.stringify({ title: evento.titulo, body: 'Evento próximo en tu calendario' });
          for (const sub of suscripciones) {
             try {
                await webpush.sendNotification({
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth }
                }, payload);
             } catch (e) {
                // Si la suscripción expiró, borrarla
             }
          }
          */
          console.log(`Simulando envío de PUSH a usuario ${usuario.nombre} para el evento ${evento.titulo}`);
        }
      }

      // Marcar como enviado
      await prisma.recordatorios_evento.update({
        where: { id: recordatorio.id },
        data: { enviado: true },
      });
      procesados++;
    }

    return NextResponse.json({ success: true, procesados });
  } catch (error: any) {
    console.error('Error procesando cron de recordatorios:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
