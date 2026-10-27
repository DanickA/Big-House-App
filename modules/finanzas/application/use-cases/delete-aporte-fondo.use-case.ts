import { IAporteFondoRepository } from '../../domain/aporte-fondo.repository.interface';
import { Result, ok, err, AppError, ValidationError, UnexpectedError, isValidId } from '@/modules/shared';
import { defaultAporteFondoRepository } from '../../infrastructure/prisma-aporte-fondo.repository';

export class DeleteAporteFondoUseCase {
  constructor(private readonly repo: IAporteFondoRepository = defaultAporteFondoRepository) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    try {
      if (!isValidId(id)) {
        return err(new ValidationError('Identificador del aporte requerido'));
      }
      await this.repo.delete(id.trim());
      return ok(undefined);
    } catch (error: any) {
      return err(
        new UnexpectedError('No se pudo eliminar el aporte', {
          original: error?.message,
        })
      );
    }
  }
}
