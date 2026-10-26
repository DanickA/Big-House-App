import { getEventosCalendario, getProximosEventosLobby } from '@/actions/eventos';
import { GetEventosCalendarioUseCase, GetProximosEventosLobbyUseCase } from '@/modules/calendario';
import { ok, err, UnexpectedError } from '@/modules/shared';

describe('actions/eventos Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventosCalendario', () => {
    it('retorna lista de eventos cuando el caso de uso es exitoso', async () => {
      const mockEventos = [
        {
          id: 'ev-1',
          titulo: 'Cena familiar',
          fecha_inicio: new Date('2026-11-10T19:00:00Z'),
          fecha_fin: new Date('2026-11-10T21:00:00Z'),
          tipo_plantilla: 'EVENTO' as const,
          origen: 'MANUAL' as const,
        },
      ];

      jest
        .spyOn(GetEventosCalendarioUseCase.prototype, 'execute')
        .mockResolvedValueOnce(ok(mockEventos as any));

      const res = await getEventosCalendario(11, 2026);

      expect(res.success).toBe(true);
      expect(res.data).toEqual(mockEventos);
    });

    it('retorna error y arreglo vacío si el caso de uso falla', async () => {
      jest
        .spyOn(GetEventosCalendarioUseCase.prototype, 'execute')
        .mockResolvedValueOnce(err(new UnexpectedError('Error de conexión a BD')));

      const res = await getEventosCalendario(11, 2026);

      expect(res.success).toBe(false);
      expect(res.data).toEqual([]);
      expect(res.error).toContain('Error de conexión a BD');
    });
  });

  describe('getProximosEventosLobby', () => {
    it('retorna eventos próximos y contador semanal cuando el caso de uso es exitoso', async () => {
      const mockLobbyData = {
        totalEventosSemana: 2,
        proximos: [
          {
            id: 'ev-2',
            titulo: 'Reunión de copropietarios',
            fecha_inicio: new Date('2026-11-12T10:00:00Z'),
            fecha_fin: new Date('2026-11-12T11:00:00Z'),
            tipo_plantilla: 'EVENTO' as const,
            origen: 'MANUAL' as const,
          },
        ],
      };

      jest
        .spyOn(GetProximosEventosLobbyUseCase.prototype, 'execute')
        .mockResolvedValueOnce(ok(mockLobbyData as any));

      const res = await getProximosEventosLobby(4);

      expect(res.success).toBe(true);
      expect(res.totalEventosSemana).toBe(2);
      expect(res.proximos).toHaveLength(1);
    });

    it('retorna fallback seguro (0 eventos y lista vacía) si el caso de uso falla', async () => {
      jest
        .spyOn(GetProximosEventosLobbyUseCase.prototype, 'execute')
        .mockResolvedValueOnce(err(new UnexpectedError('Error al leer eventos')));

      const res = await getProximosEventosLobby(3);

      expect(res.success).toBe(false);
      expect(res.totalEventosSemana).toBe(0);
      expect(res.proximos).toEqual([]);
    });
  });
});
