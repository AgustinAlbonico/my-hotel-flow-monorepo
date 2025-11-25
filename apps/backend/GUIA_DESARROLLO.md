# Guía de Desarrollo - Clean Architecture

## 🎯 Cómo Crear un Nuevo Feature

Esta guía te muestra cómo crear un nuevo módulo siguiendo Clean Architecture.

## 📋 Checklist Rápido

- [ ] 1. Crear entidad de dominio
- [ ] 2. Crear interfaz de repositorio
- [ ] 3. Crear DTOs de aplicación
- [ ] 4. Crear use cases
- [ ] 5. Crear módulo de use cases
- [ ] 6. Crear entidad ORM
- [ ] 7. Crear mapper
- [ ] 8. Crear implementación de repositorio
- [ ] 9. Registrar en TypeOrmPersistenceModule
- [ ] 10. Crear DTOs de presentación
- [ ] 11. Crear controlador
- [ ] 12. Crear módulo de presentación
- [ ] 13. Registrar en AppModule
- [ ] 14. Ejecutar tests

## 🚀 Ejemplo: Crear Módulo "Reservations"

### Paso 1: Crear Entidad de Dominio

**Ubicación**: `src/domain/entities/reservation.entity.ts`

```typescript
/**
 * Reservation Domain Entity
 * Representa una reserva de habitación
 */
export class Reservation {
  private readonly _id: number;
  private _checkIn: Date;
  private _checkOut: Date;
  private _status: ReservationStatus;
  private _totalAmount: number;
  private _userId: number;
  private _roomId: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(data: {
    id: number;
    checkIn: Date;
    checkOut: Date;
    status: ReservationStatus;
    totalAmount: number;
    userId: number;
    roomId: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = data.id;
    this._checkIn = data.checkIn;
    this._checkOut = data.checkOut;
    this._status = data.status;
    this._totalAmount = data.totalAmount;
    this._userId = data.userId;
    this._roomId = data.roomId;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
  }

  /**
   * Factory method para crear una reserva
   */
  static create(
    checkIn: Date,
    checkOut: Date,
    totalAmount: number,
    userId: number,
    roomId: number,
  ): Reservation {
    // Validaciones de negocio
    if (checkIn >= checkOut) {
      throw new Error('Check-in must be before check-out');
    }

    const now = new Date();
    return new Reservation({
      id: 0, // Será asignado por la base de datos
      checkIn,
      checkOut,
      status: ReservationStatus.PENDING,
      totalAmount,
      userId,
      roomId,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Lógica de negocio: Confirmar reserva
   */
  confirm(): void {
    if (this._status !== ReservationStatus.PENDING) {
      throw new Error('Only pending reservations can be confirmed');
    }
    this._status = ReservationStatus.CONFIRMED;
    this._updatedAt = new Date();
  }

  /**
   * Lógica de negocio: Cancelar reserva
   */
  cancel(): void {
    if (this._status === ReservationStatus.COMPLETED) {
      throw new Error('Cannot cancel completed reservations');
    }
    this._status = ReservationStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  /**
   * Verifica si la reserva está activa
   */
  isActive(): boolean {
    return this._status === ReservationStatus.CONFIRMED;
  }

  // Getters
  get id(): number { return this._id; }
  get checkIn(): Date { return this._checkIn; }
  get checkOut(): Date { return this._checkOut; }
  get status(): ReservationStatus { return this._status; }
  get totalAmount(): number { return this._totalAmount; }
  get userId(): number { return this._userId; }
  get roomId(): number { return this._roomId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}
```

### Paso 2: Crear Interfaz de Repositorio

**Ubicación**: `src/domain/repositories/reservation.repository.interface.ts`

```typescript
import type { Reservation } from '../entities/reservation.entity';

export interface IReservationRepository {
  findAll(): Promise<Reservation[]>;
  findById(id: number): Promise<Reservation | null>;
  findByUserId(userId: number): Promise<Reservation[]>;
  findByRoomId(roomId: number): Promise<Reservation[]>;
  save(reservation: Reservation): Promise<Reservation>;
  delete(id: number): Promise<void>;
}
```

### Paso 3: Crear DTOs de Aplicación

**Ubicación**: `src/application/dtos/reservation/`

```typescript
// create-reservation.dto.ts
export class CreateReservationDto {
  checkIn: Date;
  checkOut: Date;
  totalAmount: number;
  userId: number;
  roomId: number;
}

// update-reservation.dto.ts
export class UpdateReservationDto {
  checkIn?: Date;
  checkOut?: Date;
  totalAmount?: number;
}

// reservation-response.dto.ts
export class ReservationResponseDto {
  id: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
  totalAmount: number;
  userId: number;
  roomId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Paso 4: Crear Use Cases

**Ubicación**: `src/application/use-cases/reservation/`

```typescript
// create-reservation.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface';
import { Reservation } from '../../../domain/entities/reservation.entity';
import { CreateReservationDto } from '../../dtos/reservation/create-reservation.dto';
import { ReservationResponseDto } from '../../dtos/reservation/reservation-response.dto';

@Injectable()
export class CreateReservationUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(dto: CreateReservationDto): Promise<ReservationResponseDto> {
    // 1. Validaciones adicionales si es necesario
    // TODO: Verificar disponibilidad de habitación
    // TODO: Verificar que el usuario exista

    // 2. Crear entidad de dominio
    const reservation = Reservation.create(
      dto.checkIn,
      dto.checkOut,
      dto.totalAmount,
      dto.userId,
      dto.roomId,
    );

    // 3. Persistir
    const savedReservation = await this.reservationRepository.save(reservation);

    // 4. Retornar DTO de respuesta
    return {
      id: savedReservation.id,
      checkIn: savedReservation.checkIn,
      checkOut: savedReservation.checkOut,
      status: savedReservation.status,
      totalAmount: savedReservation.totalAmount,
      userId: savedReservation.userId,
      roomId: savedReservation.roomId,
      createdAt: savedReservation.createdAt,
      updatedAt: savedReservation.updatedAt,
    };
  }
}

// confirm-reservation.use-case.ts
@Injectable()
export class ConfirmReservationUseCase {
  constructor(
    @Inject('IReservationRepository')
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const reservation = await this.reservationRepository.findById(id);
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    reservation.confirm(); // Lógica de negocio en la entidad
    await this.reservationRepository.save(reservation);
  }
}
```

### Paso 5: Crear Módulo de Use Cases

**Ubicación**: `src/application/use-cases/reservation/reservation-use-cases.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmPersistenceModule } from '../../../infrastructure/persistence/typeorm/typeorm-persistence.module';
import { ListReservationsUseCase } from './list-reservations.use-case';
import { GetReservationByIdUseCase } from './get-reservation-by-id.use-case';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { UpdateReservationUseCase } from './update-reservation.use-case';
import { DeleteReservationUseCase } from './delete-reservation.use-case';
import { ConfirmReservationUseCase } from './confirm-reservation.use-case';
import { CancelReservationUseCase } from './cancel-reservation.use-case';

@Module({
  imports: [TypeOrmPersistenceModule],
  providers: [
    ListReservationsUseCase,
    GetReservationByIdUseCase,
    CreateReservationUseCase,
    UpdateReservationUseCase,
    DeleteReservationUseCase,
    ConfirmReservationUseCase,
    CancelReservationUseCase,
  ],
  exports: [
    ListReservationsUseCase,
    GetReservationByIdUseCase,
    CreateReservationUseCase,
    UpdateReservationUseCase,
    DeleteReservationUseCase,
    ConfirmReservationUseCase,
    CancelReservationUseCase,
  ],
})
export class ReservationUseCasesModule {}
```

### Paso 6: Crear Entidad ORM

**Ubicación**: `src/infrastructure/persistence/typeorm/entities/reservation.orm-entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { RoomOrmEntity } from './room.orm-entity';

@Entity('reservations')
export class ReservationOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  checkIn: Date;

  @Column({ type: 'timestamp' })
  checkOut: Date;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column()
  userId: number;

  @Column()
  roomId: number;

  @ManyToOne(() => UserOrmEntity)
  user: UserOrmEntity;

  @ManyToOne(() => RoomOrmEntity)
  room: RoomOrmEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Paso 7: Crear Mapper

**Ubicación**: `src/infrastructure/persistence/typeorm/mappers/reservation.mapper.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Reservation, ReservationStatus } from '../../../../domain/entities/reservation.entity';
import { ReservationOrmEntity } from '../entities/reservation.orm-entity';

@Injectable()
export class ReservationMapper {
  toDomain(orm: ReservationOrmEntity): Reservation {
    return (Reservation as any).createFromPersistence({
      id: orm.id,
      checkIn: orm.checkIn,
      checkOut: orm.checkOut,
      status: orm.status as ReservationStatus,
      totalAmount: Number(orm.totalAmount),
      userId: orm.userId,
      roomId: orm.roomId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toOrm(domain: Reservation): ReservationOrmEntity {
    const orm = new ReservationOrmEntity();
    orm.id = domain.id;
    orm.checkIn = domain.checkIn;
    orm.checkOut = domain.checkOut;
    orm.status = domain.status;
    orm.totalAmount = domain.totalAmount;
    orm.userId = domain.userId;
    orm.roomId = domain.roomId;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
```

### Paso 8: Crear Implementación de Repositorio

**Ubicación**: `src/infrastructure/persistence/typeorm/repositories/reservation.repository.impl.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IReservationRepository } from '../../../../domain/repositories/reservation.repository.interface';
import type { Reservation } from '../../../../domain/entities/reservation.entity';
import { ReservationOrmEntity } from '../entities/reservation.orm-entity';
import { ReservationMapper } from '../mappers/reservation.mapper';

@Injectable()
export class TypeOrmReservationRepository implements IReservationRepository {
  constructor(
    @InjectRepository(ReservationOrmEntity)
    private readonly repository: Repository<ReservationOrmEntity>,
    private readonly mapper: ReservationMapper,
  ) {}

  async findAll(): Promise<Reservation[]> {
    const ormEntities = await this.repository.find();
    return ormEntities.map(orm => this.mapper.toDomain(orm));
  }

  async findById(id: number): Promise<Reservation | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByUserId(userId: number): Promise<Reservation[]> {
    const ormEntities = await this.repository.find({ where: { userId } });
    return ormEntities.map(orm => this.mapper.toDomain(orm));
  }

  async findByRoomId(roomId: number): Promise<Reservation[]> {
    const ormEntities = await this.repository.find({ where: { roomId } });
    return ormEntities.map(orm => this.mapper.toDomain(orm));
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const ormEntity = this.mapper.toOrm(reservation);
    const saved = await this.repository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### Paso 9: Registrar en TypeOrmPersistenceModule

**Ubicación**: `src/infrastructure/persistence/typeorm/typeorm-persistence.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// ... otros imports

import { ReservationOrmEntity } from './entities/reservation.orm-entity';
import { ReservationMapper } from './mappers/reservation.mapper';
import { TypeOrmReservationRepository } from './repositories/reservation.repository.impl';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // ... otras entidades
      ReservationOrmEntity,
    ]),
  ],
  providers: [
    // ... otros mappers y repositorios
    ReservationMapper,
    {
      provide: 'IReservationRepository',
      useClass: TypeOrmReservationRepository,
    },
  ],
  exports: [
    // ... otros exports
    'IReservationRepository',
  ],
})
export class TypeOrmPersistenceModule {}
```

### Paso 10: Crear DTOs de Presentación

**Ubicación**: `src/presentation/dtos/reservation/`

```typescript
// create-reservation-request.dto.ts
import { IsDateString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationRequestDto {
  @ApiProperty({ example: '2025-12-01T14:00:00Z' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2025-12-05T12:00:00Z' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  userId: number;

  @ApiProperty({ example: 101 })
  @IsNumber()
  @Min(1)
  roomId: number;
}

// update-reservation-request.dto.ts
import { IsDateString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReservationRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalAmount?: number;
}
```

### Paso 11: Crear Controlador

**Ubicación**: `src/presentation/controllers/reservation.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { ListReservationsUseCase } from '../../application/use-cases/reservation/list-reservations.use-case';
import { GetReservationByIdUseCase } from '../../application/use-cases/reservation/get-reservation-by-id.use-case';
import { CreateReservationUseCase } from '../../application/use-cases/reservation/create-reservation.use-case';
import { UpdateReservationUseCase } from '../../application/use-cases/reservation/update-reservation.use-case';
import { DeleteReservationUseCase } from '../../application/use-cases/reservation/delete-reservation.use-case';
import { ConfirmReservationUseCase } from '../../application/use-cases/reservation/confirm-reservation.use-case';

import { CreateReservationRequestDto } from '../dtos/reservation/create-reservation-request.dto';
import { UpdateReservationRequestDto } from '../dtos/reservation/update-reservation-request.dto';
import { CreateReservationDto } from '../../application/dtos/reservation/create-reservation.dto';
import { UpdateReservationDto } from '../../application/dtos/reservation/update-reservation.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly getReservationByIdUseCase: GetReservationByIdUseCase,
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
    private readonly deleteReservationUseCase: DeleteReservationUseCase,
    private readonly confirmReservationUseCase: ConfirmReservationUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las reservas' })
  @ApiResponse({ status: 200, description: 'Lista de reservas' })
  async findAll() {
    return await this.listReservationsUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener reserva por ID' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.getReservationByIdUseCase.execute(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva reserva' })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente' })
  async create(@Body() requestDto: CreateReservationRequestDto) {
    const dto = new CreateReservationDto();
    dto.checkIn = new Date(requestDto.checkIn);
    dto.checkOut = new Date(requestDto.checkOut);
    dto.totalAmount = requestDto.totalAmount;
    dto.userId = requestDto.userId;
    dto.roomId = requestDto.roomId;

    return await this.createReservationUseCase.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() requestDto: UpdateReservationRequestDto,
  ) {
    const dto = new UpdateReservationDto();
    if (requestDto.checkIn) dto.checkIn = new Date(requestDto.checkIn);
    if (requestDto.checkOut) dto.checkOut = new Date(requestDto.checkOut);
    if (requestDto.totalAmount) dto.totalAmount = requestDto.totalAmount;

    return await this.updateReservationUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar reserva' })
  @ApiResponse({ status: 204, description: 'Reserva eliminada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteReservationUseCase.execute(id);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirmar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva confirmada' })
  async confirm(@Param('id', ParseIntPipe) id: number) {
    await this.confirmReservationUseCase.execute(id);
    return { message: 'Reservation confirmed successfully' };
  }
}
```

### Paso 12: Crear Módulo de Presentación

**Ubicación**: `src/presentation/controllers/reservation-presentation.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ReservationController } from './reservation.controller';
import { ReservationUseCasesModule } from '../../application/use-cases/reservation/reservation-use-cases.module';

@Module({
  imports: [ReservationUseCasesModule],
  controllers: [ReservationController],
})
export class ReservationPresentationModule {}
```

### Paso 13: Registrar en AppModule

**Ubicación**: `src/app.module.ts`

```typescript
import { ReservationPresentationModule } from './presentation/controllers/reservation-presentation.module';

@Module({
  imports: [
    // ... otros módulos
    ReservationPresentationModule,
  ],
})
export class AppModule {}
```

### Paso 14: Ejecutar Tests

```bash
# Compilar
npm run build

# Ejecutar tests
npm test

# Iniciar en desarrollo
npm run start:dev
```

## ✅ Checklist de Calidad

Antes de considerar completado un feature, verifica:

- [ ] ✅ Todas las entidades tienen lógica de negocio (no son anémicas)
- [ ] ✅ Los use cases son pequeños y hacen una sola cosa
- [ ] ✅ Los repositorios usan interfaces (no dependen de TypeORM)
- [ ] ✅ Los mappers convierten correctamente entre domain y ORM
- [ ] ✅ Los DTOs de presentación tienen validaciones
- [ ] ✅ Los controladores no tienen lógica de negocio
- [ ] ✅ No hay dependencias circulares
- [ ] ✅ El código compila sin errores
- [ ] ✅ Los tests existentes siguen pasando

## 🚫 Errores Comunes a Evitar

### ❌ Entidades Anémicas
```typescript
// MAL: Solo getters y setters
class User {
  private name: string;
  getName() { return this.name; }
  setName(name: string) { this.name = name; }
}

// BIEN: Lógica de negocio
class User {
  activate() {
    if (this.status === 'banned') {
      throw new Error('Cannot activate banned user');
    }
    this.status = 'active';
  }
}
```

### ❌ Lógica de Negocio en el Controlador
```typescript
// MAL
@Post()
async create(@Body() dto: CreateUserDto) {
  if (dto.age < 18) {
    throw new BadRequestException('Must be 18+');
  }
  return this.userService.create(dto);
}

// BIEN: Lógica en el Use Case o Entity
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.createUserUseCase.execute(dto);
}
```

### ❌ Dependencias Incorrectas
```typescript
// MAL: Use Case depende de TypeORM
import { Repository } from 'typeorm';

// BIEN: Use Case depende de interfaz
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
```

## 📚 Recursos Adicionales

- Ver `CLEAN_ARCHITECTURE.md` para detalles de la arquitectura
- Ver código de `Actions`, `Groups` o `Users` como referencia
- Consultar documentación de NestJS para decoradores
- Revisar TypeORM docs para queries complejas

---

**¿Dudas?** Revisa los módulos existentes o consulta con el equipo.
