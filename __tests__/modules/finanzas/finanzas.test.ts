import {
  GetServiciosUseCase,
  CreateServicioUseCase,
  RegistrarPagoServicioUseCase,
  IServicioRepository,
  IPagoRepository,
  IFileStorageService,
  Servicio,
  ServicioConEstado,
  ResumenServicios,
  CreateServicioData,
  UpdateServicioData,
  PagoServicio,
  PagoHistorialItem,
  CreatePagoData,
  CreateGastoData,
} from '@/modules/finanzas';
import { IUnitOfWork } from '@/modules/shared';

class InMemoryServicioRepository implements IServicioRepository {
  public servicios: Map<string, Servicio> = new Map();

  async findById(id: string): Promise<Servicio | null> {
    return this.servicios.get(id) || null;
  }

  async findAndLockById(id: string): Promise<Servicio | null> {
    return this.findById(id);
  }

  async findServiciosConEstado(): Promise<{ servicios: ServicioConEstado[]; resumen: ResumenServicios }> {
    const list: ServicioConEstado[] = Array.from(this.servicios.values()).map((s) => ({
      id: s.id,
      nombre_servicio: s.nombre_servicio,
      numero_cuenta: s.numero_cuenta,
      numero_factura: s.numero_factura,
      monto: s.monto,
      fecha_vencimiento: s.fecha_vencimiento.toISOString(),
      estado: s.estado,
      periodicidad_meses: s.periodicidad_meses,
      dia_vencimiento: s.dia_vencimiento,
      diasRestantes: 5,
      estadoVencimiento: 'AL_DIA',
      ultimoPago: null,
    }));

    const resumen: ResumenServicios = {
      totalServicios: list.length,
      totalPresupuestoMensual: list.reduce((acc, curr) => acc + curr.monto, 0),
      totalProximosVencimientos: list.reduce((acc, curr) => acc + curr.monto, 0),
      cuentasVencidas: 0,
      cuentasPorVencer: 0,
      cuentasAlDia: list.length,
    };

    return { servicios: list, resumen };
  }

  async create(data: CreateServicioData): Promise<Servicio> {
    const id = `serv-${Date.now()}-${Math.random()}`;
    const nuevo: Servicio = {
      id,
      nombre_servicio: data.nombre_servicio,
      monto: data.monto,
      fecha_vencimiento: data.fecha_vencimiento,
      periodicidad_meses: data.periodicidad_meses ?? 1,
      dia_vencimiento: data.dia_vencimiento ?? null,
      numero_cuenta: data.numero_cuenta ?? null,
      numero_factura: data.numero_factura ?? null,
      estado: data.estado ?? 'PENDIENTE',
    };
    this.servicios.set(id, nuevo);
    return nuevo;
  }

  async update(id: string, data: UpdateServicioData): Promise<Servicio> {
    const existing = this.servicios.get(id);
    if (!existing) throw new Error('Servicio no encontrado');
    const updated: Servicio = {
      ...existing,
      nombre_servicio: data.nombre_servicio ?? existing.nombre_servicio,
      monto: data.monto ?? existing.monto,
      fecha_vencimiento: data.fecha_vencimiento ?? existing.fecha_vencimiento,
      periodicidad_meses: data.periodicidad_meses ?? existing.periodicidad_meses,
      dia_vencimiento: data.dia_vencimiento !== undefined ? data.dia_vencimiento : existing.dia_vencimiento,
      estado: data.estado ?? existing.estado,
    };
    this.servicios.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.servicios.delete(id);
  }
}

class InMemoryPagoRepository implements IPagoRepository {
  public pagos: PagoServicio[] = [];
  public gastos: CreateGastoData[] = [];

  async findRecentDuplicate(servicioId: string, monto: number, ventanaSegundos: number): Promise<boolean> {
    const ahora = Date.now();
    return this.pagos.some(
      (p) =>
        p.servicio_id === servicioId &&
        p.monto_pagado === monto &&
        p.fecha_pago &&
        ahora - p.fecha_pago.getTime() < ventanaSegundos * 1000
    );
  }

  async createPago(data: CreatePagoData): Promise<PagoServicio> {
    const nuevo: PagoServicio = {
      id: `pago-${Date.now()}-${Math.random()}`,
      servicio_id: data.servicio_id,
      usuario_id: data.usuario_id,
      monto_pagado: data.monto_pagado,
      fecha_pago: data.fecha_pago,
      comprobante_url: data.comprobante_url ?? null,
      observaciones: data.observaciones ?? null,
    };
    this.pagos.push(nuevo);
    return nuevo;
  }

  async createGasto(data: CreateGastoData): Promise<void> {
    this.gastos.push(data);
  }

  async findHistorialByServicio(servicioId: string): Promise<PagoHistorialItem[]> {
    return this.pagos
      .filter((p) => p.servicio_id === servicioId)
      .map((p) => ({
        id: p.id,
        monto_pagado: p.monto_pagado,
        fecha_pago: (p.fecha_pago || new Date()).toISOString(),
        comprobante_url: p.comprobante_url,
        observaciones: p.observaciones,
        usuario: {
          nombre: 'Habitante Test',
          email: 'test@hogar.com',
        },
      }));
  }
}

class MockStorageService implements IFileStorageService {
  async uploadComprobante(_file: File): Promise<string> {
    return 'https://cloudinary.com/test-receipt.jpg';
  }
}

class DirectUnitOfWork implements IUnitOfWork {
  async run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

describe('Finanzas Module - Clean Architecture Use Cases', () => {
  let servicioRepo: InMemoryServicioRepository;
  let pagoRepo: InMemoryPagoRepository;
  let storageService: MockStorageService;
  let uow: DirectUnitOfWork;

  beforeEach(() => {
    servicioRepo = new InMemoryServicioRepository();
    pagoRepo = new InMemoryPagoRepository();
    storageService = new MockStorageService();
    uow = new DirectUnitOfWork();
  });

  describe('Creación y Consulta de Servicios', () => {
    it('debe crear un nuevo servicio recurrente con éxito', async () => {
      const useCase = new CreateServicioUseCase(servicioRepo);
      const res = await useCase.execute({
        nombre_servicio: 'Energía Eléctrica',
        monto: 120000,
        fecha_vencimiento_raw: '2026-11-20',
        periodicidad_meses: 1,
        dia_vencimiento_raw: '20',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.nombre_servicio).toBe('Energía Eléctrica');
        expect(res.data.monto).toBe(120000);
        expect(res.data.dia_vencimiento).toBe(20);
      }
    });

    it('debe rechazar un monto negativo o cero', async () => {
      const useCase = new CreateServicioUseCase(servicioRepo);
      const res = await useCase.execute({
        nombre_servicio: 'Gas',
        monto: -50,
        fecha_vencimiento_raw: '2026-11-20',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Liquidación Atómica de Pagos (Pessimistic Locking & Anti-Double-Pay)', () => {
    it('debe registrar el pago, registrar el gasto y avanzar la fecha de vencimiento', async () => {
      const servicio = await servicioRepo.create({
        nombre_servicio: 'Internet Fibra',
        monto: 85000,
        fecha_vencimiento: new Date('2026-10-15T00:00:00Z'),
        periodicidad_meses: 1,
        dia_vencimiento: 15,
      });

      const useCase = new RegistrarPagoServicioUseCase(servicioRepo, pagoRepo, storageService, uow);
      const res = await useCase.execute({
        servicio_id: servicio.id,
        monto_pagado: 85000,
        usuario_id: 'usr-1',
        fecha_pago_raw: '2026-10-15',
        fecha_vencimiento_esperada: new Date('2026-10-15T00:00:00Z').toISOString(),
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.pagoId).toBeTruthy();
        const nuevoVencimiento = new Date(res.data.proximoVencimiento);
        expect(nuevoVencimiento.getMonth()).toBe(10); // Noviembre
        expect(nuevoVencimiento.getDate()).toBe(15);
      }

      expect(pagoRepo.pagos.length).toBe(1);
      expect(pagoRepo.gastos.length).toBe(1);
      expect(pagoRepo.gastos[0].categoria).toBe('SERVICIOS');
    });

    it('debe abortar con CONCURRENCY_CYCLE_MISMATCH si el ciclo ya fue pagado por otro habitante', async () => {
      const servicio = await servicioRepo.create({
        nombre_servicio: 'Internet Fibra',
        monto: 85000,
        fecha_vencimiento: new Date('2026-11-15T00:00:00Z'), // Ya en noviembre
        periodicidad_meses: 1,
        dia_vencimiento: 15,
      });

      const useCase = new RegistrarPagoServicioUseCase(servicioRepo, pagoRepo, storageService, uow);
      const res = await useCase.execute({
        servicio_id: servicio.id,
        monto_pagado: 85000,
        usuario_id: 'usr-1',
        fecha_vencimiento_esperada: new Date('2026-10-15T00:00:00Z').toISOString(), // Cliente pensaba que era octubre
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONCURRENCY_CYCLE_MISMATCH');
      }
    });
  });
});
