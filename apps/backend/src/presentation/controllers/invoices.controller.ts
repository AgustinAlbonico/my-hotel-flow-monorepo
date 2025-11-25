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
import { GenerateInvoiceUseCase } from '../../application/use-cases/invoice/generate-invoice.use-case';
import type { IInvoiceRepository } from '../../domain/repositories/invoice.repository.interface';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import type { IClientRepository } from '../../domain/repositories/client.repository.interface';
import { Inject } from '@nestjs/common';
import { Actions } from '../decorators/actions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

/**
 * Invoices Controller
 * Gestión de facturas
 */
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly generateInvoiceUseCase: GenerateInvoiceUseCase,
    @Inject('IInvoiceRepository')
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  /**
   * Generar factura para una reserva
   * POST /invoices/generate/:reservationId
   */
  @Post('generate/:reservationId')
  @HttpCode(HttpStatus.CREATED)
  @Actions('facturas.crear')
  async generateInvoice(
    @Param('reservationId', ParseIntPipe) reservationId: number,
  ) {
    const invoice = await this.generateInvoiceUseCase.execute(reservationId);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reservationId: invoice.reservationId,
      clientId: invoice.clientId,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      outstandingBalance: invoice.getOutstandingBalance(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      notes: invoice.notes,
      createdAt: invoice.createdAt,
    };
  }

  /**
   * Obtener factura por ID
   * GET /invoices/:id
   */
  @Get(':id')
  @Actions('facturas.ver')
  async getInvoiceById(@Param('id', ParseIntPipe) id: number) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reservationId: invoice.reservationId,
      clientId: invoice.clientId,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      outstandingBalance: invoice.getOutstandingBalance(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      notes: invoice.notes,
      createdAt: invoice.createdAt,
    };
  }

  /**
   * Obtener factura por reserva
   * GET /invoices/reservation/:reservationId
   */
  @Get('reservation/:reservationId')
  @Actions('facturas.ver')
  async getInvoiceByReservation(
    @Param('reservationId', ParseIntPipe) reservationId: number,
  ) {
    const invoice =
      await this.invoiceRepository.findByReservationId(reservationId);
    if (!invoice) {
      throw new NotFoundException(
        `No se encontró factura para la reserva ${reservationId}`,
      );
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reservationId: invoice.reservationId,
      clientId: invoice.clientId,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      outstandingBalance: invoice.getOutstandingBalance(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      notes: invoice.notes,
      createdAt: invoice.createdAt,
    };
  }

  /**
   * Obtener facturas por cliente
   * GET /invoices/client/:clientId
   */
  @Get('client/:clientId')
  @Actions('facturas.listar')
  async getInvoicesByClient(@Param('clientId', ParseIntPipe) clientId: number) {
    const invoices = await this.invoiceRepository.findByClientId(clientId);

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reservationId: invoice.reservationId,
      clientId: invoice.clientId,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      outstandingBalance: invoice.getOutstandingBalance(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
    }));
  }

  /**
   * Listar todas las facturas
   * GET /invoices
   * Usado por la pantalla de listado general de facturas
   */
  @Get()
  @Actions('facturas.listar')
  @ApiOperation({ summary: 'Listar todas las facturas' })
  @ApiOkResponse({ description: 'Listado de facturas con estado y saldos' })
  async getAllInvoices() {
    const invoices = await this.invoiceRepository.findAll();

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reservationId: invoice.reservationId,
      clientId: invoice.clientId,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      outstandingBalance: invoice.getOutstandingBalance(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
    }));
  }

  /**
   * Obtener facturas vencidas
   * GET /invoices/overdue
   */
  @Get('list/overdue')
  @Actions('facturas.listar')
  async getOverdueInvoices() {
    const invoices = await this.invoiceRepository.findOverdue();

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reservationId: invoice.reservationId,
      clientId: invoice.clientId,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      outstandingBalance: invoice.getOutstandingBalance(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      daysOverdue: Math.ceil(
        (new Date().getTime() - invoice.dueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    }));
  }

  /**
   * Obtener datos de recibo imprimible de una factura
   * GET /invoices/:id/receipt
   */
  @Get(':id/receipt')
  @Actions('facturas.ver')
  async getInvoiceReceipt(@Param('id', ParseIntPipe) id: number) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    const [payments, client] = await Promise.all([
      this.paymentRepository.findByInvoiceId(invoice.id),
      this.clientRepository.findById(invoice.clientId),
    ]);

    const invoiceData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      reservationId: invoice.reservationId,
      clientId: invoice.clientId,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      outstandingBalance: invoice.getOutstandingBalance(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      isOverdue: invoice.isOverdue(),
      notes: invoice.notes,
      createdAt: invoice.createdAt,
    };

    const clientData = client
      ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          dni: client.dni?.value ?? null,
          email: client.email?.value ?? null,
          phone: client.phone?.value ?? null,
          city: client.city ?? null,
          country: client.country ?? null,
        }
      : null;

    const paymentsData = payments.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      clientId: p.clientId,
      amount: p.amount,
      method: p.method,
      status: p.status,
      reference: p.reference,
      notes: p.notes,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    }));

    return {
      invoice: invoiceData,
      client: clientData,
      payments: paymentsData,
      totals: {
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        outstandingBalance: invoice.getOutstandingBalance(),
      },
      meta: {
        printable: true,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
