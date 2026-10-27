import { ICuidadoRepository } from '../../domain/cuidado.repository.interface';
import { HistorialCuidado } from '../../domain/planta.entity';
import {
  Result,
  ok,
  err,
  AppError,
  ValidationError,
  UnexpectedError,
  isValidId,
} from '@/modules/shared';
import { defaultCuidadoRepository } from '../../infrastructure/prisma-cuidado.repository';

export interface RegistrarCuidadoDTO {
  plantaId: string;
  tipoTarea: string;
  usuarioId: string;
  observaciones?: string | null;
}

export interface RegistrarCuidadoResultData {
  data: HistorialCuidado;
  meta: {
    historialId: string;
    tareaId: string;
    plantaId: string;
    tipoTarea: string;
    fechaAnterior?: Date;
  };
}

export class RegistrarCuidadoUseCase {
  constructor(private readonly repo: ICuidadoRepository = defaultCuidadoRepository) {}

  async execute(dto: RegistrarCuidadoDTO): Promise<Result<RegistrarCuidadoResultData, AppError>> {
    try {
      if (!isValidId(dto.plantaId)) {
        return err(new ValidationError('Identificador de planta requerido'));
      }
      if (!isValidId(dto.usuarioId)) {
        return err(new ValidationError('Usuario no autenticado'));
      }

      const plantaId = dto.plantaId.trim();
      const usuarioId = dto.usuarioId.trim();
      const tipoTarea = dto.tipoTarea || 'RIEGO';
      let tarea = await this.repo.findTarea(plantaId, tipoTarea);

      if (!tarea) {
        const proximaFecha = new Date();
        proximaFecha.setHours(0, 0, 0, 0);
        proximaFecha.setDate(proximaFecha.getDate() + 7);

        tarea = await this.repo.createTarea(plantaId, tipoTarea, 7, proximaFecha);
      }

      const fechaAnterior = tarea.proxima_fecha;

      let nuevaProximaFecha: Date | undefined;
      if (tipoTarea === 'RIEGO') {
        nuevaProximaFecha = new Date();
        nuevaProximaFecha.setHours(0, 0, 0, 0);
        nuevaProximaFecha.setDate(nuevaProximaFecha.getDate() + (tarea.frecuencia_dias || 7));
      }

      let nuevoHistorial: HistorialCuidado;
      if (typeof this.repo.registrarCuidadoAtomico === 'function') {
        nuevoHistorial = await this.repo.registrarCuidadoAtomico(
          tarea.id,
          usuarioId,
          dto.observaciones || null,
          nuevaProximaFecha
        );
      } else {
        if (nuevaProximaFecha) {
          await this.repo.updateTareaProximaFecha(tarea.id, nuevaProximaFecha);
        }
        nuevoHistorial = await this.repo.createHistorial(
          tarea.id,
          usuarioId,
          dto.observaciones || null
        );
      }

      return ok({
        data: nuevoHistorial,
        meta: {
          historialId: nuevoHistorial.id,
          tareaId: tarea.id,
          plantaId,
          tipoTarea,
          fechaAnterior,
        },
      });
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(
        new UnexpectedError('No se pudo registrar la acción de cuidado', {
          original: error?.message,
        })
      );
    }
  }
}
