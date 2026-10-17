import { IAporteFondoRepository } from '../../domain/aporte-fondo.repository.interface';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultAporteFondoRepository } from '../../infrastructure/prisma-aporte-fondo.repository';

export class DeleteAporteFondoUseCase {
  constructor(private readonly repo: IAporteFondoRepository = defaultAporteFondoRepository) {}

  async execute(aporteId: string): Promise<Result<void, AppError>> {
    try {
      const id = aporteId?.trim();
      if (!id) {
        return err(new ValidationError('Identificador del aporte requerido'));
      }
      await this.repo.delete(id);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      return err(new UnexpectedError('No se pudo eliminar el aporte', { original: message }));
    }
  }
}
