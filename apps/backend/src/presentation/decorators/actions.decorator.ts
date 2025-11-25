import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para requerir acciones específicas
 *
 * @param actions - Lista de acciones requeridas (todas deben cumplirse)
 *
 * @example
 * ```typescript
 * @Actions('reservas.crear', 'reservas.modificar')
 * @Post('reservations')
 * async createReservation() {
 *   // Solo usuarios con ambas acciones pueden ejecutar esto
 * }
 * ```
 */
export const Actions = (...actions: string[]) =>
  SetMetadata('actions', actions);
