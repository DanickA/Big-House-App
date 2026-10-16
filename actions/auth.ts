'use server';

import { revalidatePath } from 'next/cache';
import { toActionResponse } from '@/modules/shared';
import {
  GetMiembrosSelectorUseCase,
  LoginConCredencialesUseCase,
  LoginTradicionalUseCase,
  RegistroNuevoMiembroUseCase,
  defaultSessionService,
  HabitanteSelectorItem,
} from '@/modules/habitantes';

export type MiembroSelector = HabitanteSelectorItem;

const getMiembrosSelectorUC = new GetMiembrosSelectorUseCase();
const loginConCredencialesUC = new LoginConCredencialesUseCase();
const loginTradicionalUC = new LoginTradicionalUseCase();
const registroNuevoMiembroUC = new RegistroNuevoMiembroUseCase();

// 1. Obtener lista de miembros para el selector visual de login
export async function getMiembrosParaSelector(): Promise<{ success: boolean; data: MiembroSelector[] }> {
  const result = await getMiembrosSelectorUC.execute();
  if (!result.success) {
    return { success: false, data: [] };
  }
  return { success: true, data: result.data };
}

// 2. Registrar un nuevo miembro desde el login y loguearlo automáticamente
export async function registroNuevoMiembro(formData: FormData) {
  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const pin = formData.get('pin') as string | null;

  const result = await registroNuevoMiembroUC.execute({ nombre, email, password, pin });
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/plantas');
    revalidatePath('/usuarios');
    revalidatePath('/login');
  }
  return toActionResponse(result);
}

// 3. Iniciar sesión desde el selector de perfil (con PIN o Contraseña)
export async function loginConCredenciales(
  usuarioId: string,
  credential: string,
  usarPin: boolean = false
) {
  const result = await loginConCredencialesUC.execute({ usuarioId, credential, usarPin });
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/plantas');
    revalidatePath('/usuarios');
    revalidatePath('/login');
  }
  return toActionResponse(result);
}

// 4. Iniciar sesión tradicional con Correo y Contraseña
export async function loginTradicional(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = await loginTradicionalUC.execute({ email, password });
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/plantas');
    revalidatePath('/usuarios');
    revalidatePath('/login');
  }
  return toActionResponse(result);
}

// 5. Cerrar sesión
export async function logout() {
  await defaultSessionService.destroySession();
  revalidatePath('/');
  revalidatePath('/plantas');
  revalidatePath('/usuarios');
  revalidatePath('/login');
  return { success: true };
}

// 6. Obtener usuario autenticado actual
export async function getUsuarioAutenticado() {
  return await defaultSessionService.getSession();
}
