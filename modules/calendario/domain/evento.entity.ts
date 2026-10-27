// Enumeraciones puras de Dominio desacopladas de infraestructura (@prisma/client) (A-01)
export const TipoPlantilla = {
  EVENTO: 'EVENTO',
  TAREA: 'TAREA',
  MANTENIMIENTO: 'MANTENIMIENTO',
  VISITAS: 'VISITAS',
  COMPRAS: 'COMPRAS',
  MASCOTAS: 'MASCOTAS',
  CUMPLEANOS: 'CUMPLEANOS',
  CITA_MEDICA: 'CITA_MEDICA',
  MERCADO: 'MERCADO',
} as const;
export type TipoPlantilla = (typeof TipoPlantilla)[keyof typeof TipoPlantilla];

export const EstadoEvento = {
  ACTIVO: 'ACTIVO',
  CANCELADO: 'CANCELADO',
  COMPLETADO: 'COMPLETADO',
} as const;
export type EstadoEvento = (typeof EstadoEvento)[keyof typeof EstadoEvento];

export const CanalRecordatorio = {
  PUSH: 'PUSH',
  EMAIL: 'EMAIL',
} as const;
export type CanalRecordatorio = (typeof CanalRecordatorio)[keyof typeof CanalRecordatorio];

export type OpcionRecurrenciaEdicion = 'SOLO_ESTE' | 'ESTE_Y_FUTUROS' | 'SIN_RECURRENCIA';

// Tipado estricto para detalles por plantilla (eliminando any)
export interface DetallesCitaMedica {
  paciente_id?: string;
  profesional?: string;
  especialista?: string;
  especialidad?: string;
  motivo?: string;
  acompanantes_ids?: string[];
}

export interface DetallesTarea {
  responsable_id?: string;
  prioridad?: 'BAJA' | 'MEDIA' | 'ALTA';
  categoria?: string;
}

export interface DetallesCumpleanos {
  agasajado_tipo?: 'interno' | 'externo';
  agasajado_interno_id?: string;
  agasajado_externo?: string;
  contacto_externo?: string;
  edad?: number;
}

export interface DetallesVisitas {
  visitantes?: string;
  motivo?: string;
}

export interface DetallesCompras {
  lista_articulos?: string[];
  presupuesto_estimado?: number;
}

export interface DetallesMascotas {
  mascota_nombre?: string;
  tipo_cuidado?: string;
}

export interface DetallesMantenimiento {
  area?: string;
  proveedor?: string;
  costo_estimado?: number;
}

export interface DetallesMercado {
  lugar?: string;
  articulos?: string[];
}

export interface DetallesEvento
  extends Partial<DetallesCitaMedica>,
    Partial<DetallesTarea>,
    Partial<DetallesCumpleanos>,
    Partial<DetallesVisitas>,
    Partial<DetallesCompras>,
    Partial<DetallesMascotas>,
    Partial<DetallesMantenimiento>,
    Partial<DetallesMercado> {
  [key: string]: unknown;
}

export interface SubtareaEvento {
  id?: string;
  descripcion: string;
  asignado_id?: string | null;
  completado?: boolean;
}

export interface ParticipanteExterno {
  id?: string;
  nombre: string;
  contacto?: string | null;
}

export interface RecordatorioEvento {
  id?: string;
  tipo_canal: CanalRecordatorio;
  minutos_anticipacion: number;
  fecha_programada?: Date;
  enviado?: boolean;
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo_plantilla: TipoPlantilla;
  estado: EstadoEvento;
  fecha_inicio: Date;
  fecha_fin: Date;
  todo_el_dia: boolean;
  color: string;
  ubicacion: string | null;
  recurrencia: string | null;
  detalles: DetallesEvento | null;
  creador_id: string;
  google_event_id?: string | null;
}

export interface EventoConRelaciones extends Evento {
  fecha_creacion?: Date | null;
  creador?: { id?: string; nombre: string } | null;
  participantes?: { id: string; nombre?: string }[];
  externos?: ParticipanteExterno[];
  subtareas?: SubtareaEvento[];
  recordatorios?: RecordatorioEvento[];
}

export interface EventoUnificado {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo_plantilla: string;
  estado?: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  todo_el_dia: boolean;
  color: string;
  ubicacion: string | null;
  recurrencia?: string | null;
  origen: 'MANUAL' | 'PLANTA' | 'SERVICIO';
  google_event_id?: string | null;
  creador?: { nombre: string } | null;
  participantes?: { id: string; nombre: string }[];
  metadata?: Record<string, string | number>;
  detalles?: DetallesEvento | null;
  subtareas?: { id: string; descripcion: string; completado: boolean }[];
}
