import {
  GetServiciosUseCase,
  CreateServicioUseCase,
  UpdateServicioUseCase,
  RegistrarPagoServicioUseCase,
  GetFondoComunMesUseCase,
  RegistrarAporteFondoUseCase,
  DeleteAporteFondoUseCase,
  GetHistorialPagosUseCase,
  IServicioRepository,
  IPagoRepository,
  IAporteFondoRepository,
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
  AporteFondoComun,
  CreateAporteFondoData,
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

  async findServiciosConEstado(
    _periodoMes?: string
  ): Promise<{ servicios: ServicioConEstado[]; resumen: ResumenServicios }> {
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
      responsable_id: s.responsable_id ?? null,
      responsable: s.responsable ?? null,
      diasRestantes: 5,
      enMora: false,
      diasEnMora: 0,
      estadoVencimiento: 'AL_DIA',
      ultimoPago: null,
      pagadoEnMesConsultado: false,
      pagoMesConsultado: null,
      diferenciaPresupuestoMes: null,
    }));

    const resumen: ResumenServicios = {
      totalServicios: list.length,
      totalPresupuestoMensual: list.reduce((acc, curr) => acc + curr.monto, 0),
      totalProximosVencimientos: list.reduce((acc, curr) => acc + curr.monto, 0),
      cuentasVencidas: 0,
      cuentasPorVencer: 0,
      cuentasAlDia: list.length,
      totalRealPagadoMes: 0,
      totalPorPagarMes: list.reduce((acc, curr) => acc + curr.monto, 0),
      diferenciaPresupuestoGlobal: 0,
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
      responsable_id: data.responsable_id ?? null,
      responsable: data.responsable_id ? { id: data.responsable_id, nombre: 'Encargado Test' } : null,
      estado: data.estado ?? 'PENDIENTE',
    };
    this.servicios.set(id, nuevo);
    return nuevo;
  }

  async update(id: string, data: UpdateServicioData): Promise<Servicio> {
    const existing = this.servicios.get(id);
    if (!existing) throw new Error('Servicio no encontrado');
    const nextRespId =
      data.responsable_id !== undefined ? data.responsable_id : existing.responsable_id;
    const updated: Servicio = {
      ...existing,
      nombre_servicio: data.nombre_servicio ?? existing.nombre_servicio,
      monto: data.monto ?? existing.monto,
      fecha_vencimiento: data.fecha_vencimiento ?? existing.fecha_vencimiento,
      periodicidad_meses: data.periodicidad_meses ?? existing.periodicidad_meses,
      dia_vencimiento:
        data.dia_vencimiento !== undefined ? data.dia_vencimiento : existing.dia_vencimiento,
      responsable_id: nextRespId,
      responsable: nextRespId ? { id: nextRespId, nombre: 'Encargado Test' } : null,
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

  async findRecentDuplicate(
    servicioId: string,
    monto: number,
    ventanaSegundos: number
  ): Promise<boolean> {
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
      monto_presupuestado: data.monto_presupuestado ?? null,
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
        monto_presupuestado: p.monto_presupuestado ?? null,
        diferencia_presupuesto:
          p.monto_presupuestado !== null && p.monto_presupuestado !== undefined
            ? p.monto_pagado - p.monto_presupuestado
            : 0,
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

class InMemoryAporteFondoRepository implements IAporteFondoRepository {
  public aportes: AporteFondoComun[] = [];

  async findByMonth(year: number, month: number): Promise<AporteFondoComun[]> {
    const periodoMes = `${year}-${String(month).padStart(2, '0')}`;
    return this.aportes.filter((a) => a.periodo_mes === periodoMes);
  }

  async create(data: CreateAporteFondoData): Promise<AporteFondoComun> {
    const year = data.fecha.getFullYear();
    const month = data.fecha.getMonth() + 1;
    const periodo_mes = `${year}-${String(month).padStart(2, '0')}`;
    const nuevo: AporteFondoComun = {
      id: `ap-${Date.now()}-${Math.random()}`,
      usuario_id: data.usuario_id,
      usuario: { id: data.usuario_id, nombre: `Habitante ${data.usuario_id}` },
      monto: data.monto,
      fecha: data.fecha.toISOString(),
      periodo_mes,
      descripcion: data.descripcion,
      comprobante_url: data.comprobante_url ?? null,
    };
    this.aportes.push(nuevo);
    return nuevo;
  }

  async delete(id: string): Promise<void> {
    this.aportes = this.aportes.filter((a) => a.id !== id);
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
  let aporteRepo: InMemoryAporteFondoRepository;
  let storageService: MockStorageService;
  let uow: DirectUnitOfWork;

  beforeEach(() => {
    servicioRepo = new InMemoryServicioRepository();
    pagoRepo = new InMemoryPagoRepository();
    aporteRepo = new InMemoryAporteFondoRepository();
    storageService = new MockStorageService();
    uow = new DirectUnitOfWork();
  });

  describe('Creación, Asignación de Responsable y Edición de Servicios (Ticket 01)', () => {
    it('debe crear un nuevo servicio recurrente con habitante responsable asignado', async () => {
      const useCase = new CreateServicioUseCase(servicioRepo);
      const res = await useCase.execute({
        nombre_servicio: 'Energía Eléctrica',
        monto: 120000,
        fecha_vencimiento_raw: '2026-11-20',
        periodicidad_meses: 1,
        dia_vencimiento_raw: '20',
        responsable_id: 'hab-maria',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.nombre_servicio).toBe('Energía Eléctrica');
        expect(res.data.monto).toBe(120000);
        expect(res.data.dia_vencimiento).toBe(20);
        expect(res.data.responsable_id).toBe('hab-maria');
      }
    });

    it('debe permitir actualizar el responsable y monto presupuestado de un servicio', async () => {
      const createUC = new CreateServicioUseCase(servicioRepo);
      const updateUC = new UpdateServicioUseCase(servicioRepo);

      const creado = await createUC.execute({
        nombre_servicio: 'Internet',
        monto: 90000,
        fecha_vencimiento_raw: '2026-10-05',
        responsable_id: 'hab-1',
      });
      expect(creado.success).toBe(true);
      if (!creado.success) return;

      const editado = await updateUC.execute({
        id: creado.data.id,
        nombre_servicio: 'Internet Fibra 500M',
        monto: 95000,
        responsable_id: 'hab-2',
      });

      expect(editado.success).toBe(true);
      if (editado.success) {
        expect(editado.data.nombre_servicio).toBe('Internet Fibra 500M');
        expect(editado.data.monto).toBe(95000);
        expect(editado.data.responsable_id).toBe('hab-2');
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

  describe('Liquidación Atómica y Contraste Presupuesto vs Real (Ticket 01 & 03)', () => {
    it('debe registrar un pago con monto real facturado distinto al estimado sin alterar el presupuesto del servicio y calculando la diferencia', async () => {
      const servicio = await servicioRepo.create({
        nombre_servicio: 'Acueducto y Aseo',
        monto: 85000, // Presupuesto estimado
        fecha_vencimiento: new Date('2026-10-08T00:00:00Z'),
        periodicidad_meses: 1,
        dia_vencimiento: 8,
      });

      const useCase = new RegistrarPagoServicioUseCase(
        servicioRepo,
        pagoRepo,
        storageService,
        uow
      );
      const res = await useCase.execute({
        servicio_id: servicio.id,
        monto_pagado: 94000, // Costo real facturado en el recibo
        usuario_id: 'usr-1',
        fecha_pago_raw: '2026-10-08',
        fecha_vencimiento_esperada: new Date('2026-10-08T00:00:00Z').toISOString(),
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.pagoId).toBeTruthy();
        expect(res.data.montoPresupuestado).toBe(85000);
        expect(res.data.diferenciaPresupuesto).toBe(9000); // +$9.000 sobre lo presupuestado
        const nuevoVencimiento = new Date(res.data.proximoVencimiento);
        expect(nuevoVencimiento.getMonth()).toBe(10); // Noviembre
        expect(nuevoVencimiento.getDate()).toBe(8);
      }

      // Verificar que el presupuesto estimado del servicio NO fue sobrescrito
      const servicioDespues = await servicioRepo.findById(servicio.id);
      expect(servicioDespues?.monto).toBe(85000);

      // Verificar que el historial expone monto_presupuestado y diferencia_presupuesto
      const historialUC = new GetHistorialPagosUseCase(pagoRepo);
      const histRes = await historialUC.execute(servicio.id);
      expect(histRes.success).toBe(true);
      if (histRes.success) {
        expect(histRes.data.length).toBe(1);
        expect(histRes.data[0].monto_pagado).toBe(94000);
        expect(histRes.data[0].monto_presupuestado).toBe(85000);
        expect(histRes.data[0].diferencia_presupuesto).toBe(9000);
      }
    });

    it('debe abortar con CONCURRENCY_CYCLE_MISMATCH si el ciclo ya fue pagado por otro habitante', async () => {
      const servicio = await servicioRepo.create({
        nombre_servicio: 'Internet Fibra',
        monto: 85000,
        fecha_vencimiento: new Date('2026-11-15T00:00:00Z'), // Ya en noviembre
        periodicidad_meses: 1,
        dia_vencimiento: 15,
      });

      const useCase = new RegistrarPagoServicioUseCase(
        servicioRepo,
        pagoRepo,
        storageService,
        uow
      );
      const res = await useCase.execute({
        servicio_id: servicio.id,
        monto_pagado: 85000,
        usuario_id: 'usr-1',
        fecha_vencimiento_esperada: new Date('2026-10-15T00:00:00Z').toISOString(),
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('CONCURRENCY_CYCLE_MISMATCH');
      }
    });
  });

  describe('Fondo Común Informativo y Presupuesto Mensual por Aportes (Ticket 02)', () => {
    it('debe registrar aportes mensuales por habitante y calcular el Presupuesto del Mes como la suma de dichos aportes', async () => {
      const registrarAporteUC = new RegistrarAporteFondoUseCase(aporteRepo, storageService);
      const getFondoUC = new GetFondoComunMesUseCase(aporteRepo);

      const ap1 = await registrarAporteUC.execute({
        usuario_id: 'hab-daniel',
        monto: 300000,
        periodo_mes: '2026-10',
        descripcion: 'Aporte quincena Daniel',
      });
      const ap2 = await registrarAporteUC.execute({
        usuario_id: 'hab-maria',
        monto: 350000,
        periodo_mes: '2026-10',
        descripcion: 'Aporte mensual María',
      });
      // Aporte de otro mes que NO debe contaminar Octubre
      await registrarAporteUC.execute({
        usuario_id: 'hab-daniel',
        monto: 300000,
        periodo_mes: '2026-09',
        descripcion: 'Aporte Septiembre',
      });

      expect(ap1.success).toBe(true);
      expect(ap2.success).toBe(true);

      const resumenOct = await getFondoUC.execute('2026-10');
      expect(resumenOct.success).toBe(true);
      if (resumenOct.success) {
        expect(resumenOct.data.periodoMes).toBe('2026-10');
        expect(resumenOct.data.presupuestoMesRecaudado).toBe(650000);
        expect(resumenOct.data.aportes.length).toBe(2);
        expect(resumenOct.data.porHabitante.length).toBe(2);
      }

      // Eliminar un aporte y verificar recálculo
      if (ap1.success) {
        const deleteUC = new DeleteAporteFondoUseCase(aporteRepo);
        const delRes = await deleteUC.execute(ap1.data.id);
        expect(delRes.success).toBe(true);
      }

      const resumenTrasBorrar = await getFondoUC.execute('2026-10');
      if (resumenTrasBorrar.success) {
        expect(resumenTrasBorrar.data.presupuestoMesRecaudado).toBe(350000);
      }
    });
  });
});
