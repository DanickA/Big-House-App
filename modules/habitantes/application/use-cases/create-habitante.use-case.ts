import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { Habitante } from '../../domain/habitante.entity';
import { CreateHabitanteSchema } from '../schemas';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';

export interface CreateHabitanteDTO {
  nombre: string;
  email: string;
  password: string;
  pin?: string | null;
  rol?: 'ADMIN' | 'MIEMBRO';
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

      if (password.length < 8) {
        return err(new ValidationError('La contraseña debe tener al menos 8 caracteres'));
      }

      const parsed = CreateHabitanteSchema.safeParse({
        nombre,
        email,
        password,
        pin,
        rol: dto.rol,
      });
      if (!parsed.success) {
        return err(
          new ValidationError(parsed.error.issues[0]?.message || 'Datos de habitante inválidos')
        );
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
        rol: dto.rol ?? 'MIEMBRO',
        token_version: 1,
        activo: true,
      });

      // Se omiten los hashes sensibles de la respuesta al cliente
      return ok({
        ...nuevoUsuario,
        password_hash: '',
        pin_hash: null,
      });
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
