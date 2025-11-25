# Prevención de Overbooking - Sistema de Reservas

## 1. Problema y Contexto

El **overbooking** (sobreventa) ocurre cuando se confirman más reservas que habitaciones disponibles para un mismo período de tiempo, resultando en:

- ❌ Imposibilidad de cumplir con reservas confirmadas
- ❌ Pérdida de confianza de clientes
- ❌ Daño reputacional
- ❌ Costos de reubicación o compensación

**Causa raíz**: Condiciones de carrera (race conditions) cuando múltiples usuarios intentan reservar la misma habitación simultáneamente.

---

## 2. Estrategia de Prevención

### 2.1 Enfoque Multi-Capa

Implementamos prevención de overbooking en **3 capas**:

1. **Capa de Base de Datos** (última línea de defensa)
   - Constraints e índices únicos
   - Transacciones con niveles de aislamiento adecuados

2. **Capa de Aplicación** (lógica de negocio)
   - Optimistic Locking con campo `version`
   - Verificación de solapamiento con `SELECT FOR UPDATE`
   - Locks distribuidos con Redis (opcional, para alta concurrencia)

3. **Capa de API** (validación temprana)
   - Rate limiting por cliente
   - Idempotency keys para prevenir duplicados

---

## 3. Implementación - Base de Datos (PostgreSQL)

### 3.1 Índices para Performance

```sql
-- apps/backend/src/infrastructure/persistence/typeorm/migrations/XXXX-AddOverbookingPreventionIndexes.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOverbookingPreventionIndexes1730400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índice compuesto para búsquedas de disponibilidad
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_room_dates_status
      ON reservations (roomId, checkIn, checkOut, status)
      WHERE status IN ('CONFIRMED', 'IN_PROGRESS')
    `);

    // Índice para búsqueda por rango de fechas (usando BRIN para mejor performance en timestamps)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_dates_brin
      ON reservations USING BRIN (checkIn, checkOut)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_reservations_room_dates_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_reservations_dates_brin');
  }
}
```

### 3.2 Check Constraint para Fechas Válidas

```sql
-- Evitar reservas con fechas inválidas
ALTER TABLE reservations
  ADD CONSTRAINT chk_valid_date_range
  CHECK (checkOut > checkIn);
```

### 3.3 Exclusion Constraint (Ideal para PostgreSQL)

**Opción A: Usando extensión btree_gist** (RECOMENDADO si se migra de MySQL a PostgreSQL):

```sql
-- Requiere extensión btree_gist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Constraint que impide solapamiento de reservas confirmadas para la misma habitación
ALTER TABLE reservations
  ADD CONSTRAINT no_overlapping_reservations
  EXCLUDE USING GIST (
    roomId WITH =,
    daterange(checkIn, checkOut, '[)') WITH &&
  )
  WHERE (status IN ('CONFIRMED', 'IN_PROGRESS'));
```

**Explicación**:
- `roomId WITH =`: Mismo `roomId`
- `daterange(checkIn, checkOut, '[)') WITH &&`: Rangos de fechas solapados
- `WHERE (status IN ...)`: Solo para reservas activas

**Ventajas**:
- ✅ Garantía a nivel de base de datos (no depende de lógica de aplicación)
- ✅ Atómica y thread-safe
- ✅ No requiere locks explícitos

**Limitación**:
- ❌ Solo disponible en PostgreSQL (no en MySQL/MariaDB)

---

**Opción B: Para MySQL/MariaDB** (implementación actual):

Dado que TypeORM actual usa MySQL, implementamos la prevención a nivel aplicación con locks optimistas.

---

## 4. Implementación - Aplicación (TypeORM + NestJS)

### 4.1 Optimistic Locking con Campo `version`

**Entity ORM**:
```typescript
// apps/backend/src/infrastructure/persistence/typeorm/entities/reservation.orm-entity.ts

import { Entity, Column, VersionColumn } from 'typeorm';

@Entity('reservations')
export class ReservationOrmEntity {
  // ... otros campos

  @VersionColumn()
  version: number; // Auto-incrementa en cada UPDATE
}
```

**Migración para agregar `version`**:
```sql
ALTER TABLE reservations ADD COLUMN version INTEGER DEFAULT 0 NOT NULL;
```

**Service Layer**:
```typescript
// apps/backend/src/application/reservations/reservations.service.ts

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(ReservationOrmEntity)
    private reservationsRepo: Repository<ReservationOrmEntity>,
    @InjectRepository(RoomOrmEntity)
    private roomsRepo: Repository<RoomOrmEntity>,
  ) {}

  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    return await this.reservationsRepo.manager.transaction(
      'SERIALIZABLE', // Nivel de aislamiento más estricto
      async (transactionalEntityManager) => {
        // 1. Verificar disponibilidad con SELECT FOR UPDATE (lock pesimista)
        const overlappingReservations = await transactionalEntityManager
          .createQueryBuilder(ReservationOrmEntity, 'reservation')
          .setLock('pessimistic_write') // Bloquea las filas seleccionadas
          .where('reservation.roomId = :roomId', { roomId: dto.roomId })
          .andWhere('reservation.status IN (:...statuses)', {
            statuses: ['CONFIRMED', 'IN_PROGRESS'],
          })
          .andWhere(
            '(reservation.checkIn < :checkOut AND reservation.checkOut > :checkIn)',
            {
              checkIn: dto.checkIn,
              checkOut: dto.checkOut,
            },
          )
          .getMany();

        if (overlappingReservations.length > 0) {
          throw new ConflictException({
            code: 'RES-101',
            message: 'La habitación no está disponible para las fechas seleccionadas',
            details: {
              roomId: dto.roomId,
              requestedCheckIn: dto.checkIn,
              requestedCheckOut: dto.checkOut,
              conflictingReservations: overlappingReservations.map((r) => ({
                id: r.id,
                code: r.code,
                checkIn: r.checkIn,
                checkOut: r.checkOut,
              })),
            },
          });
        }

        // 2. Verificar que la habitación existe y está habilitada
        const room = await transactionalEntityManager.findOne(RoomOrmEntity, {
          where: { id: dto.roomId, isActive: true },
        });

        if (!room) {
          throw new NotFoundException({
            code: 'RES-103',
            message: 'La habitación seleccionada no está habilitada para reservas',
          });
        }

        // 3. Crear la reserva
        const code = this.generateReservationCode();
        const reservation = transactionalEntityManager.create(ReservationOrmEntity, {
          code,
          clientId: dto.clientId,
          roomId: dto.roomId,
          checkIn: new Date(dto.checkIn),
          checkOut: new Date(dto.checkOut),
          status: 'CONFIRMED',
          version: 0, // Versión inicial
        });

        await transactionalEntityManager.save(reservation);

        // 4. Actualizar estado de habitación (opcional, según lógica de negocio)
        // await transactionalEntityManager.update(RoomOrmEntity, dto.roomId, {
        //   estado: RoomStatus.OCCUPIED
        // });

        return this.mapToDomain(reservation);
      },
    );
  }

  /**
   * Modificar fechas de reserva con optimistic locking
   */
  async updateReservationDates(
    id: number,
    dto: UpdateReservationDto,
    expectedVersion: number, // Versión que el cliente conoce
  ): Promise<Reservation> {
    return await this.reservationsRepo.manager.transaction(
      'SERIALIZABLE',
      async (transactionalEntityManager) => {
        // 1. Obtener reserva actual con lock
        const reservation = await transactionalEntityManager.findOne(
          ReservationOrmEntity,
          {
            where: { id },
            lock: { mode: 'pessimistic_write' },
          },
        );

        if (!reservation) {
          throw new NotFoundException('Reserva no encontrada');
        }

        // 2. Verificar versión (optimistic locking)
        if (reservation.version !== expectedVersion) {
          throw new ConflictException({
            code: 'RES-101',
            message:
              'Conflicto de concurrencia detectado. La reserva fue modificada por otro usuario.',
            details: {
              expectedVersion,
              currentVersion: reservation.version,
              suggestion: 'Refrescar los datos y reintentar',
            },
          });
        }

        // 3. Validar estado
        if (reservation.status !== 'CONFIRMED') {
          throw new BadRequestException({
            code: 'RES-007',
            message: `No se puede modificar una reserva en estado ${reservation.status}`,
          });
        }

        // 4. Verificar disponibilidad para nuevas fechas
        const newCheckIn = dto.checkIn
          ? new Date(dto.checkIn)
          : reservation.checkIn;
        const newCheckOut = dto.checkOut
          ? new Date(dto.checkOut)
          : reservation.checkOut;

        const overlappingReservations = await transactionalEntityManager
          .createQueryBuilder(ReservationOrmEntity, 'reservation')
          .setLock('pessimistic_write')
          .where('reservation.roomId = :roomId', { roomId: reservation.roomId })
          .andWhere('reservation.id != :currentId', { currentId: id })
          .andWhere('reservation.status IN (:...statuses)', {
            statuses: ['CONFIRMED', 'IN_PROGRESS'],
          })
          .andWhere(
            '(reservation.checkIn < :checkOut AND reservation.checkOut > :checkIn)',
            {
              checkIn: newCheckIn,
              checkOut: newCheckOut,
            },
          )
          .getMany();

        if (overlappingReservations.length > 0) {
          throw new ConflictException({
            code: 'RES-100',
            message: 'Las nuevas fechas solapan con otra reserva existente',
          });
        }

        // 5. Actualizar reserva (version se auto-incrementa con @VersionColumn)
        reservation.checkIn = newCheckIn;
        reservation.checkOut = newCheckOut;
        await transactionalEntityManager.save(reservation);

        return this.mapToDomain(reservation);
      },
    );
  }

  private generateReservationCode(): string {
    return `RES-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
```

### 4.2 Explicación del Flujo

1. **Transacción SERIALIZABLE**:
   - Nivel de aislamiento más estricto
   - Previene lecturas fantasma (phantom reads)

2. **SELECT FOR UPDATE** (`pessimistic_write`):
   - Bloquea las filas seleccionadas hasta el final de la transacción
   - Otros threads esperan hasta que la transacción actual finalice

3. **Verificación de Solapamiento**:
   - Condición SQL: `checkIn < requestedCheckOut AND checkOut > requestedCheckIn`
   - Detecta cualquier solapamiento de rangos de fechas

4. **Optimistic Locking** (campo `version`):
   - Si dos usuarios leen la misma versión y uno actualiza primero, el segundo falla
   - TypeORM automáticamente verifica y actualiza el campo `version`

---

## 5. Implementación - Locks Distribuidos con Redis (Opcional)

Para **alta concurrencia** (>100 requests/segundo), agregar locks distribuidos con Redis:

### 5.1 Configuración

```typescript
// apps/backend/src/infrastructure/cache/redis-lock.service.ts

import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class RedisLockService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Adquirir lock distribuido
   * @param key - Clave del lock (ej: "reservation:room:5:2025-12-20:2025-12-23")
   * @param ttl - TTL del lock en milisegundos (default: 5000ms)
   * @returns lockId si se adquirió el lock, null si no
   */
  async acquireLock(key: string, ttl: number = 5000): Promise<string | null> {
    const lockId = `${Date.now()}-${Math.random()}`;
    const result = await this.redis.set(
      `lock:${key}`,
      lockId,
      'PX', // Milisegundos
      ttl,
      'NX', // Solo si no existe
    );

    return result === 'OK' ? lockId : null;
  }

  /**
   * Liberar lock distribuido
   */
  async releaseLock(key: string, lockId: string): Promise<boolean> {
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(luaScript, 1, `lock:${key}`, lockId);
    return result === 1;
  }

  /**
   * Ejecutar con lock distribuido
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 5000,
    maxRetries: number = 3,
  ): Promise<T> {
    let retries = 0;
    let lockId: string | null = null;

    while (retries < maxRetries) {
      lockId = await this.acquireLock(key, ttl);

      if (lockId) {
        try {
          return await fn();
        } finally {
          await this.releaseLock(key, lockId);
        }
      }

      // Backoff exponencial
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retries) * 100),
      );
      retries++;
    }

    throw new ConflictException({
      code: 'RES-101',
      message: 'No se pudo adquirir lock para procesar la reserva. Reintentar.',
    });
  }
}
```

### 5.2 Uso en Service

```typescript
@Injectable()
export class ReservationsService {
  constructor(
    private readonly redisLock: RedisLockService,
    // ... otros deps
  ) {}

  async createReservation(dto: CreateReservationDto): Promise<Reservation> {
    const lockKey = `reservation:room:${dto.roomId}:${dto.checkIn}:${dto.checkOut}`;

    return await this.redisLock.withLock(lockKey, async () => {
      // Ejecutar lógica de creación dentro del lock
      return await this.createReservationInternal(dto);
    });
  }
}
```

---

## 6. Idempotency Keys (Capa API)

### 6.1 Interceptor de Idempotencia

```typescript
// apps/backend/src/common/interceptors/idempotency.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Solo aplicar a métodos POST
    if (request.method !== 'POST') {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException({
        code: 'RES-603',
        message: 'Header Idempotency-Key es requerido para operaciones POST',
      });
    }

    // Verificar si ya existe una respuesta cacheada
    const cachedResponse = await this.redis.get(`idempotency:${idempotencyKey}`);

    if (cachedResponse) {
      // Retornar respuesta cacheada
      return of(JSON.parse(cachedResponse));
    }

    // Ejecutar request y cachear respuesta
    return next.handle().pipe(
      tap(async (response) => {
        await this.redis.set(
          `idempotency:${idempotencyKey}`,
          JSON.stringify(response),
          'EX',
          86400, // TTL 24 horas
        );
      }),
    );
  }
}
```

### 6.2 Aplicar Interceptor

```typescript
// apps/backend/src/application/reservations/reservations.controller.ts

@Controller('reservations')
@UseInterceptors(IdempotencyInterceptor)
export class ReservationsController {
  @Post()
  async create(@Body() dto: CreateReservationDto) {
    return await this.reservationsService.createReservation(dto);
  }
}
```

---

## 7. Testing de Concurrencia

### 7.1 Test de Race Condition

```typescript
// apps/backend/src/application/reservations/__tests__/reservations-concurrency.spec.ts

import { Test } from '@nestjs/testing';
import { ReservationsService } from '../reservations.service';

describe('Reservations Concurrency Tests', () => {
  let service: ReservationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [/* ... */],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  it('debe prevenir overbooking con 10 requests simultáneos para la misma habitación', async () => {
    const roomId = 5;
    const checkIn = '2025-12-20';
    const checkOut = '2025-12-23';

    const createReservationPromises = Array.from({ length: 10 }, (_, i) =>
      service.createReservation({
        clientId: i + 1,
        roomId,
        checkIn,
        checkOut,
      }),
    );

    const results = await Promise.allSettled(createReservationPromises);

    // Solo 1 debe tener éxito
    const successfulReservations = results.filter(
      (r) => r.status === 'fulfilled',
    );
    const failedReservations = results.filter((r) => r.status === 'rejected');

    expect(successfulReservations).toHaveLength(1);
    expect(failedReservations).toHaveLength(9);

    // Verificar que los fallos son por overbooking
    failedReservations.forEach((result) => {
      expect((result as any).reason.response.code).toBe('RES-101');
    });
  });

  it('debe permitir reservas para la misma habitación en diferentes fechas', async () => {
    const roomId = 5;

    const promises = [
      service.createReservation({
        clientId: 1,
        roomId,
        checkIn: '2025-12-20',
        checkOut: '2025-12-23',
      }),
      service.createReservation({
        clientId: 2,
        roomId,
        checkIn: '2025-12-24',
        checkOut: '2025-12-27',
      }),
    ];

    const results = await Promise.allSettled(promises);

    // Ambas deben tener éxito (fechas no solapadas)
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
  });

  it('debe detectar solapamiento parcial de fechas', async () => {
    const roomId = 5;

    // Primera reserva: 20-23 dic
    await service.createReservation({
      clientId: 1,
      roomId,
      checkIn: '2025-12-20',
      checkOut: '2025-12-23',
    });

    // Segunda reserva: 22-25 dic (solapa con primera)
    await expect(
      service.createReservation({
        clientId: 2,
        roomId,
        checkIn: '2025-12-22',
        checkOut: '2025-12-25',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
```

### 7.2 Load Testing con Artillery

```yaml
# artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 50 # 50 requests/segundo
      name: "Carga sostenida"
  processor: "./artillery-functions.js"

scenarios:
  - name: "Crear reserva concurrente"
    flow:
      - post:
          url: "/api/v1/reservations"
          headers:
            Authorization: "Bearer {{ $randomString() }}"
            Idempotency-Key: "{{ $randomString() }}"
            Content-Type: "application/json"
          json:
            clientId: "{{ $randomNumber(1, 100) }}"
            roomId: 5 # Misma habitación para todos
            checkIn: "2025-12-20"
            checkOut: "2025-12-23"
```

**Ejecutar**:
```bash
artillery run artillery-config.yml
```

---

## 8. Monitoreo y Métricas

### 8.1 Métricas Prometheus

```typescript
// apps/backend/src/modules/metrics/metrics.service.ts

import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly overbookingRejections = new Counter({
    name: 'reservations_overbooking_rejections_total',
    help: 'Total de rechazos por overbooking',
    labelNames: ['roomId'],
  });

  private readonly lockAcquisitionDuration = new Histogram({
    name: 'reservations_lock_acquisition_duration_ms',
    help: 'Duración de adquisición de locks',
    buckets: [10, 50, 100, 500, 1000, 5000],
  });

  private readonly concurrencyConflicts = new Counter({
    name: 'reservations_concurrency_conflicts_total',
    help: 'Total de conflictos de concurrencia (optimistic locking)',
  });

  recordOverbookingRejection(roomId: number): void {
    this.overbookingRejections.inc({ roomId: roomId.toString() });
  }

  recordLockAcquisition(durationMs: number): void {
    this.lockAcquisitionDuration.observe(durationMs);
  }

  recordConcurrencyConflict(): void {
    this.concurrencyConflicts.inc();
  }
}
```

### 8.2 Logs Estructurados

```typescript
this.logger.warn({
  message: 'Overbooking prevented',
  code: 'RES-101',
  roomId: dto.roomId,
  requestedCheckIn: dto.checkIn,
  requestedCheckOut: dto.checkOut,
  conflictingReservations: overlappingReservations.length,
  userId: user.id,
  timestamp: new Date().toISOString(),
});
```

---

## 9. Comparación de Estrategias

| Estrategia | Pros | Contras | Cuándo usar |
|------------|------|---------|-------------|
| **Exclusion Constraint (PostgreSQL)** | ✅ Garantía DB<br>✅ Simple<br>✅ Performante | ❌ Solo PostgreSQL | Ideal si se usa PostgreSQL |
| **Optimistic Locking** | ✅ Compatible con MySQL<br>✅ Bajo overhead | ❌ Requiere reintentos del cliente | Tráfico moderado (<50 req/s) |
| **Pessimistic Locking (SELECT FOR UPDATE)** | ✅ Fuerte consistencia<br>✅ Funciona en todas las DBs | ❌ Mayor contención<br>❌ Deadlocks posibles | Necesario con Optimistic Locking |
| **Redis Distributed Locks** | ✅ Alta concurrencia<br>✅ Multi-instancia | ❌ Complejidad adicional<br>❌ Requiere Redis | Tráfico muy alto (>100 req/s) |

---

## 10. Recomendaciones Finales

### Para el Sistema Actual (TypeORM + MySQL)

1. ✅ **Implementar Optimistic Locking** con campo `version`
2. ✅ **Usar SELECT FOR UPDATE** en transacciones SERIALIZABLE
3. ✅ **Agregar Idempotency Keys** para prevenir duplicados
4. ⚠️ **Considerar migración a PostgreSQL** para usar Exclusion Constraints nativos
5. ⚠️ **Agregar Redis Locks** solo si el tráfico supera 100 req/s

### Migración Futura a PostgreSQL

```sql
-- 1. Habilitar extensión
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Agregar constraint de exclusión
ALTER TABLE reservations
  ADD CONSTRAINT no_overlapping_reservations
  EXCLUDE USING GIST (
    roomId WITH =,
    daterange(checkIn, checkOut, '[)') WITH &&
  )
  WHERE (status IN ('CONFIRMED', 'IN_PROGRESS'));

-- 3. Simplificar lógica de aplicación (menos locks necesarios)
```

---

## 11. Referencias

- **PostgreSQL Exclusion Constraints**: https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION
- **TypeORM Optimistic Locking**: https://typeorm.io/entity#version-column
- **Redis SET command**: https://redis.io/commands/set
- **Documento 04-reglas-negocio.md**: Regla R-101 (Prevención de Overbooking)
