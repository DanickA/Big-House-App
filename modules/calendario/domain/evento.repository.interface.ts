import {
  Evento,
  EventoUnificado,
  SubtareaEvento,
  ParticipanteExterno,
  RecordatorioEvento,
  TipoPlantilla,
  EstadoEvento,
} from './evento.entity';

export interface CreateEventoData {
  titulo: string;
  descripcion?: string | null;
  tipo_plantilla: TipoPlantilla;
  estado?: EstadoEvento;
  fecha_inicio: Date;
  fecha_fin: Date;
  todo_el_dia: boolean;
  color: string;
  ubicacion?: string | null;
  recurrencia?: string | null;
  detalles?: any;
  creador_id: string;
  participantes_ids?: string[];
  externos?: ParticipanteExterno[];
  subtareas?: SubtareaEvento[];
  recordatorios?: RecordatorioEvento[];
}

export interface UpdateEventoData {
  titulo?: string;
  descripcion?: string | null;
  tipo_plantilla?: TipoPlantilla;
  estado?: EstadoEvento;
  fecha_inicio?: Date;
  fecha_fin?: Date;
  todo_el_dia?: boolean;
  color?: string;
  ubicacion?: string | null;
  recurrencia?: string | null;
  detalles?: any;
  participantes_ids?: string[];
  subtareas?: SubtareaEvento[];
}

export interface IEventoRepository {
  findById(id: string): Promise<any | null>;
  findEventosUnificados(mes: number, anio: number): Promise<EventoUnificado[]>;
  create(data: CreateEventoData): Promise<any>;
  update(id: string, data: UpdateEventoData): Promise<any>;
  updateFechas(id: string, fechaInicio: Date, fechaFin: Date): Promise<void>;
  cancelarLogico(id: string): Promise<any>;
  delete(id: string): Promise<void>;
  toggleSubtarea(id: string, completado: boolean): Promise<any>;
}
