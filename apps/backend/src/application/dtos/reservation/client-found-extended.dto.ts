import { ClientFoundDto } from './client-found.dto';
import { DebtInvoiceDto } from './debt-invoice.dto';

/**
 * ClientFoundExtendedDto
 * Extiende datos del cliente con información de deuda
 */
export class ClientFoundExtendedDto extends ClientFoundDto {
  outstandingBalance!: number;
  isDebtor!: boolean;
  invoices?: DebtInvoiceDto[];
}
