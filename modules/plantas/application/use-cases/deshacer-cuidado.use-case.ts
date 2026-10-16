import { ICuidadoRepository } from '../../domain/cuidado.repository.interface';
import { Result, ok, err, AppError, NotFoundError, UnexpectedError } from '@/modules/shared';
import { defaultCuidadoRepository } from '../../infrastructure/prisma-cuidado.repository';

export interface DeshacerCuidadoResultData {
  historialId: string;
  tareaId: string;
  plantaId?: string;
  nuevaProximaFecha: Date;
}

export class DeshacerCuidadoUseCase {
  constructor(private readonly repo: ICuidadoRepository = defaultCuidadoRepository) {}

  async execute(historialId: string): Promise<Result<DeshacerCuidadoResultData, AppError>> {
    try {
      const registro = await this.repo.findHistorialById(historialId);
      if (!registro) {
        return err(new NotFoundError('El registro de cuidado no existe o ya fue eliminado'));
      }

      const { tarea_id, tareas_cuidado } = registro;

      const cuidadoAnterior = await this.repo.findUltimoCuidadoAnterior(tarea_id, historialId);

      let nuevaProximaFecha: Date;
      if (cuidadoAnterior?.fecha_realizada) {
        nuevaProximaFecha = new Date(cuidadoAnterior.fecha_realizada);
        nuevaProximaFecha.setHours(0, 0, 0, 0);
        nuevaProximaFecha.setDate(nuevaProximaFecha.getDate() + (tareas_cuidado?.frecuencia_dias || 7));
      } else {
        nuevaProximaFecha = new Date();
        nuevaProximaFecha.setHours(0, 0, 0, 0);
      }

      await this.repo.deshacerCuidado(historialId, tarea_id, nuevaProximaFecha);

      return ok({
        historialId,
        tareaId: tarea_id,
        plantaId: tareas_cuidado?.planta_id,
        nuevaProximaFecha,
      });
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('No se pudo deshacer la acción de cuidado', { original: error?.message }));
    }
  }
}
