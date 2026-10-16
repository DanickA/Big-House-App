import { IEventoRepository } from '../../domain/evento.repository.interface';
import { EventoUnificado } from '../../domain/evento.entity';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export class GetEventosCalendarioUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(mes: number, anio: number): Promise<Result<EventoUnificado[], AppError>> {
    try {
      const data = await this.repo.findEventosUnificados(mes, anio);
      return ok(data);
    } catch (error: any) {
      return err(
        new UnexpectedError('No se pudieron cargar los eventos', {
          original: error?.message,
        })
      );
    }
  }
}
