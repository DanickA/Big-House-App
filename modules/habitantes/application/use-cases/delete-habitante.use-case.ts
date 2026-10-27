import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import {
  Result,
  ok,
  err,
  AppError,
  ValidationError,
  ForbiddenError,
  UnexpectedError,
  isValidId,
} from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';

export interface DeleteHabitanteDTO {
  id: string;
  currentUserId: string;
}

export class DeleteHabitanteUseCase {
  constructor(private readonly repo: IHabitanteRepository = defaultHabitanteRepository) {}

  async execute(dto: DeleteHabitanteDTO): Promise<Result<void, AppError>> {
    try {
      if (!isValidId(dto.id)) {
        return err(new ValidationError('Identificador de habitante inválido'));
      }
      const cleanId = dto.id.trim();
      if (dto.currentUserId === cleanId) {
        return err(
          new ForbiddenError('No puedes eliminar tu propia cuenta mientras tu sesión esté activa')
        );
      }

      await this.repo.delete(cleanId);
      return ok(undefined);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(
        new UnexpectedError('No se pudo eliminar el usuario', {
          original: error?.message,
        })
      );
    }
  }
}
