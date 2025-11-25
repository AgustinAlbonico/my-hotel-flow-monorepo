import { IsOptional, IsString, MaxLength, IsBoolean } from 'class-validator';

/**
 * CheckInDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Validar input para realizar check-in
 */
export class CheckInDto {
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(500, {
    message: 'Las observaciones no pueden exceder los 500 caracteres',
  })
  observations?: string;

  @IsOptional()
  @IsBoolean({ message: 'documentsVerified debe ser un valor booleano' })
  documentsVerified?: boolean;
}
