import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { ISessionService } from '../../domain/session.service.interface';
import { LoginTradicionalSchema } from '../schemas';
import { Result, ok, err, AppError, ValidationError, UnauthorizedError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';
import { defaultSessionService } from '../../infrastructure/jose-session.service';
import { checkLoginRateLimit, recordFailedLoginAttempt, clearLoginRateLimit } from '@/lib/rate-limit';

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

  async execute(dto: LoginTradicionalDTO): Promise<Result<{ id: string; nombre: string; email: string; rol?: string }, AppError>> {
    try {
      const email = dto.email?.toLowerCase().trim();
      const password = dto.password;

      if (!email || !password) {
        return err(new ValidationError('Todos los campos son obligatorios'));
      }

      const parsed = LoginTradicionalSchema.safeParse({ email, password });
      if (!parsed.success) {
        return err(
          new ValidationError(parsed.error.issues[0]?.message || 'Todos los campos son obligatorios')
        );
      }

      const rateCheck = checkLoginRateLimit(email);
      if (!rateCheck.allowed) {
        return err(
          new UnauthorizedError(
            `Demasiados intentos fallidos. Intenta nuevamente en ${Math.ceil(
              (rateCheck.lockoutRemainingSeconds || 900) / 60
            )} minutos.`
          )
        );
      }

      const usuario = await this.repo.findByEmail(email);
      if (!usuario) {
        recordFailedLoginAttempt(email);
        return err(new UnauthorizedError('Credenciales inválidas'));
      }

      if (!usuario.activo) {
        return err(new UnauthorizedError('La cuenta de usuario está desactivada. Consulta a un administrador.'));
      }

      const esValido = await this.hasher.compare(password, usuario.password_hash);

      if (!esValido) {
        const attempt = recordFailedLoginAttempt(email);
        if (!attempt.allowed) {
          return err(
            new UnauthorizedError(
              'Has superado el límite de intentos permitidos. Tu cuenta ha sido bloqueada por 15 minutos.'
            )
          );
        }
        return err(
          new UnauthorizedError(
            `Credenciales inválidas (${attempt.remainingAttempts} intentos restantes)`
          )
        );
      }

      clearLoginRateLimit(email);

      await this.sessionService.createSession(
        usuario.id,
        usuario.nombre,
        usuario.email,
        usuario.rol,
        usuario.token_version
      );

      return ok({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      });
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('Ocurrió un error al iniciar sesión', { original: error?.message }));
    }
  }
}
