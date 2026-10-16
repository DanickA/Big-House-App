import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { HabitanteSelectorItem } from '../../domain/habitante.entity';
import { Result, ok, err, UnexpectedError, AppError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';

export class GetMiembrosSelectorUseCase {
  constructor(private readonly repo: IHabitanteRepository = defaultHabitanteRepository) {}

  async execute(): Promise<Result<HabitanteSelectorItem[], AppError>> {
    try {
      const data = await this.repo.findForSelector();
      return ok(data);
    } catch (error: any) {
      return err(new UnexpectedError('Error al obtener miembros para login', { original: error?.message }));
    }
  }
}
