import { z } from 'zod';

export const CreateServicioSchema = z.object({
  nombre_servicio: z.string().trim().min(1, 'El nombre del servicio es obligatorio'),
  monto: z.number().positive('Ingresa un monto válido mayor a 0'),
  fecha_vencimiento: z.string().min(1, 'Selecciona una fecha de vencimiento inicial'),
  periodicidad_meses: z.number().int().min(1).default(1),
  dia_vencimiento: z.number().int().min(1).max(31).nullable().optional(),
  numero_cuenta: z.string().trim().nullable().optional(),
  numero_factura: z.string().trim().nullable().optional(),
  responsable_id: z.string().trim().nullable().optional(),
});

export const UpdateServicioSchema = z.object({
  nombre_servicio: z.string().trim().min(1, 'El nombre es obligatorio'),
  monto: z.number().positive('Monto inválido'),
  fecha_vencimiento: z.string().nullable().optional(),
  periodicidad_meses: z.number().int().min(1).default(1),
  dia_vencimiento: z.number().int().min(1).max(31).nullable().optional(),
  numero_cuenta: z.string().trim().nullable().optional(),
  numero_factura: z.string().trim().nullable().optional(),
  responsable_id: z.string().trim().nullable().optional(),
});

export const RegistrarPagoSchema = z.object({
  servicio_id: z.string().min(1, 'Identificador del servicio requerido'),
  monto_pagado: z.number().positive('Ingresa un monto pagado válido'),
  fecha_pago: z.string().nullable().optional(),
  observaciones: z.string().trim().nullable().optional(),
  fecha_vencimiento_esperada: z.string().nullable().optional(),
});

export const RegistrarAporteFondoSchema = z.object({
  usuario_id: z.string().trim().min(1, 'Selecciona el habitante que realiza el aporte'),
  monto: z.number().positive('Ingresa un monto de aporte mayor a 0'),
  periodo_mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'El período debe tener formato YYYY-MM')
    .optional(),
  descripcion: z.string().trim().max(200).optional(),
});
