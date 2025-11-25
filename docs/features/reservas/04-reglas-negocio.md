# Reglas de Negocio - Sistema de Reservas

## 1. Introducción

Este documento especifica las reglas de negocio del sistema My Hotel Flow utilizando el formato estructurado solicitado:

**Formato**: `R-###: Enunciado | Motivación | Fuente | Invariante | Validación | ErrorCode`

---

## 2. Categorías de Reglas

- **R-0xx**: Reglas de Reserva (Creación y Modificación)
- **R-1xx**: Reglas de Disponibilidad y Overbooking
- **R-2xx**: Reglas de Cancelación
- **R-3xx**: Reglas de Check-in y Check-out
- **R-4xx**: Reglas de Facturación y Pagos
- **R-5xx**: Reglas de Notificaciones
- **R-6xx**: Reglas de Seguridad y Autorización

---

## 3. Reglas de Reserva (R-0xx)

### R-001: Rango de Fechas Válido
**Enunciado**: La fecha de fin de una reserva debe ser posterior a la fecha de inicio.

**Motivación**: Prevenir reservas inconsistentes que no representan un período de estancia válido.

**Fuente**: Requisito implícito del dominio hotelero + RF-01 (Crear reserva)

**Invariante**: `fechaFin > fechaInicio`

**Validación**:
- **Nivel DTO** (class-validator):
  ```typescript
  @IsDateAfter('fechaInicio')
  fechaFin: Date;
  ```
- **Nivel Database** (CHECK constraint):
  ```sql
  ALTER TABLE Reserva
    ADD CONSTRAINT chk_fechas_validas
    CHECK (fecha_fin > fecha_inicio);
  ```

**ErrorCode**: `RES-001`

---

### R-002: Fecha de Inicio Futura
**Enunciado**: La fecha de inicio de una reserva debe ser al menos 1 hora posterior a la fecha de creación.

**Motivación**: Evitar reservas inmediatas que no dan tiempo para preparación y confirmación.

**Fuente**: Requisito de negocio implícito + RNF-01 (tiempos de procesamiento)

**Invariante**: `fechaInicio >= NOW() + 1 hora`

**Validación**:
```typescript
// CreateReservaDto validator
@IsDate()
@IsAfter(new Date(), { hours: 1 })
@Transform(({ value }) => new Date(value))
fechaInicio: Date;
```

**Validación Service Layer**:
```typescript
const minStartDate = addHours(new Date(), 1);
if (isBefore(dto.fechaInicio, minStartDate)) {
  throw new BadRequestException({
    code: 'RES-002',
    message: 'La fecha de inicio debe ser al menos 1 hora en el futuro',
  });
}
```

**ErrorCode**: `RES-002`

---

### R-003: Duración Mínima de Reserva
**Enunciado**: Una reserva debe tener una duración mínima de 1 noche (diferencia de al menos 1 día entre fechaInicio y fechaFin).

**Motivación**: El modelo de negocio hotelero se basa en noches de estancia, no horas.

**Fuente**: Convención hotelera estándar + RF-01

**Invariante**: `differenceInDays(fechaFin, fechaInicio) >= 1`

**Validación**:
```typescript
const noches = differenceInDays(dto.fechaFin, dto.fechaInicio);
if (noches < 1) {
  throw new BadRequestException({
    code: 'RES-003',
    message: 'La reserva debe ser de al menos 1 noche',
  });
}
```

**ErrorCode**: `RES-003`

---

### R-004: Duración Máxima de Reserva
**Enunciado**: Una reserva no puede exceder 30 noches consecutivas.

**Motivación**: Reservas muy largas requieren procesos especiales y validación manual.

**Fuente**: Política de negocio del hotel

**Invariante**: `differenceInDays(fechaFin, fechaInicio) <= 30`

**Validación**:
```typescript
const noches = differenceInDays(dto.fechaFin, dto.fechaInicio);
if (noches > 30) {
  throw new BadRequestException({
    code: 'RES-004',
    message: 'Las reservas no pueden exceder 30 noches. Contacte recepción para estancias más largas.',
  });
}
```

**ErrorCode**: `RES-004`

---

### R-005: Capacidad de Personas Válida
**Enunciado**: La cantidad de personas en una reserva no puede exceder la capacidad máxima del tipo de habitación solicitado.

**Motivación**: Cumplir normativas de seguridad y confort de huéspedes.

**Fuente**: RF-01 + RNF-05 (normativas de seguridad)

**Invariante**: `cantidadPersonas <= tipoHabitacion.capacidadMaxima AND cantidadPersonas >= 1`

**Validación**:
```typescript
const tipoHabitacion = await this.prisma.tipoHabitacion.findUnique({
  where: { id: dto.tipoHabitacionSolicitado }
});

if (dto.cantidadPersonas > tipoHabitacion.capacidadMaxima) {
  throw new BadRequestException({
    code: 'RES-005',
    message: `El tipo de habitación seleccionado admite máximo ${tipoHabitacion.capacidadMaxima} personas`,
    details: {
      capacidadMaxima: tipoHabitacion.capacidadMaxima,
      cantidadSolicitada: dto.cantidadPersonas,
    },
  });
}

if (dto.cantidadPersonas < 1) {
  throw new BadRequestException({
    code: 'RES-005',
    message: 'La cantidad de personas debe ser al menos 1',
  });
}
```

**ErrorCode**: `RES-005`

---

### R-006: Tipo de Habitación Activo
**Enunciado**: Solo se pueden crear reservas para tipos de habitación marcados como activos.

**Motivación**: Evitar reservas de tipos de habitación descontinuados o en mantenimiento.

**Fuente**: RF-01 + Gestión de catálogo

**Invariante**: `tipoHabitacion.activo = true`

**Validación**:
```typescript
const tipoHabitacion = await this.prisma.tipoHabitacion.findUnique({
  where: { id: dto.tipoHabitacionSolicitado }
});

if (!tipoHabitacion) {
  throw new NotFoundException({
    code: 'RES-006',
    message: 'Tipo de habitación no encontrado',
  });
}

if (!tipoHabitacion.activo) {
  throw new BadRequestException({
    code: 'RES-006',
    message: 'El tipo de habitación seleccionado no está disponible para reservas',
  });
}
```

**ErrorCode**: `RES-006`

---

### R-007: Modificación Solo en Estados Permitidos
**Enunciado**: Una reserva solo puede ser modificada si está en estado `COMPLETADA` o `CONFIRMADA`.

**Motivación**: Evitar modificaciones de reservas canceladas o finalizadas.

**Fuente**: RF-02 (Modificar reserva) + Diagrama de estados (pág. 18)

**Invariante**: `estado IN ('COMPLETADA', 'CONFIRMADA') WHEN acción = 'modificar'`

**Validación**:
```typescript
const reserva = await this.prisma.reserva.findUnique({ where: { id } });

const estadosModificables = [EstadoReserva.COMPLETADA, EstadoReserva.CONFIRMADA];
if (!estadosModificables.includes(reserva.estado)) {
  throw new BadRequestException({
    code: 'RES-007',
    message: `No se puede modificar una reserva en estado ${reserva.estado}`,
    details: {
      estadoActual: reserva.estado,
      estadosPermitidos: estadosModificables,
    },
  });
}
```

**ErrorCode**: `RES-007`

---

### R-008: Código de Reserva Único y Secuencial
**Enunciado**: Cada reserva debe tener un código único con formato `MHF-{AÑO}-{SECUENCIAL}` (ej: `MHF-2025-001234`).

**Motivación**: Identificación clara de reservas para comunicación con clientes.

**Fuente**: Requisito de trazabilidad

**Invariante**: `codigoReserva UNIQUE AND formato válido`

**Validación**:
```typescript
// Service layer - generación automática
async generateCodigoReserva(): Promise<string> {
  const year = new Date().getFullYear();
  const lastReserva = await this.prisma.reserva.findFirst({
    where: {
      codigoReserva: {
        startsWith: `MHF-${year}-`
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  let secuencial = 1;
  if (lastReserva) {
    const parts = lastReserva.codigoReserva.split('-');
    secuencial = parseInt(parts[2]) + 1;
  }

  return `MHF-${year}-${secuencial.toString().padStart(6, '0')}`;
}
```

**Constraint DB**:
```sql
ALTER TABLE Reserva
  ADD CONSTRAINT uk_codigo_reserva UNIQUE (codigo_reserva);
```

**ErrorCode**: `RES-008`

---

## 4. Reglas de Disponibilidad y Overbooking (R-1xx)

### R-100: Verificación de Disponibilidad Obligatoria
**Enunciado**: Antes de confirmar una reserva, se debe verificar que exista al menos una habitación disponible del tipo solicitado en el rango de fechas.

**Motivación**: Prevenir confirmación de reservas sin recursos disponibles.

**Fuente**: RF-04 (Verificar disponibilidad) + RNF-02

**Invariante**: `EXISTS(habitacion disponible) WHEN transición a CONFIRMADA`

**Validación**:
```typescript
async verifyAvailability(
  tipoHabitacionId: string,
  fechaInicio: Date,
  fechaFin: Date,
  excludeReservaId?: string
): Promise<Habitacion[]> {
  const habitacionesDisponibles = await this.prisma.habitacion.findMany({
    where: {
      tipoId: tipoHabitacionId,
      habilitada: true,
      estado: EstadoHabitacion.DISPONIBLE,
      // Excluir habitaciones con reservas confirmadas solapadas
      NOT: {
        reservas: {
          some: {
            id: excludeReservaId ? { not: excludeReservaId } : undefined,
            estado: { in: [EstadoReserva.CONFIRMADA, EstadoReserva.COMPLETADA] },
            OR: [
              { fechaInicio: { lt: fechaFin }, fechaFin: { gt: fechaInicio } },
            ]
          }
        }
      }
    }
  });

  if (habitacionesDisponibles.length === 0) {
    throw new ConflictException({
      code: 'RES-100',
      message: 'No hay habitaciones disponibles para las fechas y tipo seleccionados',
    });
  }

  return habitacionesDisponibles;
}
```

**ErrorCode**: `RES-100`

---

### R-101: Prevención de Overbooking (Exclusión de Solapamiento)
**Enunciado**: No pueden existir dos reservas confirmadas para la misma habitación con rangos de fechas solapados.

**Motivación**: Garantizar integridad de reservas y evitar asignación doble de recursos.

**Fuente**: RF-04 + Requisito crítico de negocio

**Invariante**: `∀ reserva1, reserva2 WHERE reserva1.habitacionId = reserva2.habitacionId AND ambas CONFIRMADAS ⟹ rangos NO solapan`

**Validación**:
- **Optimistic Locking** (campo `version`):
  ```typescript
  // Ver documento 06-prevencion-overbooking.md
  const result = await this.prisma.reserva.updateMany({
    where: { id, version: expectedVersion },
    data: { version: { increment: 1 }, ...updates }
  });

  if (result.count === 0) {
    throw new ConflictException({
      code: 'RES-101',
      message: 'Conflicto de concurrencia detectado, refrescar y reintentar',
    });
  }
  ```

- **Database Constraint** (PostgreSQL):
  ```sql
  CREATE EXTENSION IF NOT EXISTS btree_gist;

  ALTER TABLE Reserva
    ADD CONSTRAINT no_overlapping_confirmed_reservations
    EXCLUDE USING GIST (
      habitacion_id WITH =,
      tstzrange(fecha_inicio, fecha_fin, '[)') WITH &&
    )
    WHERE (estado IN ('CONFIRMADA', 'COMPLETADA'));
  ```

**ErrorCode**: `RES-101`

---

### R-102: Límite de Reservas Pendientes por Cliente
**Enunciado**: Un cliente no puede tener más de 3 reservas simultáneas en estado `INICIADA` o `COMPLETADA` (sin confirmar).

**Motivación**: Prevenir abuso del sistema y liberar inventario bloqueado innecesariamente.

**Fuente**: Política anti-abuso

**Invariante**: `COUNT(reservas WHERE clienteId = X AND estado IN ('INICIADA', 'COMPLETADA')) <= 3`

**Validación**:
```typescript
const reservasPendientes = await this.prisma.reserva.count({
  where: {
    clienteId: dto.clienteId,
    estado: { in: [EstadoReserva.INICIADA, EstadoReserva.COMPLETADA] }
  }
});

if (reservasPendientes >= 3) {
  throw new BadRequestException({
    code: 'RES-102',
    message: 'Alcanzó el límite de 3 reservas pendientes. Por favor, complete o cancele alguna antes de crear una nueva.',
  });
}
```

**ErrorCode**: `RES-102`

---

### R-103: Habitación Habilitada para Asignación
**Enunciado**: Solo se pueden asignar habitaciones marcadas como `habilitada = true` al confirmar reservas.

**Motivación**: Evitar asignación de habitaciones en mantenimiento o deshabilitadas.

**Fuente**: Gestión de estado de habitaciones

**Invariante**: `habitacion.habilitada = true WHEN asignación en confirmación`

**Validación**:
```typescript
const habitacion = await this.prisma.habitacion.findUnique({
  where: { id: habitacionId }
});

if (!habitacion.habilitada) {
  throw new BadRequestException({
    code: 'RES-103',
    message: 'La habitación seleccionada no está habilitada para reservas',
    details: {
      habitacionNumero: habitacion.numero,
      motivo: habitacion.observaciones,
    },
  });
}
```

**ErrorCode**: `RES-103`

---

## 5. Reglas de Cancelación (R-2xx)

### R-200: Política de Cancelación 24 Horas (RF-05)
**Enunciado**: Una reserva confirmada solo puede ser cancelada si faltan al menos 24 horas para la fecha de inicio (check-in).

**Motivación**: Proteger ingresos del hotel y permitir reasignación de habitaciones.

**Fuente**: RF-05 (Validar plazo de cancelación) + Diagrama de estados (pág. 18)

**Invariante**: `(estado = CONFIRMADA AND acción = cancelar) ⟹ (fechaInicio - NOW() >= 24 horas)`

**Validación**:
```typescript
async cancelar(id: string, usuarioId: string, motivo?: string) {
  const reserva = await this.prisma.reserva.findUnique({ where: { id } });

  if (reserva.estado === EstadoReserva.CONFIRMADA) {
    const horasHastaCheckIn = differenceInHours(reserva.fechaInicio, new Date());

    if (horasHastaCheckIn < 24) {
      throw new BadRequestException({
        code: 'RES-200',
        message: 'No se puede cancelar una reserva confirmada con menos de 24 horas de anticipación',
        details: {
          horasRestantes: horasHastaCheckIn,
          minimoRequerido: 24,
          fechaLimite: subHours(reserva.fechaInicio, 24).toISOString(),
        },
      });
    }
  }

  // Proceder con cancelación...
}
```

**Excepción**: Admin o Recepcionista puede forzar cancelación con motivo justificado (registrado en historial).

**ErrorCode**: `RES-200`

---

### R-201: Cancelación Sin Penalización (Estados Previos)
**Enunciado**: Las reservas en estado `INICIADA` o `COMPLETADA` pueden cancelarse en cualquier momento sin restricciones.

**Motivación**: No hay asignación de recursos aún, por lo que no hay costo de oportunidad.

**Fuente**: Lógica de negocio + Diagrama de estados

**Invariante**: `estado IN ('INICIADA', 'COMPLETADA') ⟹ cancelación siempre permitida`

**Validación**:
```typescript
const estadosSinRestriccion = [EstadoReserva.INICIADA, EstadoReserva.COMPLETADA];
if (estadosSinRestriccion.includes(reserva.estado)) {
  // Cancelación sin validar plazo
  await this.transitionToState(reserva, EstadoReserva.CANCELADA, motivo);
  return;
}
```

**ErrorCode**: N/A (no hay error en este caso)

---

### R-202: Cancelación Irreversible
**Enunciado**: Una vez que una reserva alcanza el estado `CANCELADA`, no puede volver a ningún otro estado.

**Motivación**: Garantizar integridad de auditoría y evitar manipulación de registros históricos.

**Fuente**: Máquina de estados (estado terminal)

**Invariante**: `estado = CANCELADA ⟹ NO más transiciones`

**Validación**:
```typescript
if (reserva.estado === EstadoReserva.CANCELADA) {
  throw new BadRequestException({
    code: 'RES-202',
    message: 'No se pueden realizar operaciones sobre una reserva cancelada',
  });
}
```

**ErrorCode**: `RES-202`

---

### R-203: Liberación de Habitación al Cancelar
**Enunciado**: Al cancelar una reserva confirmada, la habitación asignada debe volver al estado `DISPONIBLE`.

**Motivación**: Liberar recursos para nuevas reservas inmediatamente.

**Fuente**: RF-03 (Cancelar reserva) + Máquina de estados Habitación

**Invariante**: `reserva.estado → CANCELADA ⟹ habitacion.estado → DISPONIBLE`

**Validación** (side effect):
```typescript
// Dentro de transacción de cancelación
if (reserva.habitacionId) {
  await tx.habitacion.update({
    where: { id: reserva.habitacionId },
    data: {
      estado: EstadoHabitacion.DISPONIBLE,
    }
  });

  await tx.transicionEstadoHabitacion.create({
    data: {
      habitacionId: reserva.habitacionId,
      estadoAnterior: EstadoHabitacion.RESERVADA,
      estadoNuevo: EstadoHabitacion.DISPONIBLE,
      realizadoPor: usuarioId,
      motivo: `Reserva ${reserva.codigoReserva} cancelada`,
    }
  });
}
```

**ErrorCode**: N/A (side effect, no validación)

---

## 6. Reglas de Check-in y Check-out (R-3xx)

### R-300: Check-in Solo para Reservas Confirmadas
**Enunciado**: Solo se puede realizar check-in de reservas en estado `CONFIRMADA`.

**Motivación**: Asegurar que la reserva fue verificada y tiene habitación asignada.

**Fuente**: CU-04 (Realizar Check-in) + Diagrama de estados

**Invariante**: `acción = check-in ⟹ estado = CONFIRMADA`

**Validación**:
```typescript
async checkIn(id: string, recepcionistaId: string, dto: CheckInDto) {
  const reserva = await this.prisma.reserva.findUnique({ where: { id } });

  if (reserva.estado !== EstadoReserva.CONFIRMADA) {
    throw new BadRequestException({
      code: 'RES-300',
      message: `Solo se puede hacer check-in de reservas confirmadas (estado actual: ${reserva.estado})`,
    });
  }

  if (reserva.checkIn !== null) {
    throw new ConflictException({
      code: 'RES-301',
      message: 'La reserva ya tiene un check-in registrado',
    });
  }

  // Proceder con check-in...
}
```

**ErrorCode**: `RES-300`

---

### R-301: Check-in Único
**Enunciado**: Una reserva no puede tener más de un check-in registrado.

**Motivación**: Prevenir registros duplicados y mantener integridad de auditoría.

**Fuente**: CU-04 + Lógica de negocio

**Invariante**: `checkIn != null ⟹ NO permitir nuevo check-in`

**Validación**: Ver código en R-300 (validación conjunta)

**ErrorCode**: `RES-301`

---

### R-302: Check-in en Fecha Válida
**Enunciado**: El check-in solo puede realizarse a partir de la fecha de inicio de la reserva (con margen de 4 horas antes).

**Motivación**: Permitir cierta flexibilidad para llegadas anticipadas sin comprometer ocupación previa.

**Fuente**: CU-04 + Política de early check-in

**Invariante**: `NOW() >= fechaInicio - 4 horas`

**Validación**:
```typescript
const earliestCheckIn = subHours(reserva.fechaInicio, 4);
if (isBefore(new Date(), earliestCheckIn)) {
  throw new BadRequestException({
    code: 'RES-302',
    message: 'El check-in solo puede realizarse a partir de 4 horas antes de la fecha de inicio',
    details: {
      fechaInicioReserva: reserva.fechaInicio.toISOString(),
      checkInDesde: earliestCheckIn.toISOString(),
    },
  });
}
```

**ErrorCode**: `RES-302`

---

### R-303: Check-out Requiere Check-in Previo
**Enunciado**: Solo se puede realizar check-out si la reserva tiene un check-in registrado.

**Motivación**: Mantener consistencia lógica del flujo de estancia.

**Fuente**: CU-05 (Realizar Check-out) + Diagrama de estados

**Invariante**: `acción = check-out ⟹ checkIn != null`

**Validación**:
```typescript
async checkOut(id: string, recepcionistaId: string, dto: CheckOutDto) {
  const reserva = await this.prisma.reserva.findUnique({ where: { id } });

  if (reserva.checkIn === null) {
    throw new BadRequestException({
      code: 'RES-303',
      message: 'No se puede hacer check-out sin haber realizado check-in previamente',
    });
  }

  if (reserva.checkOut !== null) {
    throw new ConflictException({
      code: 'RES-304',
      message: 'La reserva ya tiene un check-out registrado',
    });
  }

  // Proceder con check-out...
}
```

**ErrorCode**: `RES-303`

---

### R-304: Check-out Único
**Enunciado**: Una reserva no puede tener más de un check-out registrado.

**Motivación**: Prevenir manipulación de registros de salida.

**Fuente**: CU-05 + Lógica de negocio

**Invariante**: `checkOut != null ⟹ NO permitir nuevo check-out`

**Validación**: Ver código en R-303 (validación conjunta)

**ErrorCode**: `RES-304`

---

### R-305: Generación Automática de Factura al Check-out
**Enunciado**: Al realizar check-out, se debe generar automáticamente una factura con los cargos de la reserva.

**Motivación**: Agilizar proceso de facturación y garantizar que todas las estancias se facturen.

**Fuente**: RF-11 (Emitir factura de reserva) + CU-05

**Invariante**: `checkOut creado ⟹ factura generada`

**Validación** (side effect):
```typescript
// Dentro de transacción de check-out
const factura = await this.facturaService.generarDesdeReserva(reserva);

await tx.reserva.update({
  where: { id },
  data: {
    checkOut: checkOutRecord,
    facturaId: factura.id,
  }
});

// Emitir evento
this.eventEmitter.emit('factura.generada', {
  facturaId: factura.id,
  reservaId: reserva.id,
  clienteId: reserva.clienteId,
});
```

**ErrorCode**: N/A (side effect automático)

---

### R-306: Check-out Late (Flexible)
**Enunciado**: El check-out puede realizarse hasta 2 horas después de la fecha de fin sin penalización. Check-outs más tardíos requieren autorización.

**Motivación**: Dar flexibilidad a huéspedes y recepción sin comprometer próxima ocupación.

**Fuente**: Política de late check-out del hotel

**Invariante**: `NOW() <= fechaFin + 2 horas (flexible) O autorización manual`

**Validación**:
```typescript
const lateCheckoutLimit = addHours(reserva.fechaFin, 2);
const exceedsLimit = isAfter(new Date(), lateCheckoutLimit);

if (exceedsLimit && !dto.autorizacionAdmin) {
  throw new BadRequestException({
    code: 'RES-305',
    message: 'Check-out tardío excede el límite de 2 horas, requiere autorización de administrador',
    details: {
      fechaFinReserva: reserva.fechaFin.toISOString(),
      limiteLateCheckout: lateCheckoutLimit.toISOString(),
    },
  });
}

// Si hay autorización o está dentro del límite, proceder
if (exceedsLimit) {
  // Registrar cargo adicional por late checkout (opcional)
  await this.registrarCargoExtra(reserva.id, 'LATE_CHECKOUT', 500.00);
}
```

**ErrorCode**: `RES-305`

---

### R-307: Transición de Habitación al Check-in
**Enunciado**: Al realizar check-in, la habitación debe transicionar de `RESERVADA` a `OCUPADA`.

**Motivación**: Reflejar estado real de ocupación de recursos.

**Fuente**: Máquina de estados Habitación + CU-04

**Invariante**: `check-in registrado ⟹ habitacion.estado = OCUPADA`

**Validación** (side effect):
```typescript
await tx.habitacion.update({
  where: { id: reserva.habitacionId },
  data: { estado: EstadoHabitacion.OCUPADA }
});

this.eventEmitter.emit('habitacion.ocupada', {
  habitacionId: reserva.habitacionId,
  reservaId: reserva.id,
});
```

**ErrorCode**: N/A

---

### R-308: Transición de Habitación al Check-out
**Enunciado**: Al realizar check-out, la habitación debe transicionar de `OCUPADA` a `FINALIZADA` (esperando limpieza).

**Motivación**: Indicar que la habitación requiere servicio antes de estar disponible nuevamente.

**Fuente**: Máquina de estados Habitación + CU-05

**Invariante**: `check-out registrado ⟹ habitacion.estado = FINALIZADA`

**Validación** (side effect):
```typescript
await tx.habitacion.update({
  where: { id: reserva.habitacionId },
  data: { estado: EstadoHabitacion.FINALIZADA }
});

this.eventEmitter.emit('habitacion.requiere.limpieza', {
  habitacionId: reserva.habitacionId,
  prioridad: dto.estadoHabitacion === 'REQUIERE_LIMPIEZA_PROFUNDA' ? 'ALTA' : 'NORMAL',
});
```

**ErrorCode**: N/A

---

## 7. Reglas de Facturación y Pagos (R-4xx)

### R-400: Una Factura por Reserva
**Enunciado**: Cada reserva puede tener como máximo una factura asociada.

**Motivación**: Simplificar gestión contable y evitar duplicación de cargos.

**Fuente**: RF-11 + Modelo de dominio

**Invariante**: `COUNT(facturas WHERE reservaId = X) <= 1`

**Validación**:
```typescript
const facturaExistente = await this.prisma.factura.findUnique({
  where: { reservaId: reserva.id }
});

if (facturaExistente) {
  throw new ConflictException({
    code: 'RES-400',
    message: 'La reserva ya tiene una factura generada',
    details: {
      facturaId: facturaExistente.id,
      numero: facturaExistente.numero,
    },
  });
}
```

**ErrorCode**: `RES-400`

---

### R-401: Cálculo Automático de Total Factura
**Enunciado**: El total de una factura debe calcularse automáticamente como `subtotal + impuestos`, donde `subtotal = SUM(items.subtotal)`.

**Motivación**: Garantizar consistencia aritmética y prevenir manipulación manual.

**Fuente**: RF-11 + Lógica contable

**Invariante**: `total = subtotal + impuestos AND subtotal = SUM(items.subtotal)`

**Validación**:
```typescript
// En FacturaService.generar()
const items = this.calcularItemsReserva(reserva);
const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
const impuestos = this.calcularImpuestos(subtotal); // 21% IVA por defecto
const total = subtotal + impuestos;

// Crear factura con valores calculados
const factura = await this.prisma.factura.create({
  data: {
    reservaId: reserva.id,
    numero: await this.generarNumeroFactura(),
    subtotal,
    impuestos,
    total,
    items: {
      create: items
    }
  }
});
```

**Validación en DTO** (si se permite creación manual):
```typescript
if (Math.abs(dto.total - (dto.subtotal + dto.impuestos)) > 0.01) {
  throw new BadRequestException({
    code: 'RES-401',
    message: 'El total de la factura no coincide con subtotal + impuestos',
  });
}
```

**ErrorCode**: `RES-401`

---

### R-402: Factura No Modificable Tras Pago
**Enunciado**: Una factura en estado `PAGADA` no puede ser modificada ni anulada (salvo autorización de Admin).

**Motivación**: Garantizar integridad contable y cumplir normativas fiscales.

**Fuente**: Normativa contable AFIP (Argentina) + RF-11

**Invariante**: `estado = PAGADA ⟹ NO modificaciones (excepto Admin con auditoría)`

**Validación**:
```typescript
if (factura.estado === EstadoFactura.PAGADA && !esAdmin(usuario)) {
  throw new ForbiddenException({
    code: 'RES-402',
    message: 'No se puede modificar una factura ya pagada',
  });
}

// Si es Admin, registrar en auditoría
if (esAdmin(usuario)) {
  await this.auditService.log({
    accion: 'MODIFICACION_FACTURA_PAGADA',
    facturaId: factura.id,
    usuarioId: usuario.id,
    motivo: dto.motivo,
    cambios: dto.cambios,
  });
}
```

**ErrorCode**: `RES-402`

---

### R-403: Monto de Pago Positivo
**Enunciado**: El monto de un pago debe ser mayor a cero y no exceder el saldo pendiente de la factura.

**Motivación**: Prevenir errores de captura y pagos excesivos.

**Fuente**: CU-06 (Registrar pago) + RF-12

**Invariante**: `pago.monto > 0 AND pago.monto <= factura.saldoPendiente`

**Validación**:
```typescript
if (dto.monto <= 0) {
  throw new BadRequestException({
    code: 'RES-403',
    message: 'El monto del pago debe ser mayor a cero',
  });
}

const saldoPendiente = await this.calcularSaldoPendiente(factura.id);
if (dto.monto > saldoPendiente) {
  throw new BadRequestException({
    code: 'RES-403',
    message: `El monto excede el saldo pendiente (saldo: ${saldoPendiente})`,
    details: {
      saldoPendiente,
      montoRecibido: dto.monto,
      exceso: dto.monto - saldoPendiente,
    },
  });
}
```

**ErrorCode**: `RES-403`

---

### R-404: Actualización Automática de Estado Factura
**Enunciado**: Al registrar un pago, el estado de la factura debe actualizarse automáticamente: `PARCIALMENTE_PAGADA` si queda saldo, `PAGADA` si se completó el total.

**Motivación**: Reflejar estado real de la factura sin intervención manual.

**Fuente**: Máquina de estados Factura + RF-12

**Invariante**: `SUM(pagos.monto) < total ⟹ PARCIALMENTE_PAGADA | SUM(pagos.monto) = total ⟹ PAGADA`

**Validación** (side effect):
```typescript
// Después de crear el pago
const totalPagado = await this.prisma.pago.aggregate({
  where: { facturaId: factura.id, estado: EstadoPago.APROBADO },
  _sum: { monto: true }
});

const nuevoEstado = totalPagado._sum.monto >= factura.total
  ? EstadoFactura.PAGADA
  : EstadoFactura.PARCIALMENTE_PAGADA;

await this.prisma.factura.update({
  where: { id: factura.id },
  data: { estado: nuevoEstado }
});

if (nuevoEstado === EstadoFactura.PAGADA) {
  this.eventEmitter.emit('factura.pagada.completa', { facturaId: factura.id });
}
```

**ErrorCode**: N/A (automático)

---

### R-405: Medio de Pago Válido
**Enunciado**: El medio de pago debe ser uno de los valores válidos del enum `MedioDePago`.

**Motivación**: Garantizar que solo se acepten medios de pago configurados y soportados.

**Fuente**: RF-12 (Registrar pago con diferentes medios)

**Invariante**: `pago.medioDePago IN (EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA_BANCARIA, MERCADO_PAGO)`

**Validación**:
```typescript
@IsEnum(MedioDePago)
medioDePago: MedioDePago;
```

**ErrorCode**: `RES-404` (validación DTO)

---

## 8. Reglas de Notificaciones (R-5xx)

### R-500: Notificación de Confirmación Obligatoria (RF-06)
**Enunciado**: Al confirmar una reserva, se debe enviar automáticamente un email de confirmación al cliente.

**Motivación**: Informar al cliente que su reserva fue validada y proporcionar detalles.

**Fuente**: RF-06 (Confirmación automática por email)

**Invariante**: `reserva.estado → CONFIRMADA ⟹ email confirmación enviado`

**Validación** (side effect):
```typescript
// Event handler
@OnEvent('reserva.confirmada')
async handleReservaConfirmada(event: ReservaConfirmada) {
  const reserva = await this.prisma.reserva.findUnique({
    where: { id: event.reservaId },
    include: { cliente: { include: { persona: true } }, habitacion: true }
  });

  await this.notificationService.sendEmail({
    to: reserva.cliente.persona.email,
    template: 'reserva-confirmada',
    data: {
      codigoReserva: reserva.codigoReserva,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      habitacionNumero: reserva.habitacion.numero,
      linkCheckIn: `${process.env.WEB_URL}/reservas/${reserva.id}/check-in`,
    },
  });

  // Registrar notificación en DB
  await this.prisma.notificacion.create({
    data: {
      tipo: TipoNotificacion.CONFIRMACION_RESERVA,
      destinatario: reserva.cliente.persona.email,
      asunto: `Reserva ${reserva.codigoReserva} confirmada`,
      reservaId: reserva.id,
      estado: 'PENDIENTE',
    },
  });
}
```

**ErrorCode**: N/A (side effect, pero se debe logear si falla)

---

### R-501: Recordatorio 24 Horas Antes de Check-in
**Enunciado**: El sistema debe enviar un recordatorio automático al cliente 24 horas antes de la fecha de check-in.

**Motivación**: Reducir no-shows y mejorar experiencia del cliente.

**Fuente**: RF-06 + Best practices hoteleras

**Invariante**: `fechaActual = fechaInicio - 24h ⟹ enviar recordatorio`

**Validación** (cron job):
```typescript
// Scheduler task
@Cron('0 * * * *') // Cada hora
async sendCheckInReminders() {
  const tomorrow = addDays(new Date(), 1);
  const reservas = await this.prisma.reserva.findMany({
    where: {
      estado: EstadoReserva.CONFIRMADA,
      fechaInicio: {
        gte: tomorrow,
        lt: addHours(tomorrow, 1), // Ventana de 1 hora
      },
      // Verificar que no se envió ya
      notificaciones: {
        none: {
          tipo: TipoNotificacion.RECORDATORIO_CHECKIN,
        }
      }
    },
    include: { cliente: { include: { persona: true } } }
  });

  for (const reserva of reservas) {
    await this.notificationService.sendEmail({
      to: reserva.cliente.persona.email,
      template: 'recordatorio-check-in',
      data: {
        codigoReserva: reserva.codigoReserva,
        fechaInicio: reserva.fechaInicio,
        horaCheckIn: '14:00',
      },
    });
  }
}
```

**ErrorCode**: N/A (job automático)

---

### R-502: Notificación de Factura Emitida
**Enunciado**: Al generar una factura, se debe enviar un email al cliente con el PDF adjunto.

**Motivación**: Proporcionar comprobante fiscal inmediatamente.

**Fuente**: RF-11 + CU-05

**Invariante**: `factura creada ⟹ email con PDF enviado`

**Validación** (side effect):
```typescript
@OnEvent('factura.generada')
async handleFacturaGenerada(event: FacturaGenerada) {
  const factura = await this.prisma.factura.findUnique({
    where: { id: event.facturaId },
    include: { reserva: { include: { cliente: { include: { persona: true } } } } }
  });

  // Generar PDF
  const pdfBuffer = await this.pdfService.generarFacturaPDF(factura);
  const pdfUrl = await this.storageService.upload(pdfBuffer, `facturas/${factura.numero}.pdf`);

  // Actualizar URL en factura
  await this.prisma.factura.update({
    where: { id: factura.id },
    data: { pdfUrl }
  });

  // Enviar email con adjunto
  await this.notificationService.sendEmail({
    to: factura.reserva.cliente.persona.email,
    template: 'factura-emitida',
    data: { factura },
    attachments: [{
      filename: `Factura-${factura.numero}.pdf`,
      content: pdfBuffer,
    }],
  });
}
```

**ErrorCode**: N/A

---

### R-503: Reintentos de Notificaciones Fallidas
**Enunciado**: Si una notificación falla, el sistema debe reintentar hasta 3 veces con backoff exponencial.

**Motivación**: Garantizar entrega de notificaciones críticas ante fallos transitorios.

**Fuente**: RNF-02 (Disponibilidad 99%)

**Invariante**: `notificacion.intentos <= 3 AND estado != ENVIADA ⟹ reintentar`

**Validación** (cron job):
```typescript
@Cron('*/10 * * * *') // Cada 10 minutos
async retryFailedNotifications() {
  const notificaciones = await this.prisma.notificacion.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'FALLIDA'] },
      intentos: { lt: 3 },
    },
    orderBy: { fechaCreacion: 'asc' },
  });

  for (const notif of notificaciones) {
    const backoffMinutes = Math.pow(2, notif.intentos) * 5; // 5, 10, 20 minutos
    const shouldRetry = differenceInMinutes(new Date(), notif.fechaCreacion) >= backoffMinutes;

    if (shouldRetry) {
      try {
        await this.notificationService.sendEmail({ ...notif });
        await this.prisma.notificacion.update({
          where: { id: notif.id },
          data: {
            estado: 'ENVIADA',
            fechaEnvio: new Date(),
            intentos: { increment: 1 },
          },
        });
      } catch (error) {
        await this.prisma.notificacion.update({
          where: { id: notif.id },
          data: {
            estado: 'FALLIDA',
            intentos: { increment: 1 },
            error: error.message,
          },
        });
      }
    }
  }
}
```

**ErrorCode**: N/A (job interno)

---

## 9. Reglas de Seguridad y Autorización (R-6xx)

### R-600: Cliente Solo Ve Sus Propias Reservas
**Enunciado**: Un usuario con rol `CLIENTE` solo puede ver, modificar y cancelar sus propias reservas.

**Motivación**: Proteger privacidad y datos de otros clientes.

**Fuente**: RNF-06 (Seguridad) + GDPR

**Invariante**: `usuario.rol = CLIENTE ⟹ puede acceder solo a reservas WHERE clienteId = usuario.personaId`

**Validación**:
```typescript
// Guard o interceptor
@Injectable()
export class ReservaOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.rol === Rol.CLIENTE) {
      const reservaId = request.params.id;
      const reserva = await this.prisma.reserva.findUnique({ where: { id: reservaId } });

      if (reserva.clienteId !== user.personaId) {
        throw new ForbiddenException({
          code: 'RES-600',
          message: 'No tiene permisos para acceder a esta reserva',
        });
      }
    }

    return true;
  }
}
```

**ErrorCode**: `RES-600`

---

### R-601: Solo Recepcionista Puede Confirmar Reservas
**Enunciado**: La acción de confirmar una reserva (transición a `CONFIRMADA`) solo puede ser ejecutada por usuarios con rol `RECEPCIONISTA` o `ADMIN`.

**Motivación**: Garantizar que reservas sean validadas por personal autorizado.

**Fuente**: CU-01 (Actor: Recepcionista)

**Invariante**: `acción = confirmar ⟹ usuario.rol IN (RECEPCIONISTA, ADMIN)`

**Validación**:
```typescript
// Guard
@Roles(Rol.RECEPCIONISTA, Rol.ADMIN)
@Post(':id/confirmar')
async confirmar(@Param('id') id: string, @User() user: UsuarioAuth) {
  return this.reservationsService.confirmar(id, user.id, habitacionId);
}
```

**ErrorCode**: `RES-601` (403 Forbidden)

---

### R-602: Solo Recepcionista Puede Hacer Check-in/Check-out
**Enunciado**: Las operaciones de check-in y check-out solo pueden ser realizadas por `RECEPCIONISTA` o `ADMIN`.

**Motivación**: Control de acceso físico al hotel y registro de ocupación.

**Fuente**: CU-04, CU-05

**Invariante**: `acción IN (check-in, check-out) ⟹ usuario.rol IN (RECEPCIONISTA, ADMIN)`

**Validación**:
```typescript
@Roles(Rol.RECEPCIONISTA, Rol.ADMIN)
@Post(':id/check-in')
async checkIn(@Param('id') id: string, @User() user: UsuarioAuth, @Body() dto: CheckInDto) {
  return this.reservationsService.checkIn(id, user.id, dto);
}

@Roles(Rol.RECEPCIONISTA, Rol.ADMIN)
@Post(':id/check-out')
async checkOut(@Param('id') id: string, @User() user: UsuarioAuth, @Body() dto: CheckOutDto) {
  return this.reservationsService.checkOut(id, user.id, dto);
}
```

**ErrorCode**: `RES-602`

---

### R-603: Idempotencia en Creación de Reservas
**Enunciado**: Las solicitudes POST para crear reservas deben incluir un header `Idempotency-Key` único. Solicitudes con la misma key deben retornar la reserva existente sin crear duplicados.

**Motivación**: Prevenir duplicación de reservas ante reintentos de red.

**Fuente**: Best practice REST APIs + Requisito del usuario

**Invariante**: `POST /api/reservas con mismo Idempotency-Key ⟹ retornar misma reserva`

**Validación**:
```typescript
// Interceptor
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    if (request.method === 'POST') {
      const idempotencyKey = request.headers['idempotency-key'];

      if (!idempotencyKey) {
        throw new BadRequestException({
          code: 'RES-603',
          message: 'Header Idempotency-Key es requerido para operaciones POST',
        });
      }

      // Buscar reserva existente con esta key
      const existing = await this.prisma.reserva.findUnique({
        where: { idempotencyKey }
      });

      if (existing) {
        // Retornar reserva existente sin crear nueva
        return of(existing);
      }

      // Si no existe, proceder con creación
      request.body.idempotencyKey = idempotencyKey;
    }

    return next.handle();
  }
}
```

**Limpieza TTL** (24h):
```typescript
@Cron('0 2 * * *') // Daily at 2 AM
async cleanupExpiredIdempotencyKeys() {
  const threshold = subDays(new Date(), 1);
  await this.prisma.reserva.updateMany({
    where: {
      createdAt: { lt: threshold },
      idempotencyKey: { not: null }
    },
    data: { idempotencyKey: null }
  });
}
```

**ErrorCode**: `RES-603`

---

### R-604: Rate Limiting por Cliente
**Enunciado**: Un cliente no puede crear más de 10 reservas por hora.

**Motivación**: Prevenir abuso del sistema y ataques de denegación de servicio.

**Fuente**: RNF-03 (Capacidad) + Seguridad

**Invariante**: `COUNT(reservas creadas por clienteId en última hora) <= 10`

**Validación**:
```typescript
// Usar librería @nestjs/throttler o implementación custom
@Throttle(10, 3600) // 10 requests per hour
@Post()
async crear(@Body() dto: CreateReservaDto, @User() user: UsuarioAuth) {
  // Validación adicional manual
  const oneHourAgo = subHours(new Date(), 1);
  const recentReservas = await this.prisma.reserva.count({
    where: {
      clienteId: user.personaId,
      createdAt: { gte: oneHourAgo }
    }
  });

  if (recentReservas >= 10) {
    throw new TooManyRequestsException({
      code: 'RES-604',
      message: 'Límite de creación de reservas excedido (10 por hora)',
    });
  }

  return this.reservationsService.crear(dto);
}
```

**ErrorCode**: `RES-604` (429 Too Many Requests)

---

## 10. Resumen de Códigos de Error

| Código | Categoría | Mensaje Corto | HTTP Status |
|--------|-----------|---------------|-------------|
| `RES-001` | Validación Reserva | Rango de fechas inválido | 400 |
| `RES-002` | Validación Reserva | Fecha inicio debe ser futura | 400 |
| `RES-003` | Validación Reserva | Duración mínima 1 noche | 400 |
| `RES-004` | Validación Reserva | Duración máxima 30 noches | 400 |
| `RES-005` | Validación Reserva | Capacidad de personas excedida | 400 |
| `RES-006` | Validación Reserva | Tipo habitación no disponible | 400 |
| `RES-007` | Validación Reserva | Estado no permite modificación | 400 |
| `RES-008` | Validación Reserva | Código reserva duplicado | 409 |
| `RES-100` | Disponibilidad | Sin habitaciones disponibles | 409 |
| `RES-101` | Disponibilidad | Conflicto de concurrencia (overbooking) | 409 |
| `RES-102` | Disponibilidad | Límite reservas pendientes excedido | 400 |
| `RES-103` | Disponibilidad | Habitación no habilitada | 400 |
| `RES-200` | Cancelación | Cancelación fuera de plazo (< 24h) | 400 |
| `RES-202` | Cancelación | Operación sobre reserva cancelada | 400 |
| `RES-300` | Check-in | Check-in solo para confirmadas | 400 |
| `RES-301` | Check-in | Check-in duplicado | 409 |
| `RES-302` | Check-in | Check-in fuera de horario válido | 400 |
| `RES-303` | Check-out | Check-out sin check-in previo | 400 |
| `RES-304` | Check-out | Check-out duplicado | 409 |
| `RES-305` | Check-out | Late check-out sin autorización | 400 |
| `RES-400` | Facturación | Factura duplicada para reserva | 409 |
| `RES-401` | Facturación | Total factura inconsistente | 400 |
| `RES-402` | Facturación | Modificación factura pagada prohibida | 403 |
| `RES-403` | Pagos | Monto inválido o excede saldo | 400 |
| `RES-404` | Pagos | Medio de pago inválido | 400 |
| `RES-600` | Seguridad | Acceso no autorizado a reserva | 403 |
| `RES-601` | Seguridad | Confirmar requiere rol Recepcionista | 403 |
| `RES-602` | Seguridad | Check-in/out requiere rol Recepcionista | 403 |
| `RES-603` | Seguridad | Idempotency-Key requerido | 400 |
| `RES-604` | Seguridad | Rate limit excedido | 429 |

---

## 11. Referencias

- **Documentación PDF**: Requisitos funcionales RF-01 a RF-12 (págs. 31-35)
- **Documentación PDF**: Requisitos no funcionales RNF-01 a RNF-06 (pág. 36)
- **Documento 02-modelo-dominio.md**: Invariantes de entidades
- **Documento 03-maquina-estados.md**: Transiciones y guardas de estados
- **Documento 06-prevencion-overbooking.md**: Regla R-101 en detalle
