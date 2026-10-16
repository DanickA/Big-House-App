import { IPlantaRepository } from '../../domain/planta.repository.interface';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultPlantaRepository } from '../../infrastructure/prisma-planta.repository';

export class DeletePlantaUseCase {
  constructor(private readonly repo: IPlantaRepository = defaultPlantaRepository) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    try {
      await this.repo.delete(id);
      return ok(undefined);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('No se pudo eliminar la planta', { original: error?.message }));
    }
  }
}
