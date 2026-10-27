import { IHabitanteRepository, UpdateHabitanteData } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { Habitante } from '../../domain/habitante.entity';
import { UpdateHabitanteSchema } from '../schemas';
import { Result, ok, err, AppError, ValidationError, UnexpectedError, isValidId } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';

export interface UpdateHabitanteDTO {
  id: string;
  nombre: string;
  email: string;
  password?: string | null;
  pin?: string | null;
  rol?: 'ADMIN' | 'MIEMBRO';
  activo?: boolean;
}

export class UpdateHabitanteUseCase {
  constructor(
    private readonly repo: IHabitanteRepository = defaultHabitanteRepository,
    private readonly hasher: IPasswordHasher = defaultPasswordHasher
  ) {}

  async execute(dto: UpdateHabitanteDTO): Promise<Result<Habitante, AppError>> {
    try {
      if (!isValidId(dto.id)) {
        return err(new ValidationError('Identificador de habitante inválido'));
      }
      const id = dto.id.trim();
      const nombre = dto.nombre?.trim();
      const email = dto.email?.toLowerCase().trim();
      const password = dto.password;
      const pin = dto.pin;

      if (!nombre || !email) {
        return err(new ValidationError('El nombre y el correo son obligatorios'));
      }

      const parsed = UpdateHabitanteSchema.safeParse({
        nombre,
        email,
        password,
        pin,
        rol: dto.rol,
        activo: dto.activo,
      });
      if (!parsed.success) {
        return err(
          new ValidationError(parsed.error.issues[0]?.message || 'Datos de habitante inválidos')
        );
      }

      const dataToUpdate: UpdateHabitanteData = {
        nombre,
        email,
      };

      if (dto.rol) {
        dataToUpdate.rol = dto.rol;
      }

      if (dto.activo !== undefined) {
        dataToUpdate.activo = dto.activo;
      }

      let credencialesCambiadas = false;

      if (password && password.trim().length > 0) {
        if (password.trim().length < 8) {
          return err(new ValidationError('La contraseña debe tener al menos 8 caracteres'));
        }
        dataToUpdate.password_hash = await this.hasher.hash(password.trim());
        credencialesCambiadas = true;
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
        credencialesCambiadas = true;
      }

      if (credencialesCambiadas) {
        dataToUpdate.incrementTokenVersion = true;
      }

      const usuarioActualizado = await this.repo.update(id, dataToUpdate);

      // Omitir hashes en la respuesta
      return ok({
        ...usuarioActualizado,
        password_hash: '',
        pin_hash: null,
      });
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
