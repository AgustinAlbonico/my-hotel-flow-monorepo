import { ApiProperty } from '@nestjs/swagger';
import { ClientFoundResponseDto } from './create-reservation-presentation.dto';

export class DebtInvoiceResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() invoiceNumber!: string;
  @ApiProperty() total!: number;
  @ApiProperty() amountPaid!: number;
  @ApiProperty() outstandingBalance!: number;
  @ApiProperty() status!: string;
  @ApiProperty() isOverdue!: boolean;
  @ApiProperty({ required: false }) reservationId?: number;
  @ApiProperty({ required: false }) checkIn?: Date;
  @ApiProperty({ required: false }) checkOut?: Date;
  @ApiProperty({ required: false }) roomNumber?: string;
  @ApiProperty({ required: false }) roomType?: string;
  @ApiProperty({ required: false }) description?: string;
}

export class ClientFoundExtendedResponseDto extends ClientFoundResponseDto {
  @ApiProperty() outstandingBalance!: number;
  @ApiProperty() isDebtor!: boolean;
  @ApiProperty({ type: [DebtInvoiceResponseDto], required: false })
  invoices?: DebtInvoiceResponseDto[];
}
