import { IEventoRepository } from '../../domain/evento.repository.interface';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export class CancelarEventoLogicoUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(id: string): Promise<Result<any, AppError>> {
    try {
      const evento = await this.repo.cancelarLogico(id);
      return ok(evento);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError(error?.message || 'Error al cancelar evento'));
    }
  }
}
