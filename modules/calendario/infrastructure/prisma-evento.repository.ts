import { prisma, PrismaDbClient } from '@/lib/prisma';
import { projectAnnualDate, projectMonthlyDate, roundMoney } from '@/modules/shared';
import {
  IEventoRepository,
  CreateEventoData,
  UpdateEventoData,
} from '../domain/evento.repository.interface';
import {
  Evento,
  EventoConRelaciones,
  EventoUnificado,
  SubtareaEvento,
  EstadoEvento,
  TipoPlantilla,
} from '../domain/evento.entity';

export class PrismaEventoRepository implements IEventoRepository {
  constructor(private readonly db: PrismaDbClient = prisma) {}

  async findById(id: string): Promise<EventoConRelaciones | null> {
    const ev = await this.db.eventos.findUnique({
      where: { id },
      include: {
        participantes: true,
        externos: true,
        subtareas: true,
      },
    });
    return ev as unknown as EventoConRelaciones | null;
  }

  async findEventosUnificados(mes: number, anio: number): Promise<EventoUnificado[]> {
    const fechaInicioRange = new Date(anio, mes - 1, -7, 0, 0, 0);
    const fechaFinRange = new Date(anio, mes, 14, 23, 59, 59);

    const [eventosManuales, eventosRecurrentesPasados, tareasRiego, serviciosPendientes] =
      await Promise.all([
        this.db.eventos.findMany({
          where: {
            fecha_inicio: {
              gte: fechaInicioRange,
              lte: fechaFinRange,
            },
            estado: { in: ['ACTIVO', 'CANCELADO'] },
          },
          include: {
            creador: { select: { nombre: true } },
            participantes: { select: { id: true, nombre: true } },
            subtareas: true,
          },
          orderBy: { fecha_inicio: 'asc' },
        }),

        this.db.eventos.findMany({
          where: {
            recurrencia: { in: ['ANUAL', 'MENSUAL', 'SEMANAL'] },
            estado: { in: ['ACTIVO', 'CANCELADO'] },
            fecha_inicio: { lt: fechaInicioRange },
          },
          include: {
            creador: { select: { nombre: true } },
            participantes: { select: { id: true, nombre: true } },
            subtareas: true,
          },
        }),

        this.db.tareas_cuidado.findMany({
          where: {
            tipo_tarea: 'RIEGO',
            proxima_fecha: {
              gte: fechaInicioRange,
              lte: fechaFinRange,
            },
          },
          include: {
            plantas: { select: { id: true, nombre_comun: true, ubicacion: true } },
          },
        }),

        this.db.servicios.findMany({
          where: {
            activo: true,
            fecha_vencimiento: {
              gte: fechaInicioRange,
              lte: fechaFinRange,
            },
            estado: 'PENDIENTE',
          },
          select: {
            id: true,
            nombre_servicio: true,
            monto: true,
            fecha_vencimiento: true,
          },
        }),
      ]);

    const listaUnificada: EventoUnificado[] = [];

    for (const ev of eventosManuales) {
      listaUnificada.push({
        id: ev.id,
        titulo: ev.titulo,
        descripcion: ev.descripcion,
        tipo_plantilla: ev.tipo_plantilla as TipoPlantilla,
        estado: ev.estado as EstadoEvento,
        fecha_inicio: ev.fecha_inicio,
        fecha_fin: ev.fecha_fin,
        todo_el_dia: ev.todo_el_dia,
        color: ev.color,
        ubicacion: ev.ubicacion,
        recurrencia: ev.recurrencia,
        origen: 'MANUAL',
        google_event_id: ev.google_event_id || null,
        creador: ev.creador,
        participantes: ev.participantes,
        detalles: ev.detalles as Record<string, unknown> | null,
        subtareas: ev.subtareas,
      });
    }

    const pushProjectedOccurrence = (
      ev: (typeof eventosRecurrentesPasados)[number],
      fechaOcurrInicio: Date,
      fechaOcurrFin: Date
    ) => {
      const ymdKey = `${fechaOcurrInicio.getFullYear()}-${String(fechaOcurrInicio.getMonth() + 1).padStart(2, '0')}-${String(fechaOcurrInicio.getDate()).padStart(2, '0')}`;
      const alreadyExists = listaUnificada.some(
        (existing) =>
          (existing.id === ev.id || existing.id.startsWith(`${ev.id}-`)) &&
          new Date(existing.fecha_inicio).getFullYear() === fechaOcurrInicio.getFullYear() &&
          new Date(existing.fecha_inicio).getMonth() === fechaOcurrInicio.getMonth() &&
          new Date(existing.fecha_inicio).getDate() === fechaOcurrInicio.getDate()
      );
      if (alreadyExists) return;

      const occurrenceId =
        ev.recurrencia === 'ANUAL' && !listaUnificada.some((e) => e.id === ev.id)
          ? ev.id
          : `${ev.id}-${ymdKey}`;

      listaUnificada.push({
        id: occurrenceId,
        titulo: ev.titulo,
        descripcion: ev.descripcion,
        tipo_plantilla: ev.tipo_plantilla as TipoPlantilla,
        estado: ev.estado as EstadoEvento,
        fecha_inicio: fechaOcurrInicio,
        fecha_fin: fechaOcurrFin,
        todo_el_dia: ev.todo_el_dia,
        color: ev.color,
        ubicacion: ev.ubicacion,
        recurrencia: ev.recurrencia,
        origen: 'MANUAL',
        google_event_id: ev.google_event_id || null,
        creador: ev.creador,
        participantes: ev.participantes,
        detalles: ev.detalles as Record<string, unknown> | null,
        subtareas: ev.subtareas,
      });
    };

    const aniosEnRango = Array.from(
      new Set([fechaInicioRange.getFullYear(), anio, fechaFinRange.getFullYear()])
    );

    const mesesEnRango: Array<{ year: number; monthIndex: number }> = [];
    const cursorMes = new Date(
      fechaInicioRange.getFullYear(),
      fechaInicioRange.getMonth(),
      1,
      0,
      0,
      0
    );
    while (
      cursorMes.getFullYear() < fechaFinRange.getFullYear() ||
      (cursorMes.getFullYear() === fechaFinRange.getFullYear() &&
        cursorMes.getMonth() <= fechaFinRange.getMonth())
    ) {
      mesesEnRango.push({ year: cursorMes.getFullYear(), monthIndex: cursorMes.getMonth() });
      cursorMes.setMonth(cursorMes.getMonth() + 1);
    }

    for (const ev of eventosRecurrentesPasados) {
      const origInicio = new Date(ev.fecha_inicio);
      const origFin = new Date(ev.fecha_fin);
      const duracionMs = Math.max(0, origFin.getTime() - origInicio.getTime());

      if (ev.recurrencia === 'ANUAL') {
        for (const targetYear of aniosEnRango) {
          if (targetYear < origInicio.getFullYear()) continue;
          const fechaOcurrInicio = projectAnnualDate(origInicio, targetYear);
          const fechaOcurrFin = new Date(fechaOcurrInicio.getTime() + duracionMs);
          if (fechaOcurrInicio >= fechaInicioRange && fechaOcurrInicio <= fechaFinRange) {
            pushProjectedOccurrence(ev, fechaOcurrInicio, fechaOcurrFin);
          }
        }
      } else if (ev.recurrencia === 'MENSUAL') {
        for (const { year, monthIndex } of mesesEnRango) {
          if (
            year < origInicio.getFullYear() ||
            (year === origInicio.getFullYear() && monthIndex < origInicio.getMonth())
          ) {
            continue;
          }
          const fechaOcurrInicio = projectMonthlyDate(origInicio, year, monthIndex);
          const fechaOcurrFin = new Date(fechaOcurrInicio.getTime() + duracionMs);
          if (fechaOcurrInicio >= fechaInicioRange && fechaOcurrInicio <= fechaFinRange) {
            pushProjectedOccurrence(ev, fechaOcurrInicio, fechaOcurrFin);
          }
        }
      } else if (ev.recurrencia === 'SEMANAL') {
        const weekMs = 7 * 86_400_000;
        const diffStartMs = fechaInicioRange.getTime() - origInicio.getTime();
        const startWeeks = Math.max(1, Math.floor(diffStartMs / weekMs));
        let candidateInicio = new Date(origInicio.getTime() + startWeeks * weekMs);
        while (candidateInicio <= fechaFinRange) {
          if (candidateInicio >= fechaInicioRange) {
            const candidateFin = new Date(candidateInicio.getTime() + duracionMs);
            pushProjectedOccurrence(ev, new Date(candidateInicio), candidateFin);
          }
          candidateInicio = new Date(candidateInicio.getTime() + weekMs);
        }
      }
    }

    for (const tr of tareasRiego) {
      const fecha = new Date(tr.proxima_fecha);
      fecha.setHours(9, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(9, 30, 0, 0);

      listaUnificada.push({
        id: `planta-${tr.id}`,
        titulo: `Riego: ${tr.plantas.nombre_comun}`,
        descripcion: `Ubicación: ${tr.plantas.ubicacion}`,
        tipo_plantilla: TipoPlantilla.TAREA,
        fecha_inicio: fecha,
        fecha_fin: fin,
        todo_el_dia: true,
        color: '#54749d',
        ubicacion: tr.plantas.ubicacion,
        origen: 'PLANTA',
        metadata: { plantaId: tr.plantas.id },
      });
    }

    for (const s of serviciosPendientes) {
      const fecha = new Date(s.fecha_vencimiento);
      fecha.setHours(12, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(12, 30, 0, 0);
      const montoRedondeado = roundMoney(Number(s.monto));

      listaUnificada.push({
        id: `servicio-${s.id}`,
        titulo: `Vence: ${s.nombre_servicio}`,
        descripcion: `Monto: $${montoRedondeado.toLocaleString('es-CO')}`,
        tipo_plantilla: TipoPlantilla.COMPRAS,
        fecha_inicio: fecha,
        fecha_fin: fin,
        todo_el_dia: true,
        color: '#3e6190',
        ubicacion: 'Pago de Servicios',
        origen: 'SERVICIO',
        metadata: { servicioId: s.id, monto: montoRedondeado },
      });
    }

    listaUnificada.sort(
      (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
    );
    return listaUnificada;
  }

  async create(data: CreateEventoData): Promise<EventoConRelaciones> {
    const created = await this.db.eventos.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        tipo_plantilla: data.tipo_plantilla,
        estado: data.estado || EstadoEvento.ACTIVO,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        todo_el_dia: data.todo_el_dia,
        color: data.color,
        ubicacion: data.ubicacion || null,
        recurrencia: data.recurrencia || null,
        detalles: data.detalles !== undefined ? (data.detalles as object) : undefined,
        creador_id: data.creador_id,
        participantes:
          data.participantes_ids && data.participantes_ids.length > 0
            ? {
                connect: data.participantes_ids.map((id) => ({ id })),
              }
            : undefined,
        externos:
          data.externos && data.externos.length > 0
            ? {
                create: data.externos,
              }
            : undefined,
        subtareas:
          data.subtareas && data.subtareas.length > 0
            ? {
                create: data.subtareas.map((s) => ({
                  descripcion: s.descripcion,
                  asignado_id: s.asignado_id || null,
                  completado: s.completado || false,
                })),
              }
            : undefined,
        recordatorios:
          data.recordatorios && data.recordatorios.length > 0
            ? {
                create: data.recordatorios.map((r) => ({
                  tipo_canal: r.tipo_canal,
                  minutos_anticipacion: r.minutos_anticipacion,
                  fecha_programada: new Date(
                    data.fecha_inicio.getTime() - r.minutos_anticipacion * 60000
                  ),
                })),
              }
            : undefined,
      },
    });
    return created as unknown as EventoConRelaciones;
  }

  async update(id: string, data: UpdateEventoData): Promise<EventoConRelaciones> {
    const updateData: Record<string, unknown> = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.tipo_plantilla !== undefined) updateData.tipo_plantilla = data.tipo_plantilla;
    if (data.fecha_inicio !== undefined) updateData.fecha_inicio = data.fecha_inicio;
    if (data.fecha_fin !== undefined) updateData.fecha_fin = data.fecha_fin;
    if (data.todo_el_dia !== undefined) updateData.todo_el_dia = data.todo_el_dia;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.ubicacion !== undefined) updateData.ubicacion = data.ubicacion;
    if (data.recurrencia !== undefined) updateData.recurrencia = data.recurrencia;
    if (data.detalles !== undefined) updateData.detalles = data.detalles;
    if (data.estado !== undefined) updateData.estado = data.estado;

    if (data.participantes_ids !== undefined) {
      updateData.participantes = {
        set: data.participantes_ids.map((uid) => ({ id: uid })),
      };
    }

    if (
      data.fecha_inicio !== undefined &&
      typeof this.db.recordatorios_evento?.findMany === 'function'
    ) {
      const recordatorios = await this.db.recordatorios_evento.findMany({
        where: { evento_id: id },
      });
      for (const rec of recordatorios) {
        const nuevaProgramada = new Date(
          data.fecha_inicio.getTime() - rec.minutos_anticipacion * 60000
        );
        await this.db.recordatorios_evento.update({
          where: { id: rec.id },
          data: { fecha_programada: nuevaProgramada, enviado: false },
        });
      }
    }

    if (data.subtareas !== undefined) {
      const ops: Promise<unknown>[] = [
        this.db.subtareas_evento.deleteMany({
          where: { evento_id: id },
        }),
      ];
      if (data.subtareas.length > 0) {
        ops.push(
          this.db.subtareas_evento.createMany({
            data: data.subtareas.map((s) => ({
              evento_id: id,
              descripcion: s.descripcion,
              completado: s.completado || false,
              asignado_id: s.asignado_id || null,
            })),
          })
        );
      }
      ops.push(
        this.db.eventos.update({
          where: { id },
          data: updateData,
        })
      );

      const maybeTx = (this.db as { $transaction?: (p: Promise<unknown>[]) => Promise<unknown[]> })
        .$transaction;
      if (typeof maybeTx === 'function') {
        const results = await maybeTx.call(this.db, ops);
        return results[results.length - 1] as unknown as EventoConRelaciones;
      }

      const results = await Promise.all(ops);
      return results[results.length - 1] as unknown as EventoConRelaciones;
    }

    const updated = await this.db.eventos.update({
      where: { id },
      data: updateData,
    });
    return updated as unknown as EventoConRelaciones;
  }

  async updateFechas(id: string, fechaInicio: Date, fechaFin: Date): Promise<void> {
    await this.db.eventos.update({
      where: { id },
      data: {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      },
    });
  }

  async cancelarLogico(id: string): Promise<Evento> {
    const updateEventoPromise = this.db.eventos.update({
      where: { id },
      data: { estado: EstadoEvento.CANCELADO },
    });
    const updateRecordatoriosPromise = this.db.recordatorios_evento.updateMany({
      where: { evento_id: id, enviado: false },
      data: { enviado: true },
    });

    const maybeTx = (this.db as { $transaction?: (p: Promise<unknown>[]) => Promise<unknown[]> })
      .$transaction;
    if (typeof maybeTx === 'function') {
      const [evento] = await maybeTx.call(this.db, [
        updateEventoPromise,
        updateRecordatoriosPromise,
      ]);
      return evento as unknown as Evento;
    }

    const [evento] = await Promise.all([updateEventoPromise, updateRecordatoriosPromise]);
    return evento as unknown as Evento;
  }

  async delete(id: string): Promise<void> {
    await this.db.eventos.delete({
      where: { id },
    });
  }

  async toggleSubtarea(id: string, completado: boolean): Promise<SubtareaEvento> {
    return this.db.subtareas_evento.update({
      where: { id },
      data: { completado },
    });
  }
}

export const defaultEventoRepository = new PrismaEventoRepository();
