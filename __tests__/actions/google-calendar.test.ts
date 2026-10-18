import { sincronizarEventosGoogle, pushEventoAGoogleCalendar } from '@/actions/google-calendar';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    conexiones_google: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventos: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-guard', () => ({
  resolveSessionUser: jest.fn().mockResolvedValue({
    ok: true,
    user: { userId: 'user-123', nombre: 'Test User', email: 'test@example.com' },
  }),
}));

jest.mock('@/lib/google-auth', () => ({
  getOAuth2Client: jest.fn().mockReturnValue({
    setCredentials: jest.fn(),
    on: jest.fn(),
  }),
  GOOGLE_CALENDAR_SCOPES: ['https://www.googleapis.com/auth/calendar.events'],
}));

jest.mock('googleapis', () => {
  const mockInsert = jest.fn();
  const mockList = jest.fn();
  const mockPatch = jest.fn();
  const mockDelete = jest.fn();

  return {
    google: {
      calendar: jest.fn(() => ({
        events: {
          insert: mockInsert,
          list: mockList,
          patch: mockPatch,
          delete: mockDelete,
        },
      })),
    },
  };
});

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Google Calendar Bidirectional Synchronization', () => {
  const calendarMock = google.calendar({ version: 'v3' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exporta eventos locales pendientes sin google_event_id e importa eventos de Google', async () => {
    (prisma.conexiones_google.findUnique as jest.Mock).mockResolvedValue({
      usuario_id: 'user-123',
      access_token: 'valid-token',
      refresh_token: 'refresh-token',
      calendar_id: 'primary',
      ultima_sync: null,
    });

    // Evento local pendiente
    (prisma.eventos.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'local-event-1',
        titulo: 'Reunión Familiar',
        fecha_inicio: new Date('2026-10-25T10:00:00Z'),
        fecha_fin: new Date('2026-10-25T11:00:00Z'),
        todo_el_dia: false,
        google_event_id: null,
      },
    ]);

    (prisma.eventos.findUnique as jest.Mock).mockResolvedValue({
      id: 'local-event-1',
      titulo: 'Reunión Familiar',
      fecha_inicio: new Date('2026-10-25T10:00:00Z'),
      fecha_fin: new Date('2026-10-25T11:00:00Z'),
      todo_el_dia: false,
      google_event_id: null,
    });

    (calendarMock.events.insert as jest.Mock).mockResolvedValue({
      data: { id: 'new-google-id-123' },
    });

    // Eventos devueltos por Google Calendar
    (calendarMock.events.list as jest.Mock).mockResolvedValue({
      data: {
        items: [
          {
            id: 'google-item-1',
            summary: 'Cumpleaños Amigo',
            start: { dateTime: '2026-10-26T15:00:00Z' },
            end: { dateTime: '2026-10-26T16:00:00Z' },
          },
        ],
      },
    });

    (prisma.eventos.upsert as jest.Mock).mockResolvedValue({});
    (prisma.conexiones_google.update as jest.Mock).mockResolvedValue({});

    const res = await sincronizarEventosGoogle('user-123');

    expect(res.success).toBe(true);
    expect(res.exportados).toBe(1);
    expect(res.importados).toBe(1);
    expect(res.count).toBe(2);

    // Verificar que se insertó el evento en Google Calendar
    expect(calendarMock.events.insert).toHaveBeenCalledTimes(1);
    // Verificar que se actualizó el ID de Google en el evento local
    expect(prisma.eventos.update).toHaveBeenCalledWith({
      where: { id: 'local-event-1' },
      data: { google_event_id: 'new-google-id-123' },
    });
  });

  it('no re-exporta eventos que ya tienen google_event_id', async () => {
    (prisma.conexiones_google.findUnique as jest.Mock).mockResolvedValue({
      usuario_id: 'user-123',
      access_token: 'valid-token',
      calendar_id: 'primary',
    });

    // Ningún evento pendiente
    (prisma.eventos.findMany as jest.Mock).mockResolvedValue([]);

    (calendarMock.events.list as jest.Mock).mockResolvedValue({
      data: { items: [] },
    });

    const res = await sincronizarEventosGoogle('user-123');

    expect(res.success).toBe(true);
    expect(res.exportados).toBe(0);
    expect(res.importados).toBe(0);
    expect(calendarMock.events.insert).not.toHaveBeenCalled();
  });
});
