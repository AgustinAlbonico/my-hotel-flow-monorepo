import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { IPaymentRepository } from '../../../domain/repositories/payment.repository.interface';
import type { IInvoiceRepository } from '../../../domain/repositories/invoice.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IAccountMovementRepository } from '../../../domain/repositories/account-movement.repository.interface';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { Payment } from '../../../domain/entities/payment.entity';
import { AccountMovement } from '../../../domain/entities/account-movement.entity';
import { CreatePaymentDto } from '../../dtos/payment/create-payment.dto';
import { PdfGeneratorService, type ReceiptData } from '../../../infrastructure/pdf/pdf-generator.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Register Payment Use Case
 * Registra un pago y actualiza la factura y saldo del cliente
 */
@Injectable()
export class RegisterPaymentUseCase {
  private readonly logger = new Logger(RegisterPaymentUseCase.name);

  constructor(
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IAccountMovementRepository')
    private readonly accountMovementRepository: IAccountMovementRepository,
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
    private readonly pdfGeneratorService: PdfGeneratorService,
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

      // 11. Generar comprobante en PDF
      try {
        const receiptPath = await this.generateReceipt(savedPayment, invoice, client);
        savedPayment.setReceiptPath(receiptPath);
        await this.paymentRepository.update(savedPayment);
        this.logger.log(`Comprobante PDF generado para pago #${savedPayment.id}`);
      } catch (error) {
        this.logger.error(`Error generando comprobante PDF para pago #${savedPayment.id}`, error);
        // No lanzamos error, el pago ya está registrado
      }

      return savedPayment;
    });
  }

  /**
   * Genera el comprobante en PDF para un pago
   */
  private async generateReceipt(payment: Payment, invoice: any, client: any): Promise<string> {
    // Obtener la reserva asociada a la factura
    const reservation = await this.reservationRepository.findById(invoice.reservationId);
    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    // Obtener información de la habitación
    const room = await this.roomRepository.findById(reservation.roomId);
    const roomNumber = room?.numeroHabitacion || String(reservation.roomId);
    const roomType = room?.roomType.name || 'Habitación';

    // Mapear método de pago a texto legible
    const paymentMethodNames: Record<string, string> = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de Crédito',
      DEBIT_CARD: 'Tarjeta de Débito',
      BANK_TRANSFER: 'Transferencia Bancaria',
      CHECK: 'Cheque',
      OTHER: 'Otro',
    };

    // Preparar datos para el template
    const receiptData: ReceiptData = {
      hotel: {
        name: 'My Hotel Flow Gestión Hotelera S.A.',
        cuit: '30-71234567-8',
        address: 'Av. Corrientes 1234, CABA, Argentina',
        email: 'info@myhotelflow.com',
        phone: '+54 11 4567-8900',
      },
      receipt: {
        type: 'B',
        number: String(payment.id).padStart(8, '0'),
        date: format(payment.paidAt, 'dd/MM/yyyy HH:mm', { locale: es }),
      },
      client: {
        name: `${client.lastName}, ${client.firstName}`,
        dni: client.dni || 'N/A',
        address: client.address || 'No especificado',
        email: client.email || 'No especificado',
        phone: client.phone || 'No especificado',
        taxCondition: 'Consumidor Final',
      },
      reservation: {
        id: reservation.id,
        checkIn: format(new Date(reservation.checkIn), 'dd/MM/yyyy', { locale: es }),
        checkOut: format(new Date(reservation.checkOut), 'dd/MM/yyyy', { locale: es }),
        roomNumber: roomNumber,
        roomType: roomType,
      },
      items: [
        {
          code: `HAB-${roomNumber}`,
          description: `Estadía - ${roomType}`,
          quantity: invoice.quantity || 1,
          unitPrice: invoice.unitPrice || invoice.totalAmount,
          discount: 0,
          subtotal: invoice.subtotal || invoice.totalAmount,
        },
      ],
      totals: {
        subtotal: invoice.subtotal || invoice.totalAmount,
        discount: invoice.discount || 0,
        iva: invoice.iva || 0,
        total: invoice.totalAmount,
      },
      payment: {
        id: payment.id,
        method: paymentMethodNames[payment.method] || payment.method,
        amount: payment.amount,
        reference: payment.reference || undefined,
        date: format(payment.paidAt, "dd/MM/yyyy 'a las' HH:mm", { locale: es }),
      },
    };

    return await this.pdfGeneratorService.generateReceipt(receiptData);
  }
}
