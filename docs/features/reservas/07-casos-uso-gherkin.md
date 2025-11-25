# Casos de Uso en Formato Gherkin

## 1. Introducción

Este documento especifica los casos de uso del sistema de reservas en formato **Gherkin** (Given-When-Then), útil para:
- Comunicación con stakeholders no técnicos
- Definición de tests de aceptación automatizados (BDD)
- Validación de requisitos funcionales

**Herramienta**: Compatible con Cucumber, Jest + jest-cucumber, Vitest

---

## 2. Feature: Crear Reserva

```gherkin
Feature: Crear Reserva
  Como cliente del hotel
  Quiero crear una reserva para una habitación
  Para asegurar mi estadía en las fechas deseadas

  Background:
    Given el sistema tiene habitaciones disponibles
    And existe un cliente con DNI "12345678"
    And existe una habitación "205" de tipo "DOUBLE_STD" disponible

  @happy-path
  Scenario: Crear reserva exitosamente
    Given el cliente "12345678" está autenticado
    When solicita crear una reserva con los siguientes datos:
      | campo     | valor      |
      | roomId    | 5          |
      | checkIn   | 2025-12-20 |
      | checkOut  | 2025-12-23 |
    Then la reserva se crea exitosamente
    And el código de reserva tiene formato "RES-*"
    And el estado de la reserva es "CONFIRMED"
    And la habitación "205" está disponible (aún no ocupada hasta check-in)
    And se envía email de confirmación al cliente
    And la respuesta incluye el precio total de 45000.00 (3 noches × 15000)

  @validation
  Scenario: Rechazar reserva con fechas inválidas
    Given el cliente "12345678" está autenticado
    When solicita crear una reserva con checkOut anterior a checkIn:
      | campo     | valor      |
      | roomId    | 5          |
      | checkIn   | 2025-12-23 |
      | checkOut  | 2025-12-20 |
    Then la solicitud es rechazada con código "RES-001"
    And el mensaje de error indica "La fecha de check-out debe ser posterior al check-in"

  @validation
  Scenario: Rechazar reserva de menos de 1 noche
    Given el cliente "12345678" está autenticado
    When solicita crear una reserva con duración de 0 noches:
      | campo     | valor      |
      | roomId    | 5          |
      | checkIn   | 2025-12-20 |
      | checkOut  | 2025-12-20 |
    Then la solicitud es rechazada con código "RES-003"
    And el mensaje de error indica "La reserva debe ser de al menos 1 noche"

  @validation
  Scenario: Rechazar reserva de más de 30 noches
    Given el cliente "12345678" está autenticado
    When solicita crear una reserva con duración de 35 noches:
      | campo     | valor      |
      | roomId    | 5          |
      | checkIn   | 2025-12-20 |
      | checkOut  | 2026-01-24 |
    Then la solicitud es rechazada con código "RES-004"
    And el mensaje de error contiene "no pueden exceder 30 noches"

  @overbooking
  Scenario: Prevenir overbooking - Habitación ya reservada
    Given existe una reserva confirmada para habitación "205":
      | checkIn   | checkOut  |
      | 2025-12-20 | 2025-12-23 |
    And el cliente "87654321" está autenticado
    When solicita crear una reserva para la misma habitación con fechas solapadas:
      | campo     | valor      |
      | roomId    | 5          |
      | checkIn   | 2025-12-21 |
      | checkOut  | 2025-12-24 |
    Then la solicitud es rechazada con código "RES-100"
    And el mensaje de error indica que no hay habitaciones disponibles
    And se sugieren habitaciones alternativas disponibles

  @concurrency
  Scenario: Prevenir overbooking - Múltiples solicitudes simultáneas
    Given 10 clientes intentan reservar la habitación "205" simultáneamente
    And todas las solicitudes son para las mismas fechas:
      | checkIn   | checkOut  |
      | 2025-12-20 | 2025-12-23 |
    When las 10 solicitudes se procesan concurrentemente
    Then solo 1 reserva es creada exitosamente
    And las otras 9 solicitudes son rechazadas con código "RES-100" o "RES-101"

  @idempotency
  Scenario: Idempotencia - Request duplicado con mismo Idempotency-Key
    Given el cliente "12345678" está autenticado
    And el header "Idempotency-Key" es "550e8400-e29b-41d4-a716-446655440000"
    When solicita crear una reserva con los datos:
      | roomId | checkIn    | checkOut   |
      | 5      | 2025-12-20 | 2025-12-23 |
    Then la reserva se crea con ID "42"
    When envía exactamente la misma solicitud con el mismo "Idempotency-Key"
    Then recibe la misma reserva con ID "42" (no se crea duplicado)
    And solo existe 1 reserva en el sistema

  @rate-limiting
  Scenario: Rechazar exceso de reservas por hora
    Given el cliente "12345678" ha creado 10 reservas en la última hora
    When intenta crear la reserva número 11
    Then la solicitud es rechazada con código "RES-604"
    And el mensaje indica "Límite de creación de reservas excedido (10 por hora)"
```

---

## 3. Feature: Modificar Reserva

```gherkin
Feature: Modificar Fechas de Reserva
  Como cliente del hotel
  Quiero modificar las fechas de mi reserva
  Para ajustarlas a cambios en mis planes

  Background:
    Given existe una reserva confirmada:
      | id  | code              | clientId | roomId | checkIn    | checkOut   | status    |
      | 42  | RES-1730394567890 | 1        | 5      | 2025-12-20 | 2025-12-23 | CONFIRMED |

  @happy-path
  Scenario: Modificar fechas exitosamente
    Given el cliente dueño de la reserva "42" está autenticado
    When solicita modificar las fechas a:
      | checkIn    | checkOut   |
      | 2025-12-21 | 2025-12-24 |
    And las nuevas fechas no solapan con otras reservas
    Then la reserva se actualiza exitosamente
    And el campo "checkIn" es "2025-12-21"
    And el campo "checkOut" es "2025-12-24"
    And el campo "updatedAt" se actualiza
    And el precio total se recalcula a 45000.00 (3 noches)

  @validation
  Scenario: Rechazar modificación de reserva cancelada
    Given la reserva "42" tiene estado "CANCELLED"
    When el cliente intenta modificar las fechas
    Then la solicitud es rechazada con código "RES-007"
    And el mensaje indica que no se puede modificar una reserva cancelada

  @validation
  Scenario: Rechazar modificación de reserva completada
    Given la reserva "42" tiene estado "COMPLETED"
    When el cliente intenta modificar las fechas
    Then la solicitud es rechazada con código "RES-007"
    And el mensaje indica que no se puede modificar una reserva completada

  @overbooking
  Scenario: Rechazar modificación por conflicto de fechas
    Given existe otra reserva para habitación "205":
      | checkIn    | checkOut   |
      | 2025-12-24 | 2025-12-27 |
    When el cliente intenta modificar su reserva a:
      | checkIn    | checkOut   |
      | 2025-12-23 | 2025-12-26 |
    Then la solicitud es rechazada con código "RES-100"
    And el mensaje indica "Las nuevas fechas solapan con otra reserva existente"

  @authorization
  Scenario: Rechazar modificación por otro cliente
    Given el cliente "87654321" está autenticado (no es el dueño de la reserva)
    When intenta modificar la reserva "42"
    Then la solicitud es rechazada con código "RES-600"
    And el mensaje indica "No tiene permisos para acceder a esta reserva"

  @concurrency
  Scenario: Detectar conflicto de concurrencia (Optimistic Locking)
    Given el cliente lee la reserva "42" con version "3"
    And otro usuario modifica la reserva antes (incrementando version a "4")
    When el cliente intenta modificar con expectedVersion "3"
    Then la solicitud es rechazada con código "RES-101"
    And el mensaje indica "Conflicto de concurrencia detectado"
    And se sugiere "Refrescar los datos y reintentar"
```

---

## 4. Feature: Cancelar Reserva

```gherkin
Feature: Cancelar Reserva
  Como cliente del hotel
  Quiero cancelar mi reserva
  Para liberar la habitación si no la necesito

  Background:
    Given la fecha actual es "2025-12-18 10:00:00"

  @happy-path
  Scenario: Cancelar reserva confirmada con más de 24 horas
    Given existe una reserva confirmada con checkIn "2025-12-20 14:00:00"
    And faltan 50 horas para el check-in
    When el cliente solicita cancelar con motivo "Cambio de planes"
    Then la reserva se cancela exitosamente
    And el estado cambia a "CANCELLED"
    And el campo "cancelReason" es "Cambio de planes"
    And la habitación vuelve a estado "AVAILABLE"
    And se envía email de confirmación de cancelación

  @validation-rf05
  Scenario: Rechazar cancelación con menos de 24 horas (RF-05)
    Given existe una reserva confirmada con checkIn "2025-12-19 09:00:00"
    And faltan 23 horas para el check-in
    When el cliente solicita cancelar
    Then la solicitud es rechazada con código "RES-200"
    And el mensaje indica "No se puede cancelar con menos de 24 horas de anticipación"
    And se muestra la fecha límite de cancelación "2025-12-18 09:00:00"

  @happy-path
  Scenario: Cancelar reserva en estado INICIADA (sin restricción de tiempo)
    Given existe una reserva en estado "INICIADA"
    And el checkIn es mañana (menos de 24h)
    When el cliente solicita cancelar
    Then la reserva se cancela exitosamente (no aplica restricción de 24h)

  @validation
  Scenario: Rechazar cancelación de reserva ya cancelada
    Given existe una reserva en estado "CANCELLED"
    When el cliente intenta cancelar nuevamente
    Then la solicitud es rechazada con código "RES-202"
    And el mensaje indica que no se pueden realizar operaciones sobre una reserva cancelada

  @authorization
  Scenario: Recepcionista puede forzar cancelación dentro de 24h
    Given existe una reserva confirmada con checkIn en 12 horas
    And un usuario con rol "RECEPCIONISTA" está autenticado
    When solicita cancelar con motivo "Cancelación de emergencia por cliente"
    Then la reserva se cancela exitosamente (bypass de regla de 24h)
    And se registra en el historial que fue forzada por recepcionista
```

---

## 5. Feature: Check-in

```gherkin
Feature: Realizar Check-in
  Como recepcionista
  Quiero registrar el check-in de una reserva
  Para marcar el inicio de la estadía del huésped

  Background:
    Given existe una reserva confirmada:
      | id | code              | status    | checkIn    | roomId |
      | 42 | RES-1730394567890 | CONFIRMED | 2025-12-20 | 5      |
    And el usuario con rol "RECEPCIONISTA" está autenticado

  @happy-path
  Scenario: Realizar check-in exitosamente
    Given la fecha actual es "2025-12-20 14:30:00"
    When el recepcionista realiza el check-in con datos:
      | documentsVerified | observations              |
      | true              | Upgrade a suite junior    |
    Then el check-in se registra exitosamente
    And el estado de la reserva cambia a "IN_PROGRESS"
    And se guarda el timestamp de check-in "2025-12-20T14:30:00Z"
    And el estado de la habitación "205" cambia a "OCCUPIED"
    And se registra quién realizó el check-in

  @validation-rf-300
  Scenario: Rechazar check-in de reserva no confirmada
    Given la reserva tiene estado "CANCELLED"
    When el recepcionista intenta realizar check-in
    Then la solicitud es rechazada con código "RES-300"
    And el mensaje indica "Solo se puede hacer check-in de reservas confirmadas"

  @validation-rf-301
  Scenario: Rechazar check-in duplicado
    Given la reserva ya tiene un check-in registrado el "2025-12-20 14:00:00"
    When el recepcionista intenta realizar otro check-in
    Then la solicitud es rechazada con código "RES-301"
    And el mensaje indica "La reserva ya tiene un check-in registrado"

  @validation-rf-302
  Scenario: Permitir early check-in (4 horas antes)
    Given la reserva tiene checkIn "2025-12-20 14:00:00"
    And la fecha actual es "2025-12-20 10:30:00" (3.5 horas antes)
    When el recepcionista realiza el check-in
    Then el check-in se registra exitosamente (dentro de margen de 4h)

  @validation-rf-302
  Scenario: Rechazar check-in muy anticipado
    Given la reserva tiene checkIn "2025-12-20 14:00:00"
    And la fecha actual es "2025-12-20 08:00:00" (6 horas antes)
    When el recepcionista intenta realizar check-in
    Then la solicitud es rechazada con código "RES-302"
    And el mensaje indica "El check-in solo puede realizarse a partir de 4 horas antes"

  @authorization
  Scenario: Rechazar check-in realizado por cliente
    Given un usuario con rol "CLIENTE" está autenticado
    When intenta realizar check-in
    Then la solicitud es rechazada con código "RES-602"
    And el mensaje indica que se requiere rol RECEPCIONISTA
```

---

## 6. Feature: Check-out

```gherkin
Feature: Realizar Check-out
  Como recepcionista
  Quiero registrar el check-out de una reserva
  Para marcar el fin de la estadía y generar la factura

  Background:
    Given existe una reserva con check-in realizado:
      | id | status      | checkIn             | checkOut   | roomId |
      | 42 | IN_PROGRESS | 2025-12-20 14:30:00 | 2025-12-23 | 5      |
    And el usuario con rol "RECEPCIONISTA" está autenticado

  @happy-path
  Scenario: Realizar check-out exitosamente
    Given la fecha actual es "2025-12-23 11:00:00"
    When el recepcionista realiza el check-out con datos:
      | roomCondition | observations            |
      | GOOD          | Todo en orden, sin daños |
    Then el check-out se registra exitosamente
    And el estado de la reserva cambia a "COMPLETED"
    And se guarda el timestamp de check-out "2025-12-23T11:00:00Z"
    And el estado de la habitación "205" cambia a "MAINTENANCE" (requiere limpieza)
    And se genera automáticamente una factura
    And la factura tiene número "FAC-2025-00015"
    And el total de la factura es 45000.00 (3 noches × 15000)

  @validation-rf-303
  Scenario: Rechazar check-out sin check-in previo
    Given la reserva tiene estado "CONFIRMED" (sin check-in)
    When el recepcionista intenta realizar check-out
    Then la solicitud es rechazada con código "RES-303"
    And el mensaje indica "No se puede hacer check-out sin haber realizado check-in"

  @validation-rf-304
  Scenario: Rechazar check-out duplicado
    Given la reserva ya tiene check-out registrado
    When el recepcionista intenta realizar otro check-out
    Then la solicitud es rechazada con código "RES-304"
    And el mensaje indica "La reserva ya tiene un check-out registrado"

  @validation-rf-306
  Scenario: Permitir late check-out (2 horas después)
    Given la reserva tiene checkOut "2025-12-23 10:00:00"
    And la fecha actual es "2025-12-23 11:30:00" (1.5 horas después)
    When el recepcionista realiza el check-out
    Then el check-out se registra exitosamente (dentro de margen de 2h)
    And NO se aplica cargo adicional

  @validation-rf-305
  Scenario: Aplicar cargo por late check-out excesivo
    Given la reserva tiene checkOut "2025-12-23 10:00:00"
    And la fecha actual es "2025-12-23 13:00:00" (3 horas después)
    When el recepcionista realiza el check-out
    Then el check-out se registra exitosamente
    And se aplica un cargo adicional de 500.00 por late checkout
    And el cargo se incluye en la factura generada

  @business-logic
  Scenario: Priorizar limpieza según condición de habitación
    Given la fecha actual es "2025-12-23 11:00:00"
    When el recepcionista realiza check-out con roomCondition "NEEDS_DEEP_CLEANING"
    Then la habitación se marca con prioridad "ALTA" para limpieza
    And se notifica al equipo de limpieza
```

---

## 7. Feature: Verificar Disponibilidad

```gherkin
Feature: Verificar Disponibilidad de Habitaciones
  Como visitante del sitio web
  Quiero consultar habitaciones disponibles para mis fechas
  Para decidir si realizar una reserva

  Background:
    Given existen las siguientes habitaciones:
      | id | numero | tipo        | estado    | precio |
      | 1  | 101    | SINGLE      | AVAILABLE | 10000  |
      | 2  | 102    | SINGLE      | AVAILABLE | 10000  |
      | 3  | 201    | DOUBLE_STD  | AVAILABLE | 15000  |
      | 4  | 202    | DOUBLE_STD  | AVAILABLE | 15000  |
      | 5  | 205    | DOUBLE_STD  | AVAILABLE | 15000  |
      | 6  | 301    | SUITE       | AVAILABLE | 25000  |

  @happy-path
  Scenario: Consultar disponibilidad sin reservas existentes
    Given no existen reservas para las fechas consultadas
    When se consulta disponibilidad para:
      | checkIn    | checkOut   |
      | 2025-12-20 | 2025-12-23 |
    Then se retornan 6 habitaciones disponibles
    And cada habitación muestra el precio total (3 noches × precio/noche)

  @filtering
  Scenario: Filtrar por tipo de habitación
    When se consulta disponibilidad con filtro roomTypeId "DOUBLE_STD":
      | checkIn    | checkOut   |
      | 2025-12-20 | 2025-12-23 |
    Then se retornan solo 3 habitaciones de tipo "DOUBLE_STD"

  @filtering
  Scenario: Filtrar por capacidad mínima
    When se consulta disponibilidad para 3 personas:
      | checkIn    | checkOut   | guests |
      | 2025-12-20 | 2025-12-23 | 3      |
    Then se retornan solo habitaciones con capacidad >= 3
    And se excluyen habitaciones SINGLE y DOUBLE_STD

  @availability-calculation
  Scenario: Excluir habitaciones con reservas confirmadas
    Given existe una reserva confirmada:
      | roomId | checkIn    | checkOut   |
      | 5      | 2025-12-20 | 2025-12-23 |
    When se consulta disponibilidad para:
      | checkIn    | checkOut   |
      | 2025-12-21 | 2025-12-24 |
    Then se retornan 5 habitaciones disponibles (excluyendo habitación 205)

  @availability-calculation
  Scenario: Incluir habitaciones con reservas en fechas diferentes
    Given existe una reserva confirmada:
      | roomId | checkIn    | checkOut   |
      | 5      | 2025-12-10 | 2025-12-15 |
    When se consulta disponibilidad para:
      | checkIn    | checkOut   |
      | 2025-12-20 | 2025-12-23 |
    Then se retornan 6 habitaciones disponibles (incluyendo habitación 205)

  @edge-cases
  Scenario: Reservas back-to-back (check-out coincide con check-in)
    Given existe una reserva:
      | roomId | checkIn    | checkOut   |
      | 5      | 2025-12-17 | 2025-12-20 |
    When se consulta disponibilidad para:
      | checkIn    | checkOut   |
      | 2025-12-20 | 2025-12-23 |
    Then la habitación 205 está disponible (check-out 20 = check-in 20, sin solapamiento)
```

---

## 8. Uso para Testing Automatizado

### 8.1 Configuración con jest-cucumber

```typescript
// apps/backend/test/features/step-definitions/reservations.steps.ts

import { loadFeature, defineFeature } from 'jest-cucumber';
import { Test } from '@nestjs/testing';
import { ReservationsService } from '../../../src/application/reservations/reservations.service';

const feature = loadFeature('./test/features/crear-reserva.feature');

defineFeature(feature, (test) => {
  let service: ReservationsService;
  let createdReservation: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [/* ... */],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  test('Crear reserva exitosamente', ({ given, when, then, and }) => {
    let clientId: number;
    let roomId: number;

    given('el cliente "12345678" está autenticado', () => {
      clientId = 1; // Mock del cliente autenticado
    });

    when(/^solicita crear una reserva con los siguientes datos:$/, async (table) => {
      const data = table[0];
      createdReservation = await service.createReservation({
        clientId,
        roomId: parseInt(data.roomId),
        checkIn: data.checkIn,
        checkOut: data.checkOut,
      });
    });

    then('la reserva se crea exitosamente', () => {
      expect(createdReservation).toBeDefined();
      expect(createdReservation.id).toBeGreaterThan(0);
    });

    and(/^el código de reserva tiene formato "RES-\*"$/, () => {
      expect(createdReservation.code).toMatch(/^RES-\d+/);
    });

    and(/^el estado de la reserva es "CONFIRMED"$/, () => {
      expect(createdReservation.status).toBe('CONFIRMED');
    });
  });
});
```

---

## 9. Referencias

- **Cucumber Documentation**: https://cucumber.io/docs/gherkin/
- **jest-cucumber**: https://github.com/bencompton/jest-cucumber
- **Documento 04-reglas-negocio.md**: Códigos de error referenciados
- **Documento 03-maquina-estados.md**: Transiciones de estados validadas
