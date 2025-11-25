# Checklist de Implementación - Sistema de Reservas

## 📋 Índice

- [Fase 0: Preparación y Configuración](#fase-0-preparación-y-configuración)
- [Fase 1: Entidades y Dominio](#fase-1-entidades-y-dominio)
- [Fase 2: DTOs y Validaciones](#fase-2-dtos-y-validaciones)
- [Fase 3: Repositories](#fase-3-repositories)
- [Fase 4: Services - Lógica de Negocio](#fase-4-services---lógica-de-negocio)
- [Fase 5: Controllers y API](#fase-5-controllers-y-api)
- [Fase 6: Prevención de Overbooking](#fase-6-prevención-de-overbooking)
- [Fase 7: State Machine](#fase-7-state-machine)
- [Fase 8: Observabilidad](#fase-8-observabilidad)
- [Fase 9: Testing](#fase-9-testing)
- [Fase 10: Seguridad y Autorización](#fase-10-seguridad-y-autorización)
- [Fase 11: Iteración 2 (Check-in/Check-out)](#fase-11-iteración-2-check-incheck-out)
- [Fase 12: Optimizaciones](#fase-12-optimizaciones)

---

## Fase 0: Preparación y Configuración

### 0.1 Dependencias
- [ ] Verificar `package.json` tiene todas las dependencias:
  - [ ] `@nestjs/typeorm`
  - [ ] `typeorm`
  - [ ] `pg` (PostgreSQL driver)
  - [ ] `class-validator`
  - [ ] `class-transformer`
  - [ ] `date-fns`
  - [ ] `uuid`
  - [ ] `ioredis` (para locks distribuidos)
  - [ ] `@nestjs/throttler` (rate limiting)
  - [ ] `winston` / `nest-winston` (logging)
  - [ ] `prom-client` (métricas Prometheus)

### 0.2 Configuración Base de Datos
- [x] Crear migración para agregar campo `version` a tabla `reservations`
  - Ubicación: `apps/backend/src/infrastructure/persistence/typeorm/migrations/1730500000000-AddVersionAndIdempotencyToReservations.ts`
  - Agregar: `ALTER TABLE reservations ADD COLUMN version INTEGER DEFAULT 0 NOT NULL;`

- [x] Crear índices de performance (migración)
  - [x] `idx_reservations_room_dates_status` en `(roomId, checkIn, checkOut, status)`
  - [x] `idx_reservations_dates_brin` usando BRIN para rangos
  - [x] `idx_reservations_idempotency` en `idempotencyKey`

- [x] Agregar constraint de fechas válidas
  - [x] `CHECK (checkOut > checkIn)` en tabla reservations

### 0.3 Variables de Entorno
- [ ] Agregar a `.env`:
  ```env
  # Redis
  REDIS_HOST=localhost
  REDIS_PORT=6379

  # Rate Limiting
  THROTTLE_TTL=3600
  THROTTLE_LIMIT=10

  # Logging
  LOG_LEVEL=info

  # Metrics
  ENABLE_METRICS=true
  ```

---

## Fase 1: Entidades y Dominio

### 1.1 Actualizar Entidad de Dominio: Reservation
**Ubicación**: `apps/backend/src/domain/entities/reservation.entity.ts`

- [ ] Actualizar enum `ReservationStatus` para incluir todos los estados:
  ```typescript
  export enum ReservationStatus {
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
  }
  ```

- [x] Agregar métodos de negocio a clase `Reservation`:
  - [x] `canBeCancelled(currentDate: Date): boolean` - Validar política 24h
  - [x] `canBeModified(): boolean` - Solo si estado CONFIRMED
  - [x] `isWithinCancellationWindow(currentDate: Date): boolean`
  - [x] `calculateNights(): number` - Existente, verificar
  - [x] `calculateTotalPrice(pricePerNight: number): number`
  - [x] `validateDuration(): void` - Validar límites 1-30 noches

### 1.2 Actualizar ORM Entity: ReservationOrmEntity
**Ubicación**: `apps/backend/src/infrastructure/persistence/typeorm/entities/reservation.orm-entity.ts`

- [x] Agregar campo `version` con decorador:
  ```typescript
  @VersionColumn()
  version: number;
  ```

- [x] Agregar campo `idempotencyKey`:
  ```typescript
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  idempotencyKey: string | null;
  ```

- [x] Agregar campos JSON para check-in/check-out:
  ```typescript
  @Column({ type: 'jsonb', nullable: true })
  checkInData: CheckInRecord | null;

  @Column({ type: 'jsonb', nullable: true })
  checkOutData: CheckOutRecord | null;
  ```

- [x] Agregar relación `@ManyToOne` con eager loading:
  ```typescript
  @ManyToOne(() => ClientOrmEntity, { eager: true })
  @JoinColumn({ name: 'clientId' })
  client: ClientOrmEntity;

  @ManyToOne(() => RoomOrmEntity, { eager: true })
  @JoinColumn({ name: 'roomId' })
  room: RoomOrmEntity;
  ```

### 1.3 Actualizar RoomOrmEntity
**Ubicación**: `apps/backend/src/infrastructure/persistence/typeorm/entities/room.orm-entity.ts`

- [x] Verificar que existe relación inversa con reservas:
  ```typescript
  @OneToMany(() => ReservationOrmEntity, (reservation) => reservation.room)
  reservations: ReservationOrmEntity[];
  ```

### 1.4 Crear Value Objects
**Ubicación**: `apps/backend/src/domain/value-objects/`

- [x] Crear `check-in-record.value-object.ts`:
  ```typescript
  export class CheckInRecord {
    readonly timestamp: Date;
    readonly performedBy: number; // Usuario ID
    readonly documentsVerified: boolean;
    readonly observations?: string;
  }
  ```

- [x] Crear `check-out-record.value-object.ts`:
  ```typescript
  export enum RoomCondition {
    GOOD = 'GOOD',
    REGULAR = 'REGULAR',
    NEEDS_DEEP_CLEANING = 'NEEDS_DEEP_CLEANING',
  }

  export class CheckOutRecord {
    readonly timestamp: Date;
    readonly performedBy: number;
    readonly roomCondition: RoomCondition;
    readonly observations?: string;
  }
  ```

---

## Fase 2: DTOs y Validaciones

### 2.1 DTOs de Reservas
**Ubicación**: `apps/backend/src/application/dtos/reservation/`

- [x] Crear `create-reservation.dto.ts` (ya existía):
  ```typescript
  export class CreateReservationDto {
    @IsInt()
    @Min(1)
    clientId: number;

    @IsInt()
    @Min(1)
    roomId: number;

    @IsDateString()
    checkIn: string; // ISO-8601

    @IsDateString()
    checkOut: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    observations?: string;
  }
  ```

- [x] Crear `update-reservation.dto.ts`:
  ```typescript
  export class UpdateReservationDto {
    @IsOptional()
    @IsDateString()
    checkIn?: string;

    @IsOptional()
    @IsDateString()
    checkOut?: string;
  }
  ```

- [x] Crear `cancel-reservation.dto.ts`:
  ```typescript
  export class CancelReservationDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    reason?: string;
  }
  ```

- [x] Crear `check-in.dto.ts`:
  ```typescript
  export class CheckInDto {
    @IsBoolean()
    documentsVerified: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    observations?: string;
  }
  ```

- [x] Crear `check-out.dto.ts`:
  ```typescript
  export class CheckOutDto {
    @IsEnum(RoomCondition)
    roomCondition: RoomCondition;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    observations?: string;
  }
  ```

- [x] Crear `list-reservations-query.dto.ts`:
  ```typescript
  export class ListReservationsQueryDto {
    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;

    @IsOptional()
    @IsDateString()
    checkInFrom?: string;

    @IsOptional()
    @IsDateString()
    checkInTo?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    clientId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    roomId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
  }
  ```

### 2.2 DTOs de Habitaciones
**Ubicación**: `apps/backend/src/application/dtos/room/`

- [x] Crear `check-availability-query.dto.ts`:
  ```typescript
  export class CheckAvailabilityQueryDto {
    @IsDateString()
    checkIn: string;

    @IsDateString()
    checkOut: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    roomTypeId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    guests?: number;
  }
  ```

---

## Fase 3: Repositories

### 3.1 Actualizar ReservationRepository
**Ubicación**: `apps/backend/src/infrastructure/persistence/typeorm/repositories/reservation.repository.impl.ts`

- [x] Agregar método `findOverlappingReservations`:
  ```typescript
  async findOverlappingReservations(
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: number,
  ): Promise<ReservationOrmEntity[]>
  ```

- [x] Agregar método `findByIdempotencyKey`:
  ```typescript
  async findByIdempotencyKey(key: string): Promise<ReservationOrmEntity | null>
  ```

- [x] Agregar método `countPendingByClient`:
  ```typescript
  async countPendingByClient(clientId: number): Promise<number>
  ```

- [x] Agregar método `findWithLock` (para SELECT FOR UPDATE):
  ```typescript
  async findWithLock(id: number, manager: EntityManager): Promise<ReservationOrmEntity | null>
  ```

- [x] Agregar método `findAll` para listar reservas con filtros y paginación

### 3.2 Actualizar RoomRepository
**Ubicación**: `apps/backend/src/infrastructure/persistence/typeorm/repositories/room.repository.impl.ts`

- [x] Agregar método `findAvailableRooms` (ya existía):
  ```typescript
  async findAvailableRooms(
    checkIn: Date,
    checkOut: Date,
    roomTypeId?: number,
    minCapacity?: number,
  ): Promise<RoomOrmEntity[]>
  ```

---

## Fase 4: Services - Lógica de Negocio

### 4.1 Crear Use Cases de Reservas
**Ubicación**: `apps/backend/src/application/use-cases/reservation/`

- [x] Use Case: `create-reservation.use-case.ts` (ya existía, mejoras aplicadas)
  - [x] Validar fechas básicas
  - [x] Verificar disponibilidad
  - [x] Verificar límite de reservas pendientes por cliente (R-102)
  - [x] Verificar superposición de reservas (prevención overbooking)
  - [x] Crear reserva con estado CONFIRMED
  - [ ] TODO: Agregar transacción SERIALIZABLE
  - [ ] TODO: Implementar idempotency
  - [ ] TODO: Emitir eventos de dominio
  - [ ] TODO: Logs estructurados y métricas

- [x] Use Case: `cancel-reservation.use-case.ts`
  - [x] Validar política de 24h (R-200)
  - [x] Verificar que no está ya cancelada
  - [x] Transición a estado CANCELLED
  - [x] Registrar motivo en cancelReason
  - [ ] TODO: Liberar habitación (R-203)
  - [ ] TODO: Emitir evento `ReservaCancelada`
  - [ ] TODO: Logs y métricas

- [x] Use Case: `update-reservation-dates.use-case.ts`
  - [x] Validar estado (R-007)
  - [x] Verificar disponibilidad para nuevas fechas
  - [x] Actualizar fechas
  - [ ] TODO: Verificar versión (optimistic locking) cuando mapper lo soporte
  - [ ] TODO: Emitir evento `ReservaModificada`
  - [ ] TODO: Logs y métricas

- [x] Use Case: `perform-check-in.use-case.ts`
  - [x] Validar estado CONFIRMED (R-300)
  - [x] Crear CheckInRecord value object
  - [x] Transición a IN_PROGRESS
  - [x] Cambiar habitación a OCCUPIED
  - [x] Persistir checkInData como JSONB
  - [ ] TODO: Usar transacción
  - [ ] TODO: Emitir evento `CheckInRealizado`
  - [ ] TODO: Logs y métricas

- [x] Use Case: `perform-check-out.use-case.ts`
  - [x] Validar estado IN_PROGRESS
  - [x] Crear CheckOutRecord value object
  - [x] Transición a COMPLETED
  - [x] Cambiar habitación según condición (AVAILABLE o MAINTENANCE)
  - [x] Persistir checkOutData como JSONB
  - [ ] TODO: Usar transacción
  - [ ] TODO: Emitir evento `CheckOutRealizado`
  - [ ] TODO: Logs y métricas

- [x] Use Case: `list-reservations.use-case.ts`
  - [x] Construir query con filtros
  - [x] Paginación
  - [x] Mapear a domain entities
  - [ ] TODO: Aplicar filtro de seguridad por rol (R-600)

- [ ] Use Case: `find-reservation-by-id.use-case.ts` (pendiente)
  - [ ] Validar autorización (R-600)
  - [ ] Incluir relaciones (cliente, habitación)
  - [ ] Agregar flags: `canCancel`, `canModify`

### 4.2 Crear RoomsService
**Ubicación**: `apps/backend/src/application/rooms/rooms.service.ts`

- [ ] Implementar `checkAvailability(query: CheckAvailabilityQueryDto)`:
  - [ ] Validar fechas
  - [ ] Buscar habitaciones disponibles
  - [ ] Calcular precio total
  - [ ] Retornar lista con disponibilidad

---

## Fase 5: Controllers y API

### 5.1 ReservationsController
**Ubicación**: `apps/backend/src/presentation/controllers/reservation.controller.ts`

- [x] Controller ya existe con ruta base: `@Controller('reservations')`

- [x] Endpoint `POST /reservations`:
  - [x] `@Post()` con @HttpCode(CREATED)
  - [x] `@Actions('reservas.crear')` para autorización
  - [x] Header `X-Idempotency-Key` documentado
  - [x] Llamar a `createReservationUseCase.execute()`
  - [x] Retornar 201 Created
  - [ ] TODO: Implementar `@UseInterceptors(IdempotencyInterceptor)`
  - [ ] TODO: `@Throttle(10, 3600)` (rate limiting R-604)

- [x] Endpoint `GET /reservations`:
  - [x] `@Get()` con ListReservationsQueryDto
  - [x] `@Actions('reservas.listar')`
  - [x] Parsear query params con validación
  - [x] Llamar a `listReservationsUseCase.execute()`
  - [x] Retornar 200 OK con paginación
  - [ ] TODO: Extraer usuario del request para filtrar por rol

- [ ] Endpoint `GET /reservations/:id` (pendiente)
  - [ ] `@Get(':id')`
  - [ ] Llamar a use case findById
  - [ ] Retornar 200 OK o 404 Not Found

- [x] Endpoint `PATCH /reservations/:id/dates`:
  - [x] `@Patch(':id/dates')`
  - [x] `@Actions('reservas.modificar')`
  - [x] Header `X-Expected-Version` para optimistic locking
  - [x] Llamar a `updateReservationDatesUseCase.execute()`
  - [x] Retornar 200 OK o 409 Conflict

- [x] Endpoint `PATCH /reservations/:id/cancel`:
  - [x] `@Patch(':id/cancel')`
  - [x] `@Actions('reservas.cancelar')`
  - [x] Llamar a `cancelReservationUseCase.execute()`
  - [x] Retornar 200 OK

- [x] Endpoint `POST /reservations/:id/check-in`:
  - [x] `@Post(':id/check-in')`
  - [x] `@Actions('reservas.checkin')`
  - [x] Llamar a `performCheckInUseCase.execute()`
  - [x] Retornar 200 OK
  - [ ] TODO: Extraer userId del token JWT (actualmente placeholder)

- [x] Endpoint `POST /reservations/:id/check-out`:
  - [x] `@Post(':id/check-out')`
  - [x] `@Actions('reservas.checkout')`
  - [x] Llamar a `performCheckOutUseCase.execute()`
  - [x] Retornar 200 OK
  - [ ] TODO: Extraer userId del token JWT (actualmente placeholder)

### 5.2 Crear RoomsController
**Ubicación**: `apps/backend/src/presentation/rooms/rooms.controller.ts`

- [ ] Endpoint `GET /rooms/availability`:
  - [ ] `@Get('availability')`
  - [ ] Sin autenticación (público)
  - [ ] Parsear query con `CheckAvailabilityQueryDto`
  - [ ] Llamar a `roomsService.checkAvailability()`
  - [ ] Retornar 200 OK

---

## Fase 6: Prevención de Overbooking

### 6.1 Optimistic Locking
- [ ] Campo `version` ya agregado en ORM entity (Fase 1.2)
- [ ] Implementar verificación de versión en `updateReservationDates`:
  ```typescript
  if (reservation.version !== expectedVersion) {
    throw new ConflictException({
      code: 'RES-101',
      message: 'Conflicto de concurrencia detectado',
      details: { expectedVersion, currentVersion: reservation.version }
    });
  }
  ```

### 6.2 Pessimistic Locking (SELECT FOR UPDATE)
- [ ] Implementar en `createReservation`:
  ```typescript
  const overlapping = await manager
    .createQueryBuilder(ReservationOrmEntity, 'reservation')
    .setLock('pessimistic_write')
    .where('reservation.roomId = :roomId', { roomId })
    .andWhere('reservation.status IN (:...statuses)', {
      statuses: ['CONFIRMED', 'IN_PROGRESS']
    })
    .andWhere(
      '(reservation.checkIn < :checkOut AND reservation.checkOut > :checkIn)',
      { checkIn, checkOut }
    )
    .getMany();
  ```

### 6.3 Transacciones SERIALIZABLE
- [ ] Configurar nivel de aislamiento:
  ```typescript
  await this.reservationsRepo.manager.transaction(
    'SERIALIZABLE',
    async (manager) => {
      // Lógica de creación/modificación
    }
  );
  ```

### 6.4 Redis Locks (Opcional - Alta Concurrencia)
**Ubicación**: `apps/backend/src/infrastructure/cache/redis-lock.service.ts`

- [ ] Crear `RedisLockService`:
  - [ ] Método `acquireLock(key: string, ttl: number)`
  - [ ] Método `releaseLock(key: string, lockId: string)`
  - [ ] Método `withLock<T>(key: string, fn: () => Promise<T>)`

- [ ] Usar en `createReservation`:
  ```typescript
  const lockKey = `reservation:room:${roomId}:${checkIn}:${checkOut}`;
  return await this.redisLock.withLock(lockKey, async () => {
    return await this.createReservationInternal(dto);
  });
  ```

### 6.5 Idempotency Interceptor
**Ubicación**: `apps/backend/src/common/interceptors/idempotency.interceptor.ts`

- [ ] Crear `IdempotencyInterceptor`:
  - [ ] Verificar header `Idempotency-Key` (R-603)
  - [ ] Buscar respuesta cacheada en Redis
  - [ ] Si existe, retornar respuesta cacheada
  - [ ] Si no existe, ejecutar request y cachear respuesta (TTL 24h)

---

## Fase 7: State Machine

### 7.1 Crear ReservaStateMachineService
**Ubicación**: `apps/backend/src/application/reservations/services/reserva-state-machine.service.ts`

- [ ] Definir mapa de transiciones:
  ```typescript
  private readonly transitions: Map<string, Transition> = new Map([
    ['cancel', {
      from: [ReservationStatus.CONFIRMED],
      to: ReservationStatus.CANCELLED,
      guards: [(r) => this.isWithin24Hours(r)]
    }],
    ['checkIn', {
      from: [ReservationStatus.CONFIRMED],
      to: ReservationStatus.IN_PROGRESS,
      guards: [(r) => r.checkInData === null]
    }],
    // ... más transiciones
  ]);
  ```

- [ ] Implementar métodos:
  - [ ] `canTransition(reservation: Reservation, action: string): boolean`
  - [ ] `transition(reservation: Reservation, action: string): ReservationStatus`
  - [ ] `getValidActions(reservation: Reservation): string[]`

### 7.2 Event Handlers para Sincronización de Estados
**Ubicación**: `apps/backend/src/application/rooms/handlers/`

- [ ] Crear `reserva-confirmada.handler.ts`:
  - [ ] `@OnEvent('reserva.confirmada')`
  - [ ] Cambiar estado habitación a OCCUPIED (opcional según lógica)

- [ ] Crear `reserva-cancelada.handler.ts`:
  - [ ] `@OnEvent('reserva.cancelada')`
  - [ ] Cambiar estado habitación a AVAILABLE

- [ ] Crear `check-in-realizado.handler.ts`:
  - [ ] `@OnEvent('reserva.checkIn')`
  - [ ] Cambiar estado habitación a OCCUPIED

- [ ] Crear `check-out-realizado.handler.ts`:
  - [ ] `@OnEvent('reserva.checkOut')`
  - [ ] Cambiar estado habitación a MAINTENANCE

---

## Fase 8: Observabilidad

### 8.1 Configurar Winston Logger
**Ubicación**: `apps/backend/src/config/logger.config.ts`

- [ ] Configurar transportes:
  - [ ] Console con formato colorizado
  - [ ] File para errores (`logs/error.log`)
  - [ ] File combinado (`logs/combined.log`)

- [ ] Formato JSON estructurado:
  - [ ] Timestamp ISO-8601
  - [ ] Level
  - [ ] Message
  - [ ] Context
  - [ ] TraceId
  - [ ] Metadata

### 8.2 Crear MetricsService
**Ubicación**: `apps/backend/src/modules/metrics/metrics.service.ts`

- [ ] Definir métricas:
  - [ ] `reservations_created_total` (Counter)
  - [ ] `reservations_by_state` (Gauge)
  - [ ] `reservations_overbooking_rejections_total` (Counter)
  - [ ] `reservations_creation_duration_ms` (Histogram)
  - [ ] `reservations_concurrency_conflicts_total` (Counter)
  - [ ] `hotel_occupancy_rate` (Gauge)
  - [ ] `reservations_cancellations_total` (Counter)

- [ ] Implementar métodos:
  - [ ] `recordReservationCreated(success: boolean)`
  - [ ] `recordOverbookingRejection(roomId: number)`
  - [ ] `recordConcurrencyConflict()`
  - [ ] `updateReservationsByState()`
  - [ ] `updateHotelOccupancyRate()`

### 8.3 Crear MetricsController
**Ubicación**: `apps/backend/src/modules/metrics/metrics.controller.ts`

- [ ] Endpoint `GET /metrics`:
  - [ ] Retornar métricas en formato Prometheus
  - [ ] Content-Type: `text/plain; version=0.0.4`

### 8.4 Crear TraceIdInterceptor
**Ubicación**: `apps/backend/src/common/interceptors/trace-id.interceptor.ts`

- [ ] Extraer `X-Trace-Id` del header o generar UUID
- [ ] Agregar a `request.traceId`
- [ ] Agregar a response header `X-Trace-Id`
- [ ] Log de duración del request

### 8.5 Crear HttpExceptionFilter
**Ubicación**: `apps/backend/src/common/filters/http-exception.filter.ts`

- [ ] Capturar todas las excepciones
- [ ] Formatear respuesta con estructura estándar:
  ```typescript
  {
    statusCode: number;
    code?: string; // RES-XXX
    message: string | string[];
    details?: any;
    timestamp: string;
    path: string;
    traceId?: string;
  }
  ```

- [ ] Log de errores con contexto completo

---

## Fase 9: Testing

### 9.1 Unit Tests - Domain Entities
**Ubicación**: `apps/backend/src/domain/entities/__tests__/`

- [ ] `reservation.entity.spec.ts`:
  - [ ] Test de `canBeCancelled()` con diferentes escenarios
  - [ ] Test de `canBeModified()` por estado
  - [ ] Test de `calculateNights()`
  - [ ] Test de `isWithinCancellationWindow()`

### 9.2 Unit Tests - Services
**Ubicación**: `apps/backend/src/application/reservations/__tests__/`

- [ ] `reservations.service.spec.ts`:
  - [ ] Mock de repositories
  - [ ] Test de `createReservation()` exitoso
  - [ ] Test de validaciones (R-001, R-003, R-004)
  - [ ] Test de rechazo por overbooking (R-100)
  - [ ] Test de `cancelReservation()` con política 24h
  - [ ] Test de `checkIn()` con validaciones
  - [ ] Test de `checkOut()` con generación de factura

- [ ] `reserva-state-machine.service.spec.ts`:
  - [ ] Test de transiciones válidas
  - [ ] Test de transiciones inválidas
  - [ ] Test de guardas

### 9.3 Integration Tests - Repositories
**Ubicación**: `apps/backend/src/infrastructure/persistence/typeorm/repositories/__tests__/`

- [ ] `reservation.repository.integration.spec.ts`:
  - [ ] Usar base de datos de prueba (testcontainers o in-memory)
  - [ ] Test de `findOverlappingReservations()`
  - [ ] Test de `findByIdempotencyKey()`
  - [ ] Test de `countPendingByClient()`

### 9.4 Integration Tests - Concurrencia
**Ubicación**: `apps/backend/src/application/reservations/__tests__/`

- [ ] `reservations-concurrency.integration.spec.ts`:
  - [ ] Test: 10 requests simultáneos para misma habitación
  - [ ] Verificar que solo 1 tiene éxito, 9 fallan con RES-101
  - [ ] Test de optimistic locking con versiones
  - [ ] Test de idempotency con mismo key

### 9.5 E2E Tests
**Ubicación**: `apps/backend/test/`

- [ ] `reservations.e2e-spec.ts`:
  - [ ] Test de flujo completo: crear → modificar → cancelar
  - [ ] Test de flujo check-in → check-out
  - [ ] Test de autorización (cliente vs recepcionista)
  - [ ] Test de rate limiting
  - [ ] Test de idempotency

### 9.6 Tests BDD con Gherkin (Opcional)
**Ubicación**: `apps/backend/test/features/`

- [ ] Configurar `jest-cucumber`
- [ ] Crear archivos `.feature` basados en `07-casos-uso-gherkin.md`
- [ ] Implementar step definitions

### 9.7 Load Testing con Artillery
**Ubicación**: `apps/backend/test/load/`

- [ ] Crear `artillery-config.yml`
- [ ] Escenario: 50 req/s creando reservas concurrentes
- [ ] Script: `npm run test:load`

---

## Fase 10: Seguridad y Autorización

### 10.1 Guards
**Ubicación**: `apps/backend/src/common/guards/`

- [ ] Crear `reserva-ownership.guard.ts`:
  - [ ] Verificar que cliente solo accede a sus reservas (R-600)
  - [ ] Permitir acceso total a RECEPCIONISTA y ADMIN

- [ ] Crear `roles.guard.ts`:
  - [ ] Verificar roles requeridos
  - [ ] Usar decorador `@Roles(...)`

### 10.2 Decorators
**Ubicación**: `apps/backend/src/common/decorators/`

- [ ] Crear `@Roles()` decorator:
  ```typescript
  export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
  ```

- [ ] Crear `@CurrentUser()` decorator:
  ```typescript
  export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    },
  );
  ```

### 10.3 Rate Limiting
**Ubicación**: `apps/backend/src/app.module.ts`

- [ ] Configurar ThrottlerModule:
  ```typescript
  ThrottlerModule.forRoot({
    ttl: 3600,
    limit: 10,
  }),
  ```

- [ ] Aplicar `@Throttle()` en endpoints críticos

### 10.4 Helmet y CORS
- [ ] Configurar Helmet en `main.ts`:
  ```typescript
  app.use(helmet());
  ```

- [ ] Configurar CORS:
  ```typescript
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  ```

---

## Fase 11: Iteración 2 (Check-in/Check-out)

### 11.1 Facturación

#### 11.1.1 Entidades
- [ ] Crear `Invoice` domain entity
- [ ] Crear `InvoiceOrmEntity` con TypeORM
- [ ] Crear `Payment` domain entity
- [ ] Crear `PaymentOrmEntity`

#### 11.1.2 Services
- [ ] Crear `InvoicesService`:
  - [ ] `generateFromReservation(reservation: Reservation): Invoice`
  - [ ] `calculateTotal(reservation: Reservation): Money`
  - [ ] `findByReservationId(reservationId: number): Invoice`

- [ ] Crear `PaymentsService`:
  - [ ] `registerPayment(dto: CreatePaymentDto): Payment`
  - [ ] `updateInvoiceStatus(invoiceId: number)`

#### 11.1.3 Controllers
- [ ] Crear `InvoicesController`:
  - [ ] `GET /invoices/:reservationId`
  - [ ] `GET /invoices/:id/pdf` (generar PDF)

- [ ] Crear `PaymentsController`:
  - [ ] `POST /payments`
  - [ ] `GET /payments/:invoiceId`

### 11.2 Notificaciones

#### 11.2.1 Mail Service
**Ubicación**: `apps/backend/src/infrastructure/notifications/mail.service.ts`

- [ ] Configurar Nodemailer o SendGrid
- [ ] Crear plantillas Handlebars:
  - [ ] `reservation-confirmation.hbs`
  - [ ] `reservation-cancelled.hbs`
  - [ ] `check-in-reminder.hbs` (24h antes)
  - [ ] `invoice-generated.hbs`

#### 11.2.2 Event Handlers para Notificaciones
- [ ] Handler para `ReservaCreada` → Enviar email confirmación (R-500)
- [ ] Handler para `ReservaConfirmada` → Programar recordatorio 24h (R-501)
- [ ] Handler para `FacturaGenerada` → Enviar factura por email (R-502)

#### 11.2.3 Cron Jobs
**Ubicación**: `apps/backend/src/scheduler/`

- [ ] Crear `check-in-reminder.task.ts`:
  - [ ] Ejecutar cada hora
  - [ ] Buscar reservas con checkIn en próximas 24h
  - [ ] Enviar email de recordatorio

- [ ] Crear `reservations-expiration.task.ts`:
  - [ ] Ejecutar cada 5 minutos
  - [ ] Cancelar reservas INICIADA > 30 min
  - [ ] Cancelar reservas COMPLETADA > 2 horas

---

## Fase 12: Optimizaciones

### 12.1 Caché
- [ ] Configurar Redis cache para:
  - [ ] Disponibilidad de habitaciones (TTL 5 min)
  - [ ] Tipos de habitación (TTL 1 hora)
  - [ ] Reservas del cliente (invalidar al crear/modificar)

### 12.2 Índices de Base de Datos
- [ ] Analizar query plan con EXPLAIN ANALYZE
- [ ] Agregar índices adicionales según necesidad:
  - [ ] `idx_reservations_client_status` en `(clientId, status)`
  - [ ] `idx_rooms_type_active` en `(roomTypeId, isActive)`

### 12.3 Paginación Cursor-based (Opcional)
- [ ] Implementar paginación basada en cursor para mejor performance
- [ ] Usar `keyset pagination` en lugar de offset

### 12.4 Circuit Breaker para Servicios Externos
- [ ] Implementar circuit breaker para:
  - [ ] SendGrid / servicio de email
  - [ ] SMS service (si se usa)
  - [ ] Payment gateway (Iteración 2)

---

## 📊 Resumen de Tareas

| Fase | Total Tareas | Prioridad | Estimación |
|------|--------------|-----------|------------|
| Fase 0: Preparación | 8 | 🔴 Alta | 2h |
| Fase 1: Entidades | 12 | 🔴 Alta | 4h |
| Fase 2: DTOs | 7 | 🔴 Alta | 3h |
| Fase 3: Repositories | 6 | 🔴 Alta | 3h |
| Fase 4: Services | 20 | 🔴 Alta | 12h |
| Fase 5: Controllers | 15 | 🔴 Alta | 6h |
| Fase 6: Overbooking | 10 | 🔴 Alta | 8h |
| Fase 7: State Machine | 8 | 🟡 Media | 4h |
| Fase 8: Observabilidad | 12 | 🟡 Media | 6h |
| Fase 9: Testing | 15 | 🟡 Media | 10h |
| Fase 10: Seguridad | 8 | 🔴 Alta | 4h |
| Fase 11: Iteración 2 | 18 | 🟢 Baja | 12h |
| Fase 12: Optimizaciones | 6 | 🟢 Baja | 4h |
| **TOTAL** | **145 tareas** | - | **~78 horas** |

---

## 🎯 Orden de Implementación Recomendado

### Sprint 1 (MVP - 2 semanas)
1. ✅ Fase 0: Preparación y Configuración
2. ✅ Fase 1: Entidades y Dominio
3. ✅ Fase 2: DTOs y Validaciones
4. ✅ Fase 3: Repositories
5. ✅ Fase 4: Services (COMPLETO)
6. ✅ Fase 5: Controllers (COMPLETO)
7. ✅ Fase 6: Prevención Overbooking (Optimistic + Pessimistic Locking)
8. ✅ Fase 11: Facturación y Pagos (COMPLETADO ANTICIPADAMENTE)

**Entregable**: ✅ API funcional para crear, listar, cancelar reservas, check-in, check-out, facturación automática y gestión de pagos.

### Sprint 2 (Features Completas - 2 semanas)
1. ✅ Fase 4: Completar Services (check-in, check-out, update)
2. ✅ Fase 5: Completar Controllers
3. ✅ Fase 7: State Machine
4. ✅ Fase 10: Seguridad y Autorización
5. ✅ Fase 8: Observabilidad básica (logs + métricas)

**Entregable**: Sistema completo de reservas con check-in/check-out y observabilidad.

### Sprint 3 (Testing y Calidad - 1 semana)
1. ✅ Fase 9: Testing completo
2. ✅ Fase 8: Dashboards y alertas
3. ✅ Fase 12: Optimizaciones

**Entregable**: Sistema testeado, monitoreado y optimizado.

### Sprint 4 (Iteración 2 - 2 semanas)
1. ✅ Fase 11: Facturación y Pagos
2. ✅ Fase 11: Notificaciones
3. ✅ Fase 11: Cron Jobs

**Entregable**: Sistema completo con facturación automatizada.

---

## 🔍 Criterios de Aceptación por Fase

### ✅ Fase Completada Cuando:

**Fase 1-3 (Base)**:
- [ ] Todas las entities tienen tests unitarios con 100% coverage
- [ ] Migrations ejecutan sin errores
- [ ] DTOs validan correctamente todos los casos edge

**Fase 4-5 (Lógica de Negocio)**:
- [ ] Todas las reglas de negocio (R-001 a R-604) están implementadas
- [ ] Tests unitarios de services con > 80% coverage
- [ ] Endpoints retornan códigos HTTP correctos
- [ ] Swagger docs generadas automáticamente

**Fase 6 (Overbooking)**:
- [ ] Test de concurrencia con 10 requests simultáneos pasa
- [ ] No se crean reservas duplicadas con mismo Idempotency-Key
- [ ] Optimistic locking detecta conflictos correctamente

**Fase 9 (Testing)**:
- [ ] > 80% code coverage total
- [ ] Todos los escenarios Gherkin críticos implementados
- [ ] Load test alcanza 50 req/s sin errores

**Fase 8 (Observabilidad)**:
- [ ] Logs JSON se escriben correctamente en archivos
- [ ] Métricas accesibles en `/metrics`
- [ ] Dashboard Grafana funcional con paneles principales
- [ ] Al menos 3 alertas configuradas y funcionando

---

## 📝 Notas Finales

- **Priorización**: Las fases 0-6 son críticas y deben completarse primero.
- **Testing**: No postponer testing hasta el final, hacerlo incremental.
- **Code Review**: Cada fase debe ser revisada antes de continuar.
- **Documentación**: Actualizar Swagger docs en cada cambio de API.
- **Performance**: Ejecutar `EXPLAIN ANALYZE` en queries críticas antes de producción.

---

**Versión**: 1.0
**Última actualización**: 2025-11-12
**Estado**: ✅ Lista para implementación
