import { IServicioRepository, UpdateServicioData } from '../../domain/servicio.repository.interface';
import { Servicio } from '../../domain/servicio.entity';
import { UpdateServicioSchema } from '../schemas';
import {
  Result,
  ok,
  err,
  AppError,
  ValidationError,
  UnexpectedError,
  isValidId,
  roundMoney,
  parseLocalDate,
} from '@/modules/shared';
import { defaultServicioRepository } from '../../infrastructure/prisma-servicio.repository';

export interface UpdateServicioDTO {
  id: string;
  nombre_servicio: string;
  monto: number;
  periodicidad_meses?: number;
  numero_cuenta?: string | null;
  numero_factura?: string | null;
  dia_vencimiento_raw?: string | null;
  fecha_vencimiento_raw?: string | null;
  responsable_id?: string | null;
}

export class UpdateServicioUseCase {
  constructor(private readonly repo: IServicioRepository = defaultServicioRepository) {}

  async execute(dto: UpdateServicioDTO): Promise<Result<Servicio, AppError>> {
    try {
      if (!isValidId(dto.id)) {
        return err(new ValidationError('Identificador del servicio inválido'));
      }

      const nombre_servicio = dto.nombre_servicio?.trim();
      if (!nombre_servicio) {
        return err(new ValidationError('El nombre es obligatorio'));
      }

      const monto = roundMoney(dto.monto);
      if (isNaN(monto) || monto <= 0) {
        return err(new ValidationError('Monto inválido'));
      }

      if (dto.responsable_id && dto.responsable_id.trim() !== '' && !isValidId(dto.responsable_id)) {
        return err(new ValidationError('Identificador de responsable inválido'));
      }

      const parsedSchema = UpdateServicioSchema.safeParse({
        nombre_servicio,
        monto,
        fecha_vencimiento: dto.fecha_vencimiento_raw ?? null,
        periodicidad_meses:
          dto.periodicidad_meses && dto.periodicidad_meses >= 1 ? dto.periodicidad_meses : 1,
        numero_cuenta: dto.numero_cuenta,
        numero_factura: dto.numero_factura,
        responsable_id: dto.responsable_id,
      });
      if (!parsedSchema.success) {
        return err(
          new ValidationError(
            parsedSchema.error.issues[0]?.message || 'Datos de servicio inválidos'
          )
        );
      }

      const dataToUpdate: UpdateServicioData = {
        nombre_servicio,
        monto,
        periodicidad_meses:
          dto.periodicidad_meses && dto.periodicidad_meses >= 1 ? dto.periodicidad_meses : 1,
        numero_cuenta: dto.numero_cuenta?.trim() || null,
        numero_factura: dto.numero_factura?.trim() || null,
      };

      if (dto.responsable_id !== undefined) {
        dataToUpdate.responsable_id = dto.responsable_id?.trim() || null;
      }

      if (dto.dia_vencimiento_raw) {
        const dv = parseInt(dto.dia_vencimiento_raw, 10);
        if (!isNaN(dv) && dv >= 1 && dv <= 31) {
          dataToUpdate.dia_vencimiento = dv;
        }
      }

      if (dto.fecha_vencimiento_raw) {
        const fv = parseLocalDate(dto.fecha_vencimiento_raw);
        if (!isNaN(fv.getTime())) {
          dataToUpdate.fecha_vencimiento = fv;
        }
      }

      const actualizado = await this.repo.update(dto.id.trim(), dataToUpdate);
      return ok(actualizado);
    } catch (error) {
      if (error instanceof AppError) return err(error);
      const message = error instanceof Error ? error.message : 'Error inesperado';
      return err(new UnexpectedError('No se pudo actualizar el servicio', { original: message }));
    }
  }
}
