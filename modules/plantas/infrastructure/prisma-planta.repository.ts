import { prisma, PrismaDbClient } from '@/lib/prisma';
import {
  IPlantaRepository,
  CreatePlantaData,
  UpdatePlantaData,
} from '../domain/planta.repository.interface';
import { Planta, PlantaConEstado } from '../domain/planta.entity';

export class PrismaPlantaRepository implements IPlantaRepository {
  constructor(private readonly db: PrismaDbClient = prisma) {}

  async findById(id: string): Promise<Planta | null> {
    const p = await this.db.plantas.findUnique({
      where: { id },
    });
    if (!p) return null;
    return {
      id: p.id,
      nombre_comun: p.nombre_comun,
      especie: p.especie,
      ubicacion: p.ubicacion,
      foto_url: p.foto_url,
      nivel_luz: p.nivel_luz ?? 'INDIRECTA',
      nivel_agua: p.nivel_agua ?? 'MODERADA',
      estado_salud: p.estado_salud ?? 'SANA',
      notas_cuidado: p.notas_cuidado ?? null,
    };
  }

  async findAllWithStatus(): Promise<PlantaConEstado[]> {
    const plantas = await this.db.plantas.findMany({
      include: {
        tareas_cuidado: {
          where: { tipo_tarea: 'RIEGO' },
        },
      },
      orderBy: {
        nombre_comun: 'asc',
      },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return plantas.map((planta) => {
      const tareaRiego = planta.tareas_cuidado?.[0];
      let diasRestantes: number | null = null;
      let requiereRiego = false;

      if (tareaRiego?.proxima_fecha) {
        const prox = new Date(tareaRiego.proxima_fecha);
        prox.setHours(0, 0, 0, 0);
        const diffTiempo = prox.getTime() - hoy.getTime();
        diasRestantes = Math.round(diffTiempo / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 0) {
          requiereRiego = true;
        }
      }

      return {
        id: planta.id,
        nombre_comun: planta.nombre_comun,
        especie: planta.especie,
        ubicacion: planta.ubicacion,
        foto_url: planta.foto_url,
        nivel_luz: planta.nivel_luz ?? 'INDIRECTA',
        nivel_agua: planta.nivel_agua ?? 'MODERADA',
        estado_salud: planta.estado_salud ?? 'SANA',
        notas_cuidado: planta.notas_cuidado ?? null,
        diasRestantes,
        frecuencia_dias: tareaRiego?.frecuencia_dias ?? 7,
        requiereRiego,
      };
    });
  }

  async create(data: CreatePlantaData): Promise<Planta> {
    const proximaFecha = new Date();
    proximaFecha.setHours(0, 0, 0, 0);
    proximaFecha.setDate(proximaFecha.getDate() + data.frecuencia_dias);

    const nueva = await this.db.plantas.create({
      data: {
        nombre_comun: data.nombre_comun,
        ubicacion: data.ubicacion,
        especie: data.especie ?? null,
        foto_url: data.foto_url ?? null,
        nivel_luz: data.nivel_luz ?? 'INDIRECTA',
        nivel_agua: data.nivel_agua ?? 'MODERADA',
        estado_salud: data.estado_salud ?? 'SANA',
        notas_cuidado: data.notas_cuidado ?? null,
        tareas_cuidado: {
          create: {
            tipo_tarea: 'RIEGO',
            frecuencia_dias: data.frecuencia_dias,
            proxima_fecha: proximaFecha,
          },
        },
      },
    });

    return {
      id: nueva.id,
      nombre_comun: nueva.nombre_comun,
      especie: nueva.especie,
      ubicacion: nueva.ubicacion,
      foto_url: nueva.foto_url,
      nivel_luz: nueva.nivel_luz ?? 'INDIRECTA',
      nivel_agua: nueva.nivel_agua ?? 'MODERADA',
      estado_salud: nueva.estado_salud ?? 'SANA',
      notas_cuidado: nueva.notas_cuidado ?? null,
    };
  }

  async update(id: string, data: UpdatePlantaData): Promise<Planta> {
    const updated = await this.db.plantas.update({
      where: { id },
      data: {
        ...(data.nombre_comun !== undefined && { nombre_comun: data.nombre_comun }),
        ...(data.ubicacion !== undefined && { ubicacion: data.ubicacion }),
        ...(data.especie !== undefined && { especie: data.especie }),
        ...(data.foto_url !== undefined && { foto_url: data.foto_url }),
        ...(data.nivel_luz !== undefined && { nivel_luz: data.nivel_luz }),
        ...(data.nivel_agua !== undefined && { nivel_agua: data.nivel_agua }),
        ...(data.estado_salud !== undefined && { estado_salud: data.estado_salud }),
        ...(data.notas_cuidado !== undefined && { notas_cuidado: data.notas_cuidado }),
      },
    });

    return {
      id: updated.id,
      nombre_comun: updated.nombre_comun,
      especie: updated.especie,
      ubicacion: updated.ubicacion,
      foto_url: updated.foto_url,
      nivel_luz: updated.nivel_luz ?? 'INDIRECTA',
      nivel_agua: updated.nivel_agua ?? 'MODERADA',
      estado_salud: updated.estado_salud ?? 'SANA',
      notas_cuidado: updated.notas_cuidado ?? null,
    };
  }

  async delete(id: string): Promise<void> {
    await this.db.plantas.delete({
      where: { id },
    });
  }
}

export const defaultPlantaRepository = new PrismaPlantaRepository();
