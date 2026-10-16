import { z } from 'zod';

export const CreatePlantaSchema = z.object({
  nombre_comun: z.string().trim().min(1, 'Ingresa el nombre y la ubicación de la planta'),
  ubicacion: z.string().trim().min(1, 'Ingresa el nombre y la ubicación de la planta'),
  especie: z.string().trim().nullable().optional(),
  frecuencia_riego: z.number().int().min(1).default(7),
});

export const UpdatePlantaSchema = z.object({
  nombre_comun: z.string().trim().min(1, 'El nombre y la ubicación son obligatorios'),
  ubicacion: z.string().trim().min(1, 'El nombre y la ubicación son obligatorios'),
  especie: z.string().trim().nullable().optional(),
  frecuencia_riego: z.number().int().min(1).nullable().optional(),
});
