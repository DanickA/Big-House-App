import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { resolveSessionUser } from '@/lib/auth-guard';

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint de suscripción inválido'),
  keys: z.object({
    p256dh: z.string().min(1, 'Clave p256dh requerida'),
    auth: z.string().min(1, 'Clave auth requerida'),
  }),
});

export async function GET() {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
  return NextResponse.json({
    configured: Boolean(publicKey),
    publicKey,
  });
}

export async function POST(request: Request) {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const parsed = PushSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Suscripción push inválida' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = parsed.data;

    const existente = await prisma.suscripciones_push.findFirst({
      where: {
        usuario_id: auth.user.userId,
        endpoint,
      },
    });

    if (existente) {
      const actualizada = await prisma.suscripciones_push.update({
        where: { id: existente.id },
        data: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
      return NextResponse.json({ success: true, id: actualizada.id });
    }

    const creada = await prisma.suscripciones_push.create({
      data: {
        usuario_id: auth.user.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ success: true, id: creada.id }, { status: 201 });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo registrar la suscripción push' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';

    if (endpoint) {
      await prisma.suscripciones_push.deleteMany({
        where: {
          usuario_id: auth.user.userId,
          endpoint,
        },
      });
    } else {
      await prisma.suscripciones_push.deleteMany({
        where: {
          usuario_id: auth.user.userId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar la suscripción push' },
      { status: 500 }
    );
  }
}
