import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import type { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IAccountMovementRepository } from '../../../domain/repositories/account-movement.repository.interface';
import { Payment } from '../../../domain/entities/payment.entity';
import { AccountMovement } from '../../../domain/entities/account-movement.entity';
import { CreatePaymentDto } from '../../dtos/payment/create-payment.dto';

/**
 * Register Payment Use Case
 * Registra un pago y actualiza la factura y saldo del cliente
 */
@Injectable()
export class RegisterPaymentUseCase {
  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IAccountMovementRepository')
    private readonly accountMovementRepository: IAccountMovementRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(dto: CreatePaymentDto): Promise<Payment> {
    return await this.dataSource.transaction(async () => {
      // 1. Verificar que la factura existe
      const invoice = await this.invoiceRepository.findById(dto.invoiceId);
      if (!invoice) {
        throw new NotFoundException(
          `Factura con ID ${dto.invoiceId} no encontrada`,
        );
      }

      // 2. Verificar que el cliente existe
      const client = await this.clientRepository.findById(dto.clientId);
      if (!client) {
        throw new NotFoundException(
          `Cliente con ID ${dto.clientId} no encontrado`,
        );
      }

      // 3. Validar que la factura puede recibir pagos
      if (!invoice.canReceivePayment()) {
        throw new BadRequestException(
          'La factura no puede recibir pagos (ya está pagada o cancelada)',
        );
      }

      // 4. Validar que el monto no exceda el saldo pendiente
      const outstandingBalance = invoice.getOutstandingBalance();
      if (dto.amount > outstandingBalance) {
        throw new BadRequestException(
          `El monto del pago ($${dto.amount}) excede el saldo pendiente ($${outstandingBalance})`,
        );
      }

      // 5. Crear el pago
      const payment = Payment.create(
        dto.invoiceId,
        dto.clientId,
        dto.amount,
        dto.method,
        dto.reference,
        dto.notes,
      );

      // 6. Marcar como completado inmediatamente (para pagos en efectivo/tarjeta)
      // TODO: Para pagos con procesamiento asíncrono, mantener en PENDING
      payment.markAsCompleted();

      // 7. Persistir el pago
      const savedPayment = await this.paymentRepository.save(payment);

      // 8. Actualizar la factura con el pago
      invoice.recordPayment(dto.amount);
      await this.invoiceRepository.update(invoice);

      // 9. Registrar movimiento en cuenta corriente
      const lastBalance = await this.accountMovementRepository.getLastBalance(
        client.id,
      );

      const movement = AccountMovement.createPayment(
        client.id,
        dto.amount,
        lastBalance - dto.amount,
        `Pago ${payment.reference || 'sin referencia'} - ${dto.method}`,
        savedPayment.id.toString(),
      );
      await this.accountMovementRepository.save(movement);

      // 10. Reducir la deuda del cliente
      client.reduceDebt(dto.amount);
      await this.clientRepository.update(client);

      return savedPayment;
    });
  }
}
