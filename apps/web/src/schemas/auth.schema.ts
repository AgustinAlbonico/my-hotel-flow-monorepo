/**
 * Schemas de validación para autenticación
 * Siguiendo MEJORES_PRACTICAS.md - Validación con Zod
 */
import { z } from 'zod';

export const loginSchema = z.object({
  identity: z
    .string()
    .min(1, 'Usuario o email es requerido')
    .max(255, 'Máximo 255 caracteres'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(255, 'Máximo 255 caracteres'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
        'La contraseña debe contener mayúsculas, minúsculas, números y símbolos'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  });

export const recoverRequestSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const recoverConfirmSchema = z
  .object({
    token: z.string().min(1, 'Token es requerido'),
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
        'La contraseña debe contener mayúsculas, minúsculas, números y símbolos'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Exportar tipos inferidos
export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type RecoverRequestFormData = z.infer<typeof recoverRequestSchema>;
export type RecoverConfirmFormData = z.infer<typeof recoverConfirmSchema>;
