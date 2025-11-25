# Inventario del Sistema - My Hotel Flow

## 1. Estado Actual del Sistema

### 1.1 Frontend (Web Application)

**Ubicación**: `apps/web/`

**Stack Tecnológico Identificado**:
- React 18.3.1
- TypeScript 5.6.2
- Vite 5.4.8 (build tool)
- React Router 6.26.2
- TanStack Query 5.56.2 (gestión de estado servidor)
- React Hook Form 7.53.0 + Zod 3.23.8 (validación)
- Axios 1.7.7 (cliente HTTP)
- Tailwind CSS 3.4.13 + @tailwindcss/forms
- Headless UI 2.1.9 (componentes accesibles)
- date-fns 4.1.0 (manipulación de fechas)
- Lucide React (iconografía)

**Capacidades del Frontend**:
- Arquitectura modular con monorepo
- Sistema de validación robusto (Zod schemas)
- Gestión de estado asíncrono (React Query)
- Routing con navegación programática
- Testing configurado (Vitest + Testing Library)

### 1.2 Backend (API)

**Estado**: ❌ **NO EXISTE**

**Hallazgo Crítico**: No se encontró ningún directorio `apps/api`, `apps/backend`, o `packages/api` en la estructura del proyecto. El backend especificado en la documentación (NestJS + MySQL) aún no ha sido implementado.

### 1.3 Base de Datos

**Estado**: ❌ **NO IMPLEMENTADA**

- No se encontró schema de Prisma (`*.prisma`)
- No se encontraron migraciones de base de datos
- Documentación especifica MySQL como RDBMS objetivo

---

## 2. Entidades Requeridas según Documentación

### 2.1 Entidades Core (Iteración 1)

| Entidad | Estado Actual | Fuente Doc | Prioridad |
|---------|--------------|------------|-----------|
| **Persona** | ❌ No implementada | Sección 2.3, Diagrama ER | Alta |
| **Cliente** (extends Persona) | ❌ No implementada | Sección 2.3.1 | Alta |
| **Recepcionista** (extends Persona) | ❌ No implementada | Sección 2.3.1 | Alta |
| **Usuario** | ❌ No implementada | Caso de Uso CU-01 | Alta |
| **Reserva** | ❌ No implementada | Sección 2.3.2, Diagrama Estados | **Crítica** |
| **Habitación** | ❌ No implementada | Sección 2.3.3 | **Crítica** |
| **TipoHabitación** | ❌ No implementada | Diagrama ER | Alta |
| **EstadoReserva** | ❌ No implementada | Diagrama Estados Reserva | **Crítica** |
| **EstadoHabitación** | ❌ No implementada | Diagrama Estados Habitación | **Crítica** |
| **Notificación** | ❌ No implementada | RF-06 (confirmación automática) | Media |

**Estados de Reserva Documentados**:
- `Iniciada` (estado inicial)
- `Completada` (datos ingresados)
- `Confirmada` (verificada por recepcionista)
- `Cancelada` (cancelación solicitada)

**Estados de Habitación Documentados**:
- `Disponible`
- `Reservada`
- `Ocupada`
- `Finalizada`

### 2.2 Entidades de Iteración 2 (Check-in/Check-out/Facturación)

| Entidad | Estado Actual | Fuente Doc | Prioridad |
|---------|--------------|------------|-----------|
| **Factura** | ❌ No implementada | Sección 3.3, CU-05 | Media |
| **Pago** | ❌ No implementada | CU-06, RF-12 | Media |
| **MedioDePago** | ❌ No implementada | RF-12 | Media |
| **CheckIn** (relación con Reserva) | ❌ No implementada | CU-04 | Alta |
| **CheckOut** (relación con Reserva) | ❌ No implementada | CU-05 | Alta |

---

## 3. Endpoints Requeridos (Gap Analysis)

### 3.1 Gestión de Reservas (Iteración 1)

#### ❌ **POST /api/reservas**
- **Descripción**: Crear nueva reserva (CU-01)
- **Actor**: Cliente
- **Payload esperado**:
  ```typescript
  {
    clienteId: string;
    fechaInicio: string; // ISO-8601
    fechaFin: string;
    tipoHabitacionId: string;
    cantidadPersonas: number;
    observaciones?: string;
  }
  ```
- **Requisitos especiales**:
  - Verificación de disponibilidad
  - Prevención de overbooking
  - Estado inicial: `Iniciada`
  - Header `Idempotency-Key` requerido

#### ❌ **GET /api/reservas**
- **Descripción**: Listar reservas (con filtros)
- **Query params**: `estado`, `fechaDesde`, `fechaHasta`, `clienteId`
- **Actor**: Recepcionista

#### ❌ **GET /api/reservas/:id**
- **Descripción**: Detalle de reserva individual
- **Actor**: Cliente (propias), Recepcionista (todas)

#### ❌ **PATCH /api/reservas/:id**
- **Descripción**: Modificar reserva (CU-02)
- **Payload**: Cambios parciales (fechas, tipo habitación, personas)
- **Validaciones**:
  - Verificar estado (solo `Completada` o `Confirmada`)
  - Re-verificar disponibilidad si cambian fechas/tipo

#### ❌ **DELETE /api/reservas/:id**
- **Descripción**: Cancelar reserva (CU-03)
- **Efecto**: Transición a estado `Cancelada`
- **Validación**: RF-05 (cancelación hasta 24h antes de check-in)

#### ❌ **POST /api/reservas/:id/confirmar**
- **Descripción**: Confirmar reserva
- **Actor**: Recepcionista
- **Efecto**: `Completada` → `Confirmada`
- **Side-effect**: Enviar notificación (RF-06)

### 3.2 Gestión de Habitaciones

#### ❌ **GET /api/habitaciones**
- **Descripción**: Listar habitaciones
- **Query params**: `estado`, `tipoHabitacionId`

#### ❌ **GET /api/habitaciones/disponibilidad**
- **Descripción**: Verificar disponibilidad para rango de fechas
- **Query params**:
  - `fechaInicio` (ISO-8601)
  - `fechaFin` (ISO-8601)
  - `tipoHabitacionId`
  - `cantidadPersonas`
- **Response**: Lista de habitaciones disponibles con sus tipos

#### ❌ **GET /api/tipos-habitacion**
- **Descripción**: Listar tipos de habitación
- **Response**:
  ```typescript
  {
    id: string;
    nombre: string;
    descripcion: string;
    capacidadMaxima: number;
    precioPorNoche: number;
    servicios: string[];
  }[]
  ```

### 3.3 Gestión de Clientes

#### ❌ **POST /api/clientes**
- **Descripción**: Registrar nuevo cliente
- **Payload**: DNI, nombre, apellido, email, teléfono

#### ❌ **GET /api/clientes/:id**
- **Descripción**: Obtener datos del cliente

#### ❌ **GET /api/clientes/:id/reservas**
- **Descripción**: Historial de reservas del cliente

### 3.4 Check-in / Check-out (Iteración 2)

#### ❌ **POST /api/reservas/:id/check-in**
- **Descripción**: Realizar check-in (CU-04)
- **Precondición**: Estado `Confirmada`
- **Efecto**: Habitación → `Ocupada`

#### ❌ **POST /api/reservas/:id/check-out**
- **Descripción**: Realizar check-out (CU-05)
- **Precondición**: Estado con check-in realizado
- **Efecto**: Habitación → `Finalizada`, generar factura

### 3.5 Facturación y Pagos (Iteración 2)

#### ❌ **GET /api/facturas/:reservaId**
- **Descripción**: Obtener factura de reserva (RF-11)

#### ❌ **POST /api/pagos**
- **Descripción**: Registrar pago (CU-06, RF-12)
- **Payload**:
  ```typescript
  {
    facturaId: string;
    monto: number;
    medioDePago: 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia';
    referencia?: string;
  }
  ```

---

## 4. Módulos Backend a Implementar (Propuesta NestJS)

### 4.1 Módulos Core

```
apps/api/src/
├── modules/
│   ├── reservations/          # Gestión de reservas
│   │   ├── reservations.controller.ts
│   │   ├── reservations.service.ts
│   │   ├── reservations.repository.ts
│   │   ├── dto/
│   │   │   ├── create-reservation.dto.ts
│   │   │   ├── update-reservation.dto.ts
│   │   │   └── reservation-response.dto.ts
│   │   ├── entities/
│   │   │   └── reservation.entity.ts
│   │   └── reservations.module.ts
│   │
│   ├── rooms/                 # Gestión de habitaciones
│   │   ├── rooms.controller.ts
│   │   ├── rooms.service.ts
│   │   ├── rooms.repository.ts
│   │   ├── availability.service.ts  # Lógica de disponibilidad
│   │   └── rooms.module.ts
│   │
│   ├── clients/               # Gestión de clientes
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   ├── clients.repository.ts
│   │   └── clients.module.ts
│   │
│   ├── users/                 # Autenticación y usuarios
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   │
│   ├── invoices/              # Facturación (Iteración 2)
│   │   └── invoices.module.ts
│   │
│   └── payments/              # Pagos (Iteración 2)
│       └── payments.module.ts
│
├── common/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── idempotency.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── decorators/
│       └── idempotency-key.decorator.ts
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

### 4.2 Servicios de Infraestructura

| Servicio | Propósito | Estado |
|----------|-----------|--------|
| **IdempotencyService** | Garantizar idempotencia en POST | ❌ No implementado |
| **NotificationService** | Envío de emails/SMS (RF-06) | ❌ No implementado |
| **AvailabilityService** | Verificación de disponibilidad | ❌ No implementado |
| **OverbookingPreventionService** | Locks optimistas + verificación solapamiento | ❌ No implementado |
| **AuditLogService** | Trazabilidad de cambios | ❌ No implementado |

---

## 5. Brechas Críticas Identificadas

### 5.1 Funcionalidad

| Requisito | Documentación | Estado | Impacto |
|-----------|--------------|--------|---------|
| Creación de reservas | RF-01, CU-01 | ❌ Backend no existe | **Bloqueante** |
| Modificación de reservas | RF-02, CU-02 | ❌ Backend no existe | **Bloqueante** |
| Cancelación de reservas | RF-03, CU-03 | ❌ Backend no existe | **Bloqueante** |
| Verificación disponibilidad | RF-04 | ❌ No implementado | **Bloqueante** |
| Validación plazo cancelación | RF-05 | ❌ No implementado | Alto |
| Confirmación automática email | RF-06 | ❌ No implementado | Alto |
| Check-in | RF-08, CU-04 | ❌ No implementado | Medio (Iter. 2) |
| Check-out | RF-09, CU-05 | ❌ No implementado | Medio (Iter. 2) |
| Facturación | RF-11, CU-05 | ❌ No implementado | Medio (Iter. 2) |
| Registro de pagos | RF-12, CU-06 | ❌ No implementado | Medio (Iter. 2) |

### 5.2 Requerimientos No Funcionales

| RNF | Documentación | Estado | Prioridad |
|-----|--------------|--------|-----------|
| Tiempos de respuesta < 2s | RNF-01 | ⚠️ Sin backend para medir | Alta |
| Disponibilidad 99% | RNF-02 | ⚠️ Sin infraestructura | Alta |
| Soporte 50 usuarios concurrentes | RNF-03 | ⚠️ Sin backend para testear | Media |
| Compatibilidad navegadores | RNF-04 | ✅ React soporta modernos | Baja |
| Usabilidad responsive | RNF-05 | ✅ Tailwind CSS configurado | Baja |

### 5.3 Seguridad y Transaccionalidad

| Aspecto | Requerido | Estado Actual | Gap |
|---------|-----------|---------------|-----|
| Autenticación JWT | ✅ (implícito para roles) | ❌ | Implementar AuthModule |
| Autorización basada en roles | ✅ (Cliente vs Recepcionista) | ❌ | Guards de NestJS |
| Transaccionalidad reservas | ✅ (solicitado por usuario) | ❌ | Prisma transactions |
| Idempotencia en POST | ✅ (solicitado por usuario) | ❌ | Interceptor + Redis/DB |
| Timestamps ISO-8601 | ✅ (solicitado por usuario) | ❌ | Prisma + Zod validators |
| Prevención overbooking | ✅ (crítico) | ❌ | Optimistic lock + exclusion constraint |

---

## 6. Propuesta de Stack Backend

Basándose en la documentación y convenciones solicitadas:

```typescript
// Backend Stack Propuesto
{
  "framework": "NestJS 10.x",
  "orm": "Prisma 5.x",
  "database": "MySQL 8.x", // o PostgreSQL 15+ para btree_gist con tstzrange
  "validation": "class-validator + class-transformer",
  "auth": "Passport JWT",
  "cache": "Redis 7.x", // para idempotency keys
  "testing": {
    "unit": "Jest",
    "e2e": "Supertest + Test Containers"
  },
  "observability": {
    "logging": "Winston + structured JSON",
    "metrics": "Prometheus client (prom-client)",
    "tracing": "OpenTelemetry (opcional)"
  }
}
```

### 6.1 Consideración sobre Base de Datos

**Opción 1: MySQL 8.x** (especificado en doc)
- ✅ Cumple con documentación original
- ❌ No tiene soporte nativo para exclusion constraints con rangos de fechas
- ⚠️ Prevención de overbooking requiere lógica a nivel aplicación + locks

**Opción 2: PostgreSQL 15+** (recomendado para prevención overbooking)
- ✅ Extension `btree_gist` + tipo `tstzrange` para exclusion constraints
- ✅ Garantiza atomicidad de no-solapamiento a nivel DB
- ✅ Mejor soporte para ISO-8601 con `timestamptz`
- ❌ Desviación de spec original

**Recomendación**: Iniciar con MySQL según doc, implementar prevención de overbooking con:
- Optimistic locking (campo `version` en tabla `Reserva`)
- Verificación de solapamientos en transacción con `SELECT ... FOR UPDATE`
- Considerar migración a PostgreSQL si los locks causan contención excesiva

---

## 7. Prioridades de Implementación

### Fase 0: Infraestructura Base (Sprint 0)
1. Scaffold proyecto NestJS en `apps/api/`
2. Configurar Prisma + MySQL
3. Schema inicial: User, Client, Receptionist, Room, RoomType
4. AuthModule + JWT
5. Configurar Idempotency interceptor

### Fase 1: MVP Reservas (Sprint 1-2)
1. ✅ Módulo `reservations` completo
2. ✅ Endpoints CRUD + confirmar
3. ✅ Máquina de estados (Iniciada → Completada → Confirmada → Cancelada)
4. ✅ Verificación disponibilidad básica
5. ✅ Prevención overbooking con locks optimistas
6. ✅ Tests unitarios + e2e

### Fase 2: Validaciones y Notificaciones (Sprint 3)
1. ✅ RF-05: Validación cancelación 24h
2. ✅ RF-06: Envío de emails (NotificationService)
3. ✅ Integración con calendario de disponibilidad
4. ✅ Manejo de zonas horarias (ISO-8601 estricto)

### Fase 3: Iteración 2 - Check-in/Check-out (Sprint 4)
1. ✅ Endpoints check-in/check-out
2. ✅ Módulo `invoices`
3. ✅ Módulo `payments`
4. ✅ Integración de flujo completo

---

## 8. Métricas de Cumplimiento

| Categoría | Requerido | Implementado | % Completado |
|-----------|-----------|--------------|--------------|
| Entidades Core | 10 | 0 | 0% |
| Endpoints Iteración 1 | ~15 | 0 | 0% |
| Endpoints Iteración 2 | ~8 | 0 | 0% |
| RNFs Críticos | 5 | 0 | 0% |
| Seguridad | 4 aspectos | 0 | 0% |

**Estado General**: 🔴 **Sistema en fase de diseño - Backend no iniciado**

---

## 9. Dependencias Externas Identificadas

| Servicio | Propósito | Proveedor Sugerido | Prioridad |
|----------|-----------|-------------------|-----------|
| Email transaccional | Confirmaciones RF-06 | SendGrid / AWS SES | Alta |
| SMS (opcional) | Notificaciones móviles | Twilio | Baja |
| Pasarela de pagos | Procesamiento pagos RF-12 | Stripe / MercadoPago | Media (Iter. 2) |
| Object storage | Almacenar facturas PDF | AWS S3 / MinIO | Baja (Iter. 2) |

---

## 10. Referencias Cruzadas con Documentación

- **Sección 2.3**: Especificación de casos de uso (Iteración 1)
- **Sección 3.3**: Casos de uso Iteración 2
- **Diagrama ER (Pág. 15-16)**: Modelo de entidades
- **Diagramas de Estados (Pág. 18-20)**: Máquinas de estado Reserva/Habitación
- **Diagramas de Secuencia (Pág. 21-30)**: Flujos de interacción
- **Requisitos Funcionales (Pág. 31-35)**: RF-01 a RF-12
- **Requisitos No Funcionales (Pág. 36)**: RNF-01 a RNF-05
- **Prototipos UI (Pág. 40-68)**: Diseño de interfaces

---

**Conclusión**: El proyecto cuenta con un frontend moderno en React pero carece completamente del backend API requerido. Es necesario implementar desde cero la capa de servicios, persistencia, y lógica de negocio especificada en la documentación técnica.
