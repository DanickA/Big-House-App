import {
  calcularProximaFechaVencimiento,
  registrarPagoServicio,
} from '@/actions/pagos';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    pagos_servicios: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    servicios: {
      update: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Pagos Actions - Finanzas y Concurrencia (GUI-04, GUI-05, GUI-06)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calcularProximaFechaVencimiento', () => {
    it('debe avanzar el ciclo de facturación según la periodicidad en meses', async () => {
      const fechaPago = new Date('2026-05-15T00:00:00');
      const proxima = await calcularProximaFechaVencimiento(fechaPago, 1, 15);
      expect(proxima.getMonth()).toBe(5); // Junio (0-indexed: 5)
      expect(proxima.getDate()).toBe(15);
    });

    it('debe manejar periodicidad bimestral (2 meses)', async () => {
      const fechaPago = new Date('2026-01-10T00:00:00');
      const proxima = await calcularProximaFechaVencimiento(fechaPago, 2, 10);
      expect(proxima.getMonth()).toBe(2); // Marzo (0-indexed: 2)
      expect(proxima.getDate()).toBe(10);
    });
  });

  describe('registrarPagoServicio', () => {
    it('debe detectar ciclo desactualizado ante concurrencia (CONCURRENCY_CYCLE_MISMATCH)', async () => {
      const formData = new FormData();
      formData.set('servicio_id', 's-1');
      formData.set('monto_pagado', '50000');
      formData.set('fecha_pago', '2026-10-06');
      formData.set('fecha_vencimiento_esperada', new Date('2026-10-01T00:00:00Z').toISOString());

      // tx callback mock
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: 's-1',
              nombre_servicio: 'Internet',
              fecha_vencimiento: new Date('2026-11-01T00:00:00Z'), // Ya fue pagado por otro habitante
              periodicidad_meses: 1,
              dia_vencimiento: 1,
              estado: 'PAGADO',
            },
          ]),
          pagos_servicios: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
          servicios: {
            update: jest.fn(),
          },
        };
        return callback(tx);
      });

      const res = await registrarPagoServicio(formData);
      expect(res.success).toBe(false);
      expect(res.code).toBe('CONCURRENCY_CYCLE_MISMATCH');
      expect(res.error).toContain('ya fue pagada o actualizada por otro habitante');
    });

    it('debe bloquear pagos duplicados por idempotencia (IDEMPOTENCY_DUPLICATE)', async () => {
      const formData = new FormData();
      formData.set('servicio_id', 's-1');
      formData.set('monto_pagado', '50000');
      formData.set('fecha_pago', '2026-10-06');
      formData.set('fecha_vencimiento_esperada', new Date('2026-10-06T00:00:00Z').toISOString());

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: 's-1',
              nombre_servicio: 'Internet',
              fecha_vencimiento: new Date('2026-10-06T00:00:00Z'),
              periodicidad_meses: 1,
              dia_vencimiento: 6,
              estado: 'PENDIENTE',
            },
          ]),
          pagos_servicios: {
            findFirst: jest.fn().mockResolvedValue({ id: 'pago-previo-idempotente' }), // Ya existe pago reciente
            create: jest.fn(),
          },
          servicios: {
            update: jest.fn(),
          },
        };
        return callback(tx);
      });

      const res = await registrarPagoServicio(formData);
      expect(res.success).toBe(false);
      expect(res.code).toBe('IDEMPOTENCY_DUPLICATE');
    });

    it('debe registrar el pago y avanzar la fecha de vencimiento exitosamente', async () => {
      const formData = new FormData();
      formData.set('servicio_id', 's-1');
      formData.set('monto_pagado', '50000');
      formData.set('fecha_pago', '2026-10-06');
      formData.set('fecha_vencimiento_esperada', new Date('2026-10-06T00:00:00Z').toISOString());

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: 's-1',
              nombre_servicio: 'Internet',
              fecha_vencimiento: new Date('2026-10-06T00:00:00Z'),
              periodicidad_meses: 1,
              dia_vencimiento: 6,
              estado: 'PENDIENTE',
            },
          ]),
          pagos_servicios: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'pago-nuevo' }),
          },
          gastos: {
            create: jest.fn().mockResolvedValue({ id: 'gasto-nuevo' }),
          },
          servicios: {
            update: jest.fn().mockResolvedValue({
              id: 's-1',
              fecha_vencimiento: new Date('2026-11-06T00:00:00Z'),
            }),
          },
        };
        return callback(tx);
      });

      const res = await registrarPagoServicio(formData);
      expect(res.success).toBe(true);
      expect(res.data?.pagoId).toBe('pago-nuevo');
    });
  });
});
