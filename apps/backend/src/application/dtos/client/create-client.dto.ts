/**
 * DTO para crear un cliente
 * Capa: Application
 */
export class CreateClientDto {
  dni: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  observations?: string;
}
