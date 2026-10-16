import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { HabitanteListItem } from '../../domain/habitante.entity';
import { Result, ok, err, UnexpectedError, AppError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';

export class GetHabitantesUseCase {
  constructor(private readonly repo: IHabitanteRepository = defaultHabitanteRepository) {}

  async execute(): Promise<Result<HabitanteListItem[], AppError>> {
    try {
      const data = await this.repo.findAllWithDetails();
      return ok(data);
    } catch (error: any) {
      return err(new UnexpectedError('No se pudieron cargar los usuarios', { original: error?.message }));
    }
  }
}
