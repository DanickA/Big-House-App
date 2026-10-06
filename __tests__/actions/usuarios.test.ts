import { createUsuario, updateUsuario } from '@/actions/usuarios';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    usuarios: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Usuarios Actions - PIN y Seguridad (GUI-03, GUI-09)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUsuario', () => {
    it('debe crear un usuario con PIN válido de 4 dígitos', async () => {
      const formData = new FormData();
      formData.set('nombre', 'Carlos');
      formData.set('email', 'carlos@hogar.com');
      formData.set('password', '1234');
      formData.set('pin', '1234');

      (prisma.usuarios.create as jest.Mock).mockResolvedValue({
        id: 'u-1',
        nombre: 'Carlos',
        email: 'carlos@hogar.com',
      });

      const res = await createUsuario(formData);
      expect(res.success).toBe(true);

      const createCall = (prisma.usuarios.create as jest.Mock).mock.calls[0][0].data;
      expect(createCall.nombre).toBe('Carlos');
      expect(createCall.email).toBe('carlos@hogar.com');
      expect(createCall.pin_longitud).toBe(4);
      expect(createCall.pin_hash).toBeTruthy();
    });

    it('debe rechazar PIN con formato inválido (menos de 4 dígitos)', async () => {
      const formData = new FormData();
      formData.set('nombre', 'Carlos');
      formData.set('email', 'carlos@hogar.com');
      formData.set('password', 'password123');
      formData.set('pin', '12');

      const res = await createUsuario(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('PIN');
    });

    it('debe rechazar PIN no numérico', async () => {
      const formData = new FormData();
      formData.set('nombre', 'Carlos');
      formData.set('email', 'carlos@hogar.com');
      formData.set('password', 'password123');
      formData.set('pin', 'abcd');

      const res = await createUsuario(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('PIN');
    });
  });

  describe('updateUsuario', () => {
    it('debe permitir actualizar nombre y email sin tocar el PIN si no se envía nuevo PIN (preserva PIN existente)', async () => {
      const formData = new FormData();
      formData.set('nombre', 'Carlos Modificado');
      formData.set('email', 'carlos.nuevo@hogar.com');
      // No se envía pin o se envía vacío

      (prisma.usuarios.update as jest.Mock).mockResolvedValue({
        id: 'u-1',
        nombre: 'Carlos Modificado',
        email: 'carlos.nuevo@hogar.com',
      });

      const res = await updateUsuario('u-1', formData);
      expect(res.success).toBe(true);

      const updateData = (prisma.usuarios.update as jest.Mock).mock.calls[0][0].data;
      expect(updateData.nombre).toBe('Carlos Modificado');
      expect(updateData.email).toBe('carlos.nuevo@hogar.com');
      expect(updateData.pin_hash).toBeUndefined();
    });

    it('debe actualizar el PIN si se ingresa un nuevo PIN de 4 dígitos', async () => {
      const formData = new FormData();
      formData.set('nombre', 'Carlos');
      formData.set('email', 'carlos@hogar.com');
      formData.set('pin', '5678');

      (prisma.usuarios.update as jest.Mock).mockResolvedValue({
        id: 'u-1',
        nombre: 'Carlos',
      });

      const res = await updateUsuario('u-1', formData);
      expect(res.success).toBe(true);

      const updateData = (prisma.usuarios.update as jest.Mock).mock.calls[0][0].data;
      expect(updateData.pin_longitud).toBe(4);
      expect(updateData.pin_hash).toBeTruthy();
    });

    it('debe rechazar actualización si el nuevo PIN tiene letras', async () => {
      const formData = new FormData();
      formData.set('nombre', 'Carlos');
      formData.set('email', 'carlos@hogar.com');
      formData.set('pin', '12a4');

      const res = await updateUsuario('u-1', formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('PIN');
    });
  });
});
