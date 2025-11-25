import { IsString, Length, Matches } from 'class-validator';

/**
 * SearchClientByDNIDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar input para búsqueda de cliente por DNI
 */
export class SearchClientByDNIDto {
  @IsString({ message: 'DNI debe ser un texto' })
  @Length(7, 8, { message: 'DNI debe tener entre 7 y 8 caracteres' })
  @Matches(/^[0-9]+$/, { message: 'DNI debe contener solo números' })
  dni: string;
}
