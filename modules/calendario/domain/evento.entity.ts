import { TipoPlantilla, EstadoEvento, CanalRecordatorio } from '@prisma/client';

export { TipoPlantilla, EstadoEvento, CanalRecordatorio };

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
  [key: string]: any;
}

export interface SubtareaEvento {
  id?: string;
  descripcion: string;
  asignado_id?: string | null;
  completado?: boolean;
}

export interface ParticipanteExterno {
  nombre: string;
  contacto?: string;
}

export interface RecordatorioEvento {
  tipo_canal: CanalRecordatorio;
  minutos_anticipacion: number;
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
  creador?: { nombre: string } | null;
  participantes?: { id: string; nombre: string }[];
  metadata?: Record<string, string | number>;
  detalles?: DetallesEvento | null;
  subtareas?: { id: string; descripcion: string; completado: boolean }[];
}
