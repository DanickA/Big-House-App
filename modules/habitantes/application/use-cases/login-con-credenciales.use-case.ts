import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { ISessionService } from '../../domain/session.service.interface';
import { LoginCredencialesSchema } from '../schemas';
import { Result, ok, err, AppError, ValidationError, NotFoundError, UnauthorizedError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';
import { defaultSessionService } from '../../infrastructure/jose-session.service';
import { checkLoginRateLimit, recordFailedLoginAttempt, clearLoginRateLimit } from '@/lib/rate-limit';

export interface LoginConCredencialesDTO {
  usuarioId: string;
  credential: string;
  usarPin?: boolean;
}

export interface LoginResultData {
  id: string;
  nombre: string;
  email: string;
  rol?: string;
}

export class LoginConCredencialesUseCase {
  constructor(
    private readonly repo: IHabitanteRepository = defaultHabitanteRepository,
    private readonly hasher: IPasswordHasher = defaultPasswordHasher,
    private readonly sessionService: ISessionService = defaultSessionService
  ) {}

  async execute(dto: LoginConCredencialesDTO): Promise<Result<LoginResultData, AppError>> {
    try {
      const parsed = LoginCredencialesSchema.safeParse({
        usuarioId: dto.usuarioId?.trim() || '',
        credential: dto.credential?.trim() || '',
        usarPin: dto.usarPin ?? false,
      });
      if (!parsed.success) {
        return err(
          new ValidationError(parsed.error.issues[0]?.message || 'Por favor ingresa tu clave o PIN')
        );
      }

      const { usuarioId, credential: credLimpia, usarPin } = parsed.data;

      const rateCheck = checkLoginRateLimit(usuarioId);
      if (!rateCheck.allowed) {
        return err(
          new UnauthorizedError(
            `Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por ${Math.ceil(
              (rateCheck.lockoutRemainingSeconds || 900) / 60
            )} minutos.`
          )
        );
      }

      const usuario = await this.repo.findById(usuarioId);
      if (!usuario) {
        recordFailedLoginAttempt(usuarioId);
        return err(new NotFoundError('Usuario no encontrado'));
      }

      if (!usuario.activo) {
        return err(new UnauthorizedError('La cuenta de usuario está desactivada. Consulta a un administrador.'));
      }

      let esValido = false;

      if (usarPin && usuario.pin_hash) {
        esValido = await this.hasher.compare(credLimpia, usuario.pin_hash);
      }

      if (!esValido) {
        esValido = await this.hasher.compare(credLimpia, usuario.password_hash);
      }

      if (!esValido) {
        const attempt = recordFailedLoginAttempt(usuarioId);
        if (!attempt.allowed) {
          return err(
            new UnauthorizedError(
              'Has superado el límite de intentos permitidos. Tu cuenta ha sido bloqueada por 15 minutos.'
            )
          );
        }
        return err(
          new UnauthorizedError(
            usarPin
              ? `PIN incorrecto (${attempt.remainingAttempts} intentos restantes)`
              : `Contraseña incorrecta (${attempt.remainingAttempts} intentos restantes)`
          )
        );
      }

      clearLoginRateLimit(usuarioId);

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
