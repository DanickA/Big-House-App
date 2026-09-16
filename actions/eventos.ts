'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { TipoPlantilla } from '@prisma/client';

export type EventoUnificado = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo_plantilla: string;
  estado?: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  todo_el_dia: boolean;
  color: string;
  ubicacion: string | null;
  recurrencia?: string | null;
  origen: 'MANUAL' | 'PLANTA' | 'SERVICIO';
  creador?: { nombre: string } | null;
  participantes?: { id: string; nombre: string }[];
  metadata?: Record<string, string | number>;
  detalles?: any;
  subtareas?: { id: string; descripcion: string; completado: boolean }[];
};

// 1. Obtener eventos unificados del mes (Eventos propios + Riegos + Vencimiento de Facturas)
export async function getEventosCalendario(
  mes: number, // 1 - 12
  anio: number
): Promise<{ success: boolean; data: EventoUnificado[]; error?: string }> {
  try {
    // Rango amplio para cubrir días del mes anterior y siguiente visibles en la cuadrícula
    const fechaInicioRange = new Date(anio, mes - 1, -7, 0, 0, 0);
    const fechaFinRange = new Date(anio, mes, 14, 23, 59, 59);

    const [eventosManuales, eventosAnualesPasados, tareasRiego, serviciosPendientes] = await Promise.all([
      // 1. Eventos manuales del hogar (tanto ACTIVO como CANCELADO para conservar trazabilidad según RF-03)
      prisma.eventos.findMany({
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

      // 1.1 Eventos recurrentes anuales registrados en años previos
      prisma.eventos.findMany({
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

      // 2. Fechas de riego programadas de las plantas
      prisma.tareas_cuidado.findMany({
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

      // 3. Fechas de vencimiento de servicios / facturas
      prisma.servicios.findMany({
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

    // Mapear eventos manuales en el rango
    eventosManuales.forEach((ev) => {
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

    // Mapear eventos anuales proyectados para este año
    eventosAnualesPasados.forEach((ev) => {
      const fechaOcurrInicio = new Date(ev.fecha_inicio);
      fechaOcurrInicio.setFullYear(anio);
      const fechaOcurrFin = new Date(ev.fecha_fin);
      fechaOcurrFin.setFullYear(anio);

      if (fechaOcurrInicio >= fechaInicioRange && fechaOcurrInicio <= fechaFinRange) {
        // Evitar duplicados si ya vino en eventosManuales
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

    // Mapear riegos de plantas
    tareasRiego.forEach((tr) => {
      const fecha = new Date(tr.proxima_fecha);
      fecha.setHours(9, 0, 0, 0); // 9:00 AM por defecto para riego
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
        color: '#5F6F52', // Verde oliva
        ubicacion: tr.plantas.ubicacion,
        origen: 'PLANTA',
        metadata: { plantaId: tr.plantas.id },
      });
    });

    // Mapear vencimientos de servicios
    serviciosPendientes.forEach((s) => {
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
        color: '#C86242', // Terracota
        ubicacion: 'Pago de Servicios',
        origen: 'SERVICIO',
        metadata: { servicioId: s.id, monto: Number(s.monto) },
      });
    });

    // Ordenar cronológicamente
    listaUnificada.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());

    return { success: true, data: listaUnificada };
  } catch (error) {
    console.error('Error al obtener eventos del calendario:', error);
    return { success: false, data: [], error: 'No se pudieron cargar los eventos' };
  }
}

// 2. Obtener los próximos eventos para la tarjeta del Lobby
export async function getProximosEventosLobby(limit = 3): Promise<{
  success: boolean;
  totalEventosSemana: number;
  proximos: EventoUnificado[];
}> {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const finSemana = new Date(hoy);
    finSemana.setDate(finSemana.getDate() + 7);
    finSemana.setHours(23, 59, 59, 999);

    const res = await getEventosCalendario(hoy.getMonth() + 1, hoy.getFullYear());
    if (!res.success) {
      return { success: false, totalEventosSemana: 0, proximos: [] };
    }

    const futuros = res.data.filter((ev) => new Date(ev.fecha_inicio).getTime() >= hoy.getTime());
    const enLaSemana = futuros.filter((ev) => new Date(ev.fecha_inicio).getTime() <= finSemana.getTime());

    return {
      success: true,
      totalEventosSemana: enLaSemana.length,
      proximos: futuros.slice(0, limit),
    };
  } catch (error) {
    console.error('Error al obtener eventos para el lobby:', error);
    return { success: false, totalEventosSemana: 0, proximos: [] };
  }
}

// 3. Crear un evento manual con el formulario contextual
export async function createEvento(formData: FormData) {
  try {
    const titulo = (formData.get('titulo') as string)?.trim();
    const descripcion = (formData.get('descripcion') as string)?.trim() || null;
    const tipo_plantilla_str = (formData.get('tipo_plantilla') as string) || 'EVENTO';
    const fecha_inicio_str = formData.get('fecha_inicio') as string;
    const fecha_fin_str = formData.get('fecha_fin') as string;
    const todo_el_dia = formData.get('todo_el_dia') === 'true';
    const color = (formData.get('color') as string) || '#5F6F52';
    const ubicacion = (formData.get('ubicacion') as string)?.trim() || null;
    const participante_id = (formData.get('participante_id') as string) || null;

    if (!titulo || !fecha_inicio_str) {
      return { success: false, error: 'El título y la fecha son obligatorios' };
    }

    // Resolver creador
    const session = await getSession();
    let creadorId = session?.userId;
    if (!creadorId) {
      const primerUsuario = await prisma.usuarios.findFirst();
      if (!primerUsuario) {
        return { success: false, error: 'No hay usuarios registrados para asociar el evento' };
      }
      creadorId = primerUsuario.id;
    }

    const fecha_inicio = new Date(fecha_inicio_str);
    const fecha_fin = fecha_fin_str ? new Date(fecha_fin_str) : new Date(fecha_inicio.getTime() + 60 * 60 * 1000);

    const tipo_plantilla = (Object.values(TipoPlantilla).includes(tipo_plantilla_str as TipoPlantilla)
      ? tipo_plantilla_str
      : 'EVENTO') as TipoPlantilla;

    const nuevoEvento = await prisma.eventos.create({
      data: {
        titulo,
        descripcion,
        tipo_plantilla,
        fecha_inicio,
        fecha_fin,
        todo_el_dia,
        color,
        ubicacion,
        creador_id: creadorId,
        participantes: participante_id
          ? {
              connect: [{ id: participante_id }],
            }
          : undefined,
      },
    });

    revalidatePath('/calendario');
    revalidatePath('/');
    return { success: true, data: nuevoEvento };
  } catch (error) {
    console.error('Error al crear evento:', error);
    return { success: false, error: 'No se pudo guardar el evento en la agenda' };
  }
}

// 4. Eliminar un evento manual
export async function deleteEvento(id: string) {
  try {
    if (id.startsWith('planta-') || id.startsWith('servicio-')) {
      return { success: false, error: 'Este evento automático se gestiona desde su módulo correspondiente' };
    }

    await prisma.eventos.delete({
      where: { id },
    });

    revalidatePath('/calendario');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return { success: false, error: 'No se pudo eliminar el evento' };
  }
}
