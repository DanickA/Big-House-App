import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { ISessionService } from '../../domain/session.service.interface';
import { Result, ok, err, AppError, ValidationError, ConflictError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';
import { defaultSessionService } from '../../infrastructure/jose-session.service';

export interface RegistroNuevoMiembroDTO {
  nombre: string;
  email: string;
  password: string;
  pin?: string | null;
}

export class RegistroNuevoMiembroUseCase {
  constructor(
    private readonly repo: IHabitanteRepository = defaultHabitanteRepository,
    private readonly hasher: IPasswordHasher = defaultPasswordHasher,
    private readonly sessionService: ISessionService = defaultSessionService
  ) {}

  async execute(dto: RegistroNuevoMiembroDTO): Promise<Result<{ id: string; nombre: string; email: string }, AppError>> {
    try {
      const nombre = dto.nombre?.trim();
      const email = dto.email?.toLowerCase().trim();
      const password = dto.password;
      const pin = dto.pin?.trim() || null;

      if (!nombre || !email || !password) {
        return err(new ValidationError('Nombre, correo y contraseña son obligatorios'));
      }

      if (password.length < 4) {
        return err(new ValidationError('La contraseña debe tener al menos 4 caracteres'));
      }

      if (pin && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
        return err(new ValidationError('El PIN debe contener entre 4 y 6 dígitos numéricos'));
      }

      const usuarioExistente = await this.repo.findByEmail(email);
      if (usuarioExistente) {
        return err(new ConflictError('El correo electrónico ya se encuentra registrado'));
      }

      const password_hash = await this.hasher.hash(password);
      const pin_hash = pin ? await this.hasher.hash(pin) : null;
      const pin_longitud = pin ? pin.length : null;

      const nuevoUsuario = await this.repo.create({
        nombre,
        email,
        password_hash,
        pin_hash,
        pin_longitud,
      });

      await this.sessionService.createSession(nuevoUsuario.id, nuevoUsuario.nombre, nuevoUsuario.email);

      return ok({
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
      });
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('No se pudo registrar el usuario en la base de datos', { original: error?.message }));
    }
  }
}
