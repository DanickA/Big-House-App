'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, destroySession, getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export type MiembroSelector = {
  id: string;
  nombre: string;
  email: string;
  tienePin: boolean;
};

// 1. Obtener lista de miembros para el selector visual de login
export async function getMiembrosParaSelector(): Promise<{ success: boolean; data: MiembroSelector[] }> {
  try {
    const usuarios = await prisma.usuarios.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        pin_hash: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return {
      success: true,
      data: usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        tienePin: !!u.pin_hash,
      })),
    };
  } catch (error) {
    console.error('Error al obtener miembros para login:', error);
    return { success: false, data: [] };
  }
}

// 2. Registrar un nuevo miembro desde el login y loguearlo automáticamente
export async function registroNuevoMiembro(formData: FormData) {
  try {
    const nombre = (formData.get('nombre') as string)?.trim();
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const password = formData.get('password') as string;
    const pin = (formData.get('pin') as string)?.trim() || null;

    if (!nombre || !email || !password) {
      return { success: false, error: 'Nombre, correo y contraseña son obligatorios' };
    }

    if (password.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    if (pin && (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin))) {
      return { success: false, error: 'El PIN debe contener entre 4 y 6 dígitos numéricos' };
    }

    // Verificar si el correo ya existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return { success: false, error: 'El correo electrónico ya se encuentra registrado' };
    }

    const password_hash = await bcrypt.hash(password, 10);
    const pin_hash = pin ? await bcrypt.hash(pin, 10) : null;

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        password_hash,
        pin_hash,
      },
    });

    // Iniciar sesión automáticamente
    await createSession(nuevoUsuario.id, nuevoUsuario.nombre, nuevoUsuario.email);

    revalidatePath('/');
    revalidatePath('/plantas');
    revalidatePath('/usuarios');
    revalidatePath('/login');

    return {
      success: true,
      data: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
      },
    };
  } catch (error) {
    console.error('Error en registro de nuevo miembro:', error);
    return { success: false, error: 'No se pudo registrar el usuario en la base de datos' };
  }
}

// 3. Iniciar sesión desde el selector de perfil (con PIN o Contraseña)
export async function loginConCredenciales(
  usuarioId: string,
  credential: string,
  usarPin: boolean = false
) {
  try {
    const credLimpia = credential?.trim();
    if (!usuarioId || !credLimpia) {
      return { success: false, error: 'Por favor ingresa tu clave o PIN' };
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    let esValido = false;

    // Si el usuario intentó ingresar con PIN
    if (usarPin && usuario.pin_hash) {
      try {
        esValido = await bcrypt.compare(credLimpia, usuario.pin_hash);
      } catch {
        esValido = false;
      }
    }

    // Si no fue válido con PIN o no usa PIN, probar con contraseña
    if (!esValido) {
      try {
        esValido = await bcrypt.compare(credLimpia, usuario.password_hash);
      } catch {
        esValido = false;
      }
    }

    // Si la contraseña antigua aún no estaba hasheada (texto plano de fallback previo)
    if (!esValido && usuario.password_hash === credLimpia) {
      esValido = true;
      const nuevoHash = await bcrypt.hash(credLimpia, 10);
      await prisma.usuarios.update({
        where: { id: usuario.id },
        data: { password_hash: nuevoHash },
      });
    }

    if (!esValido) {
      return {
        success: false,
        error: usarPin ? 'PIN o contraseña incorrectos' : 'Contraseña incorrecta',
      };
    }

    await createSession(usuario.id, usuario.nombre, usuario.email);

    revalidatePath('/');
    revalidatePath('/plantas');
    revalidatePath('/usuarios');
    revalidatePath('/login');

    return {
      success: true,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
    };
  } catch (error) {
    console.error('Error en login con credenciales:', error);
    return { success: false, error: 'Ocurrió un error al iniciar sesión' };
  }
}

// 4. Iniciar sesión tradicional con Correo y Contraseña
export async function loginTradicional(formData: FormData) {
  try {
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const password = formData.get('password') as string;

    if (!email || !password) {
      return { success: false, error: 'Todos los campos son obligatorios' };
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { email },
    });

    if (!usuario) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    let esValido = false;
    try {
      esValido = await bcrypt.compare(password, usuario.password_hash);
    } catch {
      esValido = false;
    }

    // Fallback si la contraseña estaba sin hashear
    if (!esValido && usuario.password_hash === password) {
      esValido = true;
      const nuevoHash = await bcrypt.hash(password, 10);
      await prisma.usuarios.update({
        where: { id: usuario.id },
        data: { password_hash: nuevoHash },
      });
    }

    if (!esValido) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    await createSession(usuario.id, usuario.nombre, usuario.email);

    revalidatePath('/');
    revalidatePath('/plantas');
    revalidatePath('/usuarios');
    revalidatePath('/login');

    return {
      success: true,
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
    };
  } catch (error) {
    console.error('Error en login tradicional:', error);
    return { success: false, error: 'Ocurrió un error al iniciar sesión' };
  }
}

// 5. Cerrar sesión
export async function logout() {
  await destroySession();
  revalidatePath('/');
  revalidatePath('/plantas');
  revalidatePath('/usuarios');
  revalidatePath('/login');
  return { success: true };
}

// 6. Obtener usuario autenticado actual
export async function getUsuarioAutenticado() {
  return await getSession();
}
