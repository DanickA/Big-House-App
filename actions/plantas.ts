'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { resolveSessionUser } from '@/lib/auth-guard';
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
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { success: false, error: auth.error, code: auth.code };
    }

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
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

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
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { success: false, error: auth.error, code: auth.code };
    }

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
// La autoría se toma SOLO de la sesión firmada. Antes se aceptaba un `usuarioId` opcional
// desde el cliente; como las Server Actions son endpoints públicos, eso permitía atribuir
// el cuidado a cualquier habitante. Ningún llamador lo utilizaba.
export async function registrarCuidado(
  plantaId: string,
  tipoTarea: string,
  observaciones?: string
) {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { success: false, error: auth.error, code: auth.code };
    }
    const idFinal = auth.user.userId;

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

    const fechaAnterior = tarea.proxima_fecha;

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
    return {
      success: true,
      data: nuevoHistorial,
      meta: {
        historialId: nuevoHistorial.id,
        tareaId: tarea.id,
        plantaId,
        tipoTarea,
        fechaAnterior,
      },
    };
  } catch (error) {
    console.error('Error al registrar el cuidado:', error);
    return { success: false, error: 'No se pudo registrar la acción de cuidado' };
  }
}

// 8. Deshacer un evento de cuidado (Rollback de historial y recálculo de tareas_cuidado)
export async function deshacerCuidado(historialId: string) {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { success: false, error: auth.error, code: auth.code };
    }

    const registro = await prisma.historial_cuidado.findUnique({
      where: { id: historialId },
      include: {
        tareas_cuidado: true,
      },
    });

    if (!registro) {
      return { success: false, error: 'El registro de cuidado no existe o ya fue eliminado' };
    }

    const { tarea_id, tareas_cuidado } = registro;

    // Buscar el cuidado anterior más reciente para recalcular proxima_fecha
    const cuidadoAnterior = await prisma.historial_cuidado.findFirst({
      where: {
        tarea_id,
        id: { not: historialId },
      },
      orderBy: { fecha_realizada: 'desc' },
    });

    let nuevaProximaFecha: Date;
    if (cuidadoAnterior?.fecha_realizada) {
      nuevaProximaFecha = new Date(cuidadoAnterior.fecha_realizada);
      nuevaProximaFecha.setHours(0, 0, 0, 0);
      nuevaProximaFecha.setDate(nuevaProximaFecha.getDate() + (tareas_cuidado.frecuencia_dias || 7));
    } else {
      // Si no hay cuidados previos, la fecha de riego vencía hoy (necesitaba riego)
      nuevaProximaFecha = new Date();
      nuevaProximaFecha.setHours(0, 0, 0, 0);
    }

    // Transacción atómica: eliminar el registro de historial y actualizar la próxima fecha de la tarea
    await prisma.$transaction([
      prisma.historial_cuidado.delete({
        where: { id: historialId },
      }),
      prisma.tareas_cuidado.update({
        where: { id: tarea_id },
        data: { proxima_fecha: nuevaProximaFecha },
      }),
    ]);

    revalidatePath('/plantas');
    revalidatePath('/');
    return {
      success: true,
      data: {
        historialId,
        tareaId: tarea_id,
        plantaId: tareas_cuidado.planta_id,
        nuevaProximaFecha,
      },
    };
  } catch (error) {
    console.error('Error al deshacer cuidado:', error);
    return { success: false, error: 'No se pudo deshacer la acción de cuidado' };
  }
}

