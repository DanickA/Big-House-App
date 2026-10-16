'use server';

import { revalidatePath } from 'next/cache';
import { resolveSessionUser } from '@/lib/auth-guard';
import { toActionResponse } from '@/modules/shared';
import {
  GetHabitantesUseCase,
  CreateHabitanteUseCase,
  UpdateHabitanteUseCase,
  DeleteHabitanteUseCase,
} from '@/modules/habitantes';

const getHabitantesUC = new GetHabitantesUseCase();
const createHabitanteUC = new CreateHabitanteUseCase();
const updateHabitanteUC = new UpdateHabitanteUseCase();
const deleteHabitanteUC = new DeleteHabitanteUseCase();

// 1. Obtener todos los usuarios registrados
export async function getUsuarios() {
  const result = await getHabitantesUC.execute();
  return toActionResponse(result);
}

// 2. Crear un nuevo usuario en la base de datos
export async function createUsuario(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const pin = formData.get('pin') as string | null;

  const result = await createHabitanteUC.execute({ nombre, email, password, pin });
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

  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string | null;
  const pin = formData.get('pin') as string | null;

  const result = await updateHabitanteUC.execute({ id, nombre, email, password, pin });
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

  const result = await deleteHabitanteUC.execute({ id, currentUserId: auth.user.userId });
  if (result.success) {
    revalidatePath('/usuarios');
    revalidatePath('/login');
    revalidatePath('/');
  }
  return toActionResponse(result);
}