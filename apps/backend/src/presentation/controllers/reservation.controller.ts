import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseIntPipe,
  Headers,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Actions } from '../decorators/actions.decorator';
import { SearchClientByDNIUseCase } from '../../application/use-cases/reservation/search-client-by-dni.use-case';
import { SearchClientWithDebtByDNIUseCase } from '../../application/use-cases/reservation/search-client-with-debt-by-dni.use-case';
import { SearchAvailableRoomsUseCase } from '../../application/use-cases/reservation/search-available-rooms.use-case';
import { CreateReservationUseCase } from '../../application/use-cases/reservation/create-reservation.use-case';
import { CancelReservationUseCase } from '../../application/use-cases/reservation/cancel-reservation.use-case';
import { UpdateReservationDatesUseCase } from '../../application/use-cases/reservation/update-reservation-dates.use-case';
import { PerformCheckInUseCase } from '../../application/use-cases/reservation/perform-check-in.use-case';
import { PerformCheckOutUseCase } from '../../application/use-cases/reservation/perform-check-out.use-case';
import { ListReservationsUseCase } from '../../application/use-cases/reservation/list-reservations.use-case';
import { ListReservationsByStatusUseCase } from '../../application/use-cases/reservation/list-reservations-by-status.use-case';
import { ListReservationsByDateUseCase } from '../../application/use-cases/reservation/list-reservations-by-date.use-case';
import { SearchClientByDNIDto } from '../../application/dtos/reservation/search-client-by-dni.dto';
import { SearchAvailableRoomsDto } from '../../application/dtos/reservation/search-available-rooms.dto';
import { CreateReservationDto } from '../../application/dtos/reservation/create-reservation.dto';
import { CancelReservationDto } from '../../application/dtos/reservation/cancel-reservation.dto';
import { UpdateReservationDto } from '../../application/dtos/reservation/update-reservation.dto';
import { CheckInDto } from '../../application/dtos/reservation/check-in.dto';
import { CheckOutDto } from '../../application/dtos/reservation/check-out.dto';
import { ListReservationsQueryDto } from '../../application/dtos/reservation/list-reservations-query.dto';
import {
  ClientFoundExtendedResponseDto,
  DebtInvoiceResponseDto,
} from '../dtos/reservation/client-found-extended-response.dto';
import {
  SearchClientByDniRequestDto,
  SearchAvailableRoomsRequestDto,
  AvailableRoomResponseDto,
  CreateReservationRequestDto,
  ReservationCreatedResponseDto,
} from '../dtos/reservation/create-reservation-presentation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import type { UserOrmEntity } from '../../infrastructure/persistence/typeorm/entities/user.orm-entity';

interface RequestWithUser extends Request {
  user: UserOrmEntity;
}

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly searchClientByDNIUseCase: SearchClientByDNIUseCase,
    private readonly searchClientWithDebtByDNIUseCase: SearchClientWithDebtByDNIUseCase,
    private readonly searchAvailableRoomsUseCase: SearchAvailableRoomsUseCase,
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
    private readonly updateReservationDatesUseCase: UpdateReservationDatesUseCase,
    private readonly performCheckInUseCase: PerformCheckInUseCase,
    private readonly performCheckOutUseCase: PerformCheckOutUseCase,
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly listReservationsByStatusUseCase: ListReservationsByStatusUseCase,
    private readonly listReservationsByDateUseCase: ListReservationsByDateUseCase,
  ) {}

  @Post('search-client')
  @HttpCode(HttpStatus.OK)
  @Actions('clientes.ver')
  @ApiOperation({ summary: 'Buscar cliente por DNI' })
  @ApiResponse({ status: 200, type: ClientFoundExtendedResponseDto })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async searchClient(@Body() body: SearchClientByDniRequestDto) {
    const dto = new SearchClientByDNIDto();
    dto.dni = body.dni;

    const result = await this.searchClientWithDebtByDNIUseCase.execute(dto);
    if (!result) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const response = new ClientFoundExtendedResponseDto();
    response.id = result.id;
    response.dni = result.dni;
    response.nombre = result.nombre;
    response.apellido = result.apellido;
    response.email = result.email;
    response.telefono = result.telefono;
    response.outstandingBalance = result.outstandingBalance;
    response.isDebtor = result.isDebtor;
    if (result.invoices) {
      response.invoices = result.invoices.map((inv) => {
        const di = new DebtInvoiceResponseDto();
        di.id = inv.id;
        di.invoiceNumber = inv.invoiceNumber;
        di.total = inv.total;
        di.amountPaid = inv.amountPaid;
        di.outstandingBalance = inv.outstandingBalance;
        di.status = inv.status;
        di.isOverdue = inv.isOverdue;
        di.reservationId = inv.reservationId;
        di.checkIn = inv.checkIn;
        di.checkOut = inv.checkOut;
        di.roomNumber = inv.roomNumber;
        di.roomType = inv.roomType;
        di.description = inv.description;
        return di;
      });
    }
    return { success: true, data: response };
  }

  @Get('available-rooms')
  @Actions('habitaciones.listar')
  @ApiOperation({ summary: 'Buscar habitaciones disponibles' })
  @ApiResponse({ status: 200, type: [AvailableRoomResponseDto] })
  async getAvailableRooms(@Query() query: SearchAvailableRoomsRequestDto) {
    const dto = new SearchAvailableRoomsDto();
    dto.checkInDate = query.checkInDate;
    dto.checkOutDate = query.checkOutDate;
    dto.roomType = query.roomType;
    dto.capacity = query.capacity;

    const result = await this.searchAvailableRoomsUseCase.execute(dto);

    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Actions('reservas.crear')
  @ApiOperation({ summary: 'Crear nueva reserva' })
  @ApiResponse({ status: 201, type: ReservationCreatedResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiHeader({
    name: 'X-Idempotency-Key',
    required: false,
    description: 'Clave de idempotencia para prevenir duplicados',
  })
  async createReservation(
    @Body() body: CreateReservationRequestDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const dto = new CreateReservationDto();
    dto.clientId = body.clientId;
    dto.roomId = body.roomId;
    dto.checkIn = body.checkIn;
    dto.checkOut = body.checkOut;
    dto.notifyByEmail = body.notifyByEmail;
    dto.notifyBySMS = body.notifyBySMS;
    dto.idempotencyKey = body.idempotencyKey || idempotencyKey || undefined;

    const result = await this.createReservationUseCase.execute(dto);

    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @Actions('reservas.listar')
  @ApiOperation({ summary: 'Listar reservas con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de reservas paginada' })
  async listReservations(@Query() query: ListReservationsQueryDto) {
    const result = await this.listReservationsUseCase.execute(query);

    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('by-status')
  @Actions('reservas.listar')
  @ApiOperation({ summary: 'Listar reservas por estado' })
  @ApiResponse({ status: 200, description: 'Lista de reservas paginada por estado' })
  async listReservationsByStatus(@Query() query: ListReservationsQueryDto) {
    const result = await this.listReservationsByStatusUseCase.execute(query);
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('by-date')
  @Actions('reservas.listar')
  @ApiOperation({ summary: 'Listar reservas por fecha de check-in' })
  @ApiResponse({ status: 200, description: 'Lista de reservas paginada por fecha' })
  async listReservationsByDate(@Query() query: ListReservationsQueryDto) {
    const result = await this.listReservationsByDateUseCase.execute(query);
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Patch(':id/cancel')
  @Actions('reservas.cancelar')
  @ApiOperation({ summary: 'Cancelar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar la reserva' })
  async cancelReservation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelReservationDto,
  ) {
    await this.cancelReservationUseCase.execute(id, dto);

    return {
      success: true,
      message: 'Reserva cancelada exitosamente',
    };
  }

  @Patch(':id/dates')
  @Actions('reservas.modificar')
  @ApiOperation({ summary: 'Modificar fechas de reserva' })
  @ApiResponse({ status: 200, description: 'Fechas actualizadas exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede modificar la reserva' })
  @ApiResponse({ status: 409, description: 'Conflicto de disponibilidad' })
  @ApiHeader({
    name: 'X-Expected-Version',
    required: false,
    description: 'Versión esperada para optimistic locking',
  })
  async updateReservationDates(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
    @Headers('x-expected-version') expectedVersion?: string,
  ) {
    const version = expectedVersion ? parseInt(expectedVersion, 10) : undefined;
    await this.updateReservationDatesUseCase.execute(id, dto, version);

    return {
      success: true,
      message: 'Fechas de reserva actualizadas exitosamente',
    };
  }

  @Post(':id/check-in')
  @Actions('reservas.checkin')
  @ApiOperation({ summary: 'Realizar check-in' })
  @ApiResponse({ status: 200, description: 'Check-in realizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede realizar check-in' })
  async performCheckIn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckInDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;

    await this.performCheckInUseCase.execute(id, userId, dto);

    return {
      success: true,
      message: 'Check-in realizado exitosamente',
    };
  }

  @Post(':id/check-out')
  @Actions('reservas.checkout')
  @ApiOperation({ summary: 'Realizar check-out' })
  @ApiResponse({ status: 200, description: 'Check-out realizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  @ApiResponse({ status: 400, description: 'No se puede realizar check-out' })
  async performCheckOut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckOutDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;

    await this.performCheckOutUseCase.execute(id, userId, dto);

    return {
      success: true,
      message: 'Check-out realizado exitosamente',
    };
  }
}
