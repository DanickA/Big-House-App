'use server';

import { revalidatePath } from 'next/cache';
import { resolveSessionUser } from '@/lib/auth-guard';
import { toActionResponse, type ActionResponse } from '@/modules/shared';
import {
  GetHabitantesUseCase,
  CreateHabitanteUseCase,
  UpdateHabitanteUseCase,
  DeleteHabitanteUseCase,
  type HabitanteListItem,
} from '@/modules/habitantes';

const getHabitantesUC = new GetHabitantesUseCase();
const createHabitanteUC = new CreateHabitanteUseCase();
const updateHabitanteUC = new UpdateHabitanteUseCase();
const deleteHabitanteUC = new DeleteHabitanteUseCase();

// 1. Obtener todos los usuarios registrados
export async function getUsuarios(): Promise<ActionResponse<HabitanteListItem[]>> {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }
  const result = await getHabitantesUC.execute();
  return toActionResponse(result);
}

// 2. Crear un nuevo usuario en la base de datos
export async function createUsuario(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  if (auth.user.rol !== 'ADMIN') {
    return {
      success: false,
      error: 'Solo los administradores del hogar pueden registrar nuevos miembros.',
      code: 'FORBIDDEN',
    };
  }

  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const pin = formData.get('pin') as string | null;
  const rol = (formData.get('rol') as 'ADMIN' | 'MIEMBRO') || 'MIEMBRO';

  const result = await createHabitanteUC.execute({ nombre, email, password, pin, rol });
  if (result.success) {
    revalidatePath('/usuarios');
    revalidatePath('/login');
    revalidatePath('/');
  }
  return toActionResponse(result);
}

// 3. Actualizar información de un usuario (Nombre, Email, Contraseña y PIN)
export async function updateUsuario(id: string, formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const esAdmin = auth.user.rol === 'ADMIN';
  const esPropioPerfil = auth.user.userId === id;

  if (!esAdmin && !esPropioPerfil) {
    return {
      success: false,
      error: 'No tienes autorización para modificar la información de otro habitante.',
      code: 'FORBIDDEN',
    };
  }

  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string | null;
  const pin = formData.get('pin') as string | null;
  const rolForm = formData.get('rol') as 'ADMIN' | 'MIEMBRO' | null;
  const rol = esAdmin && rolForm ? rolForm : undefined;

  const result = await updateHabitanteUC.execute({ id, nombre, email, password, pin, rol });
  if (result.success) {
    revalidatePath('/usuarios');
    revalidatePath('/login');
    revalidatePath('/');
  }
  return toActionResponse(result);
}

// 4. Eliminar un usuario
export async function deleteUsuario(id: string) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  if (auth.user.rol !== 'ADMIN') {
    return {
      success: false,
      error: 'Solo los administradores del hogar pueden eliminar habitantes.',
      code: 'FORBIDDEN',
    };
  }

  if (auth.user.userId === id) {
    return {
      success: false,
      error: 'No puedes eliminar tu propia cuenta de administrador.',
      code: 'BAD_REQUEST',
    };
  }

  const result = await deleteHabitanteUC.execute({ id, currentUserId: auth.user.userId });
  if (result.success) {
    revalidatePath('/usuarios');
    revalidatePath('/login');
    revalidatePath('/');
  }
  return toActionResponse(result);
}
