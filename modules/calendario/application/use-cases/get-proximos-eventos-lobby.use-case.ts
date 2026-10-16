import { IEventoRepository } from '../../domain/evento.repository.interface';
import { EventoUnificado } from '../../domain/evento.entity';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultEventoRepository } from '../../infrastructure/prisma-evento.repository';

export interface ProximosEventosLobbyData {
  totalEventosSemana: number;
  proximos: EventoUnificado[];
}

export class GetProximosEventosLobbyUseCase {
  constructor(private readonly repo: IEventoRepository = defaultEventoRepository) {}

  async execute(limit = 3): Promise<Result<ProximosEventosLobbyData, AppError>> {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const finSemana = new Date(hoy);
      finSemana.setDate(finSemana.getDate() + 7);
      finSemana.setHours(23, 59, 59, 999);

      const eventos = await this.repo.findEventosUnificados(hoy.getMonth() + 1, hoy.getFullYear());

      const futuros = eventos.filter((ev) => new Date(ev.fecha_inicio).getTime() >= hoy.getTime());
      const enLaSemana = futuros.filter(
        (ev) => new Date(ev.fecha_inicio).getTime() <= finSemana.getTime()
      );

      return ok({
        totalEventosSemana: enLaSemana.length,
        proximos: futuros.slice(0, limit),
      });
    } catch (error: any) {
      return err(
        new UnexpectedError('Error al obtener eventos para el lobby', {
          original: error?.message,
        })
      );
    }
  }
}
