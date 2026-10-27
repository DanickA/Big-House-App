import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { ISessionService } from '../../domain/session.service.interface';
import { RegistroNuevoMiembroSchema } from '../schemas';
import { Result, ok, err, AppError, ValidationError, ConflictError, UnauthorizedError, UnexpectedError } from '@/modules/shared';
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

  async execute(dto: RegistroNuevoMiembroDTO): Promise<Result<{ id: string; nombre: string; email: string; rol: string }, AppError>> {
    try {
      const nombre = dto.nombre?.trim();
      const email = dto.email?.toLowerCase().trim();
      const password = dto.password;
      const pin = dto.pin?.trim() || null;

      if (!nombre || !email || !password) {
        return err(new ValidationError('Nombre, correo y contraseña son obligatorios'));
      }

      const parsed = RegistroNuevoMiembroSchema.safeParse({
        nombre,
        email,
        password,
        pin,
      });
      if (!parsed.success) {
        return err(
          new ValidationError(parsed.error.issues[0]?.message || 'Datos de registro inválidos')
        );
      }

      const totalUsuarios = await this.repo.count();
      if (totalUsuarios > 0) {
        return err(
          new UnauthorizedError(
            'El registro público está deshabilitado. Solo un administrador del hogar puede agregar nuevos miembros.'
          )
        );
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
        rol: 'ADMIN',
        token_version: 1,
        activo: true,
      });

      await this.sessionService.createSession(
        nuevoUsuario.id,
        nuevoUsuario.nombre,
        nuevoUsuario.email,
        nuevoUsuario.rol,
        nuevoUsuario.token_version
      );

      return ok({
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      });
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('No se pudo registrar el usuario en la base de datos', { original: error?.message }));
    }
  }
}
