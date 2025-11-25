import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para marcar una ruta como pública (sin autenticación)
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * async healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);
