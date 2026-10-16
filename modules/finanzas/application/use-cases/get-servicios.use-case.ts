import { IServicioRepository } from '../../domain/servicio.repository.interface';
import { ServicioConEstado, ResumenServicios } from '../../domain/servicio.entity';
import { Result, ok, err, UnexpectedError, AppError } from '@/modules/shared';
import { defaultServicioRepository } from '../../infrastructure/prisma-servicio.repository';

export class GetServiciosUseCase {
  constructor(private readonly repo: IServicioRepository = defaultServicioRepository) {}

  async execute(): Promise<Result<{ servicios: ServicioConEstado[]; resumen: ResumenServicios }, AppError>> {
    try {
      const data = await this.repo.findServiciosConEstado();
      return ok(data);
    } catch (error: any) {
      return err(new UnexpectedError('No se pudieron obtener los servicios', { original: error?.message }));
    }
  }
}
