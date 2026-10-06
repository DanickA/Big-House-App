'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { resolveSessionUser } from '@/lib/auth-guard';

// 1. Obtener todos los usuarios registrados
export async function getUsuarios() {
  try {
    let usuarios: any[];
    try {
      usuarios = await prisma.usuarios.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          pin_hash: true,
          pin_longitud: true,
          fecha_registro: true,
        },
        orderBy: {
          fecha_registro: 'desc',
        },
      });
    } catch (queryErr: any) {
      if (queryErr?.message?.includes('pin_longitud')) {
        const fallback = await prisma.usuarios.findMany({
          select: {
            id: true,
            nombre: true,
            email: true,
            pin_hash: true,
            fecha_registro: true,
          },
          orderBy: {
            fecha_registro: 'desc',
          },
        });
        usuarios = fallback.map((u) => ({ ...u, pin_longitud: 4 }));
      } else {
        throw queryErr;
      }
    }

    return {
      success: true,
      data: usuarios.map((u) => ({
        ...u,
        tienePin: !!u.pin_hash,
        pinLongitud: u.pin_longitud || 4,
      })),
    };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { success: false, error: 'No se pudieron cargar los usuarios' };
  }
}

// 2. Crear un nuevo usuario en la base de datos
export async function createUsuario(formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const nombre = formData.get('nombre') as string;
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string;
  const pin = formData.get('pin') as string | null;

  if (!nombre || !email || !password) {
    return { success: false, error: 'Nombre, correo y contraseña son obligatorios' };
  }

  if (pin && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
    return { success: false, error: 'El PIN debe contener entre 4 y 6 dígitos numéricos' };
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const pin_hash = pin && pin.trim().length > 0 ? await bcrypt.hash(pin.trim(), 10) : null;
    const pin_longitud = pin && pin.trim().length > 0 ? pin.trim().length : null;

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        password_hash,
        pin_hash,
        pin_longitud,
      },
    });

    revalidatePath('/usuarios');
    revalidatePath('/login');
    revalidatePath('/');
    return { success: true, data: nuevoUsuario };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { success: false, error: 'El correo ya está registrado o hubo un error en la base de datos' };
  }
}

// 3. Actualizar información de un usuario (Nombre, Email, Contraseña y PIN)
export async function updateUsuario(id: string, formData: FormData) {
  const auth = await resolveSessionUser();
  if (!auth.ok) {
    return { success: false, error: auth.error, code: auth.code };
  }

  const nombre = formData.get('nombre') as string;
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const password = formData.get('password') as string | null;
  const pin = formData.get('pin') as string | null;

  if (!nombre || !email) {
    return { success: false, error: 'El nombre y el correo son obligatorios' };
  }

  if (pin && pin.trim().length > 0 && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
    return { success: false, error: 'El PIN debe contener entre 4 y 6 dígitos numéricos' };
  }

  try {
    const dataToUpdate: {
      nombre: string;
      email: string;
      password_hash?: string;
      pin_hash?: string | null;
      pin_longitud?: number | null;
    } = {
      nombre,
      email,
    };

    if (password && password.trim().length > 0) {
      dataToUpdate.password_hash = await bcrypt.hash(password, 10);
    }

    if (pin !== null && pin !== undefined) {
      if (pin.trim().length > 0) {
        dataToUpdate.pin_hash = await bcrypt.hash(pin.trim(), 10);
        dataToUpdate.pin_longitud = pin.trim().length;
      }
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath('/usuarios');
    revalidatePath('/login');
    revalidatePath('/');
    return { success: true, data: usuarioActualizado };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { success: false, error: 'No se pudo actualizar el perfil del usuario' };
  }
}

// 4. Eliminar un usuario
export async function deleteUsuario(id: string) {
  try {
    const auth = await resolveSessionUser();
    if (!auth.ok) {
      return { success: false, error: auth.error, code: auth.code };
    }

    if (auth.user.userId === id) {
      return {
        success: false,
        error: 'No puedes eliminar tu propia cuenta mientras tu sesión esté activa',
      };
    }

    await prisma.usuarios.delete({
      where: { id },
    });
    revalidatePath('/usuarios');
    revalidatePath('/login');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { success: false, error: 'No se pudo eliminar el usuario' };
  }
}