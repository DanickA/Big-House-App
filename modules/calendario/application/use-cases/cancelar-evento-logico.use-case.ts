import { IEventoRepository } from '../../domain/evento.repository.interface';
import { Evento } from '../../domain/evento.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError, isValidId } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export class CancelarEventoLogicoUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(id: string): Promise<Result<Evento, AppError>> {
    try {
      if (!isValidId(id)) {
        return err(new ValidationError('Identificador de evento inválido'));
      }
      const evento = await this.repo.cancelarLogico(id.trim());
      return ok(evento);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError(error?.message || 'Error al cancelar evento'));
    }
  }
}
