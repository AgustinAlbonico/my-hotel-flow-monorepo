import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { Public } from '../../presentation/decorators/public.decorator';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Obtener métricas de la API',
    description:
      'Retorna estadísticas de uso, rendimiento y estado del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        uptime: {
          type: 'number',
          description: 'Tiempo de actividad en segundos',
        },
        totalRequests: {
          type: 'number',
          description: 'Total de requests procesadas',
        },
        successfulRequests: {
          type: 'number',
          description: 'Requests exitosas (2xx, 3xx)',
        },
        failedRequests: {
          type: 'number',
          description: 'Requests fallidas (4xx, 5xx)',
        },
        activeRequests: {
          type: 'number',
          description: 'Requests activas en este momento',
        },
        averageResponseTime: {
          type: 'number',
          description: 'Tiempo de respuesta promedio en ms',
        },
        endpoints: {
          type: 'object',
          description: 'Métricas por endpoint',
        },
        systemInfo: {
          type: 'object',
          description: 'Información del sistema',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  })
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}
