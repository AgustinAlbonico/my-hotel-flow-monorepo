# Observabilidad, Errores y Métricas

## 1. Introducción

Este documento define la estrategia de **observabilidad** para el sistema de reservas, incluyendo:
- Códigos de error estructurados
- Logs estructurados (JSON)
- Métricas de negocio (Prometheus)
- Trazabilidad de requests (Trace IDs)
- Dashboards y alertas

---

## 2. Taxonomía de Códigos de Error

### 2.1 Formato

```
[MÓDULO]-[CATEGORÍA][NÚMERO]

Ejemplos:
- RES-001: Reserva, validación #001
- RES-100: Reserva, disponibilidad #100
- RES-200: Reserva, cancelación #200
- RES-600: Reserva, seguridad #600
```

### 2.2 Tabla Completa de Códigos de Error

| Código | Categoría | Mensaje | HTTP Status | Severidad | Acción |
|--------|-----------|---------|-------------|-----------|--------|
| **RES-001** | Validación | Rango de fechas inválido (checkOut <= checkIn) | 400 | Low | Corregir fechas |
| **RES-002** | Validación | Fecha inicio debe ser al menos 1h futura | 400 | Low | Ajustar fecha |
| **RES-003** | Validación | Duración mínima 1 noche | 400 | Low | Aumentar duración |
| **RES-004** | Validación | Duración máxima 30 noches | 400 | Low | Contactar recepción |
| **RES-005** | Validación | Capacidad de personas excedida | 400 | Low | Cambiar tipo habitación |
| **RES-006** | Validación | Tipo habitación no activo | 400 | Low | Elegir otra opción |
| **RES-007** | Validación | Estado no permite modificación | 400 | Medium | Verificar estado |
| **RES-008** | Validación | Código reserva duplicado | 409 | High | Reintentar |
| **RES-100** | Disponibilidad | Sin habitaciones disponibles | 409 | Medium | Ver alternativas |
| **RES-101** | Disponibilidad | Conflicto concurrencia (overbooking) | 409 | **Critical** | Refrescar y reintentar |
| **RES-102** | Disponibilidad | Límite reservas pendientes (3 max) | 400 | Medium | Completar/cancelar existentes |
| **RES-103** | Disponibilidad | Habitación no habilitada | 400 | Medium | Elegir otra habitación |
| **RES-200** | Cancelación | Cancelación fuera de plazo (<24h) | 400 | Medium | Contactar recepción |
| **RES-202** | Cancelación | Operación sobre reserva cancelada | 400 | Low | Verificar estado |
| **RES-300** | Check-in | Check-in solo para confirmadas | 400 | Medium | Verificar estado |
| **RES-301** | Check-in | Check-in duplicado | 409 | High | Verificar registro |
| **RES-302** | Check-in | Check-in fuera de horario (>4h antes) | 400 | Low | Esperar horario |
| **RES-303** | Check-out | Check-out sin check-in previo | 400 | High | Realizar check-in |
| **RES-304** | Check-out | Check-out duplicado | 409 | High | Verificar registro |
| **RES-305** | Check-out | Late checkout sin autorización | 400 | Medium | Obtener autorización |
| **RES-400** | Facturación | Factura duplicada | 409 | High | Verificar existente |
| **RES-401** | Facturación | Total factura inconsistente | 400 | High | Revisar cálculo |
| **RES-402** | Facturación | Modificación factura pagada | 403 | High | Requiere admin |
| **RES-403** | Pagos | Monto inválido/excede saldo | 400 | Medium | Ajustar monto |
| **RES-404** | Pagos | Medio pago inválido | 400 | Low | Elegir medio válido |
| **RES-600** | Seguridad | Acceso no autorizado | 403 | High | Verificar permisos |
| **RES-601** | Seguridad | Confirmar requiere recepcionista | 403 | Medium | Contactar recepción |
| **RES-602** | Seguridad | Check-in/out requiere recepcionista | 403 | Medium | Contactar recepción |
| **RES-603** | Seguridad | Idempotency-Key requerido | 400 | Medium | Agregar header |
| **RES-604** | Seguridad | Rate limit excedido (10/hora) | 429 | High | Esperar reset |

---

## 3. Logs Estructurados

### 3.1 Configuración Winston

```typescript
// apps/backend/src/config/logger.config.ts

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'myhotelflow-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});
```

### 3.2 Formato de Logs

**Nivel INFO - Operación Exitosa**:
```json
{
  "timestamp": "2025-11-12T15:30:45.123Z",
  "level": "info",
  "message": "Reservation created successfully",
  "service": "myhotelflow-api",
  "context": "ReservationsService",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 1,
  "reservationId": 42,
  "reservationCode": "RES-1730394567890",
  "roomId": 5,
  "checkIn": "2025-12-20",
  "checkOut": "2025-12-23",
  "totalPrice": 45000.00,
  "duration": "125ms"
}
```

**Nivel WARN - Overbooking Prevenido**:
```json
{
  "timestamp": "2025-11-12T15:30:45.123Z",
  "level": "warn",
  "message": "Overbooking prevented - room not available",
  "service": "myhotelflow-api",
  "context": "ReservationsService",
  "code": "RES-100",
  "traceId": "550e8400-e29b-41d4-a716-446655440001",
  "userId": 2,
  "roomId": 5,
  "requestedCheckIn": "2025-12-20",
  "requestedCheckOut": "2025-12-23",
  "conflictingReservations": [
    {
      "id": 42,
      "code": "RES-1730394567890",
      "checkIn": "2025-12-20",
      "checkOut": "2025-12-23"
    }
  ],
  "availableAlternatives": [7, 8]
}
```

**Nivel ERROR - Error Interno**:
```json
{
  "timestamp": "2025-11-12T15:30:45.123Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "myhotelflow-api",
  "context": "TypeOrmModule",
  "traceId": "550e8400-e29b-41d4-a716-446655440002",
  "error": {
    "name": "QueryFailedError",
    "message": "Connection terminated unexpectedly",
    "stack": "Error: Connection terminated...\n    at ..."
  },
  "retryAttempt": 2,
  "maxRetries": 3
}
```

### 3.3 Implementación en Service

```typescript
// apps/backend/src/application/reservations/reservations.service.ts

@Injectable()
export class ReservationsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createReservation(dto: CreateReservationDto, traceId: string): Promise<Reservation> {
    const startTime = Date.now();

    this.logger.info({
      message: 'Creating reservation',
      context: 'ReservationsService',
      traceId,
      userId: dto.clientId,
      roomId: dto.roomId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
    });

    try {
      const reservation = await this.createReservationInternal(dto);

      this.logger.info({
        message: 'Reservation created successfully',
        context: 'ReservationsService',
        traceId,
        userId: dto.clientId,
        reservationId: reservation.id,
        reservationCode: reservation.code,
        roomId: reservation.roomId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        totalPrice: reservation.totalPrice,
        duration: `${Date.now() - startTime}ms`,
      });

      return reservation;
    } catch (error) {
      if (error instanceof ConflictException && error.getResponse()['code'] === 'RES-100') {
        this.logger.warn({
          message: 'Overbooking prevented - room not available',
          context: 'ReservationsService',
          code: 'RES-100',
          traceId,
          userId: dto.clientId,
          roomId: dto.roomId,
          requestedCheckIn: dto.checkIn,
          requestedCheckOut: dto.checkOut,
          duration: `${Date.now() - startTime}ms`,
        });
      } else {
        this.logger.error({
          message: 'Failed to create reservation',
          context: 'ReservationsService',
          traceId,
          userId: dto.clientId,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          duration: `${Date.now() - startTime}ms`,
        });
      }

      throw error;
    }
  }
}
```

---

## 4. Métricas (Prometheus)

### 4.1 Configuración

```typescript
// apps/backend/src/modules/metrics/metrics.service.ts

import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register } from 'prom-client';

@Injectable()
export class MetricsService {
  // Contador: Total de reservas creadas
  private readonly reservationsCreatedTotal = new Counter({
    name: 'reservations_created_total',
    help: 'Total number of reservations created',
    labelNames: ['status'], // 'success' | 'failed'
  });

  // Contador: Reservas por estado
  private readonly reservationsByState = new Gauge({
    name: 'reservations_by_state',
    help: 'Current number of reservations by state',
    labelNames: ['state'], // 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  });

  // Contador: Rechazos por overbooking
  private readonly overbookingRejectionsTotal = new Counter({
    name: 'reservations_overbooking_rejections_total',
    help: 'Total number of reservation rejections due to overbooking',
    labelNames: ['roomId'],
  });

  // Histograma: Duración de creación de reserva
  private readonly reservationCreationDuration = new Histogram({
    name: 'reservations_creation_duration_ms',
    help: 'Duration of reservation creation in milliseconds',
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
  });

  // Histograma: Latencia de verificación de disponibilidad
  private readonly availabilityCheckDuration = new Histogram({
    name: 'reservations_availability_check_duration_ms',
    help: 'Duration of availability check in milliseconds',
    buckets: [5, 10, 25, 50, 100, 250, 500],
  });

  // Contador: Conflictos de concurrencia
  private readonly concurrencyConflictsTotal = new Counter({
    name: 'reservations_concurrency_conflicts_total',
    help: 'Total number of optimistic locking conflicts',
  });

  // Gauge: Ocupación actual del hotel
  private readonly hotelOccupancyRate = new Gauge({
    name: 'hotel_occupancy_rate',
    help: 'Current hotel occupancy rate (0-1)',
  });

  // Contador: Cancelaciones por motivo
  private readonly cancellationsTotal = new Counter({
    name: 'reservations_cancellations_total',
    help: 'Total cancellations',
    labelNames: ['within_policy'], // 'true' | 'false' (>= 24h)
  });

  // Métodos para registrar métricas

  recordReservationCreated(success: boolean): void {
    this.reservationsCreatedTotal.inc({ status: success ? 'success' : 'failed' });
  }

  recordReservationCreationDuration(durationMs: number): void {
    this.reservationCreationDuration.observe(durationMs);
  }

  recordOverbookingRejection(roomId: number): void {
    this.overbookingRejectionsTotal.inc({ roomId: roomId.toString() });
  }

  recordAvailabilityCheck(durationMs: number): void {
    this.availabilityCheckDuration.observe(durationMs);
  }

  recordConcurrencyConflict(): void {
    this.concurrencyConflictsTotal.inc();
  }

  recordCancellation(withinPolicy: boolean): void {
    this.cancellationsTotal.inc({ within_policy: withinPolicy.toString() });
  }

  async updateReservationsByState(): Promise<void> {
    // Query a la base de datos
    const counts = await this.reservationsRepo
      .createQueryBuilder('reservation')
      .select('reservation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reservation.status')
      .getRawMany();

    counts.forEach((row) => {
      this.reservationsByState.set({ state: row.status }, parseInt(row.count));
    });
  }

  async updateHotelOccupancyRate(): Promise<void> {
    const totalRooms = await this.roomsRepo.count({ where: { isActive: true } });
    const occupiedRooms = await this.roomsRepo.count({
      where: { estado: RoomStatus.OCCUPIED },
    });

    const rate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;
    this.hotelOccupancyRate.set(rate);
  }

  getMetrics(): string {
    return register.metrics();
  }
}
```

### 4.2 Endpoint de Métricas

```typescript
// apps/backend/src/modules/metrics/metrics.controller.ts

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.end(await this.metricsService.getMetrics());
  }
}
```

**Acceso**: `GET http://localhost:3000/metrics`

### 4.3 Métricas Clave de Negocio

| Métrica | Tipo | Propósito | Alerta |
|---------|------|-----------|--------|
| `reservations_created_total` | Counter | Total de reservas creadas | - |
| `reservations_by_state{state="CONFIRMED"}` | Gauge | Reservas confirmadas actuales | > 80% capacidad |
| `reservations_overbooking_rejections_total` | Counter | Intentos de overbooking | > 10/hora |
| `reservations_creation_duration_ms` | Histogram | Latencia de creación | p95 > 500ms |
| `reservations_concurrency_conflicts_total` | Counter | Conflictos de concurrencia | > 5/min |
| `hotel_occupancy_rate` | Gauge | Tasa de ocupación (0-1) | < 0.3 (baja) o > 0.95 (alta) |
| `reservations_cancellations_total{within_policy="false"}` | Counter | Cancelaciones fuera de política | > 3/día |

---

## 5. Trazabilidad (Trace IDs)

### 5.1 Interceptor de Trace ID

```typescript
// apps/backend/src/common/interceptors/trace-id.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Obtener trace ID del header o generar uno nuevo
    const traceId = request.headers['x-trace-id'] || uuidv4();

    // Agregar al request para uso en toda la aplicación
    request.traceId = traceId;

    // Agregar al response header
    response.setHeader('X-Trace-Id', traceId);

    return next.handle().pipe(
      tap(() => {
        // Log de finalización de request
        const duration = Date.now() - request.startTime;
        console.log({
          traceId,
          method: request.method,
          url: request.url,
          statusCode: response.statusCode,
          duration: `${duration}ms`,
        });
      }),
    );
  }
}
```

### 5.2 Uso en Logs

```typescript
this.logger.info({
  message: 'Processing request',
  traceId: request.traceId, // Mismo ID en todos los logs de este request
  // ... otros campos
});
```

---

## 6. Dashboards Grafana

### 6.1 Dashboard: Reservas Overview

**Paneles**:

1. **Reservas Creadas (24h)**
   - Query: `rate(reservations_created_total{status="success"}[24h])`
   - Tipo: Graph (línea de tiempo)

2. **Tasa de Ocupación Actual**
   - Query: `hotel_occupancy_rate * 100`
   - Tipo: Gauge (0-100%)
   - Alertas: < 30% (amarillo), > 95% (rojo)

3. **Distribución por Estado**
   - Query: `reservations_by_state`
   - Tipo: Pie Chart

4. **Rechazos por Overbooking (1h)**
   - Query: `rate(reservations_overbooking_rejections_total[1h])`
   - Tipo: Single Stat
   - Alerta: > 10/hora

5. **Latencia de Creación (p95)**
   - Query: `histogram_quantile(0.95, reservations_creation_duration_ms)`
   - Tipo: Graph
   - Alerta: > 500ms

6. **Conflictos de Concurrencia (5m)**
   - Query: `rate(reservations_concurrency_conflicts_total[5m])`
   - Tipo: Graph
   - Alerta: > 5/min

### 6.2 Dashboard: Errores y Alertas

**Paneles**:

1. **Errores por Código (Top 10)**
   - Query: `topk(10, sum by (code) (rate(http_errors_total[1h])))`
   - Tipo: Table

2. **Tasa de Error Global**
   - Query: `rate(http_errors_total[5m]) / rate(http_requests_total[5m])`
   - Tipo: Graph
   - Alerta: > 5%

3. **Cancelaciones Fuera de Política**
   - Query: `reservations_cancellations_total{within_policy="false"}`
   - Tipo: Single Stat

---

## 7. Alertas (Prometheus Alertmanager)

### 7.1 Reglas de Alerta

```yaml
# prometheus-alerts.yml

groups:
  - name: reservations
    interval: 30s
    rules:
      - alert: HighOverbookingRejectionRate
        expr: rate(reservations_overbooking_rejections_total[5m]) > 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Alta tasa de rechazos por overbooking"
          description: "{{ $value }} rechazos/segundo en los últimos 5 minutos"

      - alert: SlowReservationCreation
        expr: histogram_quantile(0.95, reservations_creation_duration_ms) > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Creación de reservas lenta"
          description: "P95 de latencia: {{ $value }}ms"

      - alert: FrequentConcurrencyConflicts
        expr: rate(reservations_concurrency_conflicts_total[1m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Conflictos de concurrencia frecuentes"
          description: "{{ $value }} conflictos/segundo, posible problema de optimistic locking"

      - alert: LowHotelOccupancy
        expr: hotel_occupancy_rate < 0.3
        for: 24h
        labels:
          severity: info
        annotations:
          summary: "Ocupación baja del hotel"
          description: "Tasa de ocupación: {{ $value | humanizePercentage }}"

      - alert: HighHotelOccupancy
        expr: hotel_occupancy_rate > 0.95
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Hotel casi lleno"
          description: "Tasa de ocupación: {{ $value | humanizePercentage }}"

      - alert: ExcessiveCancellationsOutsidePolicy
        expr: increase(reservations_cancellations_total{within_policy="false"}[24h]) > 5
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Muchas cancelaciones fuera de política"
          description: "{{ $value }} cancelaciones en 24h (< 24h de check-in)"
```

### 7.2 Canales de Notificación

```yaml
# alertmanager.yml

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-notifications'

  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    - match:
        severity: warning
      receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#hotel-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<pagerduty-service-key>'
```

---

## 8. Health Checks

### 8.1 Endpoints

```typescript
// apps/backend/src/modules/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectRedis() private redis: Redis,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      async () => {
        try {
          await this.redis.ping();
          return { redis: { status: 'up' } };
        } catch (error) {
          return { redis: { status: 'down', message: error.message } };
        }
      },
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    // Listo para recibir tráfico
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('live')
  liveness() {
    // Proceso vivo
    return { status: 'ok' };
  }
}
```

---

## 9. Referencias

- **Winston Documentation**: https://github.com/winstonjs/winston
- **Prometheus Client**: https://github.com/siimon/prom-client
- **NestJS Terminus**: https://docs.nestjs.com/recipes/terminus
- **Documento 04-reglas-negocio.md**: Códigos de error completos
