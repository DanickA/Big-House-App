import { IPlantaRepository } from '../../domain/planta.repository.interface';
import { IImageStorageService } from '../../domain/image-storage.service.interface';
import { Result, ok, err, AppError, ValidationError, UnexpectedError, isValidId } from '@/modules/shared';
import { defaultPlantaRepository } from '../../infrastructure/prisma-planta.repository';
import { defaultImageStorageService } from '../../infrastructure/storage-image-adapter.service';

export class DeletePlantaUseCase {
  constructor(
    private readonly repo: IPlantaRepository = defaultPlantaRepository,
    private readonly storage: IImageStorageService = defaultImageStorageService
  ) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    try {
      if (!isValidId(id)) {
        return err(new ValidationError('Identificador de planta inválido'));
      }
      const cleanId = id.trim();
      const plantaExistente =
        typeof this.repo.findById === 'function' ? await this.repo.findById(cleanId) : null;

      await this.repo.delete(cleanId);

      if (plantaExistente?.foto_url) {
        await this.storage.deleteImage?.(plantaExistente.foto_url);
      }

      return ok(undefined);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(
        new UnexpectedError('No se pudo eliminar la planta', {
          original: error?.message,
        })
      );
    }
  }
}
