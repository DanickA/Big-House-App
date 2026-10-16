import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { Habitante } from '../../domain/habitante.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';

export interface CreateHabitanteDTO {
  nombre: string;
  email: string;
  password: string;
  pin?: string | null;
}

export class CreateHabitanteUseCase {
  constructor(
    private readonly repo: IHabitanteRepository = defaultHabitanteRepository,
    private readonly hasher: IPasswordHasher = defaultPasswordHasher
  ) {}

  async execute(dto: CreateHabitanteDTO): Promise<Result<Habitante, AppError>> {
    try {
      const nombre = dto.nombre?.trim();
      const email = dto.email?.toLowerCase().trim();
      const password = dto.password;
      const pin = dto.pin;

      if (!nombre || !email || !password) {
        return err(new ValidationError('Nombre, correo y contraseña son obligatorios'));
      }

      if (pin && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
        return err(new ValidationError('El PIN debe contener entre 4 y 6 dígitos numéricos'));
      }

      const password_hash = await this.hasher.hash(password);
      const pin_hash = pin && pin.trim().length > 0 ? await this.hasher.hash(pin.trim()) : null;
      const pin_longitud = pin && pin.trim().length > 0 ? pin.trim().length : null;

      const nuevoUsuario = await this.repo.create({
        nombre,
        email,
        password_hash,
        pin_hash,
        pin_longitud,
      });

      return ok(nuevoUsuario);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(
        new UnexpectedError('El correo ya está registrado o hubo un error en la base de datos', {
          original: error?.message,
        })
      );
    }
  }
}
