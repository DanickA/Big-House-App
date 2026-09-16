'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TipoPlantilla, EstadoEvento, CanalRecordatorio } from '@prisma/client';

export type EventoData = {
  titulo: string;
  descripcion?: string;
  tipo_plantilla: TipoPlantilla;
  estado?: EstadoEvento;
  fecha_inicio: Date;
  fecha_fin: Date;
  todo_el_dia: boolean;
  color: string;
  ubicacion?: string;
  recurrencia?: string;
  detalles?: any;
  creador_id: string;
  participantes_ids?: string[];
  externos?: { nombre: string; contacto?: string }[];
  subtareas?: { descripcion: string; asignado_id?: string; completado?: boolean }[];
  recordatorios?: { tipo_canal: CanalRecordatorio; minutos_anticipacion: number }[];
};

export async function obtenerEventosMes(fechaInicio: Date, fechaFin: Date) {
  try {
    const eventos = await prisma.eventos.findMany({
      where: {
        fecha_inicio: {
          gte: fechaInicio,
        },
        fecha_fin: {
          lte: fechaFin,
        },
      },
      include: {
        creador: { select: { id: true, nombre: true } },
        participantes: { select: { id: true, nombre: true } },
        externos: true,
        subtareas: { include: { asignado: { select: { id: true, nombre: true } } } },
        recordatorios: true,
      },
      orderBy: {
        fecha_inicio: 'asc',
      },
    });
    return { success: true, data: eventos };
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    return { success: false, error: 'No se pudieron obtener los eventos' };
  }
}

export async function crearEvento(data: EventoData) {
  try {
    if (!data.titulo || !data.titulo.trim()) {
      throw new Error('El título del evento es obligatorio');
    }

    if (data.fecha_fin < data.fecha_inicio) {
      throw new Error('La fecha de fin debe ser posterior a la de inicio');
    }

    // Reglas y variaciones específicas por plantilla (RF-02)
    if (data.tipo_plantilla === TipoPlantilla.CITA_MEDICA) {
      if (data.todo_el_dia) {
        throw new Error('La cita médica requiere obligatoriamente fecha y hora de inicio específica (no admite modalidad todo el día)');
      }
      if (!data.ubicacion || !data.ubicacion.trim()) {
        throw new Error('La ubicación es obligatoria para una cita médica');
      }
      const tienePaciente = (data.participantes_ids && data.participantes_ids.length > 0) || data.detalles?.paciente_id;
      if (!tienePaciente) {
        throw new Error('Debe seleccionar obligatoriamente un paciente del hogar para la cita médica');
      }
    }

    if (data.tipo_plantilla === TipoPlantilla.TAREA) {
      const tieneResponsable = (data.participantes_ids && data.participantes_ids.length > 0) || data.detalles?.responsable_id;
      if (!tieneResponsable) {
        throw new Error('La tarea requiere obligatoriamente un responsable asignado');
      }
    }

    let inicio = new Date(data.fecha_inicio);
    let fin = new Date(data.fecha_fin);

    if (data.todo_el_dia) {
      inicio = new Date(inicio.setHours(0, 0, 0, 0));
      fin = new Date(fin.setHours(23, 59, 59, 999));
    }

    // Preparar participantes externos (ej. agasajado externo para cumpleaños)
    const externosFinales = [...(data.externos || [])];
    if (
      data.tipo_plantilla === TipoPlantilla.CUMPLEANOS &&
      data.detalles?.agasajado_tipo === 'externo' &&
      data.detalles?.agasajado_externo
    ) {
      const yaExiste = externosFinales.some(e => e.nombre.toLowerCase() === data.detalles.agasajado_externo.toLowerCase());
      if (!yaExiste) {
        externosFinales.push({
          nombre: data.detalles.agasajado_externo,
          contacto: data.detalles.contacto_externo || undefined,
        });
      }
    }

    // Unificar participantes_ids si se especificó en detalles (ej. paciente + acompañantes, o responsable)
    const participantesSet = new Set<string>(data.participantes_ids || []);
    if (data.detalles?.paciente_id) participantesSet.add(data.detalles.paciente_id);
    if (Array.isArray(data.detalles?.acompanantes_ids)) {
      data.detalles.acompanantes_ids.forEach((id: string) => participantesSet.add(id));
    }
    if (data.detalles?.responsable_id) participantesSet.add(data.detalles.responsable_id);
    if (data.detalles?.agasajado_interno_id) participantesSet.add(data.detalles.agasajado_interno_id);

    const evento = await prisma.eventos.create({
      data: {
        titulo: data.titulo.trim(),
        descripcion: data.descripcion?.trim() || null,
        tipo_plantilla: data.tipo_plantilla,
        estado: data.estado || EstadoEvento.ACTIVO,
        fecha_inicio: inicio,
        fecha_fin: fin,
        todo_el_dia: data.todo_el_dia,
        color: data.color,
        ubicacion: data.ubicacion?.trim() || null,
        recurrencia: data.recurrencia || null,
        detalles: data.detalles || undefined,
        creador_id: data.creador_id,
        participantes: {
          connect: Array.from(participantesSet).map((id) => ({ id })),
        },
        externos: {
          create: externosFinales,
        },
        subtareas: {
          create: (data.subtareas || []).map(s => ({
            descripcion: s.descripcion,
            asignado_id: s.asignado_id || null,
            completado: s.completado || false,
          })),
        },
        recordatorios: {
          create: (data.recordatorios || []).map((r) => ({
            tipo_canal: r.tipo_canal,
            minutos_anticipacion: r.minutos_anticipacion,
            fecha_programada: new Date(inicio.getTime() - r.minutos_anticipacion * 60000),
          })),
        },
      },
    });

    revalidatePath('/calendario');
    return { success: true, data: evento };
  } catch (error: any) {
    console.error('Error al crear evento:', error);
    return { success: false, error: error.message || 'Error al crear evento' };
  }
}

export type OpcionRecurrenciaEdicion = 'SOLO_ESTE' | 'ESTE_Y_FUTUROS' | 'SIN_RECURRENCIA';

export async function actualizarEvento(
  id: string,
  data: Partial<EventoData>,
  opcionRecurrencia: OpcionRecurrenciaEdicion = 'SIN_RECURRENCIA'
) {
  try {
    // RN-01: Permisos de gestión colaborativa. Cualquier habitante autenticado puede modificar cualquier evento.
    const eventoOriginal = await prisma.eventos.findUnique({
      where: { id },
      include: {
        participantes: true,
        externos: true,
        subtareas: true,
      },
    });

    if (!eventoOriginal) {
      throw new Error('El evento no existe');
    }

    let inicio = data.fecha_inicio ? new Date(data.fecha_inicio) : new Date(eventoOriginal.fecha_inicio);
    let fin = data.fecha_fin ? new Date(data.fecha_fin) : new Date(eventoOriginal.fecha_fin);

    if (data.todo_el_dia ?? eventoOriginal.todo_el_dia) {
      inicio = new Date(new Date(inicio).setHours(0, 0, 0, 0));
      fin = new Date(new Date(fin).setHours(23, 59, 59, 999));
    }

    // RF-03 Caso 1: Eventos con recurrencia - "Modificar solo este evento"
    // Desvincula la fecha seleccionada de la serie original y aplica los cambios únicamente a esa instancia.
    if (opcionRecurrencia === 'SOLO_ESTE' && (eventoOriginal.recurrencia || data.recurrencia)) {
      // 1. Crear nueva instancia independiente para esta fecha sin recurrencia
      const nuevoEventoDesvinculado = await prisma.eventos.create({
        data: {
          titulo: data.titulo?.trim() || eventoOriginal.titulo,
          descripcion: data.descripcion !== undefined ? data.descripcion?.trim() || null : eventoOriginal.descripcion,
          tipo_plantilla: data.tipo_plantilla || eventoOriginal.tipo_plantilla,
          estado: data.estado || eventoOriginal.estado,
          fecha_inicio: inicio,
          fecha_fin: fin,
          todo_el_dia: data.todo_el_dia ?? eventoOriginal.todo_el_dia,
          color: data.color || eventoOriginal.color,
          ubicacion: data.ubicacion !== undefined ? data.ubicacion?.trim() || null : eventoOriginal.ubicacion,
          recurrencia: null, // Desvinculado de la serie original
          detalles: data.detalles !== undefined ? data.detalles : eventoOriginal.detalles || undefined,
          creador_id: data.creador_id || eventoOriginal.creador_id,
          participantes: {
            connect: (data.participantes_ids || eventoOriginal.participantes.map((p) => p.id)).map((uid) => ({ id: uid })),
          },
          subtareas: {
            create: (data.subtareas || []).map((s) => ({
              descripcion: s.descripcion,
              asignado_id: s.asignado_id || null,
              completado: s.completado || false,
            })),
          },
        },
      });

      // 2. Si la fecha coincide con el evento original recurrente, adelantar la serie original un ciclo (ej. 1 año) para no duplicar
      if (eventoOriginal.recurrencia === 'ANUAL') {
        const siguienteAnioInicio = new Date(eventoOriginal.fecha_inicio);
        siguienteAnioInicio.setFullYear(siguienteAnioInicio.getFullYear() + 1);
        const siguienteAnioFin = new Date(eventoOriginal.fecha_fin);
        siguienteAnioFin.setFullYear(siguienteAnioFin.getFullYear() + 1);

        await prisma.eventos.update({
          where: { id: eventoOriginal.id },
          data: {
            fecha_inicio: siguienteAnioInicio,
            fecha_fin: siguienteAnioFin,
          },
        });
      }

      revalidatePath('/calendario');
      revalidatePath('/');
      return { success: true, data: nuevoEventoDesvinculado };
    }

    // RF-03 Caso 2: Sin recurrencia o "Modificar este y los eventos futuros"
    const updateData: any = {
      ...(data.titulo && { titulo: data.titulo.trim() }),
      ...(data.descripcion !== undefined && { descripcion: data.descripcion?.trim() || null }),
      ...(data.tipo_plantilla && { tipo_plantilla: data.tipo_plantilla }),
      ...(data.fecha_inicio && { fecha_inicio: inicio }),
      ...(data.fecha_fin && { fecha_fin: fin }),
      ...(data.todo_el_dia !== undefined && { todo_el_dia: data.todo_el_dia }),
      ...(data.color && { color: data.color }),
      ...(data.ubicacion !== undefined && { ubicacion: data.ubicacion?.trim() || null }),
      ...(data.recurrencia !== undefined && { recurrencia: data.recurrencia }),
      ...(data.detalles !== undefined && { detalles: data.detalles }),
      ...(data.estado !== undefined && { estado: data.estado }),
    };

    if (data.participantes_ids !== undefined) {
      updateData.participantes = {
        set: data.participantes_ids.map((uid) => ({ id: uid })),
      };
    }

    // Si se enviaron subtareas, sincronizarlas
    if (data.subtareas !== undefined) {
      await prisma.subtareas_evento.deleteMany({
        where: { evento_id: id },
      });
      if (data.subtareas.length > 0) {
        await prisma.subtareas_evento.createMany({
          data: data.subtareas.map((s) => ({
            evento_id: id,
            descripcion: s.descripcion,
            completado: s.completado || false,
            asignado_id: s.asignado_id || null,
          })),
        });
      }
    }

    const evento = await prisma.eventos.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/calendario');
    revalidatePath('/');
    return { success: true, data: evento };
  } catch (error: any) {
    console.error('Error al actualizar evento:', error);
    return { success: false, error: error.message || 'Error al actualizar evento' };
  }
}

export async function cancelarEventoLogico(id: string) {
  try {
    const evento = await prisma.eventos.update({
      where: { id },
      data: { estado: EstadoEvento.CANCELADO },
    });
    
    await prisma.recordatorios_evento.updateMany({
       where: { evento_id: id, enviado: false },
       data: { enviado: true } 
    });

    revalidatePath('/calendario');
    return { success: true, data: evento };
  } catch (error: any) {
    console.error('Error al cancelar evento:', error);
    return { success: false, error: error.message || 'Error al cancelar evento' };
  }
}

export async function eliminarEventoFisico(id: string) {
  try {
    await prisma.eventos.delete({
      where: { id },
    });

    revalidatePath('/calendario');
    return { success: true };
  } catch (error: any) {
    console.error('Error al eliminar evento:', error);
    return { success: false, error: error.message || 'Error al eliminar evento' };
  }
}

export async function toggleEstadoSubtarea(id: string, completado: boolean) {
  try {
    const subtarea = await prisma.subtareas_evento.update({
      where: { id },
      data: { completado },
    });

    revalidatePath('/calendario');
    return { success: true, data: subtarea };
  } catch (error: any) {
    console.error('Error al actualizar subtarea:', error);
    return { success: false, error: error.message || 'Error al actualizar subtarea' };
  }
}
