'use server';

import { revalidatePath } from 'next/cache';
import { resolveSessionUser } from '@/lib/auth-guard';
import { toActionResponse } from '@/modules/shared';
import {
  GetResumenPlantasLobbyUseCase,
  GetPlantasUseCase,
  CreatePlantaUseCase,
  UpdatePlantaUseCase,
  DeletePlantaUseCase,
  GetHistorialCuidadoUseCase,
  RegistrarCuidadoUseCase,
  DeshacerCuidadoUseCase,
} from '@/modules/plantas';

const getResumenPlantasLobbyUC = new GetResumenPlantasLobbyUseCase();
const getPlantasUC = new GetPlantasUseCase();
const createPlantaUC = new CreatePlantaUseCase();
const updatePlantaUC = new UpdatePlantaUseCase();
const deletePlantaUC = new DeletePlantaUseCase();
const getHistorialCuidadoUC = new GetHistorialCuidadoUseCase();
const registrarCuidadoUC = new RegistrarCuidadoUseCase();
const deshacerCuidadoUC = new DeshacerCuidadoUseCase();

// 1. Obtener resumen de plantas para el Lobby (con tareas de riego)
export async function getResumenPlantasLobby() {
  const result = await getResumenPlantasLobbyUC.execute();
  if (!result.success) {
    return { success: false, totalPlantas: 0, pendientesCount: 0, plantas: [] };
  }
  return {
    success: true,
    totalPlantas: result.data.totalPlantas,
    pendientesCount: result.data.pendientesCount,
    plantas: result.data.plantas,
  };
}

// 2. Crear una nueva planta
export async function createPlanta(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const nombre_comun = formData.get('nombre_comun') as string;
  const ubicacion = formData.get('ubicacion') as string;
  const especie = (formData.get('especie') as string) || null;
  const foto = formData.get('foto') as File | null;
  const frecuencia_riego = parseInt((formData.get('frecuencia_riego') as string) || '7', 10);
  const nivel_luz = (formData.get('nivel_luz') as string) || 'INDIRECTA';
  const nivel_agua = (formData.get('nivel_agua') as string) || 'MODERADA';
  const estado_salud = (formData.get('estado_salud') as string) || 'SANA';
  const notas_cuidado = (formData.get('notas_cuidado') as string) || null;

  const result = await createPlantaUC.execute({
    nombre_comun,
    ubicacion,
    especie,
    foto,
    frecuencia_riego,
    nivel_luz,
    nivel_agua,
    estado_salud,
    notas_cuidado,
  });

  if (result.success) {
    revalidatePath('/plantas');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 3. Obtener todas las plantas con cuenta regresiva calculada
export async function getPlantas() {
  const result = await getPlantasUC.execute();
  return toActionResponse(result);
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
  const frecuencia_riego_raw = formData.get('frecuencia_riego') as string;
  const frecuencia_riego = frecuencia_riego_raw ? parseInt(frecuencia_riego_raw, 10) : null;
  const nivel_luz = (formData.get('nivel_luz') as string) || undefined;
  const nivel_agua = (formData.get('nivel_agua') as string) || undefined;
  const estado_salud = (formData.get('estado_salud') as string) || undefined;
  const notas_cuidado_raw = formData.get('notas_cuidado');
  const notas_cuidado = notas_cuidado_raw !== null ? (notas_cuidado_raw as string) : undefined;

  const result = await updatePlantaUC.execute({
    id,
    nombre_comun,
    ubicacion,
    especie,
    foto,
    frecuencia_riego,
    nivel_luz,
    nivel_agua,
    estado_salud,
    notas_cuidado,
  });

  if (result.success) {
    revalidatePath('/plantas');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 5. Eliminar planta
export async function deletePlanta(id: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const result = await deletePlantaUC.execute(id);
  if (result.success) {
    revalidatePath('/plantas');
    revalidatePath('/');
  }

  return toActionResponse(result);
}

// 6. Obtener historial real de cuidados de una planta
export async function getHistorialByPlanta(plantaId: string) {
  const result = await getHistorialCuidadoUC.execute(plantaId);
  return toActionResponse(result);
}

export type RegistrarCuidadoResponse = {
  success: boolean;
  data?: any;
  meta?: {
    historialId: string;
    tareaId: string;
    plantaId: string;
    tipoTarea: string;
    fechaAnterior?: Date;
  };
  error?: string;
  code?: string;
};

// 7. Registrar un nuevo evento de cuidado
export async function registrarCuidado(
  plantaId: string,
  tipoTarea: string,
  observaciones?: string
): Promise<RegistrarCuidadoResponse> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const result = await registrarCuidadoUC.execute({
    plantaId,
    tipoTarea,
    usuarioId: auth.user.userId,
    observaciones,
  });

  if (result.success) {
    revalidatePath('/plantas');
    revalidatePath('/');
    return {
      success: true,
      data: result.data.data,
      meta: result.data.meta,
    };
  }

  return toActionResponse(result);
}

// 8. Deshacer un evento de cuidado
export async function deshacerCuidado(historialId: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const result = await deshacerCuidadoUC.execute(historialId);
  if (result.success) {
    revalidatePath('/plantas');
    revalidatePath('/');
    return {
      success: true,
      data: result.data,
    };
  }

  return toActionResponse(result);
}
