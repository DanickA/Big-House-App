import { IHabitanteRepository } from '../../domain/habitante.repository.interface';
import { IPasswordHasher } from '../../domain/password-hasher.service.interface';
import { ISessionService } from '../../domain/session.service.interface';
import { Result, ok, err, AppError, ValidationError, NotFoundError, UnauthorizedError, UnexpectedError } from '@/modules/shared';
import { defaultHabitanteRepository } from '../../infrastructure/prisma-habitante.repository';
import { defaultPasswordHasher } from '../../infrastructure/bcrypt-password-hasher.service';
import { defaultSessionService } from '../../infrastructure/jose-session.service';

export interface LoginConCredencialesDTO {
  usuarioId: string;
  credential: string;
  usarPin?: boolean;
}

export interface LoginResultData {
  id: string;
  nombre: string;
  email: string;
}

export class LoginConCredencialesUseCase {
  constructor(
    private readonly repo: IHabitanteRepository = defaultHabitanteRepository,
    private readonly hasher: IPasswordHasher = defaultPasswordHasher,
    private readonly sessionService: ISessionService = defaultSessionService
  ) {}

  async execute(dto: LoginConCredencialesDTO): Promise<Result<LoginResultData, AppError>> {
    try {
      const usuarioId = dto.usuarioId?.trim();
      const credLimpia = dto.credential?.trim();
      const usarPin = dto.usarPin ?? false;

      if (!usuarioId || !credLimpia) {
        return err(new ValidationError('Por favor ingresa tu clave o PIN'));
      }

      const usuario = await this.repo.findById(usuarioId);
      if (!usuario) {
        return err(new NotFoundError('Usuario no encontrado'));
      }

      let esValido = false;

      if (usarPin && usuario.pin_hash) {
        esValido = await this.hasher.compare(credLimpia, usuario.pin_hash);
      }

      if (!esValido) {
        esValido = await this.hasher.compare(credLimpia, usuario.password_hash);
      }

      // Fallback para actualización de texto plano previo
      if (!esValido && usuario.password_hash === credLimpia) {
        esValido = true;
        const nuevoHash = await this.hasher.hash(credLimpia);
        await this.repo.update(usuario.id, { password_hash: nuevoHash });
      }

      if (!esValido) {
        return err(
          new UnauthorizedError(usarPin ? 'PIN o contraseña incorrectos' : 'Contraseña incorrecta')
        );
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
