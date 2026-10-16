import { IPlantaRepository } from '../../domain/planta.repository.interface';
import { PlantaConEstado } from '../../domain/planta.entity';
import { Result, ok, err, UnexpectedError, AppError } from '@/modules/shared';
import { defaultPlantaRepository } from '../../infrastructure/prisma-planta.repository';

export interface ResumenPlantasLobbyData {
  totalPlantas: number;
  pendientesCount: number;
  plantas: PlantaConEstado[];
}

export class GetResumenPlantasLobbyUseCase {
  constructor(private readonly repo: IPlantaRepository = defaultPlantaRepository) {}

  async execute(): Promise<Result<ResumenPlantasLobbyData, AppError>> {
    try {
      const plantas = await this.repo.findAllWithStatus();
      const pendientesCount = plantas.filter((p) => p.requiereRiego).length;

      return ok({
        totalPlantas: plantas.length,
        pendientesCount,
        plantas,
      });
    } catch (error: any) {
      return err(
        new UnexpectedError('Error al obtener resumen de plantas', {
          original: error?.message,
        })
      );
    }
  }
}
