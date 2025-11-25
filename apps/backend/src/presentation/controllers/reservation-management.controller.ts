/**
 * Reservation Management Controller
 * Patrón: Controller Pattern - MVC
 * Capa: Presentation
 * Responsabilidad: Manejar endpoints HTTP de gestión de reservas
 */
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';
import { GetReservationManagementMenuUseCase } from '../../application/use-cases/reservation/get-reservation-management-menu.use-case';
import { ReservationMapper } from '../mappers/reservation.mapper';
import { ReservationMenuResponsePresentationDto } from '../dtos/reservation/reservation-menu-response.dto';
import { UserOrmEntity } from '../../infrastructure/persistence/typeorm/entities/user.orm-entity';

/**
 * Request con usuario autenticado
 */
interface RequestWithUser extends Request {
  user: UserOrmEntity;
}

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard, ActionsGuard)
@ApiBearerAuth()
export class ReservationManagementController {
  constructor(
    private readonly getMenuUseCase: GetReservationManagementMenuUseCase,
    private readonly mapper: ReservationMapper,
  ) {}

  /**
   * GET /api/v1/reservations/menu
   * Obtiene el menú de gestión de reservas con opciones filtradas por permisos
   */
  @Get('menu')
  @Actions('reservas.listar')
  @ApiOperation({
    summary: 'Obtener menú de gestión de reservas',
    description:
      'Retorna las opciones del menú de gestión según los permisos del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Menú obtenido exitosamente',
    type: ReservationMenuResponsePresentationDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async getManagementMenu(
    @Req() request: RequestWithUser,
  ): Promise<ReservationMenuResponsePresentationDto> {
    const userId = request.user.id;

    // Ejecutar caso de uso
    const menuDto = await this.getMenuUseCase.execute(userId);

    // Mapear a DTO de presentación
    return this.mapper.toMenuResponse(menuDto);
  }
}
