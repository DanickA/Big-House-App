import { IPlantaRepository } from '../../domain/planta.repository.interface';
import { IImageStorageService } from '../../domain/image-storage.service.interface';
import { Planta } from '../../domain/planta.entity';
import { Result, ok, err, AppError, ValidationError, UnexpectedError } from '@/modules/shared';
import { defaultPlantaRepository } from '../../infrastructure/prisma-planta.repository';
import { defaultImageStorageService } from '../../infrastructure/storage-image-adapter.service';

export interface CreatePlantaDTO {
  nombre_comun: string;
  ubicacion: string;
  especie?: string | null;
  foto?: File | null;
  frecuencia_riego?: number;
}

export class CreatePlantaUseCase {
  constructor(
    private readonly repo: IPlantaRepository = defaultPlantaRepository,
    private readonly storage: IImageStorageService = defaultImageStorageService
  ) {}

  async execute(dto: CreatePlantaDTO): Promise<Result<Planta, AppError>> {
    try {
      const nombre_comun = dto.nombre_comun?.trim();
      const ubicacion = dto.ubicacion?.trim();

      if (!nombre_comun || !ubicacion) {
        return err(new ValidationError('Ingresa el nombre y la ubicación de la planta'));
      }

      let foto_url: string | null = null;
      if (dto.foto && dto.foto.size > 0) {
        try {
          foto_url = await this.storage.uploadImage(dto.foto);
        } catch (uploadErr: any) {
          return err(
            new UnexpectedError(
              `Error al subir la foto (${uploadErr?.message || 'Error en almacenamiento'}). Por favor verifica la configuración de Cloudinary en Vercel.`
            )
          );
        }
      }

      const frecuencia_dias = dto.frecuencia_riego && dto.frecuencia_riego > 0 ? dto.frecuencia_riego : 7;

      const nueva = await this.repo.create({
        nombre_comun,
        ubicacion,
        especie: dto.especie?.trim() || null,
        foto_url,
        frecuencia_dias,
      });

      return ok(nueva);
    } catch (error: any) {
      if (error instanceof AppError) return err(error);
      return err(new UnexpectedError('No se pudo registrar la planta', { original: error?.message }));
    }
  }
}
