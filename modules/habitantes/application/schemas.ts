import { z } from 'zod';

export const PinSchema = z
  .string()
  .refine((val) => /^\d{4,6}$/.test(val), {
    message: 'El PIN debe contener entre 4 y 6 dígitos numéricos',
  });

export const OptionalPinSchema = z
  .string()
  .nullish()
  .transform((val) => (val?.trim() ? val.trim() : null))
  .refine((val) => val === null || /^\d{4,6}$/.test(val), {
    message: 'El PIN debe contener entre 4 y 6 dígitos numéricos',
  });

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('El correo electrónico es inválido');

export const RegistroNuevoMiembroSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: EmailSchema,
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  pin: OptionalPinSchema,
});

export const LoginCredencialesSchema = z.object({
  usuarioId: z.string().min(1, 'Por favor ingresa tu clave o PIN'),
  credential: z.string().trim().min(1, 'Por favor ingresa tu clave o PIN'),
  usarPin: z.boolean().default(false),
});

export const LoginTradicionalSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Todos los campos son obligatorios'),
});

export const CreateHabitanteSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre, correo y contraseña son obligatorios'),
  email: EmailSchema,
  password: z.string().min(1, 'Nombre, correo y contraseña son obligatorios'),
  pin: OptionalPinSchema,
});

export const UpdateHabitanteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre y el correo son obligatorios'),
  email: EmailSchema,
  password: z.string().nullish().transform((v) => (v?.trim() ? v.trim() : null)),
  pin: OptionalPinSchema,
});
