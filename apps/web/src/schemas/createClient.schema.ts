import { z } from 'zod';

/**
 * Schema de validación para crear cliente
 * Zod schema con validaciones frontend
 */
export const createClientSchema = z.object({
  dni: z
    .string()
    .min(7, 'El DNI debe tener al menos 7 dígitos')
    .max(8, 'El DNI debe tener máximo 8 dígitos')
    .regex(/^[0-9]+$/, 'El DNI debe contener solo números'),

  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'El nombre solo puede contener letras',
    ),

  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede exceder 100 caracteres')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'El apellido solo puede contener letras',
    ),

  email: z
    .string()
    .email('Ingrese un email válido')
    .max(255, 'El email no puede exceder 255 caracteres'),

  phone: z
    .string()
    .regex(/^[0-9]{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos')
    .optional()
    .or(z.literal('')),

  birthDate: z
    .string()
    .optional()
    .or(z.literal('')),

  address: z
    .string()
    .max(255, 'La dirección no puede exceder 255 caracteres')
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  country: z
    .string()
    .max(100, 'El país no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  nationality: z
    .string()
    .max(100, 'La nacionalidad no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  observations: z
    .string()
    .optional()
    .or(z.literal('')),
  actionGroups: z
    .array(z.string())
    .optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;
