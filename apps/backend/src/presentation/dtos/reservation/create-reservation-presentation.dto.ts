import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Length,
  Matches,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchClientByDniRequestDto {
  @ApiProperty({
    example: '12345678',
    description: 'DNI del cliente (7-8 dígitos)',
  })
  @IsString({ message: 'DNI debe ser un texto' })
  @Length(7, 8, { message: 'DNI debe tener entre 7 y 8 caracteres' })
  @Matches(/^[0-9]+$/, { message: 'DNI debe contener solo números' })
  dni: string;
}

export class ClientFoundResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  dni: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  apellido: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  telefono: string | null;
}

export class SearchAvailableRoomsRequestDto {
  @ApiProperty({ example: '2025-11-01' })
  @IsDateString({}, { message: 'Fecha de check-in debe ser una fecha válida' })
  checkInDate: string;

  @ApiProperty({ example: '2025-11-03' })
  @IsDateString({}, { message: 'Fecha de check-out debe ser una fecha válida' })
  checkOutDate: string;

  @ApiProperty({
    example: 'estandar',
    description: 'Código del tipo de habitación',
  })
  @IsString({ message: 'Tipo de habitación debe ser un texto' })
  roomType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Capacidad debe ser un número entero' })
  @Min(1, { message: 'Capacidad debe ser al menos 1' })
  capacity?: number;
}

export class AvailableRoomResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  numeroHabitacion: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  capacidad: number;

  @ApiProperty()
  precioPorNoche: number;

  @ApiProperty({ nullable: true })
  descripcion: string | null;

  @ApiProperty({ type: [String] })
  caracteristicas: string[];

  @ApiProperty()
  precioTotal: number;

  @ApiProperty()
  cantidadNoches: number;
}

export class CreateReservationRequestDto {
  @ApiProperty()
  @IsInt({ message: 'ID de cliente debe ser un número entero' })
  clientId: number;

  @ApiProperty()
  @IsInt({ message: 'ID de habitación debe ser un número entero' })
  roomId: number;

  @ApiProperty()
  @IsDateString({}, { message: 'Fecha de check-in debe ser una fecha válida' })
  checkIn: string;

  @ApiProperty()
  @IsDateString({}, { message: 'Fecha de check-out debe ser una fecha válida' })
  checkOut: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean({ message: 'notifyByEmail debe ser un booleano' })
  notifyByEmail?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean({ message: 'notifyBySMS debe ser un booleano' })
  notifyBySMS?: boolean;

  @ApiProperty({
    required: false,
    description: 'Clave de idempotencia para prevenir reservas duplicadas',
  })
  @IsOptional()
  @IsString({ message: 'idempotencyKey debe ser un texto' })
  @MaxLength(255, {
    message: 'idempotencyKey no puede exceder los 255 caracteres',
  })
  idempotencyKey?: string;
}

export class ReservationCreatedResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  clientId: number;

  @ApiProperty()
  roomId: number;

  @ApiProperty()
  checkIn: Date;

  @ApiProperty()
  checkOut: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  cantidadNoches: number;

  @ApiProperty()
  precioTotal: number;

  @ApiProperty()
  createdAt: Date;
}
