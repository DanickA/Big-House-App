import { IServicioRepository } from '../../domain/servicio.repository.interface';
import { IPagoRepository } from '../../domain/pago.repository.interface';
import { IFileStorageService } from '../../domain/file-storage.service.interface';
import { RegistrarPagoSchema } from '../schemas';
import {
  IUnitOfWork,
  Result,
  ok,
  err,
  AppError,
  ValidationError,
  NotFoundError,
  ConcurrencyError,
  DuplicateError,
  UnexpectedError,
  calcularProximaFechaVencimientoPura,
  isValidId,
  roundMoney,
  parseLocalDate,
  toCalendarYMD,
} from '@/modules/shared';
import { defaultServicioRepository, PrismaServicioRepository } from '../../infrastructure/prisma-servicio.repository';
import { defaultPagoRepository, PrismaPagoRepository } from '../../infrastructure/prisma-pago.repository';
import { defaultStorageService } from '../../infrastructure/storage-adapter.service';
import { defaultUnitOfWork } from '../../infrastructure/prisma-unit-of-work';

export interface RegistrarPagoServicioDTO {
  servicio_id: string;
  monto_pagado: number;
  usuario_id: string;
  fecha_pago_raw?: string | null;
  observaciones?: string | null;
  comprobanteFile?: File | null;
  fecha_vencimiento_esperada?: string | null;
}

export interface RegistrarPagoResultData {
  pagoId: string;
  proximoVencimiento: string;
  montoPresupuestado?: number;
  diferenciaPresupuesto?: number;
}

export class RegistrarPagoServicioUseCase {
  constructor(
    private readonly servicioRepo: IServicioRepository = defaultServicioRepository,
    private readonly pagoRepo: IPagoRepository = defaultPagoRepository,
    private readonly storageService: IFileStorageService = defaultStorageService,
    private readonly uow: IUnitOfWork = defaultUnitOfWork
  ) {}

  async execute(dto: RegistrarPagoServicioDTO): Promise<Result<RegistrarPagoResultData, AppError>> {
    try {
      const servicio_id = dto.servicio_id?.trim();
      if (!servicio_id || !isValidId(servicio_id)) {
        return err(new ValidationError('Identificador del servicio requerido'));
      }

      const monto_pagado = roundMoney(dto.monto_pagado);
      if (isNaN(monto_pagado) || monto_pagado <= 0) {
        return err(new ValidationError('Ingresa un monto pagado válido'));
      }

      const usuario_id = dto.usuario_id?.trim();
      if (!usuario_id || !isValidId(usuario_id)) {
        return err(new ValidationError('Usuario no autenticado'));
      }

      const parsedSchema = RegistrarPagoSchema.safeParse({
        servicio_id,
        monto_pagado,
        fecha_pago: dto.fecha_pago_raw ?? null,
        observaciones: dto.observaciones ?? null,
        fecha_vencimiento_esperada: dto.fecha_vencimiento_esperada ?? null,
      });
      if (!parsedSchema.success) {
        return err(
          new ValidationError(
            parsedSchema.error.issues[0]?.message || 'Datos de pago inválidos'
          )
        );
      }

      let fecha_pago: Date;
      if (dto.fecha_pago_raw) {
        fecha_pago = parseLocalDate(dto.fecha_pago_raw);
      } else {
        fecha_pago = new Date();
      }
      fecha_pago.setHours(12, 0, 0, 0);

      let comprobante_url: string | null = null;
      if (dto.comprobanteFile && dto.comprobanteFile.size > 0) {
        try {
          comprobante_url = await this.storageService.uploadComprobante(dto.comprobanteFile);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Error de almacenamiento';
          return err(
            new UnexpectedError(
              `Error al subir el comprobante (${msg}). Verifica la configuración de Cloudinary.`
            )
          );
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultado = await this.uow.run<RegistrarPagoResultData>(async (tx: any) => {
        const txServicioRepo = tx ? new PrismaServicioRepository(tx) : this.servicioRepo;
        const txPagoRepo = tx ? new PrismaPagoRepository(tx) : this.pagoRepo;

        // 1. Obtener y bloquear la fila del servicio (Pessimistic Locking)
        const servicio = await txServicioRepo.findAndLockById(servicio_id);
        if (!servicio) {
          throw new NotFoundError('El servicio especificado no existe');
        }

        // 2. Control de Concurrencia Optimista por Ciclo de Factura (F-01: comparación calendario exacta)
        if (dto.fecha_vencimiento_esperada) {
          const fechaActual = new Date(servicio.fecha_vencimiento);
          const ymdEsperada = toCalendarYMD(dto.fecha_vencimiento_esperada);
          const ymdActual = toCalendarYMD(fechaActual);
          const esMismoCiclo = ymdEsperada === ymdActual;

          if (!esMismoCiclo) {
            throw new ConcurrencyError(
              `Esta factura ya fue pagada o actualizada por otro habitante. El próximo vencimiento actual es el ${fechaActual.toLocaleDateString('es-CO')}.`,
              {
                proximoVencimiento: servicio.fecha_vencimiento.toISOString(),
                estado: servicio.estado,
              }
            );
          }
        }

        // 3. Ventana de Idempotencia Anti-Doble Clic (60 segundos)
        const esDuplicado = await txPagoRepo.findRecentDuplicate(servicio_id, monto_pagado, 60);
        if (esDuplicado) {
          throw new DuplicateError(
            'Ya se procesó un pago reciente con el mismo monto para este servicio. Por favor verifica el historial para evitar duplicados.'
          );
        }

        const montoPresupuestadoSnapshot = roundMoney(Number(servicio.monto || 0));

        // 4. Insertar pago conservando el snapshot del presupuesto estimado
        const nuevoPago = await txPagoRepo.createPago({
          servicio_id,
          usuario_id,
          monto_pagado,
          monto_presupuestado: montoPresupuestadoSnapshot > 0 ? montoPresupuestadoSnapshot : null,
          fecha_pago,
          comprobante_url,
          observaciones: dto.observaciones || null,
        });

        // 5. Insertar asiento de egreso
        const descripcionGasto = dto.observaciones
          ? `Pago ${servicio.nombre_servicio}: ${dto.observaciones}`
          : `Pago de servicio: ${servicio.nombre_servicio}`;

        await txPagoRepo.createGasto({
          descripcion: descripcionGasto.slice(0, 200),
          monto: monto_pagado,
          fecha: fecha_pago,
          categoria: 'SERVICIOS',
          usuario_id,
          servicio_id,
        });

        // 6. Calcular nueva fecha de vencimiento sin alterar el monto presupuestado del servicio
        const periodicidad = servicio.periodicidad_meses || 1;
        const diaVenc = servicio.dia_vencimiento;
        const nuevaFechaVencimiento = calcularProximaFechaVencimientoPura(
          fecha_pago,
          periodicidad,
          diaVenc
        );

        // 7. Actualizar servicio al próximo ciclo
        const servicioActualizado = await txServicioRepo.update(servicio_id, {
          fecha_vencimiento: nuevaFechaVencimiento,
          estado: 'PENDIENTE',
        });

        return {
          pagoId: nuevoPago.id,
          proximoVencimiento: servicioActualizado.fecha_vencimiento.toISOString(),
          montoPresupuestado: montoPresupuestadoSnapshot,
          diferenciaPresupuesto:
            montoPresupuestadoSnapshot > 0
              ? roundMoney(monto_pagado - montoPresupuestadoSnapshot)
              : 0,
        };
      });

      return ok(resultado);
    } catch (error) {
      if (error instanceof AppError) return err(error);
      const message =
        error instanceof Error ? error.message : 'Error al procesar la transacción de pago';
      return err(new UnexpectedError(message));
    }
  }
}
