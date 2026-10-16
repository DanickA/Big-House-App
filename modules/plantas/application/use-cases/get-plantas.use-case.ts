import { IPlantaRepository } from '../../domain/planta.repository.interface';
import { PlantaConEstado } from '../../domain/planta.entity';
import { Result, ok, err, UnexpectedError, AppError } from '@/modules/shared';
import { defaultPlantaRepository } from '../../infrastructure/prisma-planta.repository';

export class GetPlantasUseCase {
  constructor(private readonly repo: IPlantaRepository = defaultPlantaRepository) {}

  async execute(): Promise<Result<PlantaConEstado[], AppError>> {
    try {
      const data = await this.repo.findAllWithStatus();
      return ok(data);
    } catch (error: any) {
      return err(
        new UnexpectedError('No se pudieron cargar las plantas', {
          original: error?.message,
        })
      );
    }
  }
}
