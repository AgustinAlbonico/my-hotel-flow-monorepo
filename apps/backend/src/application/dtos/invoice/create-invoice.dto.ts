import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsInt()
  @Min(1)
  reservationId: number;

  @IsInt()
  @Min(1)
  clientId: number;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number = 21; // IVA por defecto

  @IsOptional()
  @IsString()
  notes?: string;
}
