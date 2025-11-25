/**
 * Utilidad para combinar clases de Tailwind sin conflictos
 * Usa clsx para condicionales y twMerge para merge inteligente
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind sin conflictos
 *
 * Ejemplo:
 * cn('px-2 py-1', 'px-4') => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') => 'text-blue-500' (si condition es true)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
