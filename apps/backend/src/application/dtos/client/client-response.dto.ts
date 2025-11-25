/**
 * DTO de respuesta para un cliente
 * Capa: Application
 */
export class ClientResponseDto {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
