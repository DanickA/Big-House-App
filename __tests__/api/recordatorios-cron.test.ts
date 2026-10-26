import { GET } from '@/app/api/cron/recordatorios/route';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import webpush from 'web-push';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    recordatorios_evento: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    suscripciones_push: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('resend', () => {
  const mockSend = jest.fn().mockResolvedValue({ id: 'resend-123' });
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  };
});

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({}),
}));

describe('Cron Recordatorios Route Handler (Honest Notifications)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('debe rechazar con 401 si CRON_SECRET está configurado y el request no incluye el Bearer token correcto', async () => {
    process.env.CRON_SECRET = 'mi-secreto-seguro';

    const req = new Request('http://localhost:3000/api/cron/recordatorios', {
      headers: { authorization: 'Bearer token-invalido' },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('debe responder 200 con procesados: 0 si no hay recordatorios pendientes', async () => {
    (prisma.recordatorios_evento.findMany as jest.Mock).mockResolvedValueOnce([]);

    const req = new Request('http://localhost:3000/api/cron/recordatorios');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.procesados).toBe(0);
    expect(prisma.recordatorios_evento.update).not.toHaveBeenCalled();
  });

  it('debe responder 503 y NO marcar enviado: true si no hay canales configurados (evita falsos positivos destructivos)', async () => {
    // Recordatorio pendiente en BD
    (prisma.recordatorios_evento.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'rec-1',
        tipo_canal: 'EMAIL',
        evento: {
          titulo: 'Cita Médica',
          participantes: [{ id: 'user-1', email: 'dani@ejemplo.com', nombre: 'Dani' }],
          creador: null,
        },
      },
    ]);

    const req = new Request('http://localhost:3000/api/cron/recordatorios');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Servicios de notificación no configurados');
    expect(body.procesados).toBe(0);

    // Verificación crítica: NUNCA debe mutar la base de datos a enviado: true
    expect(prisma.recordatorios_evento.update).not.toHaveBeenCalled();
  });

  it('debe responder 503 y NO marcar enviado: true si el recordatorio es EMAIL pero falta RESEND_API_KEY', async () => {
    // VAPID está configurado pero el recordatorio pide EMAIL
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'vapid-pub-key';
    process.env.VAPID_PRIVATE_KEY = 'vapid-priv-key';

    (prisma.recordatorios_evento.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'rec-email-solo',
        tipo_canal: 'EMAIL',
        evento: {
          titulo: 'Reunión Hogar',
          participantes: [{ id: 'user-1', email: 'test@ejemplo.com', nombre: 'Test' }],
          creador: null,
        },
      },
    ]);

    const req = new Request('http://localhost:3000/api/cron/recordatorios');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.procesados).toBe(0);
    expect(body.omitidos).toBe(1);
    expect(prisma.recordatorios_evento.update).not.toHaveBeenCalled();
  });

  it('debe procesar y marcar enviado: true cuando RESEND_API_KEY está configurado y el envío es exitoso', async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';

    (prisma.recordatorios_evento.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'rec-email-valido',
        tipo_canal: 'EMAIL',
        evento: {
          titulo: 'Pagar Servicio de Agua',
          participantes: [{ id: 'user-1', email: 'user@bighouse.com', nombre: 'Carlos' }],
          creador: { id: 'user-2', email: 'admin@bighouse.com', nombre: 'Admin' },
        },
      },
    ]);

    const req = new Request('http://localhost:3000/api/cron/recordatorios');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.procesados).toBe(1);

    // Debe marcar enviado: true tras envío real
    expect(prisma.recordatorios_evento.update).toHaveBeenCalledWith({
      where: { id: 'rec-email-valido' },
      data: { enviado: true },
    });
  });

  it('debe procesar y enviar notificación push cuando VAPID está configurado', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub-key';
    process.env.VAPID_PRIVATE_KEY = 'priv-key';

    (prisma.recordatorios_evento.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'rec-push-valido',
        tipo_canal: 'PUSH',
        evento: {
          titulo: 'Riego Orquídea',
          participantes: [{ id: 'user-1', nombre: 'Carlos' }],
          creador: null,
        },
      },
    ]);

    (prisma.suscripciones_push.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'sub-1',
        endpoint: 'https://push.service/sub-1',
        p256dh: 'p256-key',
        auth: 'auth-secret',
      },
    ]);

    const req = new Request('http://localhost:3000/api/cron/recordatorios');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.procesados).toBe(1);

    expect(webpush.sendNotification).toHaveBeenCalled();
    expect(prisma.recordatorios_evento.update).toHaveBeenCalledWith({
      where: { id: 'rec-push-valido' },
      data: { enviado: true },
    });
  });
});
