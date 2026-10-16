import { IEventoRepository } from '../../domain/evento.repository.interface';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export class EliminarEventoFisicoUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    try {
      if (id.startsWith('planta-') || id.startsWith('servicio-')) {
        return err(
          new ValidationError(
            'Este evento automático se gestiona desde su módulo correspondiente'
          )
        );
      }

      await this.repo.delete(id);
      return ok(undefined);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError(error?.message || 'Error al eliminar evento'));
    }
  }
}
