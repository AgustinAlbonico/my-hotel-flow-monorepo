import {
  IsInt,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../../domain/entities/payment.entity';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  invoiceId: number;

  @IsInt()
  @Min(1)
  clientId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
