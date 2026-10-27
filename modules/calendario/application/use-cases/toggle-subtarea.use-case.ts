import { IEventoRepository } from '../../domain/evento.repository.interface';
import { SubtareaEvento } from '../../domain/evento.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError, isValidId } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export class ToggleSubtareaUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(id: string, completado: boolean): Promise<Result<SubtareaEvento, AppError>> {
    try {
      if (!isValidId(id)) {
        return err(new ValidationError('Identificador de subtarea inválido'));
      }
      const subtarea = await this.repo.toggleSubtarea(id.trim(), completado);
      return ok(subtarea);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError(error?.message || 'Error al actualizar subtarea'));
    }
  }
}
