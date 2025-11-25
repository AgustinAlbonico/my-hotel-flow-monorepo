import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * Resource Not Found Exception
 * Se lanza cuando un recurso solicitado no existe en la base de datos
 *
 * Ejemplo de uso:
 * ```typescript
 * const user = await this.repository.findById(id);
 * if (!user) {
 *   throw new ResourceNotFoundException('Usuario', id);
 * }
 * ```
 */
export class ResourceNotFoundException extends DomainException {
  constructor(resourceType: string, resourceId: string | number) {
    super(
      `${resourceType} con ID '${resourceId}' no encontrado`,
      HttpStatus.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      { resourceType, resourceId },
    );
  }
}
