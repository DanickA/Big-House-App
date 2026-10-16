import { prisma } from '@/lib/prisma';
import {
  IEventoRepository,
  CreateEventoData,
  UpdateEventoData,
} from '../domain/evento.repository.interface';
import { EventoUnificado, EstadoEvento } from '../domain/evento.entity';

export class PrismaEventoRepository implements IEventoRepository {
  constructor(private readonly db: any = prisma) {}

  async findById(id: string): Promise<any | null> {
    return this.db.eventos.findUnique({
      where: { id },
      include: {
        participantes: true,
        externos: true,
        subtareas: true,
      },
    });
  }

  async findEventosUnificados(mes: number, anio: number): Promise<EventoUnificado[]> {
    const fechaInicioRange = new Date(anio, mes - 1, -7, 0, 0, 0);
    const fechaFinRange = new Date(anio, mes, 14, 23, 59, 59);

    const [eventosManuales, eventosAnualesPasados, tareasRiego, serviciosPendientes] = await Promise.all([
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
          recurrencia: 'ANUAL',
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

    eventosManuales.forEach((ev: any) => {
      listaUnificada.push({
        id: ev.id,
        titulo: ev.titulo,
        descripcion: ev.descripcion,
        tipo_plantilla: ev.tipo_plantilla,
        estado: ev.estado,
        fecha_inicio: ev.fecha_inicio,
        fecha_fin: ev.fecha_fin,
        todo_el_dia: ev.todo_el_dia,
        color: ev.color,
        ubicacion: ev.ubicacion,
        recurrencia: ev.recurrencia,
        origen: 'MANUAL',
        creador: ev.creador,
        participantes: ev.participantes,
        detalles: ev.detalles,
        subtareas: ev.subtareas,
      });
    });

    eventosAnualesPasados.forEach((ev: any) => {
      const fechaOcurrInicio = new Date(ev.fecha_inicio);
      fechaOcurrInicio.setFullYear(anio);
      const fechaOcurrFin = new Date(ev.fecha_fin);
      fechaOcurrFin.setFullYear(anio);

      if (fechaOcurrInicio >= fechaInicioRange && fechaOcurrInicio <= fechaFinRange) {
        if (!listaUnificada.some((e) => e.id === ev.id)) {
          listaUnificada.push({
            id: ev.id,
            titulo: ev.titulo,
            descripcion: ev.descripcion,
            tipo_plantilla: ev.tipo_plantilla,
            estado: ev.estado,
            fecha_inicio: fechaOcurrInicio,
            fecha_fin: fechaOcurrFin,
            todo_el_dia: ev.todo_el_dia,
            color: ev.color,
            ubicacion: ev.ubicacion,
            recurrencia: ev.recurrencia,
            origen: 'MANUAL',
            creador: ev.creador,
            participantes: ev.participantes,
            detalles: ev.detalles,
            subtareas: ev.subtareas,
          });
        }
      }
    });

    tareasRiego.forEach((tr: any) => {
      const fecha = new Date(tr.proxima_fecha);
      fecha.setHours(9, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(9, 30, 0, 0);

      listaUnificada.push({
        id: `planta-${tr.id}`,
        titulo: `Riego: ${tr.plantas.nombre_comun}`,
        descripcion: `Ubicación: ${tr.plantas.ubicacion}`,
        tipo_plantilla: 'TAREA',
        fecha_inicio: fecha,
        fecha_fin: fin,
        todo_el_dia: true,
        color: '#5F6F52',
        ubicacion: tr.plantas.ubicacion,
        origen: 'PLANTA',
        metadata: { plantaId: tr.plantas.id },
      });
    });

    serviciosPendientes.forEach((s: any) => {
      const fecha = new Date(s.fecha_vencimiento);
      fecha.setHours(12, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(12, 30, 0, 0);

      listaUnificada.push({
        id: `servicio-${s.id}`,
        titulo: `Vence: ${s.nombre_servicio}`,
        descripcion: `Monto: $${Number(s.monto).toLocaleString('es-CO')}`,
        tipo_plantilla: 'COMPRAS',
        fecha_inicio: fecha,
        fecha_fin: fin,
        todo_el_dia: true,
        color: '#C86242',
        ubicacion: 'Pago de Servicios',
        origen: 'SERVICIO',
        metadata: { servicioId: s.id, monto: Number(s.monto) },
      });
    });

    listaUnificada.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
    return listaUnificada;
  }

  async create(data: CreateEventoData): Promise<any> {
    return this.db.eventos.create({
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
        detalles: data.detalles !== undefined ? data.detalles : undefined,
        creador_id: data.creador_id,
        participantes: data.participantes_ids && data.participantes_ids.length > 0
          ? {
              connect: data.participantes_ids.map((id) => ({ id })),
            }
          : undefined,
        externos: data.externos && data.externos.length > 0
          ? {
              create: data.externos,
            }
          : undefined,
        subtareas: data.subtareas && data.subtareas.length > 0
          ? {
              create: data.subtareas.map((s) => ({
                descripcion: s.descripcion,
                asignado_id: s.asignado_id || null,
                completado: s.completado || false,
              })),
            }
          : undefined,
        recordatorios: data.recordatorios && data.recordatorios.length > 0
          ? {
              create: data.recordatorios.map((r) => ({
                tipo_canal: r.tipo_canal,
                minutos_anticipacion: r.minutos_anticipacion,
                fecha_programada: new Date(data.fecha_inicio.getTime() - r.minutos_anticipacion * 60000),
              })),
            }
          : undefined,
      },
    });
  }

  async update(id: string, data: UpdateEventoData): Promise<any> {
    const updateData: any = {};
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

    if (data.subtareas !== undefined) {
      await this.db.subtareas_evento.deleteMany({
        where: { evento_id: id },
      });
      if (data.subtareas.length > 0) {
        await this.db.subtareas_evento.createMany({
          data: data.subtareas.map((s) => ({
            evento_id: id,
            descripcion: s.descripcion,
            completado: s.completado || false,
            asignado_id: s.asignado_id || null,
          })),
        });
      }
    }

    return this.db.eventos.update({
      where: { id },
      data: updateData,
    });
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

  async cancelarLogico(id: string): Promise<any> {
    const evento = await this.db.eventos.update({
      where: { id },
      data: { estado: EstadoEvento.CANCELADO },
    });

    await this.db.recordatorios_evento.updateMany({
      where: { evento_id: id, enviado: false },
      data: { enviado: true },
    });

    return evento;
  }

  async delete(id: string): Promise<void> {
    await this.db.eventos.delete({
      where: { id },
    });
  }

  async toggleSubtarea(id: string, completado: boolean): Promise<any> {
    return this.db.subtareas_evento.update({
      where: { id },
      data: { completado },
    });
  }
}

export const defaultEventoRepository = new PrismaEventoRepository();
