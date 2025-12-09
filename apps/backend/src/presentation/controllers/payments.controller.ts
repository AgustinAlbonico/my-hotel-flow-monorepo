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
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { RegisterPaymentUseCase } from '../../application/use-cases/payment/register-payment.use-case';
import { CreatePaymentDto } from '../../application/dtos/payment/create-payment.dto';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import { Inject } from '@nestjs/common';
import { Actions } from '../decorators/actions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PdfGeneratorService } from '../../infrastructure/pdf/pdf-generator.service';
import { createReadStream } from 'fs';

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
    private readonly pdfGeneratorService: PdfGeneratorService,
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

  /**
   * Descargar comprobante de pago en PDF
   * GET /payments/:id/receipt
   */
  @Get(':id/receipt')
  @Actions('pagos.ver')
  @ApiOperation({ summary: 'Descargar comprobante de pago en PDF' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comprobante en PDF',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Pago o comprobante no encontrado' })
  async downloadReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // 1. Buscar el pago
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    // 2. Verificar que existe el comprobante
    if (!payment.receiptPath) {
      throw new NotFoundException(`No se encontró comprobante para el pago #${id}`);
    }

    // 3. Verificar que el archivo existe
    const exists = await this.pdfGeneratorService.receiptExists(payment.receiptPath);
    if (!exists) {
      throw new NotFoundException(`El archivo del comprobante no existe en el servidor`);
    }

    // 4. Configurar headers de respuesta para forzar descarga
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprobante-pago-${id}.pdf"`,
      'Content-Transfer-Encoding': 'binary',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    // 5. Enviar archivo
    const file = createReadStream(payment.receiptPath);
    return new StreamableFile(file);
  }
}
