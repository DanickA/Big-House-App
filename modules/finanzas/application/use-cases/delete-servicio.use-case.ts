import { IServicioRepository } from '../../domain/servicio.repository.interface';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultServicioRepository } from '../../infrastructure/prisma-servicio.repository';

export class DeleteServicioUseCase {
  constructor(private readonly repo: IServicioRepository = defaultServicioRepository) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    try {
      await this.repo.delete(id);
      return ok(undefined);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('No se pudo eliminar el servicio', { original: error?.message }));
    }
  }
}
