import { IEventoRepository } from '../../domain/evento.repository.interface';
import {
  TipoPlantilla,
  EstadoEvento,
  CanalRecordatorio,
  ParticipanteExterno,
  SubtareaEvento,
  RecordatorioEvento,
  DetallesEvento,
} from '../../domain/evento.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export interface CrearEventoDTO {
  titulo: string;
  descripcion?: string;
  tipo_plantilla: TipoPlantilla;
  estado?: EstadoEvento;
  fecha_inicio: Date;
  fecha_fin: Date;
  todo_el_dia: boolean;
  color: string;
  ubicacion?: string;
  recurrencia?: string;
  detalles?: DetallesEvento;
  creador_id: string;
  participantes_ids?: string[];
  externos?: ParticipanteExterno[];
  subtareas?: SubtareaEvento[];
  recordatorios?: RecordatorioEvento[];
}

export class CrearEventoUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(data: CrearEventoDTO): Promise<Result<any, AppError>> {
    try {
      if (!data.titulo || !data.titulo.trim()) {
        return err(new ValidationError('El título del evento es obligatorio'));
      }

      if (data.fecha_fin < data.fecha_inicio) {
        return err(new ValidationError('La fecha de fin debe ser posterior a la de inicio'));
      }

      // Reglas específicas por plantilla (RF-02)
      if (data.tipo_plantilla === TipoPlantilla.CITA_MEDICA) {
        if (data.todo_el_dia) {
          return err(
            new ValidationError(
              'La cita médica requiere obligatoriamente fecha y hora de inicio específica (no admite modalidad todo el día)'
            )
          );
        }
        if (!data.ubicacion || !data.ubicacion.trim()) {
          return err(new ValidationError('La ubicación es obligatoria para una cita médica'));
        }
        const tienePaciente =
          (data.participantes_ids && data.participantes_ids.length > 0) ||
          (data.detalles as any)?.paciente_id;
        if (!tienePaciente) {
          return err(
            new ValidationError('Debe seleccionar obligatoriamente un paciente del hogar para la cita médica')
          );
        }
      }

      if (data.tipo_plantilla === TipoPlantilla.TAREA) {
        const tieneResponsable =
          (data.participantes_ids && data.participantes_ids.length > 0) ||
          (data.detalles as any)?.responsable_id;
        if (!tieneResponsable) {
          return err(new ValidationError('La tarea requiere obligatoriamente un responsable asignado'));
        }
      }

      let inicio = new Date(data.fecha_inicio);
      let fin = new Date(data.fecha_fin);

      if (
        data.tipo_plantilla === TipoPlantilla.CITA_MEDICA &&
        inicio.getHours() === 0 &&
        inicio.getMinutes() === 0
      ) {
        inicio = new Date(new Date(inicio).setHours(10, 0, 0, 0));
        fin = new Date(inicio.getTime() + 60 * 60 * 1000);
      } else if (data.todo_el_dia) {
        inicio = new Date(new Date(inicio).setHours(0, 0, 0, 0));
        fin = new Date(new Date(fin).setHours(23, 59, 59, 999));
      }

      const externosFinales = [...(data.externos || [])];
      const detallesAny = data.detalles as any;
      if (
        data.tipo_plantilla === TipoPlantilla.CUMPLEANOS &&
        detallesAny?.agasajado_tipo === 'externo' &&
        detallesAny?.agasajado_externo
      ) {
        const yaExiste = externosFinales.some(
          (e) => e.nombre.toLowerCase() === detallesAny.agasajado_externo.toLowerCase()
        );
        if (!yaExiste) {
          externosFinales.push({
            nombre: detallesAny.agasajado_externo,
            contacto: detallesAny.contacto_externo || undefined,
          });
        }
      }

      const participantesSet = new Set<string>(data.participantes_ids || []);
      if (detallesAny?.paciente_id) participantesSet.add(detallesAny.paciente_id);
      if (Array.isArray(detallesAny?.acompanantes_ids)) {
        detallesAny.acompanantes_ids.forEach((id: string) => participantesSet.add(id));
      }
      if (detallesAny?.responsable_id) participantesSet.add(detallesAny.responsable_id);
      if (detallesAny?.agasajado_interno_id) participantesSet.add(detallesAny.agasajado_interno_id);

      const nuevoEvento = await this.repo.create({
        titulo: data.titulo.trim(),
        descripcion: data.descripcion?.trim() || null,
        tipo_plantilla: data.tipo_plantilla,
        estado: data.estado || EstadoEvento.ACTIVO,
        fecha_inicio: inicio,
        fecha_fin: fin,
        todo_el_dia: data.todo_el_dia,
        color: data.color,
        ubicacion: data.ubicacion?.trim() || null,
        recurrencia: data.recurrencia || null,
        detalles: data.detalles !== undefined ? data.detalles : undefined,
        creador_id: data.creador_id,
        participantes_ids: Array.from(participantesSet),
        externos: externosFinales,
        subtareas: data.subtareas || [],
        recordatorios: data.recordatorios || [],
      });

      return ok(nuevoEvento);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError(error?.message || 'Error al crear evento'));
    }
  }
}
