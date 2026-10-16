import { IPagoRepository } from '../../domain/pago.repository.interface';
import { PagoHistorialItem } from '../../domain/pago.entity';
import { Result, ok, err, AppError, UnexpectedError } from '@/modules/shared';
import { defaultPagoRepository } from '../../infrastructure/prisma-pago.repository';

export class GetHistorialPagosUseCase {
  constructor(private readonly repo: IPagoRepository = defaultPagoRepository) {}

  async execute(servicioId: string): Promise<Result<PagoHistorialItem[], AppError>> {
    try {
      const data = await this.repo.findHistorialByServicio(servicioId);
      return ok(data);
    } catch (error: any) {
      return err(new UnexpectedError('No se pudo cargar el historial de pagos', { original: error?.message }));
    }
  }
}
