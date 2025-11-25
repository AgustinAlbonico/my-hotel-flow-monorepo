# Modelo de Dominio - Sistema de Reservas

## 1. Visión General del Dominio

El sistema My Hotel Flow gestiona el ciclo de vida completo de las reservas hoteleras, desde la solicitud inicial hasta la facturación final. El dominio se organiza alrededor de tres conceptos centrales:

1. **Reserva** (Aggregate Root): Entidad central que coordina la ocupación temporal de recursos
2. **Recurso Hotelero** (Habitación): Activo físico sujeto a reserva
3. **Actor** (Cliente/Recepcionista): Agentes que interactúan con el sistema

---

## 2. Entidades Core y Value Objects

### 2.1 Jerarquía de Personas

```
Persona (Base abstracta)
├── Cliente
└── Recepcionista
```

#### Persona (Abstract Entity)
```typescript
abstract class Persona {
  id: UUID
  dni: string (unique, indexed)
  nombre: string
  apellido: string
  email: EmailAddress (value object)
  telefono: PhoneNumber (value object)
  createdAt: DateTime (ISO-8601)
  updatedAt: DateTime (ISO-8601)
}
```

**Value Objects**:
- `EmailAddress`: Validación RFC 5322
- `PhoneNumber`: Formato internacional E.164

#### Cliente (Entity)
```typescript
class Cliente extends Persona {
  historialReservas: Reserva[] (one-to-many)
  preferencias?: ClientPreferences (value object)
  nivelFidelidad?: 'STANDARD' | 'PREMIUM' | 'VIP'
}
```

#### Recepcionista (Entity)
```typescript
class Recepcionista extends Persona {
  usuario: Usuario (one-to-one)
  turno?: 'MAÑANA' | 'TARDE' | 'NOCHE'
  reservasConfirmadas: Reserva[] (one-to-many)
}
```

### 2.2 Usuario y Autenticación

```typescript
class Usuario {
  id: UUID
  email: string (unique, indexed)
  passwordHash: string
  rol: Role (enum: CLIENTE, RECEPCIONISTA, ADMIN)
  activo: boolean
  ultimoAcceso?: DateTime
  createdAt: DateTime

  // Relaciones polimórficas
  personaId: UUID
  personaTipo: 'Cliente' | 'Recepcionista'
}
```

### 2.3 Reserva (Aggregate Root)

```typescript
class Reserva {
  // Identidad
  id: UUID (primary key)
  codigoReserva: string (unique, indexed, ej: "MHF-2025-001234")

  // Temporal (UTC timestamptz)
  fechaSolicitud: DateTime (ISO-8601)
  fechaInicio: DateTime (check-in deseado)
  fechaFin: DateTime (check-out deseado)
  fechaCreacion: DateTime (audit)
  fechaUltimaModificacion: DateTime (audit)

  // Relaciones
  clienteId: UUID (foreign key → Cliente)
  cliente: Cliente (many-to-one)
  habitacionId?: UUID (foreign key → Habitación, nullable hasta asignación)
  habitacion?: Habitacion (many-to-one)
  tipoHabitacionSolicitado: UUID (foreign key → TipoHabitacion)

  // Datos de ocupación
  cantidadPersonas: number (min: 1, max: capacidad tipo habitación)
  observaciones?: string (text)

  // Estado y máquina de estados
  estado: EstadoReserva (enum)
  historialEstados: TransicionEstado[] (one-to-many, audit trail)

  // Confirmación
  confirmadaPor?: UUID (foreign key → Recepcionista, nullable)
  fechaConfirmacion?: DateTime

  // Check-in / Check-out (Iteración 2)
  checkIn?: CheckInRecord (value object)
  checkOut?: CheckOutRecord (value object)

  // Facturación (Iteración 2)
  facturaId?: UUID (one-to-one)

  // Optimistic locking (prevención overbooking)
  version: number (incrementa en cada UPDATE)

  // Idempotencia
  idempotencyKey?: string (indexed, TTL 24h)
}

enum EstadoReserva {
  INICIADA       // Estado inicial tras POST
  COMPLETADA     // Datos completos, esperando confirmación
  CONFIRMADA     // Verificada por recepcionista, habitación asignada
  CANCELADA      // Cancelación procesada
}
```

**Value Objects de Reserva**:

```typescript
class TransicionEstado {
  estadoAnterior: EstadoReserva
  estadoNuevo: EstadoReserva
  timestamp: DateTime
  realizadoPor: UUID (Usuario)
  motivo?: string
}

class CheckInRecord {
  timestamp: DateTime
  realizadoPor: UUID (Recepcionista)
  documentosVerificados: boolean
  observaciones?: string
}

class CheckOutRecord {
  timestamp: DateTime
  realizadoPor: UUID (Recepcionista)
  estadoHabitacion: 'BUENO' | 'REGULAR' | 'REQUIERE_LIMPIEZA_PROFUNDA'
  observaciones?: string
}
```

### 2.4 Habitación y Recursos

```typescript
class Habitacion {
  id: UUID
  numero: string (unique, indexed, ej: "101", "205-A")
  piso: number
  tipoHabitacionId: UUID (foreign key → TipoHabitacion)
  tipo: TipoHabitacion (many-to-one)
  estado: EstadoHabitacion (enum)
  habilitada: boolean (soft delete / mantenimiento)
  observaciones?: string
  createdAt: DateTime
  updatedAt: DateTime

  // Relaciones inversas
  reservas: Reserva[] (one-to-many)
  historialEstados: TransicionEstadoHabitacion[] (audit trail)
}

enum EstadoHabitacion {
  DISPONIBLE   // Puede ser reservada
  RESERVADA    // Tiene reserva confirmada futura
  OCUPADA      // Check-in realizado
  FINALIZADA   // Check-out realizado, pendiente limpieza
  MANTENIMIENTO // Temporalmente no disponible
}

class TipoHabitacion {
  id: UUID
  codigo: string (unique, ej: "SINGLE", "DOUBLE_STD", "SUITE")
  nombre: string (ej: "Habitación Individual", "Suite Junior")
  descripcion: string
  capacidadMaxima: number
  precioPorNoche: Money (value object)
  servicios: Servicio[] (many-to-many)
  imagenes: ImagenUrl[] (value object)
  activo: boolean
}

class Servicio {
  id: UUID
  nombre: string (ej: "WiFi", "Aire Acondicionado", "Vista al Mar")
  icono?: string (lucide-react icon name)
}
```

**Value Object Money**:
```typescript
class Money {
  cantidad: Decimal (precisión 2 decimales)
  moneda: string (ISO 4217, ej: "ARS", "USD")
}
```

### 2.5 Facturación y Pagos (Iteración 2)

```typescript
class Factura {
  id: UUID
  numero: string (unique, sequential, ej: "F-2025-00123")
  reservaId: UUID (foreign key → Reserva, unique)
  reserva: Reserva (one-to-one)

  // Temporal
  fechaEmision: DateTime
  fechaVencimiento: DateTime

  // Montos
  subtotal: Money
  impuestos: Money (IVA u otros)
  total: Money

  // Items
  items: ItemFactura[] (one-to-many)

  // Estado
  estado: 'PENDIENTE' | 'PAGADA' | 'PARCIALMENTE_PAGADA' | 'VENCIDA' | 'ANULADA'

  // Pagos asociados
  pagos: Pago[] (one-to-many)

  // Archivo
  pdfUrl?: string (S3/storage URL)
}

class ItemFactura {
  id: UUID
  facturaId: UUID
  concepto: string (ej: "Hospedaje 3 noches", "Servicio de limpieza")
  cantidad: number
  precioUnitario: Money
  subtotal: Money
}

class Pago {
  id: UUID
  facturaId: UUID (foreign key → Factura)

  // Temporal
  fechaPago: DateTime

  // Monto
  monto: Money

  // Medio
  medioDePago: MedioDePago (enum)
  referencia?: string (número de transacción, comprobante)

  // Registro
  registradoPor: UUID (Recepcionista)

  // Estado
  estado: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO'
}

enum MedioDePago {
  EFECTIVO
  TARJETA_DEBITO
  TARJETA_CREDITO
  TRANSFERENCIA_BANCARIA
  MERCADO_PAGO
}
```

### 2.6 Notificaciones

```typescript
class Notificacion {
  id: UUID
  tipo: TipoNotificacion (enum)
  destinatario: EmailAddress
  asunto: string
  cuerpo: string (HTML template)
  estado: 'PENDIENTE' | 'ENVIADA' | 'FALLIDA'
  intentos: number
  fechaCreacion: DateTime
  fechaEnvio?: DateTime
  error?: string

  // Relación
  reservaId?: UUID (foreign key → Reserva, nullable)
}

enum TipoNotificacion {
  CONFIRMACION_RESERVA    // RF-06
  RECORDATORIO_CHECKIN    // 24h antes
  FACTURA_EMITIDA
  PAGO_RECIBIDO
  CANCELACION_RESERVA
}
```

---

## 3. Pseudo-ERD (Diagrama Entidad-Relación)

```
┌────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA MY HOTEL FLOW                          │
│                         Domain Model v1.0                              │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────┐                    ┌──────────────────┐
│    Usuario      │                    │   Persona        │
│─────────────────│                    │  (Abstract)      │
│ PK id           │                    │──────────────────│
│ UK email        │         ┌──────────┤ PK id            │
│    passwordHash │         │          │ UK dni           │
│    rol          │         │          │    nombre        │
│    activo       │         │          │    apellido      │
│    personaId ───┼─────────┘          │    email         │
│    personaTipo  │                    │    telefono      │
└─────────────────┘                    └──────────────────┘
                                               △
                                               │ (inheritance)
                              ┌────────────────┴────────────────┐
                              │                                 │
                    ┌─────────────────┐             ┌──────────────────┐
                    │    Cliente      │             │  Recepcionista   │
                    │─────────────────│             │──────────────────│
                    │ PK id           │             │ PK id            │
                    │    nivelFidelid │             │ FK usuarioId     │
                    │    preferencias │             │    turno         │
                    └─────────────────┘             └──────────────────┘
                              │                               │
                              │ 1                             │ 1
                              │                               │
                              │ *                             │ * (confirmadas)
                              ▼                               ▼
         ┌──────────────────────────────────────────────────────────────┐
         │                      Reserva (Aggregate Root)                │
         │──────────────────────────────────────────────────────────────│
         │ PK id                                                        │
         │ UK codigoReserva                                            │
         │ FK clienteId          ──────────────────► Cliente           │
         │ FK habitacionId?      ──────────────────► Habitacion        │
         │ FK tipoHabitacionSolicitado ───────────► TipoHabitacion    │
         │ FK confirmadaPor?     ──────────────────► Recepcionista     │
         │    fechaSolicitud (timestamptz)                             │
         │    fechaInicio (timestamptz)                                │
         │    fechaFin (timestamptz)                                   │
         │    cantidadPersonas                                         │
         │    estado (ENUM: EstadoReserva)                             │
         │    version (optimistic lock)                                │
         │ UK idempotencyKey?                                          │
         │    observaciones                                            │
         └──────────────────────────────────────────────────────────────┘
                  │                           │
                  │ 1                         │ 1
                  │                           │
                  │ *                         │ 0..1
                  ▼                           ▼
    ┌─────────────────────────┐    ┌─────────────────────────┐
    │  TransicionEstado       │    │      Factura            │
    │  (Value Object)         │    │─────────────────────────│
    │─────────────────────────│    │ PK id                   │
    │ PK id                   │    │ UK numero               │
    │ FK reservaId            │    │ UK reservaId            │
    │    estadoAnterior       │    │    fechaEmision         │
    │    estadoNuevo          │    │    subtotal (Money)     │
    │    timestamp            │    │    impuestos (Money)    │
    │    realizadoPor         │    │    total (Money)        │
    └─────────────────────────┘    │    estado               │
                                   │    pdfUrl               │
                                   └─────────────────────────┘
                                             │
                             ┌───────────────┴───────────────┐
                             │ 1                             │ 1
                             │                               │
                             │ *                             │ *
                             ▼                               ▼
               ┌──────────────────────┐      ┌──────────────────────┐
               │   ItemFactura        │      │       Pago           │
               │──────────────────────│      │──────────────────────│
               │ PK id                │      │ PK id                │
               │ FK facturaId         │      │ FK facturaId         │
               │    concepto          │      │    fechaPago         │
               │    cantidad          │      │    monto (Money)     │
               │    precioUnitario    │      │    medioDePago       │
               │    subtotal          │      │    referencia        │
               └──────────────────────┘      │ FK registradoPor     │
                                             │    estado            │
                                             └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                       RECURSOS HOTELEROS                                │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────────┐
                         │  TipoHabitacion      │
                         │──────────────────────│
                         │ PK id                │
                         │ UK codigo            │
                         │    nombre            │
                         │    descripcion       │
                         │    capacidadMaxima   │
                         │    precioPorNoche    │
                         │    activo            │
                         └──────────────────────┘
                                   △
                                   │ 1
                                   │
                   ┌───────────────┼───────────────┐
                   │ *             │               │ *
                   │               │               │
         ┌─────────▼──────┐        │      ┌───────▼────────┐
         │  Habitacion    │        │      │   Servicio     │
         │────────────────│        │      │────────────────│
         │ PK id          │        │      │ PK id          │
         │ UK numero      │        │      │    nombre      │
         │ FK tipoId   ───┼────────┘      │    icono       │
         │    piso        │               └────────────────┘
         │    estado      │               (relación M:N via
         │    habilitada  │                TipoHabitacion_Servicio)
         └────────────────┘
                │
                │ 1
                │
                │ *
                ▼
    ┌──────────────────────────────┐
    │ TransicionEstadoHabitacion   │
    │  (Audit Trail)               │
    │──────────────────────────────│
    │ PK id                        │
    │ FK habitacionId              │
    │    estadoAnterior            │
    │    estadoNuevo               │
    │    timestamp                 │
    │    realizadoPor              │
    └──────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICACIONES                                   │
└─────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────┐
         │   Notificacion       │
         │──────────────────────│
         │ PK id                │
         │ FK reservaId?        │────────► Reserva
         │    tipo              │
         │    destinatario      │
         │    asunto            │
         │    cuerpo (HTML)     │
         │    estado            │
         │    intentos          │
         │    fechaCreacion     │
         │    fechaEnvio        │
         └──────────────────────┘

```

### 3.1 Leyenda del Diagrama

- **PK**: Primary Key
- **FK**: Foreign Key
- **UK**: Unique Key / Constraint
- **1, *, 0..1**: Cardinalidad de relaciones
- **───►**: Relación (foreign key)
- **△**: Herencia / Extends
- **(timestamptz)**: Timestamp con zona horaria (ISO-8601)
- **(Money)**: Value Object con cantidad + moneda
- **(ENUM)**: Tipo enumerado

---

## 4. Reglas de Integridad Referencial

### 4.1 Constraints a Nivel Base de Datos

```sql
-- Tabla: Reserva
ALTER TABLE Reserva
  ADD CONSTRAINT chk_fechas
    CHECK (fechaFin > fechaInicio);

ALTER TABLE Reserva
  ADD CONSTRAINT chk_cantidadPersonas
    CHECK (cantidadPersonas >= 1);

-- Índices para prevención overbooking y búsquedas
CREATE INDEX idx_reserva_fechas
  ON Reserva(fechaInicio, fechaFin)
  WHERE estado IN ('CONFIRMADA', 'COMPLETADA');

CREATE INDEX idx_reserva_habitacion_estado
  ON Reserva(habitacionId, estado);

CREATE UNIQUE INDEX idx_reserva_idempotency
  ON Reserva(idempotencyKey)
  WHERE idempotencyKey IS NOT NULL;

-- Tabla: Habitacion
ALTER TABLE Habitacion
  ADD CONSTRAINT uk_numero UNIQUE (numero);

-- Tabla: Usuario
ALTER TABLE Usuario
  ADD CONSTRAINT uk_email UNIQUE (email);

-- Tabla: Cliente/Persona
ALTER TABLE Persona
  ADD CONSTRAINT uk_dni UNIQUE (dni);
```

### 4.2 Constraint de Overbooking (PostgreSQL con btree_gist)

```sql
-- Opción ideal para PostgreSQL
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE Reserva
  ADD CONSTRAINT no_overlapping_reservations
  EXCLUDE USING GIST (
    habitacionId WITH =,
    tstzrange(fechaInicio, fechaFin, '[)') WITH &&
  )
  WHERE (estado IN ('CONFIRMADA', 'COMPLETADA'));
```

### 4.3 Implementación Alternativa para MySQL

```sql
-- MySQL no soporta exclusion constraints nativos
-- Se implementa mediante:
-- 1. Optimistic locking (campo version)
-- 2. Verificación en transacción con SELECT FOR UPDATE
-- 3. Validación a nivel aplicación

-- Ver sección 6 de documento 06-prevencion-overbooking.md
```

---

## 5. Invariantes del Dominio

### 5.1 Reserva

| Código | Invariante | Validación |
|--------|-----------|------------|
| **INV-R01** | `fechaFin > fechaInicio` | CHECK constraint + DTO validation |
| **INV-R02** | `cantidadPersonas <= tipoHabitacion.capacidadMaxima` | Service layer validation |
| **INV-R03** | `estado = CONFIRMADA` ⟹ `habitacionId IS NOT NULL` | State machine guard |
| **INV-R04** | `estado = CONFIRMADA` ⟹ `confirmadaPor IS NOT NULL` | State machine guard |
| **INV-R05** | Solo una reserva activa por habitación en rango de fechas | Exclusion constraint / optimistic lock |
| **INV-R06** | `version` incrementa en cada UPDATE | Prisma `@updatedAt` + manual increment |
| **INV-R07** | `idempotencyKey` único para operaciones POST | Unique constraint + TTL cleanup |
| **INV-R08** | Transiciones de estado válidas según máquina de estados | Service layer state machine |

### 5.2 Habitación

| Código | Invariante | Validación |
|--------|-----------|------------|
| **INV-H01** | `numero` único en el hotel | UNIQUE constraint |
| **INV-H02** | `estado = OCUPADA` ⟹ existe reserva con check-in | Verificación en service |
| **INV-H03** | `habilitada = false` ⟹ no puede recibir nuevas reservas | Business logic guard |

### 5.3 Factura

| Código | Invariante | Validación |
|--------|-----------|------------|
| **INV-F01** | `total = subtotal + impuestos` | Calculated field / validation |
| **INV-F02** | `numero` secuencial único | DB sequence / stored procedure |
| **INV-F03** | Una factura por reserva | UNIQUE constraint on reservaId |
| **INV-F04** | `estado = PAGADA` ⟹ `SUM(pagos.monto) >= total` | Aggregate validation |

---

## 6. Agregados y Boundaries

### 6.1 Aggregate: Reserva

**Aggregate Root**: `Reserva`

**Entidades contenidas**:
- `TransicionEstado[]` (value object collection)
- `CheckInRecord?` (value object)
- `CheckOutRecord?` (value object)

**Reglas del Aggregate**:
1. Toda modificación del estado de reserva pasa por el aggregate root
2. Las transiciones de estado se registran automáticamente en `historialEstados`
3. La asignación de habitación solo puede ocurrir en estado `CONFIRMADA`
4. La cancelación verifica la política de 24h antes de proceder

**Operaciones del Aggregate**:
```typescript
class Reserva {
  // Comandos
  static crear(dto: CrearReservaDTO): Reserva
  modificar(dto: ModificarReservaDTO): void
  confirmar(recepcionistaId: UUID, habitacionId: UUID): void
  cancelar(usuarioId: UUID, motivo?: string): void
  realizarCheckIn(recepcionistaId: UUID): void
  realizarCheckOut(recepcionistaId: UUID, datos: CheckOutDTO): void

  // Queries
  puedeSerModificada(): boolean
  puedeSerCancelada(fechaActual: DateTime): boolean
  estaDentroDeVentanaCancelacion(): boolean
  calcularMontoTotal(): Money

  // Eventos (Domain Events)
  emitir(evento: DomainEvent): void
}
```

### 6.2 Aggregate: Habitación

**Aggregate Root**: `Habitacion`

**Entidades contenidas**:
- `TransicionEstadoHabitacion[]`

**Operaciones**:
```typescript
class Habitacion {
  reservar(): void
  ocupar(): void
  liberar(): void
  enviarAMantenimiento(motivo: string): void
  habilitar(): void

  estaDisponible(fechaInicio: DateTime, fechaFin: DateTime): boolean
}
```

### 6.3 Aggregate: Factura

**Aggregate Root**: `Factura`

**Entidades contenidas**:
- `ItemFactura[]`
- `Pago[]`

**Operaciones**:
```typescript
class Factura {
  static generar(reserva: Reserva): Factura
  agregarItem(item: ItemFactura): void
  registrarPago(pago: Pago): void
  calcularSaldoPendiente(): Money
  marcarComoPagada(): void
  anular(motivo: string): void
}
```

---

## 7. Domain Events

### 7.1 Eventos de Reserva

```typescript
interface ReservaCreada {
  eventType: 'ReservaCreada'
  reservaId: UUID
  clienteId: UUID
  fechaInicio: DateTime
  fechaFin: DateTime
  tipoHabitacionId: UUID
  timestamp: DateTime
}

interface ReservaConfirmada {
  eventType: 'ReservaConfirmada'
  reservaId: UUID
  habitacionId: UUID
  confirmadaPor: UUID
  timestamp: DateTime
}

interface ReservaCancelada {
  eventType: 'ReservaCancelada'
  reservaId: UUID
  canceladaPor: UUID
  motivo?: string
  timestamp: DateTime
}

interface CheckInRealizado {
  eventType: 'CheckInRealizado'
  reservaId: UUID
  habitacionId: UUID
  recepcionistaId: UUID
  timestamp: DateTime
}

interface CheckOutRealizado {
  eventType: 'CheckOutRealizado'
  reservaId: UUID
  habitacionId: UUID
  recepcionistaId: UUID
  timestamp: DateTime
}
```

### 7.2 Event Handlers

| Evento | Handler | Acción |
|--------|---------|--------|
| `ReservaCreada` | NotificationService | Enviar email confirmación RF-06 |
| `ReservaConfirmada` | HabitacionService | Cambiar estado habitación a `RESERVADA` |
| `ReservaConfirmada` | NotificationService | Enviar recordatorio 24h antes check-in |
| `ReservaCancelada` | HabitacionService | Liberar habitación, cambiar a `DISPONIBLE` |
| `CheckInRealizado` | HabitacionService | Cambiar estado habitación a `OCUPADA` |
| `CheckOutRealizado` | HabitacionService | Cambiar estado habitación a `FINALIZADA` |
| `CheckOutRealizado` | FacturaService | Generar factura automáticamente |

---

## 8. Prisma Schema (Propuesta Inicial)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"  // o "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// PERSONAS Y AUTENTICACIÓN
// ============================================================================

enum Rol {
  CLIENTE
  RECEPCIONISTA
  ADMIN
}

model Usuario {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  rol           Rol
  activo        Boolean  @default(true)
  ultimoAcceso  DateTime? @map("ultimo_acceso")

  personaId     String   @map("persona_id")
  personaTipo   String   @map("persona_tipo") // 'Cliente' | 'Recepcionista'

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("usuarios")
}

model Persona {
  id        String   @id @default(uuid())
  dni       String   @unique
  nombre    String
  apellido  String
  email     String
  telefono  String
  tipo      String   // Discriminator: 'Cliente' | 'Recepcionista'

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones polimórficas
  cliente       Cliente?
  recepcionista Recepcionista?

  @@map("personas")
}

model Cliente {
  id              String  @id @default(uuid())
  personaId       String  @unique @map("persona_id")
  persona         Persona @relation(fields: [personaId], references: [id], onDelete: Cascade)

  nivelFidelidad  String? @map("nivel_fidelidad") // 'STANDARD' | 'PREMIUM' | 'VIP'
  preferencias    Json?

  reservas        Reserva[]

  @@map("clientes")
}

model Recepcionista {
  id        String  @id @default(uuid())
  personaId String  @unique @map("persona_id")
  persona   Persona @relation(fields: [personaId], references: [id], onDelete: Cascade)

  turno     String? // 'MAÑANA' | 'TARDE' | 'NOCHE'

  reservasConfirmadas Reserva[] @relation("ConfirmadaPor")

  @@map("recepcionistas")
}

// ============================================================================
// RESERVAS (AGGREGATE ROOT)
// ============================================================================

enum EstadoReserva {
  INICIADA
  COMPLETADA
  CONFIRMADA
  CANCELADA
}

model Reserva {
  id                        String        @id @default(uuid())
  codigoReserva            String        @unique @map("codigo_reserva")

  // Temporal (UTC)
  fechaSolicitud           DateTime      @map("fecha_solicitud")
  fechaInicio              DateTime      @map("fecha_inicio")
  fechaFin                 DateTime      @map("fecha_fin")

  // Relaciones
  clienteId                String        @map("cliente_id")
  cliente                  Cliente       @relation(fields: [clienteId], references: [id])

  habitacionId             String?       @map("habitacion_id")
  habitacion               Habitacion?   @relation(fields: [habitacionId], references: [id])

  tipoHabitacionSolicitado String        @map("tipo_habitacion_solicitado")
  tipoHabitacion           TipoHabitacion @relation(fields: [tipoHabitacionSolicitado], references: [id])

  // Datos ocupación
  cantidadPersonas         Int           @map("cantidad_personas")
  observaciones            String?       @db.Text

  // Estado
  estado                   EstadoReserva

  // Confirmación
  confirmadaPorId          String?       @map("confirmada_por_id")
  confirmadaPor            Recepcionista? @relation("ConfirmadaPor", fields: [confirmadaPorId], references: [id])
  fechaConfirmacion        DateTime?     @map("fecha_confirmacion")

  // Check-in/Check-out (JSON para value objects)
  checkIn                  Json?         @map("check_in")
  checkOut                 Json?         @map("check_out")

  // Optimistic locking
  version                  Int           @default(0)

  // Idempotencia
  idempotencyKey           String?       @unique @map("idempotency_key")

  // Audit
  createdAt                DateTime      @default(now()) @map("created_at")
  updatedAt                DateTime      @updatedAt @map("updated_at")

  // Relaciones inversas
  historialEstados         TransicionEstado[]
  factura                  Factura?
  notificaciones           Notificacion[]

  @@index([fechaInicio, fechaFin, estado])
  @@index([habitacionId, estado])
  @@map("reservas")
}

model TransicionEstado {
  id              String        @id @default(uuid())
  reservaId       String        @map("reserva_id")
  reserva         Reserva       @relation(fields: [reservaId], references: [id], onDelete: Cascade)

  estadoAnterior  EstadoReserva @map("estado_anterior")
  estadoNuevo     EstadoReserva @map("estado_nuevo")
  timestamp       DateTime      @default(now())
  realizadoPor    String        @map("realizado_por") // UUID Usuario
  motivo          String?       @db.Text

  @@map("transiciones_estado")
}

// ============================================================================
// HABITACIONES Y RECURSOS
// ============================================================================

enum EstadoHabitacion {
  DISPONIBLE
  RESERVADA
  OCUPADA
  FINALIZADA
  MANTENIMIENTO
}

model TipoHabitacion {
  id               String   @id @default(uuid())
  codigo           String   @unique
  nombre           String
  descripcion      String   @db.Text
  capacidadMaxima  Int      @map("capacidad_maxima")
  precioPorNoche   Decimal  @map("precio_por_noche") @db.Decimal(10, 2)
  moneda           String   @default("ARS")
  activo           Boolean  @default(true)
  imagenes         Json?    // Array de URLs

  habitaciones     Habitacion[]
  reservas         Reserva[]
  servicios        TipoHabitacionServicio[]

  @@map("tipos_habitacion")
}

model Habitacion {
  id            String            @id @default(uuid())
  numero        String            @unique
  piso          Int

  tipoId        String            @map("tipo_id")
  tipo          TipoHabitacion    @relation(fields: [tipoId], references: [id])

  estado        EstadoHabitacion
  habilitada    Boolean           @default(true)
  observaciones String?           @db.Text

  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")

  reservas      Reserva[]
  historialEstados TransicionEstadoHabitacion[]

  @@map("habitaciones")
}

model TransicionEstadoHabitacion {
  id              String            @id @default(uuid())
  habitacionId    String            @map("habitacion_id")
  habitacion      Habitacion        @relation(fields: [habitacionId], references: [id], onDelete: Cascade)

  estadoAnterior  EstadoHabitacion  @map("estado_anterior")
  estadoNuevo     EstadoHabitacion  @map("estado_nuevo")
  timestamp       DateTime          @default(now())
  realizadoPor    String            @map("realizado_por")
  motivo          String?           @db.Text

  @@map("transiciones_estado_habitacion")
}

model Servicio {
  id     String @id @default(uuid())
  nombre String @unique
  icono  String?

  tiposHabitacion TipoHabitacionServicio[]

  @@map("servicios")
}

model TipoHabitacionServicio {
  tipoHabitacionId String         @map("tipo_habitacion_id")
  tipoHabitacion   TipoHabitacion @relation(fields: [tipoHabitacionId], references: [id], onDelete: Cascade)

  servicioId       String         @map("servicio_id")
  servicio         Servicio       @relation(fields: [servicioId], references: [id], onDelete: Cascade)

  @@id([tipoHabitacionId, servicioId])
  @@map("tipo_habitacion_servicios")
}

// ============================================================================
// FACTURACIÓN Y PAGOS (ITERACIÓN 2)
// ============================================================================

enum EstadoFactura {
  PENDIENTE
  PAGADA
  PARCIALMENTE_PAGADA
  VENCIDA
  ANULADA
}

model Factura {
  id               String         @id @default(uuid())
  numero           String         @unique

  reservaId        String         @unique @map("reserva_id")
  reserva          Reserva        @relation(fields: [reservaId], references: [id])

  fechaEmision     DateTime       @map("fecha_emision")
  fechaVencimiento DateTime       @map("fecha_vencimiento")

  subtotal         Decimal        @db.Decimal(10, 2)
  impuestos        Decimal        @db.Decimal(10, 2)
  total            Decimal        @db.Decimal(10, 2)
  moneda           String         @default("ARS")

  estado           EstadoFactura
  pdfUrl           String?        @map("pdf_url")

  items            ItemFactura[]
  pagos            Pago[]

  createdAt        DateTime       @default(now()) @map("created_at")

  @@map("facturas")
}

model ItemFactura {
  id              String  @id @default(uuid())
  facturaId       String  @map("factura_id")
  factura         Factura @relation(fields: [facturaId], references: [id], onDelete: Cascade)

  concepto        String
  cantidad        Int
  precioUnitario  Decimal @map("precio_unitario") @db.Decimal(10, 2)
  subtotal        Decimal @db.Decimal(10, 2)

  @@map("items_factura")
}

enum MedioDePago {
  EFECTIVO
  TARJETA_DEBITO
  TARJETA_CREDITO
  TRANSFERENCIA_BANCARIA
  MERCADO_PAGO
}

enum EstadoPago {
  APROBADO
  PENDIENTE
  RECHAZADO
}

model Pago {
  id              String       @id @default(uuid())
  facturaId       String       @map("factura_id")
  factura         Factura      @relation(fields: [facturaId], references: [id])

  fechaPago       DateTime     @map("fecha_pago")
  monto           Decimal      @db.Decimal(10, 2)
  moneda          String       @default("ARS")

  medioDePago     MedioDePago  @map("medio_de_pago")
  referencia      String?

  registradoPor   String       @map("registrado_por") // UUID Recepcionista
  estado          EstadoPago

  createdAt       DateTime     @default(now()) @map("created_at")

  @@map("pagos")
}

// ============================================================================
// NOTIFICACIONES
// ============================================================================

enum TipoNotificacion {
  CONFIRMACION_RESERVA
  RECORDATORIO_CHECKIN
  FACTURA_EMITIDA
  PAGO_RECIBIDO
  CANCELACION_RESERVA
}

enum EstadoNotificacion {
  PENDIENTE
  ENVIADA
  FALLIDA
}

model Notificacion {
  id            String              @id @default(uuid())
  tipo          TipoNotificacion
  destinatario  String
  asunto        String
  cuerpo        String              @db.Text

  estado        EstadoNotificacion
  intentos      Int                 @default(0)
  error         String?             @db.Text

  reservaId     String?             @map("reserva_id")
  reserva       Reserva?            @relation(fields: [reservaId], references: [id])

  fechaCreacion DateTime            @default(now()) @map("fecha_creacion")
  fechaEnvio    DateTime?           @map("fecha_envio")

  @@map("notificaciones")
}
```

---

## 9. Referencias Cruzadas con Documentación

- **Diagrama ER Original**: Pág. 15-16 del PDF (sección 2.3)
- **Diagrama de Clases UML**: Pág. 17 (entidades Persona, Cliente, Recepcionista, Reserva, Habitación)
- **Diagrama de Estados Reserva**: Pág. 18
- **Diagrama de Estados Habitación**: Pág. 19
- **Casos de Uso CU-01 a CU-06**: Secciones 2.3 y 3.3
- **Requisitos Funcionales RF-01 a RF-12**: Págs. 31-35

---

## 10. Notas de Diseño

### 10.1 Decisiones de Arquitectura

1. **Herencia Persona**: Se implementa usando estrategia "single table inheritance" con discriminador `tipo` para simplificar queries. Alternativa: "class table inheritance" con tablas separadas `clientes` y `recepcionistas`.

2. **Value Objects como JSON**: `CheckInRecord`, `CheckOutRecord`, y arrays de `imagenes` se almacenan como JSON para evitar tablas adicionales, asumiendo que no se consultarán directamente.

3. **Optimistic Locking**: Campo `version` en `Reserva` incrementa en cada UPDATE mediante `@@updatedAt` de Prisma y lógica manual en service layer.

4. **Idempotency Keys**: Se almacenan con TTL de 24h, requiere job periódico de limpieza o uso de Redis.

5. **Money como campos separados**: `cantidad` (Decimal) + `moneda` (String) en lugar de tipo compuesto por limitaciones de MySQL.

6. **Domain Events**: Se implementan mediante event emitters en NestJS, no se persisten en event store (opción futura para event sourcing).

### 10.2 Consideraciones de Performance

- Índices compuestos en `(fechaInicio, fechaFin, estado)` para queries de disponibilidad
- Índice en `habitacionId + estado` para verificar estado actual de habitaciones
- Desnormalización potencial: agregar `estadoHabitacion` a tabla `Reserva` para evitar JOINs frecuentes (tradeoff consistencia vs performance)

### 10.3 Escalabilidad Futura

- **Sharding por hotel**: Si el sistema soporta múltiples hoteles, particionar por `hotelId`
- **CQRS**: Separar modelo de lectura (queries de disponibilidad) del modelo de escritura (creación de reservas)
- **Event Sourcing**: Almacenar todas las transiciones de estado como eventos inmutables para auditoría completa
