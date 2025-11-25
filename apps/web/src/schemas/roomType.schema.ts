import { z } from 'zod';

/**
 * Schema de validación para crear/editar tipo de habitación
 */
export const roomTypeSchema = z.object({
  code: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(50, 'El código no puede exceder 50 caracteres')
    .transform((val) => val.toLowerCase()) // Convertir automáticamente a minúsculas
    .pipe(
      z.string().regex(
        /^[a-z0-9-]+$/,
        'El código solo puede contener letras minúsculas, números y guiones',
      ),
    ),

  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  precioPorNoche: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .min(0, 'El precio no puede ser negativo')
    .max(1000000, 'El precio no puede exceder $1.000.000'),

  capacidadMaxima: z
    .number({ invalid_type_error: 'La capacidad debe ser un número' })
    .int('La capacidad debe ser un número entero')
    .min(1, 'La capacidad mínima es 1 persona')
    .max(10, 'La capacidad máxima es 10 personas'),

  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),

  caracteristicasIds: z
    .array(z.number())
    .optional()
    .default([]),
});

/**
 * Schema para actualizar tipo de habitación (todos los campos opcionales excepto code)
 */
export const updateRoomTypeSchema = roomTypeSchema.partial().required({
  code: true,
});

/**
 * Tipo TypeScript inferido del schema
 */
export type RoomTypeFormData = z.infer<typeof roomTypeSchema>;
export type UpdateRoomTypeFormData = z.infer<typeof updateRoomTypeSchema>;
