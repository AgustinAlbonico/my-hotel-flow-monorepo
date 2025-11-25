import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RegisterPaymentUseCase } from '../../application/use-cases/payment/register-payment.use-case';
import { CreatePaymentDto } from '../../application/dtos/payment/create-payment.dto';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import { Inject } from '@nestjs/common';
import { Actions } from '../decorators/actions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

/**
 * Payments Controller
 * Gestión de pagos
 */
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  /**
   * Registrar un nuevo pago
   * POST /payments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Actions('pagos.registrar')
  async registerPayment(@Body() dto: CreatePaymentDto) {
    const payment = await this.registerPaymentUseCase.execute(dto);

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      clientId: payment.clientId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }

  /**
   * Obtener pago por ID
   * GET /payments/:id
   */
  @Get(':id')
  @Actions('pagos.ver')
  async getPaymentById(@Param('id', ParseIntPipe) id: number) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      clientId: payment.clientId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    };
  }

  /**
   * Obtener pagos por factura
   * GET /payments/invoice/:invoiceId
   */
  @Get('invoice/:invoiceId')
  @Actions('pagos.listar')
  async getPaymentsByInvoice(
    @Param('invoiceId', ParseIntPipe) invoiceId: number,
  ) {
    const payments = await this.paymentRepository.findByInvoiceId(invoiceId);

    return payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      clientId: payment.clientId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    }));
  }

  /**
   * Obtener pagos por cliente
   * GET /payments/client/:clientId
   */
  @Get('client/:clientId')
  @Actions('pagos.listar')
  async getPaymentsByClient(@Param('clientId', ParseIntPipe) clientId: number) {
    const payments = await this.paymentRepository.findByClientId(clientId);

    return payments.map((payment) => ({
      id: payment.id,
      invoiceId: payment.invoiceId,
      clientId: payment.clientId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    }));
  }
}
