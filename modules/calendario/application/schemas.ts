import { z } from 'zod';
import { TipoPlantilla, EstadoEvento, CanalRecordatorio } from '../domain/evento.entity';

export const DetallesCitaMedicaSchema = z.object({
  paciente_id: z.string().optional(),
  profesional: z.string().optional(),
  especialidad: z.string().optional(),
  motivo: z.string().optional(),
  acompanantes_ids: z.array(z.string()).optional(),
});

export const DetallesTareaSchema = z.object({
  responsable_id: z.string().optional(),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA']).optional(),
  categoria: z.string().optional(),
});

export const DetallesCumpleanosSchema = z.object({
  agasajado_tipo: z.enum(['interno', 'externo']).optional(),
  agasajado_interno_id: z.string().optional(),
  agasajado_externo: z.string().optional(),
  contacto_externo: z.string().optional(),
  edad: z.number().optional(),
});

export const SubtareaSchema = z.object({
  descripcion: z.string().min(1, 'La descripción de la subtarea es obligatoria'),
  asignado_id: z.string().nullable().optional(),
  completado: z.boolean().default(false),
});

export const RecordatorioSchema = z.object({
  tipo_canal: z.nativeEnum(CanalRecordatorio),
  minutos_anticipacion: z.number().int().min(0),
});

export const CrearEventoSchema = z.object({
  titulo: z.string().trim().min(1, 'El título del evento es obligatorio'),
  descripcion: z.string().trim().nullable().optional(),
  tipo_plantilla: z.nativeEnum(TipoPlantilla),
  estado: z.nativeEnum(EstadoEvento).default(EstadoEvento.ACTIVO),
  fecha_inicio: z.date(),
  fecha_fin: z.date(),
  todo_el_dia: z.boolean().default(false),
  color: z.string().default('#5F6F52'),
  ubicacion: z.string().trim().nullable().optional(),
  recurrencia: z.string().nullable().optional(),
  detalles: z.any().optional(),
  participantes_ids: z.array(z.string()).optional(),
  externos: z.array(z.object({ nombre: z.string(), contacto: z.string().optional() })).optional(),
  subtareas: z.array(SubtareaSchema).optional(),
  recordatorios: z.array(RecordatorioSchema).optional(),
});
