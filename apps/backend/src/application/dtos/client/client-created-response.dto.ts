import { ClientResponseDto } from './client-response.dto';

/**
 * DTO de respuesta para un cliente recién creado
 * Incluye la contraseña temporal (solo en creación)
 * Capa: Application
 */
export class ClientCreatedResponseDto extends ClientResponseDto {
  temporaryPassword: string;
}
