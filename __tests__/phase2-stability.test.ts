import {
  isValidId,
  isValidUuid,
  assertValidId,
  roundMoney,
  parseLocalDate,
  projectAnnualDate,
  projectMonthlyDate,
  toCalendarYMD,
} from '@/modules/shared';
import { PrismaDbClient } from '@/lib/prisma';
import { PrismaServicioRepository } from '@/modules/finanzas/infrastructure/prisma-servicio.repository';
import { PrismaEventoRepository } from '@/modules/calendario/infrastructure/prisma-evento.repository';
import { DeleteServicioUseCase } from '@/modules/finanzas/application/use-cases/delete-servicio.use-case';
import { UpdateServicioUseCase } from '@/modules/finanzas/application/use-cases/update-servicio.use-case';

describe('Phase 2 - Estabilidad Funcional (F-02, F-06, F-08, F-21, F-22, Soft Delete)', () => {
  describe('Validación de Identificadores (F-08)', () => {
    it('acepta UUIDs válidos e identificadores alfanuméricos limpios', () => {
      expect(isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidId('serv-1')).toBe(true);
      expect(assertValidId('  u-100  ')).toBe('u-100');
    });

    it('rechaza cadenas vacías, espacios o inyección SQL/rutas maliciosas', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('   ')).toBe(false);
      expect(isValidId("1' OR '1'='1")).toBe(false);
      expect(isValidId('../../etc/passwd')).toBe(false);
      expect(() => assertValidId('')).toThrow();
    });

    it('bloquea IDs malformados en casos de uso antes de tocar Prisma', async () => {
      const mockRepo: any = { delete: jest.fn(), update: jest.fn() };
      const deleteUC = new DeleteServicioUseCase(mockRepo);
      const res = await deleteUC.execute("'; DROP TABLE servicios; --");

      expect(res.success).toBe(false);
      expect(mockRepo.delete).not.toHaveBeenCalled();

      const updateUC = new UpdateServicioUseCase(mockRepo);
      const resUpd = await updateUC.execute({
        id: '   ',
        nombre_servicio: 'Agua',
        monto: 50000,
      });
      expect(resUpd.success).toBe(false);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('Precisión Monetaria y Fechas Locales (F-06, F-21, F-22)', () => {
    it('redondea operaciones de punto flotante IEEE 754 a 2 decimales exactos', () => {
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(roundMoney(100.555)).toBe(100.56);
      expect(roundMoney(19999.999)).toBe(20000);
    });

    it('parsea YYYY-MM-DD en medianoche local sin desfase UTC', () => {
      const fecha = parseLocalDate('2026-10-01');
      expect(fecha.getFullYear()).toBe(2026);
      expect(fecha.getMonth()).toBe(9); // Octubre (0-indexed)
      expect(fecha.getDate()).toBe(1);
      expect(fecha.getHours()).toBe(0);
    });

    it('proyecta recurrencias anuales en años bisiestos (29 Feb -> 28 Feb) sin saltar a Marzo', () => {
      const bisiesto = new Date(2024, 1, 29, 10, 30, 0); // 29 Feb 2024
      const proyectadaNoBisiesto = projectAnnualDate(bisiesto, 2026);
      expect(proyectadaNoBisiesto.getFullYear()).toBe(2026);
      expect(proyectadaNoBisiesto.getMonth()).toBe(1); // Febrero
      expect(proyectadaNoBisiesto.getDate()).toBe(28);

      const proyectadaBisiesto = projectAnnualDate(bisiesto, 2028);
      expect(proyectadaBisiesto.getFullYear()).toBe(2028);
      expect(proyectadaBisiesto.getMonth()).toBe(1);
      expect(proyectadaBisiesto.getDate()).toBe(29);
    });

    it('normaliza fechas calendario (toCalendarYMD) y proyecta recurrencias mensuales/semanales (F-01, F-04)', async () => {
      expect(toCalendarYMD('2026-10-15')).toBe('2026-10-15');
      expect(toCalendarYMD(new Date(2026, 9, 15, 22, 0, 0))).toBe('2026-10-15');

      const finEnero = new Date(2026, 0, 31, 9, 0, 0);
      const proyectadoFeb = projectMonthlyDate(finEnero, 2026, 1);
      expect(proyectadoFeb.getMonth()).toBe(1);
      expect(proyectadoFeb.getDate()).toBe(28);

      const mockEventoDb = {
        eventos: {
          findMany: jest
            .fn()
            .mockResolvedValueOnce([]) // eventosManuales en rango
            .mockResolvedValueOnce([
              {
                id: 'ev-mensual',
                titulo: 'Reunión Mensual',
                descripcion: null,
                tipo_plantilla: 'EVENTO',
                estado: 'ACTIVO',
                fecha_inicio: new Date(2026, 0, 15, 10, 0, 0),
                fecha_fin: new Date(2026, 0, 15, 11, 0, 0),
                todo_el_dia: false,
                color: '#3e6190',
                ubicacion: null,
                recurrencia: 'MENSUAL',
                google_event_id: null,
                creador: { nombre: 'Admin' },
                participantes: [],
                detalles: null,
                subtareas: [],
              },
              {
                id: 'ev-semanal',
                titulo: 'Sacar Basura',
                descripcion: null,
                tipo_plantilla: 'TAREA',
                estado: 'ACTIVO',
                fecha_inicio: new Date(2026, 8, 1, 8, 0, 0),
                fecha_fin: new Date(2026, 8, 1, 9, 0, 0),
                todo_el_dia: false,
                color: '#54749d',
                ubicacion: null,
                recurrencia: 'SEMANAL',
                google_event_id: null,
                creador: { nombre: 'Admin' },
                participantes: [],
                detalles: null,
                subtareas: [],
              },
            ]),
        },
        tareas_cuidado: { findMany: jest.fn().mockResolvedValue([]) },
        servicios: { findMany: jest.fn().mockResolvedValue([]) },
      } as unknown as PrismaDbClient;

      const eventoRepo = new PrismaEventoRepository(mockEventoDb);
      const unificados = await eventoRepo.findEventosUnificados(10, 2026);

      expect(unificados.some((e) => e.titulo === 'Reunión Mensual')).toBe(true);
      expect(unificados.filter((e) => e.titulo === 'Sacar Basura').length).toBeGreaterThanOrEqual(
        4
      );
    });
  });

  describe('Baja Lógica Contable en Servicios (Preservación de Historial)', () => {
    it('aplica baja lógica (activo: false) si el servicio ya tiene pagos históricos', async () => {
      const mockDb = {
        pagos_servicios: {
          count: jest.fn().mockResolvedValue(3),
        },
        servicios: {
          update: jest.fn().mockResolvedValue({ id: 'serv-con-pagos', activo: false }),
          delete: jest.fn(),
        },
      } as unknown as PrismaDbClient;

      const repo = new PrismaServicioRepository(mockDb);
      await repo.delete('serv-con-pagos');

      expect((mockDb as any).pagos_servicios.count).toHaveBeenCalledWith({
        where: { servicio_id: 'serv-con-pagos' },
      });
      expect((mockDb as any).servicios.update).toHaveBeenCalledWith({
        where: { id: 'serv-con-pagos' },
        data: { activo: false, estado: 'INACTIVO' },
      });
      expect((mockDb as any).servicios.delete).not.toHaveBeenCalled();
    });

    it('elimina físicamente el servicio solo si no tiene historial contable (0 pagos)', async () => {
      const mockDb = {
        pagos_servicios: {
          count: jest.fn().mockResolvedValue(0),
        },
        servicios: {
          update: jest.fn(),
          delete: jest.fn().mockResolvedValue({ id: 'serv-sin-pagos' }),
        },
      } as unknown as PrismaDbClient;

      const repo = new PrismaServicioRepository(mockDb);
      await repo.delete('serv-sin-pagos');

      expect((mockDb as any).servicios.delete).toHaveBeenCalledWith({
        where: { id: 'serv-sin-pagos' },
      });
      expect((mockDb as any).servicios.update).not.toHaveBeenCalled();
    });
  });
});
