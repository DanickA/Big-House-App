import {
  CrearEventoUseCase,
  ActualizarEventoUseCase,
  CancelarEventoLogicoUseCase,
  EliminarEventoFisicoUseCase,
  IEventoRepository,
  CreateEventoData,
  UpdateEventoData,
  EventoUnificado,
  TipoPlantilla,
  EstadoEvento,
} from '@/modules/calendario';

class InMemoryEventoRepository implements IEventoRepository {
  public eventos: Map<string, any> = new Map();
  public subtareas: any[] = [];
  public recordatorios: any[] = [];

  async findById(id: string): Promise<any | null> {
    return this.eventos.get(id) || null;
  }

  async findEventosUnificados(_mes: number, _anio: number): Promise<EventoUnificado[]> {
    return Array.from(this.eventos.values()).map((e) => ({
      id: e.id,
      titulo: e.titulo,
      descripcion: e.descripcion,
      tipo_plantilla: e.tipo_plantilla,
      estado: e.estado,
      fecha_inicio: e.fecha_inicio,
      fecha_fin: e.fecha_fin,
      todo_el_dia: e.todo_el_dia,
      color: e.color,
      ubicacion: e.ubicacion,
      recurrencia: e.recurrencia,
      origen: 'MANUAL',
      creador: { nombre: 'Habitante' },
      participantes: (e.participantes_ids || []).map((id: string) => ({ id, nombre: 'Habitante' })),
      detalles: e.detalles,
      subtareas: e.subtareas,
    }));
  }

  async create(data: CreateEventoData): Promise<any> {
    const id = `ev-${Date.now()}-${Math.random()}`;
    const nuevo = {
      id,
      ...data,
      participantes: (data.participantes_ids || []).map((uid) => ({ id: uid })),
    };
    this.eventos.set(id, nuevo);
    return nuevo;
  }

  async update(id: string, data: UpdateEventoData): Promise<any> {
    const existing = this.eventos.get(id);
    if (!existing) throw new Error('Evento no encontrado');
    const updated = {
      ...existing,
      ...data,
      participantes: data.participantes_ids
        ? data.participantes_ids.map((uid) => ({ id: uid }))
        : existing.participantes,
    };
    this.eventos.set(id, updated);
    return updated;
  }

  async updateFechas(id: string, fechaInicio: Date, fechaFin: Date): Promise<void> {
    const existing = this.eventos.get(id);
    if (existing) {
      existing.fecha_inicio = fechaInicio;
      existing.fecha_fin = fechaFin;
    }
  }

  async cancelarLogico(id: string): Promise<any> {
    const existing = this.eventos.get(id);
    if (!existing) throw new Error('Evento no encontrado');
    existing.estado = EstadoEvento.CANCELADO;
    return existing;
  }

  async delete(id: string): Promise<void> {
    this.eventos.delete(id);
  }

  async toggleSubtarea(id: string, completado: boolean): Promise<any> {
    return { id, completado };
  }
}

describe('Calendario Module - Clean Architecture Use Cases', () => {
  let repo: InMemoryEventoRepository;

  beforeEach(() => {
    repo = new InMemoryEventoRepository();
  });

  describe('Creación de Eventos y Reglas de Plantillas', () => {
    it('debe rechazar eventos con fecha de fin anterior a fecha de inicio', async () => {
      const useCase = new CrearEventoUseCase(repo);
      const res = await useCase.execute({
        titulo: 'Reunión de vecinos',
        tipo_plantilla: TipoPlantilla.EVENTO,
        fecha_inicio: new Date('2026-10-15T18:00:00Z'),
        fecha_fin: new Date('2026-10-15T17:00:00Z'),
        todo_el_dia: false,
        color: '#5F6F52',
        creador_id: 'user-1',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toContain('fecha de fin debe ser posterior');
      }
    });

    it('Cita Médica: debe exigir ubicación y paciente obligatorios', async () => {
      const useCase = new CrearEventoUseCase(repo);
      const res = await useCase.execute({
        titulo: 'Odontología',
        tipo_plantilla: TipoPlantilla.CITA_MEDICA,
        fecha_inicio: new Date('2026-10-15T09:00:00Z'),
        fecha_fin: new Date('2026-10-15T10:00:00Z'),
        todo_el_dia: false,
        color: '#0284C7',
        creador_id: 'user-1',
        ubicacion: '', // Vacía
        participantes_ids: [],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toContain('ubicación es obligatoria');
      }
    });

    it('Tarea: debe exigir responsable asignado', async () => {
      const useCase = new CrearEventoUseCase(repo);
      const res = await useCase.execute({
        titulo: 'Barrer el patio',
        tipo_plantilla: TipoPlantilla.TAREA,
        fecha_inicio: new Date('2026-10-15T09:00:00Z'),
        fecha_fin: new Date('2026-10-15T10:00:00Z'),
        todo_el_dia: false,
        color: '#D97706',
        creador_id: 'user-1',
        participantes_ids: [],
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).toContain('responsable asignado');
      }
    });
  });

  describe('Edición y Recurrencias', () => {
    it('SOLO_ESTE: debe desvincular la fecha y crear una instancia independiente sin recurrencia', async () => {
      const original = await repo.create({
        titulo: 'Cumpleaños Anual',
        tipo_plantilla: TipoPlantilla.CUMPLEANOS,
        fecha_inicio: new Date('2026-10-10T00:00:00Z'),
        fecha_fin: new Date('2026-10-10T23:59:59Z'),
        todo_el_dia: true,
        color: '#7C3AED',
        recurrencia: 'ANUAL',
        creador_id: 'user-1',
      });

      const useCase = new ActualizarEventoUseCase(repo);
      const res = await useCase.execute(
        original.id,
        {
          titulo: 'Cumpleaños Especial (Solo Este)',
          color: '#D97706',
        },
        'SOLO_ESTE'
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.titulo).toBe('Cumpleaños Especial (Solo Este)');
        expect(res.data.recurrencia).toBeNull();
      }

      const originalPost = await repo.findById(original.id);
      expect(new Date(originalPost.fecha_inicio).getFullYear()).toBe(2027);
    });

    it('debe cancelar lógicamente el evento y dejarlo en CANCELADO', async () => {
      const original = await repo.create({
        titulo: 'Cena cancelada',
        tipo_plantilla: TipoPlantilla.EVENTO,
        fecha_inicio: new Date('2026-10-15T20:00:00Z'),
        fecha_fin: new Date('2026-10-15T22:00:00Z'),
        todo_el_dia: false,
        color: '#7C3AED',
        creador_id: 'user-1',
      });

      const cancelUseCase = new CancelarEventoLogicoUseCase(repo);
      const res = await cancelUseCase.execute(original.id);

      expect(res.success).toBe(true);
      const post = await repo.findById(original.id);
      expect(post.estado).toBe(EstadoEvento.CANCELADO);
    });

    it('debe propagar google_event_id en findEventosUnificados para eventos sincronizados con Google Calendar', async () => {
      const creado = await repo.create({
        titulo: 'Evento desde Google Calendar',
        tipo_plantilla: TipoPlantilla.EVENTO,
        fecha_inicio: new Date('2026-10-18T14:00:00Z'),
        fecha_fin: new Date('2026-10-18T15:00:00Z'),
        todo_el_dia: false,
        color: '#6EB5A5',
        creador_id: 'user-1',
      });
      repo.eventos.get(creado.id).google_event_id = 'gcal-evt-999';

      const unificados = await repo.findEventosUnificados(10, 2026);
      expect(unificados).toHaveLength(1);
      expect(unificados[0].titulo).toBe('Evento desde Google Calendar');
    });
  });
});
