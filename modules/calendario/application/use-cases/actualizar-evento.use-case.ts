import { IEventoRepository } from '../../domain/evento.repository.interface';
import {
  TipoPlantilla,
  OpcionRecurrenciaEdicion,
  EventoConRelaciones,
} from '../../domain/evento.entity';
import { CrearEventoDTO } from './crear-evento.use-case';
import {
  Result,
  ok,
  err,
  AppError,
  ValidationError,
  NotFoundError,
  UnexpectedError,
  isValidId,
  projectAnnualDate,
} from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export class ActualizarEventoUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(
    id: string,
    data: Partial<CrearEventoDTO>,
    opcionRecurrencia: OpcionRecurrenciaEdicion = 'SIN_RECURRENCIA'
  ): Promise<Result<EventoConRelaciones, AppError>> {
    try {
      if (!isValidId(id)) {
        return err(new ValidationError('Identificador de evento inválido'));
      }
      const cleanId = id.trim();

      const eventoOriginal = await this.repo.findById(cleanId);
      if (!eventoOriginal) {
        return err(new NotFoundError('El evento no existe'));
      }

      const plantillaEfectiva = data.tipo_plantilla || eventoOriginal.tipo_plantilla;
      let esTodoElDia = data.todo_el_dia ?? eventoOriginal.todo_el_dia;
      if (plantillaEfectiva === TipoPlantilla.CITA_MEDICA) {
        esTodoElDia = false;
        if (data.todo_el_dia !== undefined) {
          data.todo_el_dia = false;
        }
      }

      let inicio = data.fecha_inicio
        ? new Date(data.fecha_inicio)
        : new Date(eventoOriginal.fecha_inicio);
      let fin = data.fecha_fin ? new Date(data.fecha_fin) : new Date(eventoOriginal.fecha_fin);

      if (esTodoElDia) {
        inicio = new Date(new Date(inicio).setHours(0, 0, 0, 0));
        fin = new Date(new Date(fin).setHours(23, 59, 59, 999));
      } else if (
        plantillaEfectiva === TipoPlantilla.CITA_MEDICA &&
        inicio.getHours() === 0 &&
        inicio.getMinutes() === 0
      ) {
        inicio = new Date(new Date(inicio).setHours(10, 0, 0, 0));
        fin = new Date(inicio.getTime() + 60 * 60 * 1000);
      }

      // RF-03 Caso 1: Recurrencia "SOLO_ESTE"
      if (opcionRecurrencia === 'SOLO_ESTE' && (eventoOriginal.recurrencia || data.recurrencia)) {
        const nuevoEventoDesvinculado = await this.repo.create({
          titulo: data.titulo?.trim() || eventoOriginal.titulo,
          descripcion:
            data.descripcion !== undefined
              ? data.descripcion?.trim() || null
              : eventoOriginal.descripcion,
          tipo_plantilla: data.tipo_plantilla || eventoOriginal.tipo_plantilla,
          estado: data.estado || eventoOriginal.estado,
          fecha_inicio: inicio,
          fecha_fin: fin,
          todo_el_dia: esTodoElDia,
          color: data.color || eventoOriginal.color,
          ubicacion:
            data.ubicacion !== undefined
              ? data.ubicacion?.trim() || null
              : eventoOriginal.ubicacion,
          recurrencia: null,
          detalles:
            data.detalles !== undefined ? data.detalles : eventoOriginal.detalles || undefined,
          creador_id: eventoOriginal.creador_id,
          participantes_ids:
            data.participantes_ids ||
            eventoOriginal.participantes?.map((p: any) => p.id) ||
            [],
          subtareas: data.subtareas || [],
        });

        if (eventoOriginal.recurrencia === 'ANUAL') {
          const origInicio = new Date(eventoOriginal.fecha_inicio);
          const origFin = new Date(eventoOriginal.fecha_fin);
          const duracionMs = Math.max(0, origFin.getTime() - origInicio.getTime());
          const siguienteAnioInicio = projectAnnualDate(
            origInicio,
            origInicio.getFullYear() + 1
          );
          const siguienteAnioFin = new Date(siguienteAnioInicio.getTime() + duracionMs);

          await this.repo.updateFechas(eventoOriginal.id, siguienteAnioInicio, siguienteAnioFin);
        }

        return ok(nuevoEventoDesvinculado);
      }

      // RF-03 Caso 2: Sin recurrencia o "ESTE_Y_FUTUROS"
      const updateData: any = {
        ...(data.titulo && { titulo: data.titulo.trim() }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion?.trim() || null }),
        ...(data.tipo_plantilla && { tipo_plantilla: data.tipo_plantilla }),
        ...(data.fecha_inicio && { fecha_inicio: inicio }),
        ...(data.fecha_fin && { fecha_fin: fin }),
        ...(data.todo_el_dia !== undefined
          ? { todo_el_dia: esTodoElDia }
          : plantillaEfectiva === TipoPlantilla.CITA_MEDICA
          ? { todo_el_dia: false }
          : {}),
        ...(data.color && { color: data.color }),
        ...(data.ubicacion !== undefined && { ubicacion: data.ubicacion?.trim() || null }),
        ...(data.recurrencia !== undefined && { recurrencia: data.recurrencia }),
        ...(data.detalles !== undefined && { detalles: data.detalles }),
        ...(data.estado !== undefined && { estado: data.estado }),
        ...(data.participantes_ids !== undefined && {
          participantes_ids: data.participantes_ids,
        }),
        ...(data.subtareas !== undefined && { subtareas: data.subtareas }),
      };

      const eventoActualizado = await this.repo.update(cleanId, updateData);
      return ok(eventoActualizado);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError(error?.message || 'Error al actualizar evento'));
    }
  }
}
