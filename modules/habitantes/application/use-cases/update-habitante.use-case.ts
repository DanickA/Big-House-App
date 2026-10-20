import { IHabitanteRepository, UpdateHabitanteData } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { Habitante } from '../../domain/habitante.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';

export interface UpdateHabitanteDTO {
  id: string;
  nombre: string;
  email: string;
  password?: string | null;
  pin?: string | null;
}

export class UpdateHabitanteUseCase {
  constructor(
    private readonly repo: IHabitanteRepository = defaultHabitanteRepository,
    private readonly hasher: IPasswordHasher = defaultPasswordHasher
  ) {}

  async execute(dto: UpdateHabitanteDTO): Promise<Result<Habitante, AppError>> {
    try {
      const id = dto.id;
      const nombre = dto.nombre?.trim();
      const email = dto.email?.toLowerCase().trim();
      const password = dto.password;
      const pin = dto.pin;

      if (!nombre || !email) {
        return err(new ValidationError('El nombre y el correo son obligatorios'));
      }

      if (pin && pin.trim().length > 0 && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
        return err(new ValidationError('El PIN debe contener entre 4 y 6 dígitos numéricos'));
      }

      const dataToUpdate: UpdateHabitanteData = {
        nombre,
        email,
      };

      if (password && password.trim().length > 0) {
        dataToUpdate.password_hash = await this.hasher.hash(password);
      }

      if (pin !== null && pin !== undefined) {
        if (pin.trim().length > 0) {
          dataToUpdate.pin_hash = await this.hasher.hash(pin.trim());
          dataToUpdate.pin_longitud = pin.trim().length;
        } else {
          // Si el PIN viene como cadena vacía explícita (''), revocar el PIN previo
          dataToUpdate.pin_hash = null;
          dataToUpdate.pin_longitud = null;
        }
      }

      const usuarioActualizado = await this.repo.update(id, dataToUpdate);
      return ok(usuarioActualizado);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(
        new UnexpectedError('No se pudo actualizar el perfil del usuario', {
          original: error?.message,
        })
      );
    }
  }
}
