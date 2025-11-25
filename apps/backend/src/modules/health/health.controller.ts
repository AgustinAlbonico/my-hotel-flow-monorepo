import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../presentation/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check general' })
  @ApiResponse({ status: 200, description: 'Sistema saludable' })
  @ApiResponse({ status: 503, description: 'Sistema no saludable' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
    ]);
  }

  @Get('live')
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe - verifica si la aplicación está viva',
  })
  @ApiResponse({ status: 200, description: 'Aplicación viva' })
  checkLive() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary:
      'Readiness probe - verifica si la aplicación está lista para recibir tráfico',
  })
  @ApiResponse({ status: 200, description: 'Aplicación lista' })
  @ApiResponse({ status: 503, description: 'Aplicación no lista' })
  checkReady() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
