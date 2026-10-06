import { registrarCuidado, deshacerCuidado, getResumenPlantasLobby } from '@/actions/plantas';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    plantas: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tareas_cuidado: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    historial_cuidado: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Plantas Actions - Cuidados y Lobby (GUI-02, GUI-07, GUI-08)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getResumenPlantasLobby', () => {
    it('debe clasificar correctamente plantas urgentes que requieren riego inmediato', async () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const proximaAyer = new Date(hoy);
      proximaAyer.setDate(proximaAyer.getDate() - 1);

      const proximaSemana = new Date(hoy);
      proximaSemana.setDate(proximaSemana.getDate() + 5);

      (prisma.plantas.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'p-1',
          nombre_comun: 'Monstera Urgente',
          tareas_cuidado: [{ tipo_tarea: 'RIEGO', frecuencia_dias: 7, proxima_fecha: proximaAyer }],
        },
        {
          id: 'p-2',
          nombre_comun: 'Suculenta al Día',
          tareas_cuidado: [{ tipo_tarea: 'RIEGO', frecuencia_dias: 15, proxima_fecha: proximaSemana }],
        },
      ]);

      const res = await getResumenPlantasLobby();
      expect(res.success).toBe(true);
      expect(res.totalPlantas).toBe(2);
      expect(res.pendientesCount).toBe(1);

      const urgente = res.plantas.find((p) => p.id === 'p-1');
      expect(urgente?.requiereRiego).toBe(true);
      expect(urgente?.diasRestantes).toBeLessThanOrEqual(0);

      const alDia = res.plantas.find((p) => p.id === 'p-2');
      expect(alDia?.requiereRiego).toBe(false);
      expect(alDia?.diasRestantes).toBeGreaterThan(0);
    });
  });

  describe('registrarCuidado (1 toque / quick-water)', () => {
    it('debe registrar el cuidado y recalcular proxima_fecha para RIEGO', async () => {
      (prisma.tareas_cuidado.findFirst as jest.Mock).mockResolvedValue({
        id: 'tc-1',
        planta_id: 'p-1',
        tipo_tarea: 'RIEGO',
        frecuencia_dias: 7,
      });

      (prisma.historial_cuidado.create as jest.Mock).mockResolvedValue({
        id: 'h-100',
        tarea_id: 'tc-1',
        usuario_id: 'uuid-1',
        fecha_realizada: new Date(),
      });

      (prisma.tareas_cuidado.update as jest.Mock).mockResolvedValue({
        id: 'tc-1',
        frecuencia_dias: 7,
      });

      const res = await registrarCuidado('p-1', 'RIEGO');
      expect(res.success).toBe(true);
      expect(res.meta?.historialId).toBe('h-100');

      expect(prisma.historial_cuidado.create).toHaveBeenCalled();
      expect(prisma.tareas_cuidado.update).toHaveBeenCalled();
    });
  });

  describe('deshacerCuidado', () => {
    it('debe revertir un registro de cuidado existente', async () => {
      (prisma.historial_cuidado.findUnique as jest.Mock).mockResolvedValue({
        id: 'h-100',
        tarea_id: 'tc-1',
        tareas_cuidado: {
          id: 'tc-1',
          planta_id: 'p-1',
          tipo_tarea: 'RIEGO',
          frecuencia_dias: 7,
        },
      });

      (prisma.historial_cuidado.delete as jest.Mock).mockResolvedValue({ id: 'h-100' });
      (prisma.historial_cuidado.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.tareas_cuidado.update as jest.Mock).mockResolvedValue({ id: 'tc-1' });

      const res = await deshacerCuidado('h-100');
      expect(res.success).toBe(true);
      expect(prisma.historial_cuidado.delete).toHaveBeenCalledWith({ where: { id: 'h-100' } });
    });
  });
});
