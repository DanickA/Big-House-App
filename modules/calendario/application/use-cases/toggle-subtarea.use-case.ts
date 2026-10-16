import { IEventoRepository } from '../../domain/evento.repository.interface';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export class ToggleSubtareaUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(id: string, completado: boolean): Promise<Result<any, AppError>> {
    try {
      const subtarea = await this.repo.toggleSubtarea(id, completado);
      return ok(subtarea);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError(error?.message || 'Error al actualizar subtarea'));
    }
  }
}
