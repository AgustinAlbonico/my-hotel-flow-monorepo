# Máquina de Estados - Sistema de Reservas

## 1. Introducción

Este documento define las máquinas de estados para las entidades críticas del sistema My Hotel Flow, especificando transiciones válidas, condiciones de guarda, acciones asociadas, y políticas de expiración.

---

## 2. Máquina de Estados: Reserva

### 2.1 Diagrama ASCII

```
                                    [Creación POST /api/reservas]
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │   INICIADA    │ ◄── Estado inicial
                                      └───────┬───────┘
                                              │
                    [Cliente completa datos]  │  [Auto-transición o manual]
                                              │
                                              ▼
                                      ┌───────────────┐
                             ┌────────┤  COMPLETADA   │────────┐
                             │        └───────┬───────┘        │
                             │                │                │
    [Cancelación Cliente]    │                │                │  [Cancelación]
    [< 24h de check-in]      │                │                │  [Violación RF-05]
                             │                │                │
                             │    [Recepcionista confirma]     │
                             │    [Asigna habitación]          │
                             │                │                │
                             │                ▼                │
                             │        ┌───────────────┐        │
                             │        │  CONFIRMADA   │        │
                             │        └───────┬───────┘        │
                             │                │                │
                             │                │                │
                             │    [Check-in realizado]         │
                             │                │                │
                             │                ▼                │
                             │        ┌───────────────┐        │
                             │        │   (OCUPADA)   │◄── Estado implícito
                             │        │  [checkIn!=   │    (habitación)
                             │        │    null]      │        │
                             │        └───────┬───────┘        │
                             │                │                │
                             │    [Check-out realizado]        │
                             │                │                │
                             │                ▼                │
                             │        ┌───────────────┐        │
                             │        │ (FINALIZADA)  │◄── Estado implícito
                             │        │ [checkOut!=   │    (reserva completada)
                             │        │   null]       │        │
                             │        └───────────────┘        │
                             │                                 │
                             │                                 │
                             ▼                                 ▼
                      ┌───────────────┐              ┌───────────────┐
                      │  CANCELADA    │◄─────────────┤  CANCELADA    │
                      └───────────────┘              └───────────────┘
                           (Estado final)                 (Estado final)


Leyenda:
  ┌─────┐  Estado explícito en DB (campo `estado`)
  │     │
  └─────┘

  ┌─────┐  Estado implícito derivado de datos
  │(   )│
  └─────┘

  ───►    Transición válida

  [...]   Evento/Condición de transición
```

### 2.2 Estados Detallados

| Estado | Código | Descripción | Persistido | Terminal |
|--------|--------|-------------|------------|----------|
| **INICIADA** | `INICIADA` | Reserva creada por cliente, datos parciales ingresados | ✅ Sí | ❌ No |
| **COMPLETADA** | `COMPLETADA` | Todos los datos requeridos ingresados, esperando confirmación de recepcionista | ✅ Sí | ❌ No |
| **CONFIRMADA** | `CONFIRMADA` | Verificada por recepcionista, habitación asignada, esperando check-in | ✅ Sí | ❌ No |
| **CANCELADA** | `CANCELADA` | Reserva cancelada (por cliente o sistema) | ✅ Sí | ✅ Sí |
| *(OCUPADA)* | - | Estado derivado: `estado=CONFIRMADA AND checkIn IS NOT NULL` | ❌ Derivado | ❌ No |
| *(FINALIZADA)* | - | Estado derivado: `checkOut IS NOT NULL` | ❌ Derivado | ✅ Sí |

### 2.3 Tabla de Transiciones

| # | Estado Origen | Evento/Comando | Guardas (Precondiciones) | Estado Destino | Acciones | Actor |
|---|---------------|----------------|-------------------------|----------------|----------|-------|
| **T1** | `null` | `POST /api/reservas` | - Cliente autenticado<br>- Fechas válidas (fin > inicio)<br>- Tipo habitación existe<br>- Cantidad personas ≤ capacidad | `INICIADA` | - Crear entidad Reserva<br>- Generar código reserva<br>- Registrar en `historialEstados`<br>- **NO** enviar notificación aún | Cliente |
| **T2** | `INICIADA` | `PATCH /api/reservas/:id` (completar datos) | - Cliente es dueño de reserva<br>- Todos los campos requeridos provistos | `COMPLETADA` | - Actualizar campos<br>- Verificar disponibilidad preliminar<br>- Incrementar `version`<br>- Registrar transición | Cliente |
| **T3** | `COMPLETADA` | `POST /api/reservas/:id/confirmar` | - Usuario es Recepcionista<br>- Habitación disponible en rango<br>- No existe solapamiento | `CONFIRMADA` | - Asignar `habitacionId`<br>- Asignar `confirmadaPorId`<br>- Cambiar estado habitación a `RESERVADA`<br>- **Emitir evento** `ReservaConfirmada`<br>- **Enviar email** confirmación (RF-06)<br>- Programar recordatorio 24h antes<br>- Incrementar `version` | Recepcionista |
| **T4** | `COMPLETADA` | `DELETE /api/reservas/:id` | - Cliente es dueño<br>- Fecha actual < fechaInicio - 24h (RF-05) | `CANCELADA` | - Marcar estado como `CANCELADA`<br>- Liberar habitación (si asignada)<br>- Registrar motivo<br>- Emitir evento `ReservaCancelada` | Cliente |
| **T5** | `CONFIRMADA` | `POST /api/reservas/:id/check-in` | - Usuario es Recepcionista<br>- Fecha actual ≥ fechaInicio<br>- `checkIn IS NULL` | *(OCUPADA)* | - Crear `CheckInRecord`<br>- Almacenar en campo `checkIn` (JSON)<br>- Cambiar estado habitación a `OCUPADA`<br>- Emitir evento `CheckInRealizado`<br>- Incrementar `version` | Recepcionista |
| **T6** | `CONFIRMADA` | `DELETE /api/reservas/:id` | - Cliente es dueño **O** Recepcionista<br>- Fecha actual < fechaInicio - 24h (RF-05)<br>- `checkIn IS NULL` | `CANCELADA` | - Marcar estado como `CANCELADA`<br>- Cambiar habitación a `DISPONIBLE`<br>- Registrar motivo<br>- Emitir evento `ReservaCancelada` | Cliente / Recepcionista |
| **T7** | `CONFIRMADA` (con checkIn) | `POST /api/reservas/:id/check-out` | - Usuario es Recepcionista<br>- `checkIn IS NOT NULL`<br>- `checkOut IS NULL`<br>- Fecha actual ≥ fechaFin (o antes con autorización) | *(FINALIZADA)* | - Crear `CheckOutRecord`<br>- Almacenar en campo `checkOut` (JSON)<br>- Cambiar habitación a `FINALIZADA`<br>- Emitir evento `CheckOutRealizado`<br>- **Generar factura automáticamente** (Iteración 2)<br>- Incrementar `version` | Recepcionista |
| **T8** | `INICIADA` | `DELETE /api/reservas/:id` | - Cliente es dueño | `CANCELADA` | - Marcar como `CANCELADA`<br>- Registrar motivo | Cliente |
| **T9** | `INICIADA` | TTL expira (> 30 min sin actividad) | - Sin transición a `COMPLETADA` en 30 min | `CANCELADA` | - Job automático marca como `CANCELADA`<br>- Motivo: "Expiración por inactividad"<br>- **NO** enviar notificación | Sistema (Cron) |
| **T10** | `COMPLETADA` | TTL expira (> 2 horas sin confirmación) | - Sin transición a `CONFIRMADA` en 2h | `CANCELADA` | - Job automático marca como `CANCELADA`<br>- Motivo: "Expiración por falta de confirmación"<br>- Notificar cliente | Sistema (Cron) |

### 2.4 Invariantes de Estado

| Invariante | Código | Validación |
|------------|--------|------------|
| `estado = CONFIRMADA` ⟹ `habitacionId IS NOT NULL` | **INV-R03** | Guard en transición T3 |
| `estado = CONFIRMADA` ⟹ `confirmadaPorId IS NOT NULL` | **INV-R04** | Guard en transición T3 |
| `checkIn IS NOT NULL` ⟹ `estado = CONFIRMADA` | **INV-R09** | Verificación en servicio |
| `checkOut IS NOT NULL` ⟹ `checkIn IS NOT NULL` | **INV-R10** | Guard en transición T7 |
| `estado = CANCELADA` ⟹ estado final (no más transiciones) | **INV-R11** | State machine validation |

### 2.5 Políticas de Expiración (TTL)

| Estado | TTL | Acción en Expiración | Job Scheduler | Prioridad |
|--------|-----|---------------------|---------------|-----------|
| `INICIADA` | 30 minutos | Transición automática a `CANCELADA` (T9) | Cron cada 5 min: `*/5 * * * *` | Media |
| `COMPLETADA` | 2 horas | Transición automática a `CANCELADA` (T10) + notificar cliente | Cron cada 15 min: `*/15 * * * *` | Alta |
| `CONFIRMADA` | N/A (hasta check-in) | No-show: Si `fechaInicio + 2h` pasó sin check-in, marcar como no-show | Cron cada hora: `0 * * * *` | Baja (Iteración 2) |

**Implementación TTL** (NestJS):
```typescript
// apps/api/src/scheduler/reservations-expiration.task.ts
@Injectable()
export class ReservationsExpirationTask {
  @Cron('*/5 * * * *')  // Cada 5 minutos
  async expireIniciadasReservations() {
    const threshold = subMinutes(new Date(), 30);
    const reservas = await this.prisma.reserva.findMany({
      where: {
        estado: 'INICIADA',
        createdAt: { lt: threshold }
      }
    });

    for (const reserva of reservas) {
      await this.reservationsService.cancelar(
        reserva.id,
        'SYSTEM',
        'Expiración automática por inactividad'
      );
    }
  }

  @Cron('*/15 * * * *')  // Cada 15 minutos
  async expireCompletadasReservations() {
    const threshold = subHours(new Date(), 2);
    const reservas = await this.prisma.reserva.findMany({
      where: {
        estado: 'COMPLETADA',
        updatedAt: { lt: threshold }
      }
    });

    for (const reserva of reservas) {
      await this.reservationsService.cancelar(
        reserva.id,
        'SYSTEM',
        'Expiración automática por falta de confirmación'
      );
      await this.notificationService.sendCancellationEmail(reserva.clienteId);
    }
  }
}
```

---

## 3. Máquina de Estados: Habitación

### 3.1 Diagrama ASCII

```
                              [Habitación creada/liberada]
                                        │
                                        ▼
                                ┌───────────────┐
                    ┌───────────┤  DISPONIBLE   │◄──────────┐
                    │           └───────┬───────┘           │
                    │                   │                   │
                    │                   │                   │
    [Reserva           │       [Reserva confirmada]         │   [Check-out
     cancelada]        │       [Habitación asignada]        │    completado]
                    │                   │                   │
                    │                   ▼                   │
                    │           ┌───────────────┐           │
                    │           │   RESERVADA   │           │
                    │           └───────┬───────┘           │
                    │                   │                   │
                    │       [Check-in realizado]            │
                    │                   │                   │
                    │                   ▼                   │
                    │           ┌───────────────┐           │
                    └───────────┤    OCUPADA    │           │
                    ┌───────────└───────┬───────┘           │
                    │                   │                   │
        [Mantenimiento │      [Check-out realizado]         │
         requerido]    │                │                   │
                    │                   ▼                   │
                    │           ┌───────────────┐           │
                    │           │  FINALIZADA   ├───────────┘
                    │           └───────┬───────┘
                    │                   │
                    │      [Limpieza completada]
                    │                   │
                    │                   └─────────┐
                    │                             │
                    ▼                             ▼
            ┌───────────────┐            ┌───────────────┐
            │ MANTENIMIENTO │            │  DISPONIBLE   │
            └───────┬───────┘            └───────────────┘
                    │
     [Mantenimiento completado]
                    │
                    └─────────────────────────────────────►
```

### 3.2 Estados Detallados

| Estado | Código | Descripción | Puede Reservarse | Terminal |
|--------|--------|-------------|------------------|----------|
| **DISPONIBLE** | `DISPONIBLE` | Habitación lista para nueva reserva | ✅ Sí | ❌ No |
| **RESERVADA** | `RESERVADA` | Tiene reserva confirmada futura | ❌ No | ❌ No |
| **OCUPADA** | `OCUPADA` | Check-in realizado, huésped presente | ❌ No | ❌ No |
| **FINALIZADA** | `FINALIZADA` | Check-out realizado, requiere limpieza | ❌ No | ❌ No |
| **MANTENIMIENTO** | `MANTENIMIENTO` | Temporalmente fuera de servicio | ❌ No | ❌ No |

### 3.3 Tabla de Transiciones

| # | Estado Origen | Evento | Guardas | Estado Destino | Acciones | Trigger |
|---|---------------|--------|---------|----------------|----------|---------|
| **H1** | `DISPONIBLE` | Reserva confirmada | - Habitación `habilitada = true`<br>- No existe solapamiento | `RESERVADA` | - Actualizar `estado`<br>- Registrar en historial<br>- Asociar `reservaId` | Evento `ReservaConfirmada` |
| **H2** | `RESERVADA` | Check-in realizado | - Fecha actual ≥ fechaInicio reserva<br>- Reserva en estado `CONFIRMADA` | `OCUPADA` | - Actualizar `estado`<br>- Registrar timestamp check-in | Evento `CheckInRealizado` |
| **H3** | `OCUPADA` | Check-out realizado | - Reserva tiene `checkIn != null`<br>- Recepcionista autorizado | `FINALIZADA` | - Actualizar `estado`<br>- Registrar timestamp check-out<br>- Notificar limpieza | Evento `CheckOutRealizado` |
| **H4** | `FINALIZADA` | Limpieza completada | - Personal de limpieza confirma | `DISPONIBLE` | - Actualizar `estado`<br>- Limpiar `reservaId` asociado<br>- Registrar en historial | Manual / Sistema |
| **H5** | `RESERVADA` | Reserva cancelada | - Cancelación válida (RF-05) | `DISPONIBLE` | - Actualizar `estado`<br>- Limpiar `reservaId`<br>- Registrar motivo | Evento `ReservaCancelada` |
| **H6** | `DISPONIBLE` / `OCUPADA` / `FINALIZADA` | Requiere mantenimiento | - Recepcionista/Admin autoriza | `MANTENIMIENTO` | - Actualizar `estado`<br>- `habilitada = false`<br>- Registrar motivo | Manual |
| **H7** | `MANTENIMIENTO` | Mantenimiento completado | - Personal mantenimiento confirma | `DISPONIBLE` | - Actualizar `estado`<br>- `habilitada = true`<br>- Registrar finalización | Manual |

### 3.4 Políticas de Sincronización con Reservas

| Evento Reserva | Efecto en Habitación | Transición |
|----------------|---------------------|------------|
| `ReservaConfirmada` | `DISPONIBLE` → `RESERVADA` | H1 |
| `ReservaCancelada` | `RESERVADA` → `DISPONIBLE` | H5 |
| `CheckInRealizado` | `RESERVADA` → `OCUPADA` | H2 |
| `CheckOutRealizado` | `OCUPADA` → `FINALIZADA` | H3 |

**Implementación (Event Handlers)**:
```typescript
// apps/api/src/modules/rooms/handlers/reserva-confirmada.handler.ts
@Injectable()
export class ReservaConfirmadaHandler {
  @OnEvent('reserva.confirmada')
  async handle(event: ReservaConfirmada) {
    await this.roomsService.cambiarEstado(
      event.habitacionId,
      EstadoHabitacion.RESERVADA,
      event.reservaId
    );
  }
}
```

---

## 4. Máquina de Estados: Factura (Iteración 2)

### 4.1 Diagrama ASCII

```
                        [Check-out realizado]
                                │
                                ▼
                        ┌───────────────┐
                        │  PENDIENTE    │◄── Estado inicial
                        └───────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              │                 │                 │
   [Pago parcial]      [Pago total]    [Vencimiento sin pago]
   [monto < total]     [monto = total]          │
              │                 │                 │
              ▼                 ▼                 ▼
     ┌──────────────────┐ ┌─────────────┐ ┌──────────────┐
     │ PARCIALMENTE_    │ │   PAGADA    │ │   VENCIDA    │
     │    PAGADA        │ └─────────────┘ └──────┬───────┘
     └────────┬─────────┘  (Estado final)         │
              │                                    │
   [Pago complementario]            [Pago post-vencimiento]
   [suma pagos = total]                           │
              │                                    │
              ▼                                    ▼
       ┌─────────────┐                      ┌─────────────┐
       │   PAGADA    │                      │   PAGADA    │
       └─────────────┘                      └─────────────┘
        (Estado final)                       (Estado final)


                        [Solicitud anulación]
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
   (Cualquier estado no terminal)                       │
       │                                                 │
       ▼                                                 ▼
  ┌─────────────┐                                 ┌─────────────┐
  │   ANULADA   │◄────────────────────────────────┤   ANULADA   │
  └─────────────┘                                 └─────────────┘
   (Estado final)                                  (Estado final)
```

### 4.2 Estados Detallados

| Estado | Código | Descripción | Terminal |
|--------|--------|-------------|----------|
| **PENDIENTE** | `PENDIENTE` | Factura generada, esperando pago | ❌ No |
| **PARCIALMENTE_PAGADA** | `PARCIALMENTE_PAGADA` | Pagos recibidos < total factura | ❌ No |
| **PAGADA** | `PAGADA` | Monto total recibido | ✅ Sí |
| **VENCIDA** | `VENCIDA` | Fecha vencimiento superada sin pago completo | ❌ No |
| **ANULADA** | `ANULADA` | Factura anulada (error, cancelación post check-out) | ✅ Sí |

### 4.3 Tabla de Transiciones

| # | Estado Origen | Evento | Guardas | Estado Destino | Acciones | Actor |
|---|---------------|--------|---------|----------------|----------|-------|
| **F1** | `null` | Check-out realizado | - Reserva tiene `checkOut != null`<br>- No existe factura previa | `PENDIENTE` | - Crear entidad Factura<br>- Generar número secuencial<br>- Calcular items (noches × precio)<br>- Calcular impuestos<br>- Emitir evento `FacturaGenerada` | Sistema (automático) |
| **F2** | `PENDIENTE` | Pago registrado (parcial) | - Suma de pagos < total<br>- Pago validado | `PARCIALMENTE_PAGADA` | - Asociar pago a factura<br>- Actualizar saldo pendiente<br>- Emitir evento `PagoRecibido` | Recepcionista |
| **F3** | `PENDIENTE` | Pago registrado (total) | - Suma de pagos = total<br>- Pago validado | `PAGADA` | - Asociar pago<br>- Marcar factura como pagada<br>- Generar PDF<br>- Emitir evento `FacturaPagada`<br>- Enviar email cliente | Recepcionista |
| **F4** | `PARCIALMENTE_PAGADA` | Pago complementario | - Suma acumulada = total | `PAGADA` | - Asociar pago<br>- Marcar como pagada<br>- Generar PDF<br>- Emitir evento `FacturaPagada` | Recepcionista |
| **F5** | `PENDIENTE` | TTL vencimiento superado | - `fechaVencimiento < NOW()`<br>- Estado != `PAGADA` | `VENCIDA` | - Actualizar estado<br>- Notificar cliente<br>- Registrar en historial | Sistema (Cron) |
| **F6** | `PARCIALMENTE_PAGADA` | TTL vencimiento superado | - `fechaVencimiento < NOW()` | `VENCIDA` | - Actualizar estado<br>- Notificar cliente + saldo pendiente | Sistema (Cron) |
| **F7** | `VENCIDA` | Pago post-vencimiento | - Suma de pagos = total | `PAGADA` | - Asociar pago<br>- Marcar como pagada<br>- Registrar mora (opcional) | Recepcionista |
| **F8** | `PENDIENTE` / `PARCIALMENTE_PAGADA` | Solicitud anulación | - Admin autoriza<br>- Justificación requerida | `ANULADA` | - Actualizar estado<br>- Registrar motivo<br>- Revertir pagos (si aplica) | Admin |

### 4.4 Políticas de Vencimiento

| Estado | TTL | Acción en Expiración | Job Scheduler |
|--------|-----|---------------------|---------------|
| `PENDIENTE` | `fechaVencimiento` (7 días típicamente) | Transición a `VENCIDA` + notificación | Cron diario: `0 9 * * *` |
| `PARCIALMENTE_PAGADA` | `fechaVencimiento` | Transición a `VENCIDA` + notificación de saldo | Cron diario: `0 9 * * *` |

---

## 5. Máquina de Estados: Pago (Iteración 2)

### 5.1 Estados Simplificados

Los pagos tienen una máquina de estados simple:

```
    [Registro POST /api/pagos]
              │
              ▼
       ┌─────────────┐
       │  PENDIENTE  │◄── Estado inicial (si requiere verificación)
       └──────┬──────┘
              │
              │  [Verificación exitosa]
              │  [Banco/gateway aprueba]
              │
              ▼
       ┌─────────────┐
       │  APROBADO   │
       └─────────────┘
        (Estado final)


              │
              │  [Rechazo banco]
              │  [Fondos insuficientes]
              │
              ▼
       ┌─────────────┐
       │  RECHAZADO  │
       └─────────────┘
        (Estado final)
```

### 5.2 Tabla de Transiciones

| # | Estado Origen | Evento | Guardas | Estado Destino | Acciones |
|---|---------------|--------|---------|----------------|----------|
| **P1** | `null` | Registro pago efectivo | - Recepcionista autorizado<br>- Factura existe | `APROBADO` | - Crear entidad Pago<br>- Asociar a factura<br>- Actualizar saldo factura |
| **P2** | `null` | Registro pago tarjeta | - Recepcionista autorizado<br>- Datos tarjeta válidos | `PENDIENTE` | - Crear entidad Pago<br>- Iniciar verificación con gateway |
| **P3** | `PENDIENTE` | Respuesta gateway (aprobado) | - Token transacción válido | `APROBADO` | - Actualizar estado<br>- Guardar referencia<br>- Actualizar saldo factura |
| **P4** | `PENDIENTE` | Respuesta gateway (rechazo) | - Error de gateway (fondos, etc.) | `RECHAZADO` | - Actualizar estado<br>- Registrar error<br>- Notificar recepcionista |

---

## 6. Implementación Técnica

### 6.1 Enum de Estados (TypeScript)

```typescript
// apps/api/src/modules/reservations/enums/estado-reserva.enum.ts
export enum EstadoReserva {
  INICIADA = 'INICIADA',
  COMPLETADA = 'COMPLETADA',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoHabitacion {
  DISPONIBLE = 'DISPONIBLE',
  RESERVADA = 'RESERVADA',
  OCUPADA = 'OCUPADA',
  FINALIZADA = 'FINALIZADA',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

export enum EstadoFactura {
  PENDIENTE = 'PENDIENTE',
  PARCIALMENTE_PAGADA = 'PARCIALMENTE_PAGADA',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  ANULADA = 'ANULADA',
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}
```

### 6.2 State Machine Service (NestJS)

```typescript
// apps/api/src/modules/reservations/services/reserva-state-machine.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';

type Transition = {
  from: EstadoReserva[];
  to: EstadoReserva;
  guards: ((reserva: Reserva) => boolean)[];
};

@Injectable()
export class ReservaStateMachineService {
  private readonly transitions: Map<string, Transition> = new Map([
    ['completar', {
      from: [EstadoReserva.INICIADA],
      to: EstadoReserva.COMPLETADA,
      guards: [
        (r) => r.cantidadPersonas > 0,
        (r) => r.tipoHabitacionSolicitado !== null,
      ]
    }],
    ['confirmar', {
      from: [EstadoReserva.COMPLETADA],
      to: EstadoReserva.CONFIRMADA,
      guards: [
        (r) => r.habitacionId !== null,
        (r) => r.confirmadaPorId !== null,
      ]
    }],
    ['cancelar', {
      from: [EstadoReserva.INICIADA, EstadoReserva.COMPLETADA, EstadoReserva.CONFIRMADA],
      to: EstadoReserva.CANCELADA,
      guards: [
        // RF-05: Verificar 24h para CONFIRMADA
        (r) => {
          if (r.estado === EstadoReserva.CONFIRMADA) {
            const horasHastaCheckIn = differenceInHours(r.fechaInicio, new Date());
            return horasHastaCheckIn >= 24;
          }
          return true;
        }
      ]
    }],
  ]);

  canTransition(reserva: Reserva, action: string): boolean {
    const transition = this.transitions.get(action);
    if (!transition) return false;

    const isValidOrigin = transition.from.includes(reserva.estado);
    const passesGuards = transition.guards.every(guard => guard(reserva));

    return isValidOrigin && passesGuards;
  }

  transition(reserva: Reserva, action: string): EstadoReserva {
    if (!this.canTransition(reserva, action)) {
      throw new BadRequestException(
        `Transición inválida: no se puede ${action} desde estado ${reserva.estado}`
      );
    }

    const transition = this.transitions.get(action);
    return transition.to;
  }

  getValidActions(reserva: Reserva): string[] {
    return Array.from(this.transitions.keys())
      .filter(action => this.canTransition(reserva, action));
  }
}
```

### 6.3 Uso en Service Layer

```typescript
// apps/api/src/modules/reservations/reservations.service.ts
@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: ReservaStateMachineService,
    private eventEmitter: EventEmitter2,
  ) {}

  async confirmar(id: string, recepcionistaId: string, habitacionId: string) {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });

    // Validar transición
    if (!this.stateMachine.canTransition(reserva, 'confirmar')) {
      throw new BadRequestException('No se puede confirmar esta reserva');
    }

    // Verificar overbooking (ver doc 06-prevencion-overbooking.md)
    await this.verifyAvailability(habitacionId, reserva.fechaInicio, reserva.fechaFin);

    // Transacción atómica
    const updated = await this.prisma.$transaction(async (tx) => {
      // Incrementar version (optimistic lock)
      const result = await tx.reserva.updateMany({
        where: {
          id: reserva.id,
          version: reserva.version, // WHERE version = expected
        },
        data: {
          estado: EstadoReserva.CONFIRMADA,
          habitacionId,
          confirmadaPorId: recepcionistaId,
          fechaConfirmacion: new Date(),
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw new ConflictException('Conflicto de concurrencia, reintentar');
      }

      // Registrar transición en historial
      await tx.transicionEstado.create({
        data: {
          reservaId: reserva.id,
          estadoAnterior: reserva.estado,
          estadoNuevo: EstadoReserva.CONFIRMADA,
          realizadoPor: recepcionistaId,
        },
      });

      // Actualizar estado habitación
      await tx.habitacion.update({
        where: { id: habitacionId },
        data: { estado: EstadoHabitacion.RESERVADA },
      });

      return tx.reserva.findUnique({ where: { id } });
    });

    // Emitir evento (fuera de transacción para performance)
    this.eventEmitter.emit('reserva.confirmada', {
      eventType: 'ReservaConfirmada',
      reservaId: updated.id,
      habitacionId,
      confirmadaPor: recepcionistaId,
      timestamp: new Date(),
    });

    return updated;
  }
}
```

---

## 7. Diagrama de Secuencia: Transición de Estado

```
Cliente          API Gateway      ReservationsService    StateMachine    Database       EventBus
  │                   │                    │                   │             │              │
  │ PATCH /reservas/  │                    │                   │             │              │
  │ :id (completar)   │                    │                   │             │              │
  ├──────────────────>│                    │                   │             │              │
  │                   │ completar(id, dto) │                   │             │              │
  │                   ├───────────────────>│                   │             │              │
  │                   │                    │ findUnique(id)    │             │              │
  │                   │                    ├──────────────────────────────>│              │
  │                   │                    │<──────────────────────────────┤              │
  │                   │                    │   reserva actual              │              │
  │                   │                    │                   │             │              │
  │                   │                    │ canTransition(    │             │              │
  │                   │                    │   reserva,        │             │              │
  │                   │                    │   'completar'     │             │              │
  │                   │                    ├──────────────────>│             │              │
  │                   │                    │                   │ [Verificar] │              │
  │                   │                    │                   │ - from OK?  │              │
  │                   │                    │                   │ - guards OK?│              │
  │                   │                    │<──────────────────┤             │              │
  │                   │                    │     true          │             │              │
  │                   │                    │                   │             │              │
  │                   │                    │ updateMany(       │             │              │
  │                   │                    │   WHERE version=N)│             │              │
  │                   │                    ├──────────────────────────────>│              │
  │                   │                    │<──────────────────────────────┤              │
  │                   │                    │   count=1 (success)           │              │
  │                   │                    │                   │             │              │
  │                   │                    │ create(transicion)│             │              │
  │                   │                    ├──────────────────────────────>│              │
  │                   │                    │                   │             │              │
  │                   │                    │ emit('reserva.completada')     │              │
  │                   │                    ├─────────────────────────────────────────────>│
  │                   │<───────────────────┤                   │             │              │
  │<──────────────────┤  200 OK            │                   │             │              │
  │  { reserva }      │  { reserva }       │                   │             │              │
```

---

## 8. Validaciones y Códigos de Error

| Error Code | Situación | Estado HTTP | Mensaje |
|------------|-----------|-------------|---------|
| `RES-001` | Transición inválida de estado | 400 Bad Request | "No se puede {acción} una reserva en estado {estadoActual}" |
| `RES-002` | Violación de guarda (RF-05: cancelación) | 400 Bad Request | "No se puede cancelar una reserva con menos de 24h de anticipación" |
| `RES-003` | Conflicto de versión (optimistic lock) | 409 Conflict | "La reserva fue modificada por otro usuario, refrescar y reintentar" |
| `RES-004` | Habitación no disponible en transición | 409 Conflict | "La habitación ya no está disponible para las fechas solicitadas" |
| `RES-005` | Check-in sin reserva CONFIRMADA | 400 Bad Request | "Solo se puede hacer check-in de reservas confirmadas" |
| `RES-006` | Check-out sin check-in previo | 400 Bad Request | "No se puede hacer check-out sin haber realizado check-in" |
| `RES-007` | Doble check-in | 409 Conflict | "La reserva ya tiene un check-in registrado" |

---

## 9. Métricas de Observabilidad

| Métrica | Tipo | Descripción | Labels |
|---------|------|-------------|--------|
| `reservations_by_state` | Gauge | Cantidad de reservas por estado actual | `estado` |
| `state_transition_total` | Counter | Total de transiciones de estado | `from`, `to`, `action` |
| `state_transition_duration_ms` | Histogram | Duración de transiciones de estado | `action` |
| `expiration_job_processed` | Counter | Reservas procesadas por job de expiración | `estado`, `resultado` |
| `state_transition_errors` | Counter | Errores en transiciones | `action`, `error_code` |

**Implementación Prometheus**:
```typescript
// apps/api/src/modules/reservations/reservations.metrics.ts
@Injectable()
export class ReservationsMetrics {
  private stateTransitionCounter = new promClient.Counter({
    name: 'reservations_state_transition_total',
    help: 'Total state transitions',
    labelNames: ['from', 'to', 'action'],
  });

  private transitionDuration = new promClient.Histogram({
    name: 'reservations_state_transition_duration_ms',
    help: 'Duration of state transitions',
    labelNames: ['action'],
    buckets: [10, 50, 100, 500, 1000, 5000],
  });

  recordTransition(from: EstadoReserva, to: EstadoReserva, action: string) {
    this.stateTransitionCounter.inc({ from, to, action });
  }

  recordDuration(action: string, durationMs: number) {
    this.transitionDuration.observe({ action }, durationMs);
  }
}
```

---

## 10. Logs Estructurados

```typescript
// Ejemplo de log estructurado para transición
this.logger.log({
  message: 'State transition executed',
  context: 'ReservationsService',
  action: 'confirmar',
  reservaId: reserva.id,
  estadoAnterior: reserva.estado,
  estadoNuevo: EstadoReserva.CONFIRMADA,
  realizadoPor: recepcionistaId,
  version: reserva.version,
  timestamp: new Date().toISOString(),
  traceId: request.headers['x-trace-id'],
});
```

---

## 11. Testing de Máquina de Estados

### 11.1 Unit Tests

```typescript
// apps/api/src/modules/reservations/__tests__/reserva-state-machine.service.spec.ts
describe('ReservaStateMachineService', () => {
  let service: ReservaStateMachineService;

  beforeEach(() => {
    service = new ReservaStateMachineService();
  });

  describe('canTransition', () => {
    it('debe permitir completar desde INICIADA', () => {
      const reserva = createMockReserva({ estado: EstadoReserva.INICIADA });
      expect(service.canTransition(reserva, 'completar')).toBe(true);
    });

    it('debe rechazar completar desde CONFIRMADA', () => {
      const reserva = createMockReserva({ estado: EstadoReserva.CONFIRMADA });
      expect(service.canTransition(reserva, 'completar')).toBe(false);
    });

    it('debe rechazar cancelar CONFIRMADA con < 24h de anticipación', () => {
      const tomorrow = addDays(new Date(), 1);
      const reserva = createMockReserva({
        estado: EstadoReserva.CONFIRMADA,
        fechaInicio: addHours(tomorrow, 12), // < 24h
      });
      expect(service.canTransition(reserva, 'cancelar')).toBe(false);
    });

    it('debe permitir cancelar CONFIRMADA con >= 24h de anticipación', () => {
      const reserva = createMockReserva({
        estado: EstadoReserva.CONFIRMADA,
        fechaInicio: addDays(new Date(), 2), // >= 24h
      });
      expect(service.canTransition(reserva, 'cancelar')).toBe(true);
    });
  });
});
```

### 11.2 Integration Tests

```typescript
// apps/api/src/modules/reservations/__tests__/reservations.service.integration.spec.ts
describe('ReservationsService - State Transitions (Integration)', () => {
  it('flujo completo: INICIADA → COMPLETADA → CONFIRMADA → OCUPADA → FINALIZADA', async () => {
    // Crear reserva (INICIADA)
    const reserva = await service.crear(createReservaDto);
    expect(reserva.estado).toBe(EstadoReserva.INICIADA);

    // Completar (INICIADA → COMPLETADA)
    const completada = await service.completar(reserva.id, completeDto);
    expect(completada.estado).toBe(EstadoReserva.COMPLETADA);

    // Confirmar (COMPLETADA → CONFIRMADA)
    const confirmada = await service.confirmar(
      reserva.id,
      recepcionistaId,
      habitacionId
    );
    expect(confirmada.estado).toBe(EstadoReserva.CONFIRMADA);
    expect(confirmada.habitacionId).toBe(habitacionId);

    // Check-in (CONFIRMADA → OCUPADA)
    const ocupada = await service.checkIn(reserva.id, recepcionistaId);
    expect(ocupada.checkIn).not.toBeNull();

    // Check-out (OCUPADA → FINALIZADA)
    const finalizada = await service.checkOut(reserva.id, recepcionistaId, checkOutDto);
    expect(finalizada.checkOut).not.toBeNull();

    // Verificar historial de transiciones
    const historial = await prisma.transicionEstado.findMany({
      where: { reservaId: reserva.id },
      orderBy: { timestamp: 'asc' },
    });
    expect(historial).toHaveLength(4);
    expect(historial[0].estadoNuevo).toBe(EstadoReserva.COMPLETADA);
    expect(historial[3].estadoNuevo).toBe(EstadoReserva.CONFIRMADA);
  });
});
```

---

## 12. Referencias

- **Documentación PDF**: Diagramas de estados (págs. 18-20)
- **RF-05**: Política de cancelación 24h
- **RF-06**: Confirmación automática email
- **CU-01 a CU-06**: Casos de uso con flujos de estado
- **Documento 04-reglas-negocio.md**: Reglas de negocio relacionadas con transiciones
- **Documento 06-prevencion-overbooking.md**: Prevención de conflictos en transición a CONFIRMADA
