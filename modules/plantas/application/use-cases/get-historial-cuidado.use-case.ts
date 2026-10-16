import { ICuidadoRepository } from '../../domain/cuidado.repository.interface';
import { HistorialCuidado } from '../../domain/planta.entity';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultCuidadoRepository } from '../../infrastructure/prisma-cuidado.repository';

export class GetHistorialCuidadoUseCase {
  constructor(private readonly repo: ICuidadoRepository = defaultCuidadoRepository) {}

  async execute(plantaId: string): Promise<Result<HistorialCuidado[], AppError>> {
    try {
      const historial = await this.repo.findHistorialByPlanta(plantaId);
      return ok(historial);
    } catch (error: any) {
      return err(new UnexpectedError('No se pudo cargar el historial', { original: error?.message }));
    }
  }
}
