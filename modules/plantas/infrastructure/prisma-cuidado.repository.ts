import { prisma, PrismaDbClient } from '@/lib/prisma';
import { ICuidadoRepository } from '../domain/cuidado.repository.interface';
import { TareaCuidado, HistorialCuidado } from '../domain/planta.entity';

export class PrismaCuidadoRepository implements ICuidadoRepository {
  constructor(private readonly db: PrismaDbClient = prisma) {}

  async findTarea(plantaId: string, tipoTarea: string): Promise<TareaCuidado | null> {
    const t = await this.db.tareas_cuidado.findFirst({
      where: {
        planta_id: plantaId,
        tipo_tarea: tipoTarea,
      },
    });
    if (!t) return null;
    return {
      id: t.id,
      planta_id: t.planta_id,
      tipo_tarea: t.tipo_tarea,
      frecuencia_dias: t.frecuencia_dias,
      proxima_fecha: t.proxima_fecha,
    };
  }

  async createTarea(
    plantaId: string,
    tipoTarea: string,
    frecuenciaDias: number,
    proximaFecha: Date
  ): Promise<TareaCuidado> {
    const t = await this.db.tareas_cuidado.create({
      data: {
        planta_id: plantaId,
        tipo_tarea: tipoTarea,
        frecuencia_dias: frecuenciaDias,
        proxima_fecha: proximaFecha,
      },
    });
    return {
      id: t.id,
      planta_id: t.planta_id,
      tipo_tarea: t.tipo_tarea,
      frecuencia_dias: t.frecuencia_dias,
      proxima_fecha: t.proxima_fecha,
    };
  }

  async updateTareaProximaFecha(
    tareaId: string,
    nuevaFecha: Date,
    frecuenciaDias?: number
  ): Promise<void> {
    await this.db.tareas_cuidado.update({
      where: { id: tareaId },
      data: {
        proxima_fecha: nuevaFecha,
        ...(frecuenciaDias !== undefined && { frecuencia_dias: frecuenciaDias }),
      },
    });
  }

  async createHistorial(
    tareaId: string,
    usuarioId: string,
    observaciones?: string | null
  ): Promise<HistorialCuidado> {
    const h = await this.db.historial_cuidado.create({
      data: {
        tarea_id: tareaId,
        usuario_id: usuarioId,
        observaciones: observaciones || null,
      },
    });
    return {
      id: h.id,
      tarea_id: h.tarea_id,
      usuario_id: h.usuario_id,
      fecha_realizada: h.fecha_realizada,
      observaciones: h.observaciones,
    };
  }

  async registrarCuidadoAtomico(
    tareaId: string,
    usuarioId: string,
    observaciones?: string | null,
    nuevaProximaFecha?: Date
  ): Promise<HistorialCuidado> {
    const maybeTx = (this.db as { $transaction?: (p: Promise<unknown>[]) => Promise<unknown[]> })
      .$transaction;
    if (nuevaProximaFecha && typeof maybeTx === 'function') {
      const [h] = (await maybeTx.call(this.db, [
        this.db.historial_cuidado.create({
          data: {
            tarea_id: tareaId,
            usuario_id: usuarioId,
            observaciones: observaciones || null,
          },
        }),
        this.db.tareas_cuidado.update({
          where: { id: tareaId },
          data: { proxima_fecha: nuevaProximaFecha },
        }),
      ])) as [HistorialCuidado];
      return {
        id: h.id,
        tarea_id: h.tarea_id,
        usuario_id: h.usuario_id,
        fecha_realizada: h.fecha_realizada,
        observaciones: h.observaciones,
      };
    }

    if (nuevaProximaFecha) {
      await this.updateTareaProximaFecha(tareaId, nuevaProximaFecha);
    }
    return this.createHistorial(tareaId, usuarioId, observaciones);
  }

  async findHistorialByPlanta(plantaId: string): Promise<HistorialCuidado[]> {
    const list = await this.db.historial_cuidado.findMany({
      where: {
        tareas_cuidado: {
          planta_id: plantaId,
        },
      },
      include: {
        usuarios: {
          select: { nombre: true },
        },
        tareas_cuidado: {
          select: { tipo_tarea: true },
        },
      },
      orderBy: {
        fecha_realizada: 'desc',
      },
    });

    return list.map((h) => ({
      id: h.id,
      tarea_id: h.tarea_id,
      usuario_id: h.usuario_id,
      fecha_realizada: h.fecha_realizada,
      observaciones: h.observaciones,
      usuarios: h.usuarios,
      tareas_cuidado: h.tareas_cuidado,
    }));
  }

  async findHistorialById(historialId: string): Promise<HistorialCuidado | null> {
    const h = await this.db.historial_cuidado.findUnique({
      where: { id: historialId },
      include: {
        tareas_cuidado: true,
      },
    });
    if (!h) return null;
    return {
      id: h.id,
      tarea_id: h.tarea_id,
      usuario_id: h.usuario_id,
      fecha_realizada: h.fecha_realizada,
      observaciones: h.observaciones,
      tareas_cuidado: h.tareas_cuidado,
    };
  }

  async findUltimoCuidadoAnterior(
    tareaId: string,
    excludeHistorialId?: string
  ): Promise<HistorialCuidado | null> {
    const whereClause: { tarea_id: string; id?: { not: string } } = { tarea_id: tareaId };
    if (excludeHistorialId && excludeHistorialId.trim().length > 0) {
      whereClause.id = { not: excludeHistorialId.trim() };
    }

    const h = await this.db.historial_cuidado.findFirst({
      where: whereClause,
      orderBy: { fecha_realizada: 'desc' },
    });
    if (!h) return null;
    return {
      id: h.id,
      tarea_id: h.tarea_id,
      usuario_id: h.usuario_id,
      fecha_realizada: h.fecha_realizada,
      observaciones: h.observaciones,
    };
  }

  async deshacerCuidado(
    historialId: string,
    tareaId: string,
    nuevaProximaFecha: Date
  ): Promise<void> {
    const maybeTx = (this.db as { $transaction?: (p: Promise<unknown>[]) => Promise<unknown[]> })
      .$transaction;
    const ops = [
      this.db.historial_cuidado.delete({
        where: { id: historialId },
      }),
      this.db.tareas_cuidado.update({
        where: { id: tareaId },
        data: { proxima_fecha: nuevaProximaFecha },
      }),
    ];
    if (typeof maybeTx === 'function') {
      await maybeTx.call(this.db, ops);
      return;
    }
    await Promise.all(ops);
  }
}

export const defaultCuidadoRepository = new PrismaCuidadoRepository();
