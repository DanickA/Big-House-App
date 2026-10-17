import { IAporteFondoRepository } from '../../domain/aporte-fondo.repository.interface';
import { IFileStorageService } from '../../domain/file-storage.service.interface';
import { AporteFondoComun } from '../../domain/aporte-fondo.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultAporteFondoRepository } from '../../infrastructure/prisma-aporte-fondo.repository';
import { defaultStorageService } from '../../infrastructure/storage-adapter.service';

export interface RegistrarAporteFondoDTO {
  usuario_id: string;
  monto: number;
  periodo_mes?: string | null; // YYYY-MM
  fecha_raw?: string | null; // YYYY-MM-DD
  descripcion?: string | null;
  comprobanteFile?: File | null;
}

export class RegistrarAporteFondoUseCase {
  constructor(
    private readonly repo: IAporteFondoRepository = defaultAporteFondoRepository,
    private readonly storageService: IFileStorageService = defaultStorageService
  ) {}

  async execute(dto: RegistrarAporteFondoDTO): Promise<Result<AporteFondoComun, AppError>> {
    try {
      const usuario_id = dto.usuario_id?.trim();
      if (!usuario_id) {
        return err(new ValidationError('Selecciona el habitante que realiza el aporte'));
      }

      const monto = dto.monto;
      if (isNaN(monto) || monto <= 0) {
        return err(new ValidationError('Ingresa un monto de aporte válido mayor a 0'));
      }

      let fecha: Date;
      if (dto.fecha_raw && /^\d{4}-\d{2}-\d{2}$/.test(dto.fecha_raw)) {
        const [y, m, d] = dto.fecha_raw.split('-').map(Number);
        fecha = new Date(y, m - 1, d, 12, 0, 0, 0);
      } else if (dto.periodo_mes && /^\d{4}-\d{2}$/.test(dto.periodo_mes)) {
        const [y, m] = dto.periodo_mes.split('-').map(Number);
        const now = new Date();
        // Si es el mes actual usa el día de hoy; si es otro mes usa el día 1 de ese mes
        const day =
          now.getFullYear() === y && now.getMonth() + 1 === m ? now.getDate() : 1;
        fecha = new Date(y, m - 1, day, 12, 0, 0, 0);
      } else {
        fecha = new Date();
        fecha.setHours(12, 0, 0, 0);
      }

      let comprobante_url: string | null = null;
      if (dto.comprobanteFile && dto.comprobanteFile.size > 0) {
        try {
          comprobante_url = await this.storageService.uploadComprobante(dto.comprobanteFile);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Error de almacenamiento';
          return err(
            new UnexpectedError(
              `Error al subir el comprobante del aporte (${msg}). Verifica la configuración de Cloudinary.`
            )
          );
        }
      }

      const descripcion = (dto.descripcion?.trim() || 'Aporte al Fondo Común').slice(0, 200);

      const nuevoAporte = await this.repo.create({
        usuario_id,
        monto,
        fecha,
        descripcion,
        comprobante_url,
      });

      return ok(nuevoAporte);
    } catch (error) {
      if (error instanceof AppError) return err(error);
      const message = error instanceof Error ? error.message : 'Error inesperado';
      return err(new UnexpectedError('No se pudo registrar el aporte al Fondo Común', { original: message }));
    }
  }
}
