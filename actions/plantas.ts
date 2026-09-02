'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { uploadImage } from '@/lib/storage';

// 1. Obtener resumen de plantas para el Lobby (con tareas de riego)
export async function getResumenPlantasLobby() {
  try {
    const plantas = await prisma.plantas.findMany({
      include: {
        tareas_cuidado: {
          where: { tipo_tarea: 'RIEGO' },
        },
      },
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let pendientesCount = 0;
    const listaConEstado = plantas.map((planta) => {
      const tareaRiego = planta.tareas_cuidado[0];
      let diasRestantes = null;
      let requiereRiego = false;

      if (tareaRiego?.proxima_fecha) {
        const prox = new Date(tareaRiego.proxima_fecha);
        prox.setHours(0, 0, 0, 0);
        const diffTiempo = prox.getTime() - hoy.getTime();
        diasRestantes = Math.round(diffTiempo / (1000 * 60 * 60 * 24));
        if (diasRestantes <= 0) {
          requiereRiego = true;
          pendientesCount++;
        }
      }

      return {
        ...planta,
        frecuencia_dias: tareaRiego?.frecuencia_dias || 7,
        diasRestantes,
        requiereRiego,
      };
    });

    return {
      success: true,
      totalPlantas: plantas.length,
      pendientesCount,
      plantas: listaConEstado,
    };
  } catch (error) {
    console.error('Error al obtener resumen de plantas:', error);
    return { success: false, totalPlantas: 0, pendientesCount: 0, plantas: [] };
  }
}

// 2. Crear una nueva planta
export async function createPlanta(formData: FormData) {
  try {
    const nombre_comun = formData.get('nombre_comun') as string;
    const ubicacion = formData.get('ubicacion') as string;
    const especie = (formData.get('especie') as string) || null;
    const foto = formData.get('foto') as File | null;
    const frecuencia_dias = parseInt((formData.get('frecuencia_riego') as string) || '7', 10);

    if (!nombre_comun || !ubicacion) {
      return { success: false, error: 'Ingresa el nombre y la ubicación de la planta' };
    }

    let foto_url: string | null = null;
    if (foto && foto.size > 0) {
      try {
        foto_url = await uploadImage(foto);
      } catch (uploadErr: any) {
        console.error('Error subiendo foto de planta:', uploadErr);
        return {
          success: false,
          error: `Error al subir la foto (${uploadErr?.message || 'Error en almacenamiento'}). Por favor verifica la configuración de Cloudinary en Vercel.`
        };
      }
    }

    const proximaFecha = new Date();
    proximaFecha.setHours(0, 0, 0, 0);
    proximaFecha.setDate(proximaFecha.getDate() + frecuencia_dias);

    const nuevaPlanta = await prisma.plantas.create({
      data: {
        nombre_comun,
        ubicacion,
        especie,
        foto_url,
        tareas_cuidado: {
          create: {
            tipo_tarea: 'RIEGO',
            frecuencia_dias,
            proxima_fecha: proximaFecha,
          },
        },
      },
    });

    revalidatePath('/plantas');
    revalidatePath('/');
    return { success: true, data: nuevaPlanta };
  } catch (error) {
    console.error('Error al crear planta:', error);
    return { success: false, error: 'No se pudo registrar la planta' };
  }
}

// 3. Obtener todas las plantas con cuenta regresiva calculada
export async function getPlantas() {
  try {
    const plantas = await prisma.plantas.findMany({
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

    const plantasConEstado = plantas.map((planta) => {
      const tareaRiego = planta.tareas_cuidado[0];
      let diasRestantes: number | null = null;

      if (tareaRiego?.proxima_fecha) {
        const prox = new Date(tareaRiego.proxima_fecha);
        prox.setHours(0, 0, 0, 0);
        const diffTiempo = prox.getTime() - hoy.getTime();
        diasRestantes = Math.round(diffTiempo / (1000 * 60 * 60 * 24));
      }

      return {
        id: planta.id,
        nombre_comun: planta.nombre_comun,
        especie: planta.especie,
        ubicacion: planta.ubicacion,
        foto_url: planta.foto_url,
        diasRestantes,
        frecuencia_dias: tareaRiego?.frecuencia_dias ?? 7,
      };
    });

    return { success: true, data: plantasConEstado };
  } catch (error) {
    console.error('Error al obtener plantas:', error);
    return { success: false, error: 'No se pudieron cargar las plantas' };
  }
}

// 4. Actualizar una planta y recalcular su ciclo de riego
export async function updatePlanta(id: string, formData: FormData) {
  const nombre_comun = formData.get('nombre_comun') as string;
  const ubicacion = formData.get('ubicacion') as string;
  const especie = (formData.get('especie') as string) || null;
  const foto = formData.get('foto') as File | null;
  const frecuencia_riego = formData.get('frecuencia_riego') as string;

  if (!nombre_comun || !ubicacion) {
    return { success: false, error: 'El nombre y la ubicación son obligatorios' };
  }

  try {
    const datosActualizados: {
      nombre_comun: string;
      ubicacion: string;
      especie: string | null;
      foto_url?: string;
    } = {
      nombre_comun,
      ubicacion,
      especie,
    };

    if (foto && foto.size > 0) {
      try {
        datosActualizados.foto_url = await uploadImage(foto);
      } catch (uploadErr: any) {
        console.error('Error actualizando foto de planta:', uploadErr);
        return {
          success: false,
          error: `Error al subir la foto (${uploadErr?.message || 'Error en almacenamiento'}). Por favor verifica la configuración de Cloudinary en Vercel.`
        };
      }
    }

    const plantaActualizada = await prisma.plantas.update({
      where: { id },
      data: datosActualizados,
    });

    if (frecuencia_riego) {
      const freq = parseInt(frecuencia_riego, 10);
      if (!isNaN(freq) && freq > 0) {
        const tareaExistente = await prisma.tareas_cuidado.findFirst({
          where: { planta_id: id, tipo_tarea: 'RIEGO' },
        });

        if (tareaExistente) {
          const ultimoRiego = await prisma.historial_cuidado.findFirst({
            where: { tarea_id: tareaExistente.id },
            orderBy: { fecha_realizada: 'desc' },
          });

          let nuevaProximaFecha = new Date();
          if (ultimoRiego?.fecha_realizada) {
            nuevaProximaFecha = new Date(ultimoRiego.fecha_realizada);
          }
          nuevaProximaFecha.setHours(0, 0, 0, 0);
          nuevaProximaFecha.setDate(nuevaProximaFecha.getDate() + freq);

          await prisma.tareas_cuidado.update({
            where: { id: tareaExistente.id },
            data: {
              frecuencia_dias: freq,
              proxima_fecha: nuevaProximaFecha,
            },
          });
        } else {
          const proximaFecha = new Date();
          proximaFecha.setHours(0, 0, 0, 0);
          proximaFecha.setDate(proximaFecha.getDate() + freq);
          await prisma.tareas_cuidado.create({
            data: {
              planta_id: id,
              tipo_tarea: 'RIEGO',
              frecuencia_dias: freq,
              proxima_fecha: proximaFecha,
            },
          });
        }
      }
    }

    revalidatePath('/plantas');
    revalidatePath('/');
    return { success: true, data: plantaActualizada };
  } catch (error) {
    console.error('Error al actualizar la planta:', error);
    return { success: false, error: 'No se pudo actualizar la información' };
  }
}

// 5. Eliminar planta
export async function deletePlanta(id: string) {
  try {
    await prisma.plantas.delete({
      where: { id },
    });
    revalidatePath('/plantas');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar la planta:', error);
    return { success: false, error: 'No se pudo eliminar la planta' };
  }
}

// 6. Obtener historial real de cuidados de una planta
export async function getHistorialByPlanta(plantaId: string) {
  try {
    const historial = await prisma.historial_cuidado.findMany({
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

    return { success: true, data: historial };
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return { success: false, error: 'No se pudo cargar el historial' };
  }
}

// 7. Registrar un nuevo evento de cuidado
export async function registrarCuidado(
  plantaId: string,
  tipoTarea: string,
  usuarioId?: string,
  observaciones?: string
) {
  try {
    let idFinal = usuarioId;
    if (!idFinal) {
      const session = await getSession();
      if (session?.userId) {
        idFinal = session.userId;
      } else {
        const primerUsuario = await prisma.usuarios.findFirst();
        if (!primerUsuario) {
          return { success: false, error: 'No hay usuarios registrados en la base de datos' };
        }
        idFinal = primerUsuario.id;
      }
    }

    let tarea = await prisma.tareas_cuidado.findFirst({
      where: {
        planta_id: plantaId,
        tipo_tarea: tipoTarea,
      },
    });

    if (!tarea) {
      const proximaFecha = new Date();
      proximaFecha.setHours(0, 0, 0, 0);
      proximaFecha.setDate(proximaFecha.getDate() + 7);

      tarea = await prisma.tareas_cuidado.create({
        data: {
          planta_id: plantaId,
          tipo_tarea: tipoTarea,
          frecuencia_dias: 7,
          proxima_fecha: proximaFecha,
        },
      });
    }

    if (tipoTarea === 'RIEGO') {
      const nuevaProximaFecha = new Date();
      nuevaProximaFecha.setHours(0, 0, 0, 0);
      nuevaProximaFecha.setDate(nuevaProximaFecha.getDate() + (tarea.frecuencia_dias || 7));

      await prisma.tareas_cuidado.update({
        where: { id: tarea.id },
        data: { proxima_fecha: nuevaProximaFecha },
      });
    }

    const nuevoHistorial = await prisma.historial_cuidado.create({
      data: {
        tarea_id: tarea.id,
        usuario_id: idFinal,
        observaciones: observaciones || null,
      },
    });

    revalidatePath('/plantas');
    revalidatePath('/');
    return { success: true, data: nuevoHistorial };
  } catch (error) {
    console.error('Error al registrar el cuidado:', error);
    return { success: false, error: 'No se pudo registrar la acción de cuidado' };
  }
}
