import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { Result, ok, err, AppError, ForbiddenError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';

export interface DeleteHabitanteDTO {
  id: string;
  currentUserId: string;
}

export class DeleteHabitanteUseCase {
  constructor(private readonly repo: IHabitanteRepository = defaultHabitanteRepository) {}

  async execute(dto: DeleteHabitanteDTO): Promise<Result<void, AppError>> {
    try {
      if (dto.currentUserId === dto.id) {
        return err(
          new ForbiddenError('No puedes eliminar tu propia cuenta mientras tu sesión esté activa')
        );
      }

      await this.repo.delete(dto.id);
      return ok(undefined);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('No se pudo eliminar el usuario', { original: error?.message }));
    }
  }
}
