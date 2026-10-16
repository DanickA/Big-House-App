import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { ISessionService } from '../../domain/session.service.interface';
import { Result, ok, err, AppError, ValidationError, UnauthorizedError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';
import { defaultSessionService } from '../../infrastructure/jose-session.service';

export interface LoginTradicionalDTO {
  email: string;
  password: string;
}

export class LoginTradicionalUseCase {
  constructor(
    private readonly repo: IHabitanteRepository = defaultHabitanteRepository,
    private readonly hasher: IPasswordHasher = defaultPasswordHasher,
    private readonly sessionService: ISessionService = defaultSessionService
  ) {}

  async execute(dto: LoginTradicionalDTO): Promise<Result<{ id: string; nombre: string; email: string }, AppError>> {
    try {
      const email = dto.email?.toLowerCase().trim();
      const password = dto.password;

      if (!email || !password) {
        return err(new ValidationError('Todos los campos son obligatorios'));
      }

      const usuario = await this.repo.findByEmail(email);
      if (!usuario) {
        return err(new UnauthorizedError('Credenciales inválidas'));
      }

      let esValido = await this.hasher.compare(password, usuario.password_hash);

      if (!esValido && usuario.password_hash === password) {
        esValido = true;
        const nuevoHash = await this.hasher.hash(password);
        await this.repo.update(usuario.id, { password_hash: nuevoHash });
      }

      if (!esValido) {
        return err(new UnauthorizedError('Credenciales inválidas'));
      }

      await this.sessionService.createSession(usuario.id, usuario.nombre, usuario.email);

      return ok({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      });
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('Ocurrió un error al iniciar sesión', { original: error?.message }));
    }
  }
}
