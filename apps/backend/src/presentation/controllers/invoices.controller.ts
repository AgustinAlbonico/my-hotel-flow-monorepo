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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerateInvoiceUseCase } from '../../application/use-cases/invoice/generate-invoice.use-case';
import type { IInvoiceRepository } from '../../domain/repositories/invoice.repository.interface';
import type { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import type { IClientRepository } from '../../domain/repositories/client.repository.interface';
import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import { InvoiceOrmEntity } from '../../infrastructure/persistence/typeorm/entities/invoice.orm-entity';
import { Inject } from '@nestjs/common';
import { Actions } from '../decorators/actions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { PdfGeneratorService } from '../../infrastructure/pdf/pdf-generator.service';

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
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
    @InjectRepository(InvoiceOrmEntity)
    private readonly invoiceOrmRepository: Repository<InvoiceOrmEntity>,
    private readonly pdfGeneratorService: PdfGeneratorService,
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
    const invoiceOrm = await this.invoiceOrmRepository.findOne({
      where: { id },
      relations: ['client', 'reservation', 'reservation.room', 'reservation.room.roomType'],
    });

    if (!invoiceOrm) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    const outstandingBalance = Number(invoiceOrm.total) - Number(invoiceOrm.amountPaid);
    const isOverdue = invoiceOrm.status !== 'PAID' && invoiceOrm.status !== 'CANCELLED' && invoiceOrm.dueDate < new Date();

    return {
      id: invoiceOrm.id,
      invoiceNumber: invoiceOrm.invoiceNumber,
      reservationId: invoiceOrm.reservationId,
      clientId: invoiceOrm.clientId,
      subtotal: Number(invoiceOrm.subtotal),
      taxRate: Number(invoiceOrm.taxRate),
      taxAmount: Number(invoiceOrm.taxAmount),
      total: Number(invoiceOrm.total),
      amountPaid: Number(invoiceOrm.amountPaid),
      outstandingBalance,
      status: invoiceOrm.status,
      issuedAt: invoiceOrm.issuedAt,
      dueDate: invoiceOrm.dueDate,
      isOverdue,
      notes: invoiceOrm.notes,
      createdAt: invoiceOrm.createdAt,
      client: invoiceOrm.client ? {
        id: invoiceOrm.client.id,
        firstName: invoiceOrm.client.firstName,
        lastName: invoiceOrm.client.lastName,
        email: invoiceOrm.client.email,
        phone: invoiceOrm.client.phone,
      } : undefined,
      reservation: invoiceOrm.reservation ? {
        id: invoiceOrm.reservation.id,
        code: invoiceOrm.reservation.code,
        checkIn: invoiceOrm.reservation.checkIn,
        checkOut: invoiceOrm.reservation.checkOut,
        status: invoiceOrm.reservation.status,
        room: invoiceOrm.reservation.room ? {
          id: invoiceOrm.reservation.room.id,
          number: invoiceOrm.reservation.room.numeroHabitacion,
          type: invoiceOrm.reservation.room.roomType?.name || 'N/A',
          floor: null,
        } : undefined,
      } : undefined,
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
    const invoicesOrm = await this.invoiceOrmRepository.find({
      relations: ['client', 'reservation', 'reservation.room', 'reservation.room.roomType'],
      order: { createdAt: 'DESC' },
    });

    return invoicesOrm.map((invoice) => {
      const outstandingBalance = Number(invoice.total) - Number(invoice.amountPaid);
      const isOverdue = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.dueDate < new Date();
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        reservationId: invoice.reservationId,
        clientId: invoice.clientId,
        total: Number(invoice.total),
        amountPaid: Number(invoice.amountPaid),
        outstandingBalance,
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        dueDate: invoice.dueDate,
        isOverdue,
        client: invoice.client ? {
          id: invoice.client.id,
          firstName: invoice.client.firstName,
          lastName: invoice.client.lastName,
          email: invoice.client.email,
          phone: invoice.client.phone,
        } : undefined,
        reservation: invoice.reservation ? {
          id: invoice.reservation.id,
          code: invoice.reservation.code,
          checkIn: invoice.reservation.checkIn,
          checkOut: invoice.reservation.checkOut,
          status: invoice.reservation.status,
          room: invoice.reservation.room ? {
            id: invoice.reservation.room.id,
            number: invoice.reservation.room.numeroHabitacion,
            type: invoice.reservation.room.roomType?.name || 'N/A',
            floor: null, // No disponible en la entidad actual
          } : undefined,
        } : undefined,
      };
    });
  }

  /**
   * Obtener facturas vencidas
   * GET /invoices/overdue
   */
  @Get('list/overdue')
  @Actions('facturas.listar')
  async getOverdueInvoices() {
    const now = new Date();
    const invoicesOrm = await this.invoiceOrmRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.client', 'client')
      .leftJoinAndSelect('invoice.reservation', 'reservation')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .where('invoice.status IN (:...statuses)', {
        statuses: ['PENDING', 'PARTIAL'],
      })
      .andWhere('invoice.dueDate < :now', { now })
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();

    return invoicesOrm.map((invoice) => {
      const outstandingBalance = Number(invoice.total) - Number(invoice.amountPaid);
      const daysOverdue = Math.ceil(
        (new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        reservationId: invoice.reservationId,
        clientId: invoice.clientId,
        total: Number(invoice.total),
        amountPaid: Number(invoice.amountPaid),
        outstandingBalance,
        status: invoice.status,
        issuedAt: invoice.issuedAt,
        dueDate: invoice.dueDate,
        daysOverdue,
        client: invoice.client ? {
          id: invoice.client.id,
          firstName: invoice.client.firstName,
          lastName: invoice.client.lastName,
          email: invoice.client.email,
          phone: invoice.client.phone,
        } : undefined,
        reservation: invoice.reservation ? {
          id: invoice.reservation.id,
          code: invoice.reservation.code,
          checkIn: invoice.reservation.checkIn,
          checkOut: invoice.reservation.checkOut,
          status: invoice.reservation.status,
          room: invoice.reservation.room ? {
            id: invoice.reservation.room.id,
            number: invoice.reservation.room.numeroHabitacion,
            type: invoice.reservation.room.roomType?.name || 'N/A',
            floor: null, // No disponible en la entidad actual
          } : undefined,
        } : undefined,
      };
    });
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

  /**
   * Descargar comprobante de pago de una factura
   * GET /invoices/:id/download-receipt
   */
  @Get(':id/download-receipt')
  @Actions('facturas.ver')
  async downloadReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Buscar la factura
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    // Buscar los pagos de esta factura
    const payments = await this.paymentRepository.findByInvoiceId(id);
    if (!payments || payments.length === 0) {
      throw new NotFoundException(
        `No se encontraron pagos para la factura con ID ${id}`,
      );
    }

    // Obtener el último pago (el más reciente)
    const lastPayment = payments.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    const receiptPath = lastPayment.receiptPath;
    if (!receiptPath) {
      throw new NotFoundException(
        `No hay comprobante disponible para la factura con ID ${id}`,
      );
    }

    // Verificar que el archivo existe
    const fileExists = await this.pdfGeneratorService.receiptExists(receiptPath);
    if (!fileExists) {
      throw new NotFoundException(
        `El archivo del comprobante no existe en el servidor`,
      );
    }

    // Configurar headers de respuesta para forzar descarga
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="comprobante-factura-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': (await import('fs')).statSync(receiptPath).size.toString(),
    });

    // Enviar archivo como stream
    const file = createReadStream(receiptPath);
    return new StreamableFile(file);
  }
}
