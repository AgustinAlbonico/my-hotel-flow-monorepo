/**
 * Schemas de validación para acciones
 * Siguiendo MEJORES_PRACTICAS.md - Validación con Zod
 */
import { z } from 'zod';

export const createActionSchema = z.object({
  key: z
    .string()
    .min(1, 'Clave es requerida')
    .max(255, 'Máximo 255 caracteres')
    .regex(/^[a-z0-9._-]+$/, 'Solo minúsculas, números, puntos, guiones y guiones bajos'),
  name: z.string().min(1, 'Nombre es requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

export const updateActionSchema = createActionSchema.partial();

// Exportar tipos inferidos
export type CreateActionFormData = z.infer<typeof createActionSchema>;
export type UpdateActionFormData = z.infer<typeof updateActionSchema>;
