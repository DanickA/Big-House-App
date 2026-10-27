import { IPlantaRepository, UpdatePlantaData } from '../../domain/planta.repository.interface';
import { ICuidadoRepository } from '../../domain/cuidado.repository.interface';
import { IImageStorageService } from '../../domain/image-storage.service.interface';
import { Planta } from '../../domain/planta.entity';
import { UpdatePlantaSchema } from '../schemas';
import {
  Result,
  ok,
  err,
  AppError,
  ValidationError,
  UnexpectedError,
  isValidId,
} from '@/modules/shared';
import { defaultPlantaRepository } from '../../infrastructure/prisma-planta.repository';
import { defaultCuidadoRepository } from '../../infrastructure/prisma-cuidado.repository';
import { defaultImageStorageService } from '../../infrastructure/storage-image-adapter.service';

export interface UpdatePlantaDTO {
  id: string;
  nombre_comun: string;
  ubicacion: string;
  especie?: string | null;
  foto?: File | null;
  frecuencia_riego?: number | null;
  nivel_luz?: string | null;
  nivel_agua?: string | null;
  estado_salud?: string | null;
  notas_cuidado?: string | null;
}

export class UpdatePlantaUseCase {
  constructor(
    private readonly plantaRepo: IPlantaRepository = defaultPlantaRepository,
    private readonly cuidadoRepo: ICuidadoRepository = defaultCuidadoRepository,
    private readonly storage: IImageStorageService = defaultImageStorageService
  ) {}

  async execute(dto: UpdatePlantaDTO): Promise<Result<Planta, AppError>> {
    try {
      if (!isValidId(dto.id)) {
        return err(new ValidationError('Identificador de planta inválido'));
      }
      const id = dto.id.trim();
      const nombre_comun = dto.nombre_comun?.trim();
      const ubicacion = dto.ubicacion?.trim();

      if (!nombre_comun || !ubicacion) {
        return err(new ValidationError('El nombre y la ubicación son obligatorios'));
      }

      const parsed = UpdatePlantaSchema.safeParse({
        nombre_comun,
        ubicacion,
        especie: dto.especie,
        frecuencia_riego: dto.frecuencia_riego && dto.frecuencia_riego > 0 ? dto.frecuencia_riego : null,
        nivel_luz: dto.nivel_luz,
        nivel_agua: dto.nivel_agua,
        estado_salud: dto.estado_salud,
        notas_cuidado: dto.notas_cuidado,
      });
      if (!parsed.success) {
        return err(
          new ValidationError(
            parsed.error.issues[0]?.message || 'El nombre y la ubicación son obligatorios'
          )
        );
      }

      const datosActualizados: UpdatePlantaData = {
        nombre_comun,
        ubicacion,
        especie: dto.especie?.trim() || null,
        ...(dto.nivel_luz !== undefined && { nivel_luz: dto.nivel_luz?.trim() || 'INDIRECTA' }),
        ...(dto.nivel_agua !== undefined && { nivel_agua: dto.nivel_agua?.trim() || 'MODERADA' }),
        ...(dto.estado_salud !== undefined && { estado_salud: dto.estado_salud?.trim() || 'SANA' }),
        ...(dto.notas_cuidado !== undefined && { notas_cuidado: dto.notas_cuidado?.trim() || null }),
      };

      let fotoAnteriorUrl: string | null | undefined = null;
      if (dto.foto && dto.foto.size > 0) {
        try {
          if (typeof this.plantaRepo.findById === 'function') {
            const plantaPrev = await this.plantaRepo.findById(id);
            fotoAnteriorUrl = plantaPrev?.foto_url;
          }
          datosActualizados.foto_url = await this.storage.uploadImage(dto.foto);
        } catch (uploadErr: any) {
          return err(
            new UnexpectedError(
              `Error al subir la foto (${uploadErr?.message || 'Error en almacenamiento'}). Por favor verifica la configuración de Cloudinary en Vercel.`
            )
          );
        }
      }

      const plantaActualizada = await this.plantaRepo.update(id, datosActualizados);

      if (fotoAnteriorUrl && datosActualizados.foto_url && fotoAnteriorUrl !== datosActualizados.foto_url) {
        await this.storage.deleteImage?.(fotoAnteriorUrl);
      }

      if (dto.frecuencia_riego && dto.frecuencia_riego > 0) {
        const freq = dto.frecuencia_riego;
        const tareaExistente = await this.cuidadoRepo.findTarea(id, 'RIEGO');

        if (tareaExistente) {
          const ultimoRiego = await this.cuidadoRepo.findUltimoCuidadoAnterior(tareaExistente.id);

          let nuevaProximaFecha = new Date();
          if (ultimoRiego?.fecha_realizada) {
            nuevaProximaFecha = new Date(ultimoRiego.fecha_realizada);
          }
          nuevaProximaFecha.setHours(0, 0, 0, 0);
          nuevaProximaFecha.setDate(nuevaProximaFecha.getDate() + freq);

          await this.cuidadoRepo.updateTareaProximaFecha(
            tareaExistente.id,
            nuevaProximaFecha,
            freq
          );
        } else {
          const proximaFecha = new Date();
          proximaFecha.setHours(0, 0, 0, 0);
          proximaFecha.setDate(proximaFecha.getDate() + freq);

          await this.cuidadoRepo.createTarea(id, 'RIEGO', freq, proximaFecha);
        }
      }

      return ok(plantaActualizada);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(
        new UnexpectedError('No se pudo actualizar la información', {
          original: error?.message,
        })
      );
    }
  }
}
