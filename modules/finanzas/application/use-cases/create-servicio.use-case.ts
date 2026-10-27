import { IServicioRepository } from '../../domain/servicio.repository.interface';
import { Servicio } from '../../domain/servicio.entity';
import { CreateServicioSchema } from '../schemas';
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

export interface CreateServicioDTO {
  nombre_servicio: string;
  monto: number;
  fecha_vencimiento_raw: string; // YYYY-MM-DD
  periodicidad_meses?: number;
  dia_vencimiento_raw?: string | null;
  numero_cuenta?: string | null;
  numero_factura?: string | null;
  responsable_id?: string | null;
}

export class CreateServicioUseCase {
  constructor(private readonly repo: IServicioRepository = defaultServicioRepository) {}

  async execute(dto: CreateServicioDTO): Promise<Result<Servicio, AppError>> {
    try {
      const nombre_servicio = dto.nombre_servicio?.trim();
      if (!nombre_servicio) {
        return err(new ValidationError('El nombre del servicio es obligatorio'));
      }

      const monto = roundMoney(dto.monto);
      if (isNaN(monto) || monto <= 0) {
        return err(new ValidationError('Ingresa un monto válido mayor a 0'));
      }

      if (!dto.fecha_vencimiento_raw) {
        return err(new ValidationError('Selecciona una fecha de vencimiento inicial'));
      }

      if (dto.responsable_id && dto.responsable_id.trim() !== '' && !isValidId(dto.responsable_id)) {
        return err(new ValidationError('Identificador de responsable inválido'));
      }

      const fecha_vencimiento = parseLocalDate(dto.fecha_vencimiento_raw);
      if (isNaN(fecha_vencimiento.getTime())) {
        return err(new ValidationError('Fecha de vencimiento inválida'));
      }

      const day = fecha_vencimiento.getDate();
      const dia_vencimiento_parsed = dto.dia_vencimiento_raw
        ? parseInt(dto.dia_vencimiento_raw, 10)
        : day;
      const dia_vencimiento =
        isNaN(dia_vencimiento_parsed) || dia_vencimiento_parsed < 1 || dia_vencimiento_parsed > 31
          ? day
          : dia_vencimiento_parsed;

      const periodicidad =
        dto.periodicidad_meses && dto.periodicidad_meses >= 1 ? dto.periodicidad_meses : 1;

      const parsedSchema = CreateServicioSchema.safeParse({
        nombre_servicio,
        monto,
        fecha_vencimiento: dto.fecha_vencimiento_raw,
        periodicidad_meses: periodicidad,
        dia_vencimiento,
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

      const nuevoServicio = await this.repo.create({
        nombre_servicio,
        monto,
        fecha_vencimiento,
        periodicidad_meses: periodicidad,
        dia_vencimiento,
        numero_cuenta: dto.numero_cuenta?.trim() || null,
        numero_factura: dto.numero_factura?.trim() || null,
        responsable_id: dto.responsable_id?.trim() || null,
        estado: 'PENDIENTE',
      });

      return ok(nuevoServicio);
    } catch (error) {
      if (error instanceof AppError) return err(error);
      const message = error instanceof Error ? error.message : 'Error inesperado';
      return err(new UnexpectedError('No se pudo crear el servicio', { original: message }));
    }
  }
}
