/**
 * OccupancyController
 * Capa: Presentation
 * Responsabilidad: Exponer endpoint de ocupación diaria de habitaciones.
 */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';
import { GetDailyOccupancyUseCase } from '../../application/use-cases/reservation/get-daily-occupancy.use-case';
import { DailyOccupancyResponseDto } from '../../application/dtos/reservation/daily-occupancy.dto';

@ApiTags('Occupancy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('occupancy')
export class OccupancyController {
  constructor(
    private readonly getDailyOccupancyUseCase: GetDailyOccupancyUseCase,
  ) {}

  /**
   * GET /api/v1/occupancy/daily
   * Retorna resumen de ocupación diaria por tipo de habitación.
   */
  @Get('daily')
  @Actions('habitaciones.listar')
  @ApiOperation({
    summary: 'Obtener ocupación diaria de habitaciones',
    description:
      'Devuelve, por tipo de habitación, el total de habitaciones, cuántas están ocupadas, reservadas y disponibles para la fecha indicada.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description:
      'Fecha a consultar en formato ISO (YYYY-MM-DD). Por defecto, hoy.',
  })
  async getDailyOccupancy(
    @Query('date') date?: string,
  ): Promise<DailyOccupancyResponseDto> {
    const todayIso = new Date().toISOString().split('T')[0];
    const targetDate = date && date.trim().length > 0 ? date : todayIso;
    return this.getDailyOccupancyUseCase.execute(targetDate);
  }
}
