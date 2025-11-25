# Contratos de API REST - Sistema de Reservas

## 1. Introducción

Este documento define los contratos de API REST para el sistema My Hotel Flow, incluyendo rutas, métodos HTTP, DTOs TypeScript, validaciones y headers requeridos.

**Base URL**: `/api/v1`

**Stack Actual**:
- Framework: NestJS 11.x
- ORM: TypeORM 0.3.x
- Base de datos: PostgreSQL
- Validación: class-validator + class-transformer
- Autenticación: JWT (Passport)

---

## 2. Gestión de Reservas

### 2.1 Crear Reserva

**Endpoint**: `POST /api/v1/reservations`

**Autenticación**: ✅ Requerida (Cliente o Recepcionista)

**Headers**:
```typescript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json",
  "Idempotency-Key": "<uuid>"  // REQUERIDO para prevenir duplicados
}
```

**Request Body DTO**:
```typescript
// apps/backend/src/application/reservations/dto/create-reservation.dto.ts
import { IsDateString, IsInt, Min, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({
    description: 'ID del cliente que realiza la reserva',
    example: 1,
  })
  @IsInt()
  @Min(1)
  clientId: number;

  @ApiProperty({
    description: 'ID de la habitación a reservar',
    example: 5,
  })
  @IsInt()
  @Min(1)
  roomId: number;

  @ApiProperty({
    description: 'Fecha de check-in (formato ISO 8601 YYYY-MM-DD)',
    example: '2025-12-20',
  })
  @IsDateString()
  @Transform(({ value }) => {
    const date = new Date(value);
    // Validar que sea al menos 1 hora en el futuro (R-002)
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 1);
    if (date < minDate) {
      throw new Error('La fecha de check-in debe ser al menos 1 hora en el futuro');
    }
    return value;
  })
  checkIn: string; // ISO-8601 date string

  @ApiProperty({
    description: 'Fecha de check-out (formato ISO 8601 YYYY-MM-DD)',
    example: '2025-12-23',
  })
  @IsDateString()
  checkOut: string; // ISO-8601 date string

  @ApiProperty({
    description: 'Observaciones adicionales de la reserva',
    example: 'Llegada tardía, después de las 22:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observations?: string;
}
```

**Validaciones Custom** (Service Layer):
- ✅ R-001: `checkOut > checkIn`
- ✅ R-003: Duración mínima 1 noche
- ✅ R-004: Duración máxima 30 noches
- ✅ R-100: Habitación disponible para las fechas solicitadas
- ✅ R-101: No existe solapamiento con otras reservas confirmadas
- ✅ R-102: Cliente no excede 3 reservas pendientes simultáneas
- ✅ R-604: Rate limiting (10 reservas por hora por cliente)

**Response 201 Created**:
```typescript
{
  "id": 42,
  "code": "RES-1730394567890",
  "clientId": 1,
  "roomId": 5,
  "checkIn": "2025-12-20",
  "checkOut": "2025-12-23",
  "status": "CONFIRMED",
  "cancelReason": null,
  "createdAt": "2025-11-12T15:30:45.123Z",
  "updatedAt": "2025-11-12T15:30:45.123Z",
  "client": {
    "id": 1,
    "dni": "12345678",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "phone": "+541112345678"
  },
  "room": {
    "id": 5,
    "numeroHabitacion": "205",
    "estado": "AVAILABLE",
    "capacidad": 2,
    "precioPorNoche": 15000.00
  },
  "totalNights": 3,
  "totalPrice": 45000.00
}
```

**Response 400 Bad Request**:
```typescript
{
  "statusCode": 400,
  "code": "RES-003",
  "message": "La reserva debe ser de al menos 1 noche",
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations"
}
```

**Response 409 Conflict** (Overbooking):
```typescript
{
  "statusCode": 409,
  "code": "RES-100",
  "message": "No hay habitaciones disponibles para las fechas y tipo seleccionados",
  "details": {
    "requestedCheckIn": "2025-12-20",
    "requestedCheckOut": "2025-12-23",
    "roomId": 5
  },
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations"
}
```

---

### 2.2 Listar Reservas

**Endpoint**: `GET /api/v1/reservations`

**Autenticación**: ✅ Requerida

**Query Parameters**:
```typescript
// apps/backend/src/application/reservations/dto/list-reservations-query.dto.ts
import { IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../../../domain/entities/reservation.entity';

export class ListReservationsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de reserva',
    enum: ReservationStatus,
    example: 'CONFIRMED',
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({
    description: 'Filtrar desde fecha (ISO 8601)',
    example: '2025-12-01',
  })
  @IsOptional()
  @IsDateString()
  checkInFrom?: string;

  @ApiPropertyOptional({
    description: 'Filtrar hasta fecha (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  checkInTo?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de cliente (solo admin/recepcionista)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de habitación',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number;

  @ApiPropertyOptional({
    description: 'Página (paginación)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de items por página',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
```

**Reglas de Autorización**:
- **Cliente**: Solo ve sus propias reservas (`clientId = user.id` automático)
- **Recepcionista/Admin**: Ve todas las reservas, puede filtrar por `clientId`

**Response 200 OK**:
```typescript
{
  "data": [
    {
      "id": 42,
      "code": "RES-1730394567890",
      "clientId": 1,
      "roomId": 5,
      "checkIn": "2025-12-20",
      "checkOut": "2025-12-23",
      "status": "CONFIRMED",
      "cancelReason": null,
      "createdAt": "2025-11-12T15:30:45.123Z",
      "updatedAt": "2025-11-12T15:30:45.123Z",
      "client": {
        "id": 1,
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "juan.perez@example.com"
      },
      "room": {
        "id": 5,
        "numeroHabitacion": "205",
        "capacidad": 2,
        "precioPorNoche": 15000.00
      },
      "totalNights": 3,
      "totalPrice": 45000.00
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7
  }
}
```

---

### 2.3 Obtener Detalle de Reserva

**Endpoint**: `GET /api/v1/reservations/:id`

**Autenticación**: ✅ Requerida

**Path Parameters**:
- `id`: number (ID de la reserva)

**Autorización**:
- Cliente solo puede ver sus propias reservas
- Recepcionista/Admin ve todas

**Response 200 OK**:
```typescript
{
  "id": 42,
  "code": "RES-1730394567890",
  "clientId": 1,
  "roomId": 5,
  "checkIn": "2025-12-20",
  "checkOut": "2025-12-23",
  "status": "CONFIRMED",
  "cancelReason": null,
  "createdAt": "2025-11-12T15:30:45.123Z",
  "updatedAt": "2025-11-12T15:30:45.123Z",
  "client": {
    "id": 1,
    "dni": "12345678",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "phone": "+541112345678",
    "address": "Av. Corrientes 1234, CABA",
    "city": "Buenos Aires",
    "country": "Argentina"
  },
  "room": {
    "id": 5,
    "numeroHabitacion": "205",
    "roomType": {
      "id": 2,
      "nombre": "Habitación Doble",
      "codigo": "DOUBLE_STD",
      "capacidadMaxima": 2,
      "precioPorNoche": 15000.00,
      "descripcion": "Habitación con cama matrimonial o dos camas individuales"
    },
    "estado": "AVAILABLE",
    "caracteristicas": ["WiFi", "Aire Acondicionado", "TV"]
  },
  "totalNights": 3,
  "totalPrice": 45000.00,
  "canCancel": true, // Si cumple R-200 (más de 24h antes de check-in)
  "canModify": true // Si estado es CONFIRMED
}
```

**Response 403 Forbidden** (Cliente intentando ver reserva de otro):
```typescript
{
  "statusCode": 403,
  "code": "RES-600",
  "message": "No tiene permisos para acceder a esta reserva",
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/42"
}
```

**Response 404 Not Found**:
```typescript
{
  "statusCode": 404,
  "message": "Reserva no encontrada",
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/999"
}
```

---

### 2.4 Modificar Fechas de Reserva

**Endpoint**: `PATCH /api/v1/reservations/:id`

**Autenticación**: ✅ Requerida

**Autorización**: Cliente (propia reserva) o Recepcionista/Admin

**Request Body DTO**:
```typescript
// apps/backend/src/application/reservations/dto/update-reservation.dto.ts
import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReservationDto {
  @ApiPropertyOptional({
    description: 'Nueva fecha de check-in (ISO 8601)',
    example: '2025-12-21',
  })
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional({
    description: 'Nueva fecha de check-out (ISO 8601)',
    example: '2025-12-24',
  })
  @IsOptional()
  @IsDateString()
  checkOut?: string;
}
```

**Validaciones**:
- ✅ R-007: Solo modificable si estado es `CONFIRMED`
- ✅ R-001: `checkOut > checkIn`
- ✅ R-003 y R-004: Duración entre 1 y 30 noches
- ✅ R-100: Verificar disponibilidad para nuevas fechas (excluyendo esta reserva)

**Response 200 OK**: Igual que GET detalle

**Response 400 Bad Request** (Estado inválido):
```typescript
{
  "statusCode": 400,
  "code": "RES-007",
  "message": "No se puede modificar una reserva en estado COMPLETED",
  "details": {
    "estadoActual": "COMPLETED",
    "estadosPermitidos": ["CONFIRMED"]
  },
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/42"
}
```

---

### 2.5 Cancelar Reserva

**Endpoint**: `DELETE /api/v1/reservations/:id`

**Autenticación**: ✅ Requerida

**Autorización**: Cliente (propia reserva) o Recepcionista/Admin

**Request Body DTO** (opcional):
```typescript
// apps/backend/src/application/reservations/dto/cancel-reservation.dto.ts
import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelReservationDto {
  @ApiPropertyOptional({
    description: 'Motivo de cancelación (máximo 100 caracteres)',
    example: 'Cambio de planes de viaje',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reason?: string;
}
```

**Validaciones**:
- ✅ R-200: Si estado `CONFIRMED`, verificar que faltan >= 24h para check-in
- ✅ R-202: No se puede cancelar una reserva ya cancelada

**Response 200 OK**:
```typescript
{
  "id": 42,
  "code": "RES-1730394567890",
  "status": "CANCELLED",
  "cancelReason": "Cambio de planes de viaje",
  "cancelledAt": "2025-11-12T15:30:45.123Z",
  "refundEligible": true, // Si se canceló dentro del plazo
  "message": "Reserva cancelada exitosamente"
}
```

**Response 400 Bad Request** (Fuera de plazo):
```typescript
{
  "statusCode": 400,
  "code": "RES-200",
  "message": "No se puede cancelar una reserva confirmada con menos de 24 horas de anticipación",
  "details": {
    "horasRestantes": 18,
    "minimoRequerido": 24,
    "fechaLimite": "2025-12-19T00:00:00.000Z",
    "checkInDate": "2025-12-20T00:00:00.000Z"
  },
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/42"
}
```

---

### 2.6 Realizar Check-in

**Endpoint**: `POST /api/v1/reservations/:id/check-in`

**Autenticación**: ✅ Requerida

**Autorización**: Solo Recepcionista o Admin (R-602)

**Request Body DTO**:
```typescript
// apps/backend/src/application/reservations/dto/check-in.dto.ts
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({
    description: 'Verificación de documentos completada',
    example: true,
  })
  @IsBoolean()
  documentsVerified: boolean;

  @ApiPropertyOptional({
    description: 'Observaciones del check-in',
    example: 'Llegada tarde, upgrade a suite',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observations?: string;
}
```

**Validaciones**:
- ✅ R-300: Estado debe ser `CONFIRMED`
- ✅ R-301: No puede tener check-in previo
- ✅ R-302: Fecha actual >= checkIn - 4 horas

**Response 200 OK**:
```typescript
{
  "id": 42,
  "code": "RES-1730394567890",
  "status": "IN_PROGRESS", // Estado actualizado
  "checkInTimestamp": "2025-12-20T14:30:00.000Z",
  "checkInData": {
    "documentsVerified": true,
    "observations": "Llegada tarde, upgrade a suite",
    "performedBy": {
      "id": 3,
      "firstName": "María",
      "lastName": "González",
      "rol": "RECEPCIONISTA"
    }
  },
  "room": {
    "id": 5,
    "numeroHabitacion": "205",
    "estado": "OCCUPIED" // Estado de habitación actualizado
  },
  "message": "Check-in realizado exitosamente"
}
```

**Response 400 Bad Request**:
```typescript
{
  "statusCode": 400,
  "code": "RES-300",
  "message": "Solo se puede hacer check-in de reservas confirmadas (estado actual: CANCELLED)",
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/42/check-in"
}
```

**Response 409 Conflict** (Doble check-in):
```typescript
{
  "statusCode": 409,
  "code": "RES-301",
  "message": "La reserva ya tiene un check-in registrado",
  "details": {
    "existingCheckIn": "2025-12-20T14:30:00.000Z"
  },
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/42/check-in"
}
```

---

### 2.7 Realizar Check-out

**Endpoint**: `POST /api/v1/reservations/:id/check-out`

**Autenticación**: ✅ Requerida

**Autorización**: Solo Recepcionista o Admin (R-602)

**Request Body DTO**:
```typescript
// apps/backend/src/application/reservations/dto/check-out.dto.ts
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RoomCondition {
  GOOD = 'GOOD',
  REGULAR = 'REGULAR',
  NEEDS_DEEP_CLEANING = 'NEEDS_DEEP_CLEANING',
}

export class CheckOutDto {
  @ApiProperty({
    description: 'Condición de la habitación al momento del check-out',
    enum: RoomCondition,
    example: 'GOOD',
  })
  @IsEnum(RoomCondition)
  roomCondition: RoomCondition;

  @ApiPropertyOptional({
    description: 'Observaciones del check-out',
    example: 'Todo en orden, sin daños',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observations?: string;
}
```

**Validaciones**:
- ✅ R-303: Debe tener check-in previo
- ✅ R-304: No puede tener check-out previo
- ✅ R-306: Si excede checkOut + 2h, requiere autorización (manejado por recepcionista)

**Response 200 OK**:
```typescript
{
  "id": 42,
  "code": "RES-1730394567890",
  "status": "COMPLETED", // Estado actualizado
  "checkInTimestamp": "2025-12-20T14:30:00.000Z",
  "checkOutTimestamp": "2025-12-23T11:00:00.000Z",
  "checkOutData": {
    "roomCondition": "GOOD",
    "observations": "Todo en orden, sin daños",
    "performedBy": {
      "id": 3,
      "firstName": "María",
      "lastName": "González",
      "rol": "RECEPCIONISTA"
    }
  },
  "room": {
    "id": 5,
    "numeroHabitacion": "205",
    "estado": "MAINTENANCE" // Requiere limpieza
  },
  "invoice": {
    "id": 15,
    "numero": "FAC-2025-00015",
    "total": 45000.00,
    "url": "/api/v1/invoices/15"
  }, // Factura generada automáticamente (R-305)
  "message": "Check-out realizado exitosamente. Factura generada."
}
```

**Response 400 Bad Request**:
```typescript
{
  "statusCode": 400,
  "code": "RES-303",
  "message": "No se puede hacer check-out sin haber realizado check-in previamente",
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/42/check-out"
}
```

---

## 3. Gestión de Habitaciones

### 3.1 Verificar Disponibilidad

**Endpoint**: `GET /api/v1/rooms/availability`

**Autenticación**: ❌ No requerida (endpoint público)

**Query Parameters**:
```typescript
// apps/backend/src/application/rooms/dto/check-availability-query.dto.ts
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckAvailabilityQueryDto {
  @ApiProperty({
    description: 'Fecha de check-in (ISO 8601)',
    example: '2025-12-20',
  })
  @IsDateString()
  checkIn: string;

  @ApiProperty({
    description: 'Fecha de check-out (ISO 8601)',
    example: '2025-12-23',
  })
  @IsDateString()
  checkOut: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de habitación (ID)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomTypeId?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de personas',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests?: number;
}
```

**Response 200 OK**:
```typescript
{
  "availableRooms": [
    {
      "id": 5,
      "numeroHabitacion": "205",
      "roomType": {
        "id": 2,
        "codigo": "DOUBLE_STD",
        "nombre": "Habitación Doble",
        "capacidadMaxima": 2,
        "precioPorNoche": 15000.00,
        "descripcion": "Habitación con cama matrimonial o dos camas individuales",
        "caracteristicas": [
          {
            "id": 1,
            "nombre": "WiFi",
            "icono": "wifi"
          },
          {
            "id": 2,
            "nombre": "Aire Acondicionado",
            "icono": "air-conditioner"
          }
        ]
      },
      "estado": "AVAILABLE",
      "precioPorNoche": 15000.00,
      "totalPrice": 45000.00, // 3 noches × 15000
      "totalNights": 3
    },
    {
      "id": 7,
      "numeroHabitacion": "301",
      "roomType": {
        "id": 3,
        "codigo": "SUITE",
        "nombre": "Suite Junior",
        "capacidadMaxima": 3,
        "precioPorNoche": 25000.00,
        "descripcion": "Suite con sala de estar separada"
      },
      "estado": "AVAILABLE",
      "precioPorNoche": 25000.00,
      "totalPrice": 75000.00,
      "totalNights": 3
    }
  ],
  "totalAvailable": 2,
  "requestedDates": {
    "checkIn": "2025-12-20",
    "checkOut": "2025-12-23",
    "nights": 3
  }
}
```

**Response 200 OK** (Sin disponibilidad):
```typescript
{
  "availableRooms": [],
  "totalAvailable": 0,
  "requestedDates": {
    "checkIn": "2025-12-20",
    "checkOut": "2025-12-23",
    "nights": 3
  },
  "message": "No hay habitaciones disponibles para las fechas seleccionadas"
}
```

---

### 3.2 Listar Habitaciones

**Endpoint**: `GET /api/v1/rooms`

**Autenticación**: ❌ No requerida

**Query Parameters**:
```typescript
export class ListRoomsQueryDto {
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roomTypeId?: number;

  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean = true; // Por defecto solo mostrar activas
}
```

**Response 200 OK**:
```typescript
{
  "data": [
    {
      "id": 5,
      "numeroHabitacion": "205",
      "roomType": {
        "id": 2,
        "codigo": "DOUBLE_STD",
        "nombre": "Habitación Doble",
        "capacidadMaxima": 2,
        "precioPorNoche": 15000.00
      },
      "estado": "AVAILABLE",
      "isActive": true,
      "caracteristicas": ["WiFi", "Aire Acondicionado", "TV"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-11-12T15:30:45.123Z"
    }
  ],
  "total": 25
}
```

---

### 3.3 Obtener Detalle de Habitación

**Endpoint**: `GET /api/v1/rooms/:id`

**Autenticación**: ❌ No requerida

**Response 200 OK**:
```typescript
{
  "id": 5,
  "numeroHabitacion": "205",
  "roomType": {
    "id": 2,
    "codigo": "DOUBLE_STD",
    "nombre": "Habitación Doble",
    "capacidadMaxima": 2,
    "precioPorNoche": 15000.00,
    "descripcion": "Habitación con cama matrimonial o dos camas individuales",
    "caracteristicas": [
      {
        "id": 1,
        "nombre": "WiFi",
        "icono": "wifi"
      },
      {
        "id": 2,
        "nombre": "Aire Acondicionado",
        "icono": "air-conditioner"
      },
      {
        "id": 3,
        "nombre": "TV Cable",
        "icono": "tv"
      }
    ],
    "imagenes": [
      "https://storage.myhotelflow.com/rooms/205-1.jpg",
      "https://storage.myhotelflow.com/rooms/205-2.jpg"
    ]
  },
  "estado": "AVAILABLE",
  "descripcion": null,
  "caracteristicasAdicionales": [],
  "isActive": true,
  "currentReservation": null, // Si está OCCUPIED, mostrar reserva actual
  "upcomingReservations": [
    {
      "id": 42,
      "code": "RES-1730394567890",
      "checkIn": "2025-12-20",
      "checkOut": "2025-12-23"
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-11-12T15:30:45.123Z"
}
```

---

## 4. Gestión de Clientes

### 4.1 Crear Cliente (Registro)

**Endpoint**: `POST /api/v1/clients`

**Autenticación**: ❌ No requerida (auto-registro) o ✅ Requerida (Recepcionista)

**Request Body DTO**:
```typescript
// apps/backend/src/application/clients/dto/create-client.dto.ts
import { IsString, IsEmail, Length, Matches, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'DNI del cliente (8 dígitos)',
    example: '12345678',
  })
  @IsString()
  @Length(8, 8)
  @Matches(/^\d{8}$/, { message: 'DNI debe contener 8 dígitos' })
  dni: string;

  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan',
  })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del cliente',
    example: 'Pérez',
  })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'juan.perez@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Teléfono del cliente (formato internacional)',
    example: '+541112345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Formato de teléfono inválido (E.164)' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (ISO 8601)',
    example: '1990-05-15',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Dirección del cliente',
    example: 'Av. Corrientes 1234, CABA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Ciudad',
    example: 'Buenos Aires',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'País',
    example: 'Argentina',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Nacionalidad',
    example: 'Argentina',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Prefiere habitaciones en pisos altos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observations?: string;
}
```

**Response 201 Created**:
```typescript
{
  "id": 1,
  "dni": "12345678",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "phone": "+541112345678",
  "birthDate": "1990-05-15",
  "address": "Av. Corrientes 1234, CABA",
  "city": "Buenos Aires",
  "country": "Argentina",
  "nationality": "Argentina",
  "observations": null,
  "isActive": true,
  "createdAt": "2025-11-12T15:30:45.123Z",
  "credentials": {
    "email": "juan.perez@example.com",
    "temporaryPassword": "ab34cd56" // Password temporal generado
  },
  "message": "Cliente registrado exitosamente. Se envió un email con las credenciales."
}
```

**Response 409 Conflict** (DNI o email duplicado):
```typescript
{
  "statusCode": 409,
  "message": "Ya existe un cliente registrado con este DNI",
  "details": {
    "field": "dni",
    "value": "12345678"
  },
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/clients"
}
```

---

### 4.2 Obtener Cliente por ID

**Endpoint**: `GET /api/v1/clients/:id`

**Autenticación**: ✅ Requerida

**Autorización**: Cliente (propio perfil) o Recepcionista/Admin

**Response 200 OK**: Igual que response de creación (sin `credentials`)

---

### 4.3 Actualizar Cliente

**Endpoint**: `PATCH /api/v1/clients/:id`

**Autenticación**: ✅ Requerida

**Autorización**: Cliente (propio perfil) o Recepcionista/Admin

**Request Body DTO**: Campos opcionales de `CreateClientDto` (excepto `dni`)

**Response 200 OK**: Cliente actualizado

---

## 5. Tipos de Habitación

### 5.1 Listar Tipos de Habitación

**Endpoint**: `GET /api/v1/room-types`

**Autenticación**: ❌ No requerida

**Response 200 OK**:
```typescript
{
  "data": [
    {
      "id": 1,
      "codigo": "SINGLE",
      "nombre": "Habitación Individual",
      "descripcion": "Habitación con cama individual para 1 persona",
      "capacidadMaxima": 1,
      "precioPorNoche": 10000.00,
      "caracteristicas": [
        {
          "id": 1,
          "nombre": "WiFi",
          "icono": "wifi"
        },
        {
          "id": 2,
          "nombre": "Aire Acondicionado",
          "icono": "air-conditioner"
        }
      ],
      "imagenes": [
        "https://storage.myhotelflow.com/room-types/single-1.jpg"
      ],
      "isActive": true
    },
    {
      "id": 2,
      "codigo": "DOUBLE_STD",
      "nombre": "Habitación Doble",
      "descripcion": "Habitación con cama matrimonial o dos camas individuales",
      "capacidadMaxima": 2,
      "precioPorNoche": 15000.00,
      "caracteristicas": [...],
      "imagenes": [...],
      "isActive": true
    }
  ],
  "total": 5
}
```

---

## 6. Códigos de Estado HTTP

| Código | Descripción | Cuándo usar |
|--------|-------------|-------------|
| **200 OK** | Éxito | GET, PATCH exitosos |
| **201 Created** | Recurso creado | POST exitoso |
| **204 No Content** | Éxito sin contenido | DELETE sin response body |
| **400 Bad Request** | Validación falló | DTOs inválidos, reglas de negocio violadas |
| **401 Unauthorized** | No autenticado | JWT inválido o ausente |
| **403 Forbidden** | No autorizado | Intentando acceder a recurso de otro usuario |
| **404 Not Found** | Recurso no existe | ID no encontrado |
| **409 Conflict** | Conflicto de estado | Overbooking, doble check-in, concurrencia |
| **422 Unprocessable Entity** | Lógica de negocio | Violación de invariantes complejas |
| **429 Too Many Requests** | Rate limit | Más de 10 requests/hora (R-604) |
| **500 Internal Server Error** | Error del servidor | Errores no manejados |

---

## 7. Headers Comunes

### Request Headers

```typescript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Idempotency-Key": "<uuid>", // Solo POST de creación
  "X-Client-Version": "1.0.0", // Opcional, para compatibilidad
  "Accept-Language": "es-AR" // Opcional, para i18n
}
```

### Response Headers

```typescript
{
  "Content-Type": "application/json; charset=utf-8",
  "X-RateLimit-Limit": "10",
  "X-RateLimit-Remaining": "7",
  "X-RateLimit-Reset": "1730394600",
  "X-Request-Id": "550e8400-e29b-41d4-a716-446655440000" // Trace ID
}
```

---

## 8. Formato de Errores Estandarizado

Todos los errores siguen el formato:

```typescript
// apps/backend/src/common/filters/http-exception.filter.ts
export interface ErrorResponse {
  statusCode: number;
  code?: string; // Código de error de negocio (ej: RES-001)
  message: string | string[]; // Mensaje legible para humanos
  details?: Record<string, any>; // Información adicional del error
  timestamp: string; // ISO-8601
  path: string; // Ruta de la solicitud
  traceId?: string; // ID de traza para debugging
}
```

**Ejemplo de Error de Validación**:
```typescript
{
  "statusCode": 400,
  "message": [
    "checkIn must be a valid ISO 8601 date string",
    "checkOut must be a valid ISO 8601 date string"
  ],
  "error": "Bad Request",
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations"
}
```

**Ejemplo de Error de Negocio**:
```typescript
{
  "statusCode": 409,
  "code": "RES-101",
  "message": "Conflicto de concurrencia detectado, refrescar y reintentar",
  "details": {
    "reservaId": 42,
    "expectedVersion": 3,
    "currentVersion": 4
  },
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations/42",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 9. Paginación

Para endpoints que retornan listas, usar paginación basada en offset:

**Query Parameters**:
```typescript
{
  page: number = 1; // Página actual (comienza en 1)
  limit: number = 20; // Items por página (máx 100)
}
```

**Response Format**:
```typescript
{
  "data": [...], // Array de items
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 125, // Total de items
    "totalPages": 7,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 10. Filtrado y Ordenamiento

### Filtros (Query Params)

- Usar nombres de campos directos: `?status=CONFIRMED&clientId=1`
- Fechas con sufijos: `?checkInFrom=2025-12-01&checkInTo=2025-12-31`
- Arrays: `?status=CONFIRMED,IN_PROGRESS` (separados por coma)

### Ordenamiento

```typescript
?sortBy=createdAt&sortOrder=DESC
```

- `sortBy`: Nombre del campo
- `sortOrder`: `ASC` o `DESC`

---

## 11. Versionado de API

**Estrategia**: URL Path Versioning

- Current: `/api/v1/...`
- Future: `/api/v2/...`

**Deprecation Headers**:
```typescript
{
  "X-API-Deprecated": "true",
  "X-API-Deprecation-Date": "2026-01-01",
  "X-API-Sunset-Date": "2026-06-01",
  "Link": "</api/v2/reservations>; rel=\"successor-version\""
}
```

---

## 12. Documentación OpenAPI (Swagger)

**Endpoint**: `GET /api/docs`

- Documentación interactiva generada con `@nestjs/swagger`
- JSON Schema: `GET /api/docs-json`
- Todos los DTOs están decorados con `@ApiProperty`

---

## 13. Health Checks

### 13.1 Health Check General

**Endpoint**: `GET /health`

**Response 200 OK**:
```typescript
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### 13.2 Readiness Check

**Endpoint**: `GET /health/ready`

- Retorna 200 si el servicio está listo para recibir tráfico
- Retorna 503 si no está listo (ej: migraciones pendientes)

### 13.3 Liveness Check

**Endpoint**: `GET /health/live`

- Retorna 200 si el proceso está vivo
- Usado por Kubernetes liveness probe

---

## 14. Rate Limiting

**Límites Globales**:
- 100 requests/min por IP (endpoints públicos)
- 1000 requests/min por usuario autenticado

**Límites Específicos**:
- POST `/api/v1/reservations`: 10 requests/hora por cliente (R-604)
- POST `/api/v1/clients`: 5 requests/hora por IP (prevención spam)

**Headers de Rate Limit**:
```typescript
{
  "X-RateLimit-Limit": "10",
  "X-RateLimit-Remaining": "7",
  "X-RateLimit-Reset": "1730394600" // Unix timestamp
}
```

**Response 429 Too Many Requests**:
```typescript
{
  "statusCode": 429,
  "code": "RES-604",
  "message": "Límite de creación de reservas excedido (10 por hora)",
  "details": {
    "limit": 10,
    "remaining": 0,
    "resetAt": "2025-11-12T16:30:00.000Z"
  },
  "timestamp": "2025-11-12T15:30:45.123Z",
  "path": "/api/v1/reservations"
}
```

---

## 15. CORS y Seguridad

**CORS Headers**:
```typescript
{
  "Access-Control-Allow-Origin": "https://myhotelflow.com",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key",
  "Access-Control-Max-Age": "86400"
}
```

**Security Headers** (Helmet):
```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
}
```

---

## 16. Referencias

- **Documento 03-maquina-estados.md**: Estados válidos de reservas y habitaciones
- **Documento 04-reglas-negocio.md**: Códigos de error (RES-###) y validaciones
- **Documento 02-modelo-dominio.md**: Entidades del dominio
- **NestJS Documentation**: https://docs.nestjs.com
- **class-validator**: https://github.com/typestack/class-validator
- **OpenAPI 3.0 Spec**: https://spec.openapis.org/oas/v3.0.0
