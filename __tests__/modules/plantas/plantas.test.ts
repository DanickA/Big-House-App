import {
  GetResumenPlantasLobbyUseCase,
  CreatePlantaUseCase,
  UpdatePlantaUseCase,
  RegistrarCuidadoUseCase,
  DeshacerCuidadoUseCase,
  IPlantaRepository,
  ICuidadoRepository,
  IImageStorageService,
  Planta,
  PlantaConEstado,
  CreatePlantaData,
  UpdatePlantaData,
  TareaCuidado,
  HistorialCuidado,
} from '@/modules/plantas';

class InMemoryPlantaRepository implements IPlantaRepository {
  public plantas: Map<string, PlantaConEstado> = new Map();

  async findById(id: string): Promise<Planta | null> {
    return this.plantas.get(id) || null;
  }

  async findAllWithStatus(): Promise<PlantaConEstado[]> {
    return Array.from(this.plantas.values());
  }

  async create(data: CreatePlantaData): Promise<Planta> {
    const id = `planta-${Date.now()}-${Math.random()}`;
    const p: PlantaConEstado = {
      id,
      nombre_comun: data.nombre_comun,
      ubicacion: data.ubicacion,
      especie: data.especie ?? null,
      foto_url: data.foto_url ?? null,
      nivel_luz: data.nivel_luz ?? 'INDIRECTA',
      nivel_agua: data.nivel_agua ?? 'MODERADA',
      estado_salud: data.estado_salud ?? 'SANA',
      notas_cuidado: data.notas_cuidado ?? null,
      diasRestantes: data.frecuencia_dias,
      frecuencia_dias: data.frecuencia_dias,
      requiereRiego: false,
    };
    this.plantas.set(id, p);
    return p;
  }

  async update(id: string, data: UpdatePlantaData): Promise<Planta> {
    const existing = this.plantas.get(id);
    if (!existing) throw new Error('Planta no encontrada');
    const updated: PlantaConEstado = {
      ...existing,
      nombre_comun: data.nombre_comun ?? existing.nombre_comun,
      ubicacion: data.ubicacion ?? existing.ubicacion,
      especie: data.especie !== undefined ? data.especie : existing.especie,
      foto_url: data.foto_url !== undefined ? data.foto_url : existing.foto_url,
      nivel_luz: data.nivel_luz !== undefined ? data.nivel_luz : existing.nivel_luz,
      nivel_agua: data.nivel_agua !== undefined ? data.nivel_agua : existing.nivel_agua,
      estado_salud: data.estado_salud !== undefined ? data.estado_salud : existing.estado_salud,
      notas_cuidado: data.notas_cuidado !== undefined ? data.notas_cuidado : existing.notas_cuidado,
    };
    this.plantas.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.plantas.delete(id);
  }
}

class InMemoryCuidadoRepository implements ICuidadoRepository {
  public tareas: Map<string, TareaCuidado> = new Map();
  public historiales: HistorialCuidado[] = [];

  async findTarea(plantaId: string, tipoTarea: string): Promise<TareaCuidado | null> {
    for (const t of this.tareas.values()) {
      if (t.planta_id === plantaId && t.tipo_tarea === tipoTarea) return t;
    }
    return null;
  }

  async createTarea(
    plantaId: string,
    tipoTarea: string,
    frecuenciaDias: number,
    proximaFecha: Date
  ): Promise<TareaCuidado> {
    const id = `tarea-${Date.now()}-${Math.random()}`;
    const t: TareaCuidado = {
      id,
      planta_id: plantaId,
      tipo_tarea: tipoTarea,
      frecuencia_dias: frecuenciaDias,
      proxima_fecha: proximaFecha,
    };
    this.tareas.set(id, t);
    return t;
  }

  async updateTareaProximaFecha(tareaId: string, nuevaFecha: Date, frecuenciaDias?: number): Promise<void> {
    const existing = this.tareas.get(tareaId);
    if (existing) {
      existing.proxima_fecha = nuevaFecha;
      if (frecuenciaDias !== undefined) existing.frecuencia_dias = frecuenciaDias;
    }
  }

  async createHistorial(tareaId: string, usuarioId: string, observaciones?: string | null): Promise<HistorialCuidado> {
    const id = `hist-${Date.now()}-${Math.random()}`;
    const h: HistorialCuidado = {
      id,
      tarea_id: tareaId,
      usuario_id: usuarioId,
      fecha_realizada: new Date(),
      observaciones: observaciones || null,
    };
    this.historiales.push(h);
    return h;
  }

  async findHistorialByPlanta(plantaId: string): Promise<HistorialCuidado[]> {
    return this.historiales.filter((h) => {
      const tarea = this.tareas.get(h.tarea_id);
      return tarea && tarea.planta_id === plantaId;
    });
  }

  async findHistorialById(historialId: string): Promise<HistorialCuidado | null> {
    const h = this.historiales.find((item) => item.id === historialId);
    if (!h) return null;
    const tarea = this.tareas.get(h.tarea_id);
    return {
      ...h,
      tareas_cuidado: tarea ? { tipo_tarea: tarea.tipo_tarea, frecuencia_dias: tarea.frecuencia_dias, planta_id: tarea.planta_id } : null,
    };
  }

  async findUltimoCuidadoAnterior(tareaId: string, excludeHistorialId: string): Promise<HistorialCuidado | null> {
    const filtered = this.historiales.filter((h) => h.tarea_id === tareaId && h.id !== excludeHistorialId);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }

  async deshacerCuidado(historialId: string, tareaId: string, nuevaProximaFecha: Date): Promise<void> {
    const index = this.historiales.findIndex((h) => h.id === historialId);
    if (index !== -1) {
      this.historiales.splice(index, 1);
    }
    const tarea = this.tareas.get(tareaId);
    if (tarea) {
      tarea.proxima_fecha = nuevaProximaFecha;
    }
  }
}

class MockImageStorageService implements IImageStorageService {
  async uploadImage(_file: File): Promise<string> {
    return 'https://cloudinary.com/test-plant.jpg';
  }
}

describe('Plantas Module - Clean Architecture Use Cases', () => {
  let plantaRepo: InMemoryPlantaRepository;
  let cuidadoRepo: InMemoryCuidadoRepository;
  let imageStorage: MockImageStorageService;

  beforeEach(() => {
    plantaRepo = new InMemoryPlantaRepository();
    cuidadoRepo = new InMemoryCuidadoRepository();
    imageStorage = new MockImageStorageService();
  });

  describe('Guía de Cuidado (Creación y Actualización)', () => {
    it('debe crear una planta con sus atributos de Guía de Cuidado (luz, agua, salud, notas)', async () => {
      const createUC = new CreatePlantaUseCase(plantaRepo, imageStorage);
      const res = await createUC.execute({
        nombre_comun: 'Calathea Orbifolia',
        ubicacion: 'Estudio',
        especie: 'Calathea orbifolia',
        frecuencia_riego: 4,
        nivel_luz: 'SOMBRA',
        nivel_agua: 'ABUNDANTE',
        estado_salud: 'EN_OBSERVACION',
        notas_cuidado: 'Usar agua filtrada para evitar bordes marrones',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.nivel_luz).toBe('SOMBRA');
        expect(res.data.nivel_agua).toBe('ABUNDANTE');
        expect(res.data.estado_salud).toBe('EN_OBSERVACION');
        expect(res.data.notas_cuidado).toBe('Usar agua filtrada para evitar bordes marrones');
      }
    });

    it('debe actualizar los atributos de la Guía de Cuidado de una planta existente', async () => {
      const createUC = new CreatePlantaUseCase(plantaRepo, imageStorage);
      const created = await createUC.execute({
        nombre_comun: 'Potus',
        ubicacion: 'Cocina',
        frecuencia_riego: 7,
      });
      expect(created.success).toBe(true);
      if (!created.success) return;

      const updateUC = new UpdatePlantaUseCase(plantaRepo, cuidadoRepo, imageStorage);
      const updated = await updateUC.execute({
        id: created.data.id,
        nombre_comun: 'Potus Dorado',
        ubicacion: 'Balcón',
        nivel_luz: 'INDIRECTA',
        nivel_agua: 'POCA',
        estado_salud: 'SANA',
        notas_cuidado: 'Podar guías largas en primavera',
      });

      expect(updated.success).toBe(true);
      if (updated.success) {
        expect(updated.data.nombre_comun).toBe('Potus Dorado');
        expect(updated.data.nivel_luz).toBe('INDIRECTA');
        expect(updated.data.nivel_agua).toBe('POCA');
        expect(updated.data.estado_salud).toBe('SANA');
        expect(updated.data.notas_cuidado).toBe('Podar guías largas en primavera');
      }
    });
  });

  describe('Consultas y Lobby', () => {
    it('debe calcular métricas del lobby con plantas que requieren riego', async () => {
      plantaRepo.plantas.set('p-1', {
        id: 'p-1',
        nombre_comun: 'Monstera Deliciosa',
        especie: 'Monstera',
        ubicacion: 'Sala',
        foto_url: null,
        diasRestantes: 0,
        frecuencia_dias: 7,
        requiereRiego: true,
      });

      plantaRepo.plantas.set('p-2', {
        id: 'p-2',
        nombre_comun: 'Ficus Lyrata',
        especie: 'Ficus',
        ubicacion: 'Balcón',
        foto_url: null,
        diasRestantes: 4,
        frecuencia_dias: 7,
        requiereRiego: false,
      });

      const useCase = new GetResumenPlantasLobbyUseCase(plantaRepo);
      const res = await useCase.execute();

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.totalPlantas).toBe(2);
        expect(res.data.pendientesCount).toBe(1);
      }
    });
  });

  describe('Registro y Cuidado', () => {
    it('debe registrar un evento de riego y avanzar la fecha de la tarea', async () => {
      const hoy = new Date();
      const tarea = await cuidadoRepo.createTarea('p-1', 'RIEGO', 5, hoy);

      const useCase = new RegistrarCuidadoUseCase(cuidadoRepo);
      const res = await useCase.execute({
        plantaId: 'p-1',
        tipoTarea: 'RIEGO',
        usuarioId: 'user-123',
        observaciones: 'Riego matutino abundante',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.meta.plantaId).toBe('p-1');
        expect(res.data.meta.tipoTarea).toBe('RIEGO');
      }

      const tareaActualizada = await cuidadoRepo.findTarea('p-1', 'RIEGO');
      expect(tareaActualizada?.proxima_fecha.getTime()).toBeGreaterThan(hoy.getTime());
    });

    it('debe deshacer el último cuidado exitosamente', async () => {
      const hoy = new Date();
      const tarea = await cuidadoRepo.createTarea('p-1', 'RIEGO', 7, hoy);
      const historial = await cuidadoRepo.createHistorial(tarea.id, 'user-123');

      const undoUseCase = new DeshacerCuidadoUseCase(cuidadoRepo);
      const res = await undoUseCase.execute(historial.id);

      expect(res.success).toBe(true);
      expect(cuidadoRepo.historiales.length).toBe(0);
    });
  });
});
