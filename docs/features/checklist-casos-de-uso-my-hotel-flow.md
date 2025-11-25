# Checklist de Desarrollo - My Hotel Flow (MHF)
## Casos de Uso del Sistema de Gestión Hotelera

---

## CUD01 - Gestionar Reservas

### Backend (Clean Architecture)
- [x] **Domain Layer**: Crear agregado `Reservation` sin dependencias externas
- [x] **Application Layer**: Crear caso de uso `GetReservationManagementMenuUseCase`
- [x] **Presentation Layer**: Crear controller `ReservationManagementController` con endpoint GET `/api/reservations/menu`
- [x] Aplicar decorator `@RequireAction('reservas.listar')` al endpoint
- [x] Implementar DTO `ReservationMenuResponseDto` que retorne opciones disponibles basadas en permisos del usuario
- [x] En el caso de uso, inyectar `PermissionEvaluator` para verificar qué opciones mostrar según acciones del usuario:
  - Mostrar "Crear reserva" solo si tiene `reservas.crear`
  - Mostrar "Cancelar reserva" solo si tiene `reservas.cancelar`
  - Mostrar "Modificar reserva" solo si tiene `reservas.modificar`
  - Mostrar "Consultar por fecha" solo si tiene `reservas.listar`
  - Mostrar "Ocupación diaria" solo si tiene `habitaciones.listar` o `reportes.ver`
- [x] Documentar endpoint en Swagger/OpenAPI con respuestas 200, 401, 403
- [x] Implementar test unitario del caso de uso mockeando `PermissionEvaluator`

### Frontend
- [x] Crear componente `ReservationManagementDashboard.tsx` con menú de opciones
- [x] Implementar navegación por botones hacia cada subcaso (Crear, Cancelar, Modificar, etc.)
- [x] Diseñar layout con grid/cards para las 5 opciones principales
- [x] Agregar iconos identificativos para cada acción (calendar, cancel, edit, search, chart)
- [x] Implementar guard de ruta que valide autenticación antes de acceder
- [x] Crear breadcrumb que muestre "Inicio > Gestión de Reservas"
- [x] Agregar loading spinner mientras se verifica la sesión
- [x] Testear redirección a login si el usuario no está autenticado

### Testing
- [x] Test unitario: verificar que el menú muestre las 5 opciones correctas
- [x] Test de integración: validar redirección a login si no hay token válido
- [ ] Test E2E: navegar desde login → dashboard → gestión de reservas

---

## CUD02 - Crear Reserva

### Backend (Clean Architecture)
- [x] **Domain Layer**: 
  - Crear entidad `Client` con métodos: `create()`, `validate()`
  - Crear entidad `Reservation` con métodos: `create()`, `calculateTotal()`, `assignRoom()`
  - Crear Value Objects: `DNI`, `Email`, `DateRange`, `ReservationCode`
  - Crear excepción de dominio `InvalidDNIException` para DNI < 7 caracteres
  - Crear excepción de dominio `RoomNotAvailableException`
- [x] **Application Layer**:
  - Crear DTO `CreateReservationDto` con validaciones class-validator: DNI (min 7 chars), fechas, tipo habitación, cantidad personas
  - Crear caso de uso `SearchClientByDNIUseCase` que inyecte `IClientRepository`
  - Crear caso de uso `CreateReservationUseCase` que orqueste: búsqueda de habitaciones + creación de reserva + notificación
  - Inyectar `IRoomRepository.findAvailable(checkIn, checkOut, roomType)`
  - Inyectar `IReservationRepository.save(reservation)`
  - Inyectar `INotificationService` (puerto/interfaz en Domain, implementación en Infrastructure)
- [x] **Presentation Layer**:
  - Crear controller `ClientController` con endpoint POST `/api/clients/search-by-dni` decorado con `@RequireAction('clientes.ver')`
  - Crear controller `ReservationController` con endpoint POST `/api/reservations` decorado con `@RequireAction('reservas.crear')`
  - Implementar endpoint GET `/api/rooms/available` con `@RequireAction('habitaciones.listar')` y query params: `checkIn`, `checkOut`, `roomType`
  - Crear endpoint GET `/api/rooms/types` decorado con `@RequireAction('habitaciones.listar')`
- [x] **Infrastructure Layer**:
  - Implementar `ClientRepository` usando TypeORM con método `findByDNI()`
  - Implementar `RoomRepository` con query `findAvailable()` con subquery para excluir habitaciones reservadas
  - Implementar `ReservationRepository.save()` con transacción que incluya: INSERT reservation + INSERT reservation_rooms + UPDATE rooms.estado
  - Implementar `NotificationService` con método `sendReservationConfirmation()` que soporte email, WhatsApp (Twilio API), SMS
  - Crear servicio `ReservationCodeGenerator` que genere código único: `"RES" + timestamp + random(4 digits)`
- [x] Agregar validación en Value Object `DNI`: regex `/^[0-9]{7,8}$/`
- [x] Implementar lógica en `Reservation.calculateTotal()`: `(checkOut - checkIn) * precioPorNoche`
- [x] Implementar manejo de transacciones usando patrón Unit of Work o @Transactional decorator

### Frontend
- [x] Crear componente `CreateReservationForm.tsx` con formulario paso a paso (wizard)
- [x] Implementar paso 1: campo input DNI con validación en tiempo real (solo números, min 7 dígitos)
- [x] Mostrar mensaje de error personalizado si DNI tiene < 7 caracteres: "DNI inválido, intente nuevamente"
- [x] Crear botón "Buscar cliente" que llame a `/api/clients/search-by-dni`
- [x] Si DNI no existe, habilitar botón "Crear nuevo cliente" que redirija a CUD08 (Crear Perfil)
- [x] Implementar paso 2: selects para tipo de habitación, cantidad de personas, date pickers para check-in/out
- [x] Agregar validación frontend: check-out > check-in (deshabilitar fechas pasadas)
- [x] Crear paso 3: llamar a `/api/rooms/available` al cargar y mostrar cards de habitaciones disponibles
- [x] En cada card mostrar: número de habitación, tipo, precio por noche, capacidad
- [x] Calcular y mostrar "Total: $X por Y noches" dinámicamente
- [x] Implementar paso 4: radiobuttons para seleccionar canal de notificación (email, WhatsApp, SMS)
- [x] Agregar checkbox "No desea notificaciones" que deshabilite los radios
- [x] Crear paso 5: pantalla de confirmación con resumen completo (cliente, fechas, habitación, total)
- [x] Implementar botón "Confirmar reserva" que llame a POST `/api/reservations`
- [x] Mostrar modal de éxito con código de reserva generado (ej: "RES123456")
- [x] Si no hay notificaciones, mostrar botón "Imprimir comprobante" que genere PDF con `jsPDF`
- [x] Implementar manejo de error 404 cuando no hay disponibilidad: mostrar mensaje "No hay habitaciones disponibles"
- [x] Agregar botón "Volver atrás" en cada paso del wizard
- [x] Implementar progreso visual con stepper (paso 1 de 5, 2 de 5, etc.)

### Base de Datos
- [x] Verificar tabla `clients` tiene columnas: id, dni (UNIQUE), nombre, apellido, email, telefono, password, created_at
- [x] Verificar tabla `rooms` tiene: id, numero, tipo (ENUM: Estándar, Suite, Familiar), precio_noche, capacidad, estado (ENUM: Disponible, Reservada, Ocupada)
- [x] Verificar tabla `reservations` tiene: id, codigo (UNIQUE), client_id (FK), check_in, check_out, estado (ENUM: Confirmada, En curso, Cancelada, Finalizada), created_at
- [x] Crear tabla intermedia `reservation_rooms` con: id, reservation_id (FK), room_id (FK), check_in, check_out
- [x] Crear índice en `reservation_rooms(room_id, check_in, check_out)` para optimizar búsqueda de disponibilidad

### Testing
- [x] Test unitario: validar generación de código único (ejecutar 1000 veces y verificar que no haya duplicados)
- [x] Test unitario: verificar cálculo correcto de precio (3 noches x $100 = $300)
- [x] Test de integración: crear reserva completa y verificar que la habitación cambie a estado "Reservada"
- [x] Test de integración: verificar que se envíe email correctamente (mock del servicio de email)
- [x] Test E2E: flujo completo desde ingresar DNI hasta recibir código de reserva
- [x] Test E2E: validar que al buscar DNI inexistente se habilite opción de crear cliente
- [x] Test de validación: ingresar DNI con 6 dígitos y verificar mensaje de error
- [x] Test de disponibilidad: reservar habitación 101 para 01/11-03/11, luego intentar reservarla para 02/11-04/11 y verificar que NO aparezca

---

## CUD03 - Cancelar Reserva

### Backend (Clean Architecture)
- [ ] **Domain Layer**:
  - Agregar método `Reservation.cancel(reason: string)` que valide estado y cambie a "Cancelada"
  - Crear excepción de dominio `InvalidReservationStateException` si estado != "Confirmada"
  - Crear evento de dominio `ReservationCancelledEvent` con: reservationId, reason, cancelledAt
- [ ] **Application Layer**:
  - Crear caso de uso `SearchReservationUseCase` que acepte DNI o código
  - Implementar lógica: si es DNI, filtrar por `client.dni = :dni AND status = 'Confirmada'` y retornar primera
  - Crear DTO `CancelReservationDto` con: `reservationId`, `reason` (max 100 caracteres, validado con class-validator)
  - Crear caso de uso `CancelReservationUseCase` que:
    1. Obtenga la reserva del repositorio
    2. Llame a `reservation.cancel(reason)` 
    3. Libere habitaciones llamando a `room.setEstado('Disponible')`
    4. Persista cambios con `reservationRepository.save()`
    5. Publique evento `ReservationCancelledEvent`
    6. Llame a `notificationService.sendCancellation()`
  - Crear event handler `OnReservationCancelledHandler` que registre en audit logs
- [ ] **Presentation Layer**:
  - Crear endpoint GET `/api/reservations/search` con `@RequireAction('reservas.ver')` y query params: `dni` o `code`
  - Crear endpoint PATCH `/api/reservations/:id/cancel` con `@RequireAction('reservas.cancelar')`
  - Retornar 400 con mensaje si estado != "Confirmada"
- [ ] **Infrastructure Layer**:
  - Implementar `ReservationRepository.findByDNI()` y `findByCode()`
  - Implementar transacción en `CancelReservationUseCase`: UPDATE reservations + UPDATE rooms + INSERT audit_log
  - Implementar `NotificationService.sendCancellationEmail()` con template que incluya motivo
- [ ] Agregar columna `cancel_reason VARCHAR(100)` a tabla `reservations`
- [ ] Crear tabla `audit_logs` si no existe: id, user_id (FK), action, entity_type, entity_id, details (JSON), ip_address, created_at
- [ ] Implementar `AuditLogRepository` para registrar acciones críticas

### Frontend
- [ ] Crear componente `CancelReservationForm.tsx`
- [ ] Implementar input con label "Buscar por DNI o Código de Reserva"
- [ ] Agregar botón "Buscar" que llame a GET `/api/reservations/search?dni=X` o `?code=Y`
- [ ] Mostrar card con detalles de la reserva encontrada: código, cliente, fechas, tipo habitación, estado
- [ ] Implementar textarea para "Motivo de cancelación" con contador de caracteres (máximo 100)
- [ ] Agregar validación frontend: deshabilitar botón "Confirmar cancelación" si el textarea está vacío
- [ ] Crear modal de confirmación con mensaje: "¿Está seguro que desea cancelar la reserva RES123456?"
- [ ] Al confirmar, llamar a PATCH `/api/reservations/:id/cancel`
- [ ] Mostrar notificación de éxito: "Reserva cancelada correctamente. Se envió notificación al cliente."
- [ ] Implementar manejo de error 404: mostrar mensaje "No se encontró reserva activa"
- [ ] Agregar botón "Cancelar" que cierre el modal sin hacer cambios
- [ ] Después de cancelar exitosamente, redirigir al dashboard de gestión de reservas

### Base de Datos
- [ ] Agregar columna `cancel_reason VARCHAR(100)` a tabla `reservations`
- [ ] Crear tabla `audit_logs` con: id, user_id (FK a tabla users/recepcionistas), action (VARCHAR), entity_id, entity_type, details (TEXT), created_at
- [ ] Crear trigger para registrar automáticamente en `audit_logs` cuando se actualice `estado` de una reserva

### Testing
- [ ] Test unitario: verificar que el servicio lance excepción si intenta cancelar reserva con estado != "Confirmada"
- [ ] Test de integración: cancelar reserva y verificar que habitaciones pasen a estado "Disponible"
- [ ] Test de integración: verificar que se guarde el motivo en `cancel_reason`
- [ ] Test de notificación: mock del servicio de email y verificar que se llame con los parámetros correctos
- [ ] Test E2E: buscar reserva por DNI, ingresar motivo, confirmar y verificar cambio de estado
- [ ] Test de validación: intentar cancelar reserva ya cancelada y verificar error 400

---

## CUD04 - Modificar Reserva

### Backend
- [ ] Crear DTO `UpdateReservationDto` con campos opcionales: `checkIn`, `checkOut`, `roomType`, `guestCount`
- [ ] Implementar endpoint GET `/api/reservations/search` (reutilizar del CUD03)
- [ ] Crear endpoint PATCH `/api/reservations/:id`
- [ ] Implementar lógica que compare fechas nuevas con las actuales
- [ ] Si cambian fechas o tipo, llamar a `RoomService.findAvailable()` con los nuevos parámetros
- [ ] Implementar transacción para: liberar habitación actual + asignar nueva habitación + actualizar fechas en reserva
- [ ] Recalcular precio total con las nuevas fechas: `(newCheckOut - newCheckIn) * nuevoPrecioPorNoche`
- [ ] Llamar a `NotificationService.sendReservationUpdate()` con el nuevo comprobante
- [ ] Agregar validación: no permitir modificar si `estado != 'Confirmada'`
- [ ] Registrar modificación en `audit_logs` con detalles: campos modificados y valores anteriores

### Frontend
- [ ] Crear componente `ModifyReservationForm.tsx`
- [ ] Reutilizar búsqueda de CUD03 (input para DNI o código + botón Buscar)
- [ ] Mostrar formulario prellenado con datos actuales de la reserva
- [ ] Implementar date pickers para check-in/out con valores actuales como default
- [ ] Agregar select para tipo de habitación con opción actual preseleccionada
- [ ] Implementar input numérico para cantidad de huéspedes
- [ ] Crear botón "Buscar nuevas habitaciones disponibles" que llame a `/api/rooms/available` con los nuevos parámetros
- [ ] Mostrar lista de habitaciones disponibles (similar a CUD02)
- [ ] Permitir seleccionar nueva habitación de la lista
- [ ] Calcular y mostrar "Nuevo total: $X" dinámicamente al cambiar fechas
- [ ] Crear sección comparativa: "Antes: Hab 101, 2 noches, $200 → Después: Hab 105, 3 noches, $330"
- [ ] Implementar botón "Confirmar cambios" que llame a PATCH `/api/reservations/:id`
- [ ] Mostrar modal de confirmación antes de aplicar cambios
- [ ] Manejar error 404 si no hay disponibilidad: "No hay habitaciones disponibles para las nuevas fechas seleccionadas"
- [ ] Agregar opción para cancelar modificación y volver a los datos originales
- [ ] Mostrar notificación de éxito: "Reserva modificada. Se envió nuevo comprobante al cliente."

### Base de Datos
- [ ] Verificar que `reservations` tenga columna `updated_at` (TIMESTAMP) que se actualice automáticamente
- [ ] Crear tabla `reservation_history` para guardar snapshots: id, reservation_id (FK), datos_anteriores (JSON), datos_nuevos (JSON), modified_by (FK), modified_at

### Testing
- [ ] Test unitario: modificar solo fechas y verificar recálculo correcto de precio
- [ ] Test unitario: modificar tipo de habitación y verificar asignación correcta
- [ ] Test de integración: modificar reserva y verificar que habitación anterior se libere
- [ ] Test de integración: verificar que se cree registro en `reservation_history`
- [ ] Test E2E: modificar fechas de una reserva, seleccionar nueva habitación y confirmar cambios
- [ ] Test de validación: intentar modificar reserva en estado "Cancelada" y verificar error 400

---

## CUD05 - Consultar Reservas por Fechas

### Backend
- [ ] Crear DTO `ReservationSearchDto` con: `startDate`, `endDate` (opcional), `roomType` (opcional), `status` (opcional)
- [ ] Implementar endpoint GET `/api/reservations/search-by-date` con query params
- [ ] Si solo se envía `startDate`, buscar reservas donde `checkIn = startDate` o `checkOut = startDate`
- [ ] Si se envía rango, buscar donde `(checkIn >= startDate AND checkOut <= endDate)` o `(checkIn <= endDate AND checkOut >= startDate)`
- [ ] Aplicar filtros opcionales: `roomType IN (...)` y `status IN (...)`
- [ ] Implementar paginación: query params `page` y `limit` (default: 20 por página)
- [ ] Retornar respuesta con: `{ data: [...], total: 150, page: 1, totalPages: 8 }`
- [ ] Incluir en cada reserva: código, DNI cliente, nombre completo, fechas, tipo habitación, cantidad personas, estado
- [ ] Ordenar resultados por `checkIn DESC` (más recientes primero)
- [ ] Crear índice compuesto en tabla `reservations(checkIn, checkOut, status)` para optimizar búsqueda

### Frontend
- [ ] Crear componente `ReservationSearchByDate.tsx`
- [ ] Implementar date picker único con label "Fecha" (por defecto: fecha actual - 30/05/2025)
- [ ] Agregar checkbox "Buscar por rango" que habilite un segundo date picker para fecha fin
- [ ] Crear filtros desplegables con multiselect: "Tipo de habitación" (Estándar, Suite, Familiar) y "Estado" (Confirmada, En curso, Cancelada)
- [ ] Implementar botón "Buscar" que llame a GET `/api/reservations/search-by-date`
- [ ] Mostrar tabla con columnas: Código | DNI | Cliente | Check-in | Check-out | Tipo | Estado
- [ ] Implementar paginación con botones "Anterior" y "Siguiente" + selector de "Resultados por página"
- [ ] Agregar botón de acción en cada fila: icono de "ojo" para ver detalles, "editar" para modificar, "X" para cancelar
- [ ] Al hacer clic en una fila, abrir modal con detalles completos de la reserva
- [ ] Implementar botón "Limpiar filtros" que resetee a valores por defecto
- [ ] Mostrar mensaje "No se encontraron reservas" si el resultado está vacío
- [ ] Agregar indicador de loading mientras se realiza la búsqueda
- [ ] Implementar exportación a CSV con botón "Descargar resultados"

### Testing
- [ ] Test unitario: verificar que la búsqueda por fecha única retorne reservas con check-in o check-out en esa fecha
- [ ] Test unitario: verificar búsqueda por rango de fechas con overlapping
- [ ] Test de integración: aplicar múltiples filtros (fecha + tipo + estado) y verificar resultados correctos
- [ ] Test de integración: verificar que la paginación funcione correctamente (página 1 vs página 2)
- [ ] Test E2E: buscar reservas para "30/05/2025", aplicar filtro "Estado: Confirmada", verificar tabla
- [ ] Test de performance: buscar en base de datos con 10,000 reservas y verificar que la respuesta sea < 2 segundos

---

## CUD06 - Consultar Ocupación Diaria

### Backend
- [ ] Crear DTO `OccupancySearchDto` con: `date`, `status[]` (opcional)
- [ ] Implementar endpoint GET `/api/occupancy/daily` con query params
- [ ] Ejecutar consulta SQL que agrupe por tipo de habitación:
  ```sql
  SELECT 
    r.tipo,
    COUNT(*) as total_habitaciones,
    SUM(CASE WHEN r.estado = 'Ocupada' THEN 1 ELSE 0 END) as ocupadas,
    SUM(CASE WHEN r.estado = 'Reservada' THEN 1 ELSE 0 END) as reservadas,
    SUM(CASE WHEN r.estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles
  FROM rooms r
  LEFT JOIN reservation_rooms rr ON r.id = rr.room_id 
    AND :date BETWEEN rr.check_in AND rr.check_out
  WHERE rr.id IS NULL OR rr.id IS NOT NULL
  GROUP BY r.tipo
  ```
- [ ] Calcular porcentaje de ocupación: `(ocupadas / total) * 100`
- [ ] Si se envía filtro `status`, aplicar WHERE adicional: `reservations.status IN (:statuses)`
- [ ] Retornar JSON estructurado:
  ```json
  {
    "date": "2025-05-30",
    "summary": [
      {
        "roomType": "Estándar",
        "total": 20,
        "occupied": 15,
        "reserved": 3,
        "available": 2,
        "occupancyPercentage": 75
      },
      {...}
    ]
  }
  ```

### Frontend
- [ ] Crear componente `DailyOccupancyReport.tsx`
- [ ] Implementar date picker con label "Fecha de consulta" (default: fecha actual - 30/05/2025)
- [ ] Agregar filtros de estado con checkboxes: "Confirmada", "En curso" (ambos seleccionados por defecto)
- [ ] Crear botón "Consultar" que llame a GET `/api/occupancy/daily`
- [ ] Mostrar resumen en cards agrupados por tipo de habitación:
  ```
  📊 ESTÁNDAR
  Total: 20 | Ocupadas: 15 | Reservadas: 3 | Disponibles: 2
  Ocupación: 75%
  [Barra de progreso visual]
  ```
- [ ] Implementar gráfico de barras con Recharts/Chart.js mostrando ocupación por tipo
- [ ] Agregar gráfico de torta (pie chart) con distribución porcentual de estados
- [ ] Implementar código de colores: verde (disponibles), amarillo (reservadas), rojo (ocupadas)
- [ ] Crear tabla detallada debajo con los números exactos
- [ ] Agregar botón "Exportar a PDF" que genere reporte visual con `jsPDF`
- [ ] Implementar mensaje "Sin ocupación registrada" si no hay datos para la fecha
- [ ] Mostrar timestamp de última actualización: "Datos actualizados a las 03:20 PM -03, 30/05/2025"

### Testing
- [ ] Test unitario: verificar cálculo correcto de porcentaje (15 ocupadas / 20 total = 75%)
- [ ] Test de integración: consultar ocupación para fecha con múltiples reservas y verificar agregación correcta
- [ ] Test de integración: aplicar filtro de estado y verificar que solo cuente reservas con ese estado
- [ ] Test E2E: consultar ocupación para fecha actual, verificar gráficos y exportar PDF
- [ ] Test de performance: consultar ocupación en base con 500 habitaciones y verificar tiempo < 1 segundo

---

## CUD07 - Gestión de Clientes

### Backend
- [ ] Crear endpoint GET `/api/clients/menu` que retorne opciones del módulo (Crear, Modificar, Borrar, Ver detalles)
- [ ] Reutilizar middleware de autenticación de CUD01
- [ ] Documentar todos los sub-endpoints en Swagger con ejemplos

### Frontend
- [ ] Crear componente `ClientManagementDashboard.tsx`
- [ ] Implementar layout con 4 cards/botones principales: Crear perfil, Modificar perfil, Borrar perfil, Ver detalles
- [ ] Agregar iconos descriptivos para cada acción (user-plus, edit, trash, info)
- [ ] Implementar navegación hacia los componentes correspondientes (CUD08-CUD11)
- [ ] Crear breadcrumb: "Inicio > Gestión de Clientes"
- [ ] Agregar búsqueda rápida de cliente por DNI en el header del dashboard
- [ ] Implementar guard de ruta para validar autenticación

### Testing
- [ ] Test E2E: navegar desde dashboard principal → gestión de clientes → cada sub-módulo
- [ ] Test de autorización: verificar que usuario sin rol de recepcionista sea redirigido

---

## CUD08 - Crear Perfil de Cliente

### Backend (Clean Architecture)

#### Domain Layer
- [ ] **Entidad `Client`**: `src/domain/entities/client.entity.ts`
  - [ ] Crear clase `Client` con propiedades privadas: `_id`, `_dni`, `_firstName`, `_lastName`, `_email`, `_phone`, `_password`, `_isActive`, `_createdAt`, `_updatedAt`
  - [ ] Implementar factory method estático `Client.create(dni: DNI, firstName: string, lastName: string, email: Email, phone?: string)` que valide datos y retorne instancia
  - [ ] Implementar método estático `Client.generatePassword(): string` que genere contraseña de 8 caracteres alfanuméricos usando `crypto.randomBytes(4).toString('hex')`
  - [ ] Implementar método `setPassword(hashedPassword: string): void` para asignar password hasheado
  - [ ] Agregar getters para todas las propiedades
  - [ ] Agregar método `toPlainObject()` para serialización

- [ ] **Value Objects**: `src/domain/value-objects/`
  - [ ] Crear `DNI` class con:
    - Constructor privado que almacene `_value: string`
    - Factory method estático `DNI.create(value: string): DNI` que valide con regex `/^[0-9]{7,8}$/`
    - Lanzar `InvalidDNIException` si formato inválido
    - Getter `value: string`
    - Método `equals(other: DNI): boolean`
  - [ ] Crear `Email` class con:
    - Constructor privado que almacene `_value: string` normalizado (toLowerCase)
    - Factory method estático `Email.create(value: string): Email` que valide con regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
    - Lanzar `InvalidEmailException` si formato inválido
    - Getter `value: string`
    - Método `equals(other: Email): boolean`
  - [ ] Crear `Phone` class (opcional) con:
    - Constructor privado que almacene `_value: string`
    - Factory method estático `Phone.create(value: string): Phone` que valide con regex `/^[0-9]{7,15}$/`
    - Lanzar `InvalidPhoneException` si formato inválido
    - Getter `value: string`

- [ ] **Excepciones de Dominio**: `src/domain/exceptions/`
  - [ ] `InvalidDNIException`: mensaje "DNI inválido. Debe tener entre 7 y 8 dígitos numéricos."
  - [ ] `InvalidEmailException`: mensaje "Email inválido. Formato requerido: usuario@dominio.com"
  - [ ] `InvalidPhoneException`: mensaje "Teléfono inválido. Debe tener entre 7 y 15 dígitos numéricos."
  - [ ] `ClientAlreadyExistsException`: constructor que acepte DNI y mensaje "Cliente con DNI {dni} ya existe."

- [ ] **Interfaz de Repositorio**: `src/domain/repositories/client.repository.interface.ts`
  - [ ] Declarar `IClientRepository` con métodos:
    - `findByDNI(dni: DNI): Promise<Client | null>`
    - `findByEmail(email: Email): Promise<Client | null>`
    - `save(client: Client): Promise<Client>`
    - `findById(id: number): Promise<Client | null>`

- [ ] **Interfaz de Servicio**: `src/domain/services/hash.service.interface.ts`
  - [ ] Declarar `IHashService` con métodos:
    - `hash(plainText: string): Promise<string>`
    - `compare(plainText: string, hashed: string): Promise<boolean>`

#### Application Layer
- [ ] **DTOs**: `src/application/dtos/client/`
  - [ ] Crear `CreateClientDto`:
    ```typescript
    export class CreateClientDto {
      dni: string;           // Required, 7-8 dígitos numéricos
      firstName: string;     // Required, min 2 caracteres
      lastName: string;      // Required, min 2 caracteres
      email: string;         // Required, formato email válido
      phone?: string;        // Optional, 7-15 dígitos numéricos
    }
    ```
  - [ ] Crear `ClientResponseDto`:
    ```typescript
    export class ClientResponseDto {
      id: number;
      dni: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
    ```
  - [ ] Crear `ClientCreatedResponseDto` (extiende `ClientResponseDto`):
    ```typescript
    export class ClientCreatedResponseDto extends ClientResponseDto {
      temporaryPassword: string;  // Password en texto plano (solo en creación)
    }
    ```

- [ ] **Use Case**: `src/application/use-cases/client/create-client.use-case.ts`
  - [ ] Inyectar dependencias:
    - `@Inject('IClientRepository') private clientRepository: IClientRepository`
    - `@Inject('IHashService') private hashService: IHashService`
    - `@Inject('INotificationService') private notificationService: INotificationService`
  - [ ] Implementar método `execute(dto: CreateClientDto): Promise<ClientCreatedResponseDto>`:
    1. Crear Value Objects: `DNI.create(dto.dni)`, `Email.create(dto.email)`, `Phone.create(dto.phone)` si existe
    2. Verificar que DNI no exista: `await clientRepository.findByDNI(dni)`, lanzar `ClientAlreadyExistsException` si existe
    3. Verificar que Email no exista: `await clientRepository.findByEmail(email)`, lanzar error si existe
    4. Generar contraseña temporal: `const plainPassword = Client.generatePassword()`
    5. Hashear contraseña: `const hashedPassword = await hashService.hash(plainPassword)`
    6. Crear entidad: `const client = Client.create(dni, dto.firstName, dto.lastName, email, dto.phone)`
    7. Asignar password hasheado: `client.setPassword(hashedPassword)`
    8. Persistir: `const savedClient = await clientRepository.save(client)`
    9. Enviar notificación: `await notificationService.sendWelcomeEmail(savedClient.email.value, plainPassword)`
    10. Retornar DTO con password temporal incluido

- [ ] **Módulo de Use Cases**: `src/application/use-cases/client/client-use-cases.module.ts`
  - [ ] Importar `TypeOrmPersistenceModule` y `SecurityModule`
  - [ ] Importar `NotificationModule` (si existe)
  - [ ] Exportar `CreateClientUseCase`

#### Infrastructure Layer
- [ ] **Entidad ORM**: `src/infrastructure/persistence/typeorm/entities/client.orm-entity.ts`
  - [ ] Decorar con `@Entity('clients')`
  - [ ] Columnas:
    - `@PrimaryGeneratedColumn() id: number`
    - `@Column({ unique: true, length: 8 }) dni: string`
    - `@Column({ name: 'first_name', length: 100 }) firstName: string`
    - `@Column({ name: 'last_name', length: 100 }) lastName: string`
    - `@Column({ unique: true, length: 255 }) email: string`
    - `@Column({ nullable: true, length: 15 }) phone: string | null`
    - `@Column({ length: 255 }) password: string`
    - `@Column({ name: 'is_active', default: true }) isActive: boolean`
    - `@CreateDateColumn({ name: 'created_at' }) createdAt: Date`
    - `@UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date`

- [ ] **Mapper**: `src/infrastructure/persistence/typeorm/mappers/client.mapper.ts`
  - [ ] Implementar `toDomain(orm: ClientOrmEntity): Client`:
    - Crear Value Objects desde strings: `DNI.create(orm.dni)`, `Email.create(orm.email)`
    - Reconstruir entidad con constructor interno (usar Reflection o método `reconstruct`)
  - [ ] Implementar `toOrm(domain: Client): ClientOrmEntity`:
    - Mapear cada propiedad del dominio a la entidad ORM
    - Usar `.value` para extraer strings de Value Objects

- [ ] **Implementación de Repositorio**: `src/infrastructure/persistence/typeorm/repositories/client.repository.impl.ts`
  - [ ] Implementar `IClientRepository`
  - [ ] Inyectar `@InjectRepository(ClientOrmEntity) private repo: Repository<ClientOrmEntity>`
  - [ ] Inyectar `private mapper: ClientMapper`
  - [ ] Implementar cada método usando TypeORM y mapper:
    - `findByDNI`: `const orm = await this.repo.findOne({ where: { dni: dni.value, isActive: true } })`
    - `findByEmail`: similar pero buscar por email
    - `save`: convertir a ORM, hacer `this.repo.save(orm)`, reconvertir a dominio
    - `findById`: buscar por id

- [ ] **Registrar en `TypeOrmPersistenceModule`**:
  - [ ] Agregar `ClientOrmEntity` al array de `TypeOrmModule.forFeature`
  - [ ] Agregar `ClientMapper` al array de providers
  - [ ] Agregar provider con `useClass`:
    ```typescript
    {
      provide: 'IClientRepository',
      useClass: TypeOrmClientRepository,
    }
    ```
  - [ ] Exportar `'IClientRepository'`

#### Presentation Layer
- [ ] **DTOs de Request**: `src/presentation/dtos/client/`
  - [ ] Crear `CreateClientRequestDto`:
    ```typescript
    import { IsString, IsEmail, IsOptional, Matches, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
    import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

    export class CreateClientRequestDto {
      @ApiProperty({ example: '12345678', description: 'DNI del cliente (7-8 dígitos)' })
      @IsNotEmpty({ message: 'El DNI es obligatorio' })
      @IsString()
      @Matches(/^[0-9]{7,8}$/, { message: 'El DNI debe tener entre 7 y 8 dígitos numéricos' })
      dni: string;

      @ApiProperty({ example: 'Juan', description: 'Nombre del cliente' })
      @IsNotEmpty({ message: 'El nombre es obligatorio' })
      @IsString()
      @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
      @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
      firstName: string;

      @ApiProperty({ example: 'Pérez', description: 'Apellido del cliente' })
      @IsNotEmpty({ message: 'El apellido es obligatorio' })
      @IsString()
      @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
      @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
      lastName: string;

      @ApiProperty({ example: 'juan.perez@example.com', description: 'Email del cliente' })
      @IsNotEmpty({ message: 'El email es obligatorio' })
      @IsEmail({}, { message: 'El email debe tener un formato válido' })
      email: string;

      @ApiPropertyOptional({ example: '1123456789', description: 'Teléfono del cliente (opcional, 7-15 dígitos)' })
      @IsOptional()
      @IsString()
      @Matches(/^[0-9]{7,15}$/, { message: 'El teléfono debe tener entre 7 y 15 dígitos numéricos' })
      phone?: string;
    }
    ```
  - [ ] Crear `CheckDniResponseDto`:
    ```typescript
    export class CheckDniResponseDto {
      exists: boolean;
      message: string;
    }
    ```

- [ ] **Controller**: `src/presentation/controllers/client.controller.ts`
  - [ ] Decorar clase con `@ApiTags('Clients')` y `@Controller('clients')`
  - [ ] Implementar endpoint **POST `/api/v1/clients`**:
    - Decorar con `@RequireAction('clientes.crear')`
    - Decorar con `@ApiOperation({ summary: 'Crear nuevo cliente' })`
    - Decorar con `@ApiResponse({ status: 201, description: 'Cliente creado exitosamente', type: ClientCreatedResponseDto })`
    - Decorar con `@ApiResponse({ status: 400, description: 'Datos inválidos' })`
    - Decorar con `@ApiResponse({ status: 409, description: 'Cliente ya existe' })`
    - Inyectar `CreateClientUseCase`
    - Método: `async create(@Body() dto: CreateClientRequestDto): Promise<ClientCreatedResponseDto>`
    - Try-catch para capturar `ClientAlreadyExistsException` y lanzar `ConflictException`
    - Try-catch para capturar excepciones de Value Objects y lanzar `BadRequestException`
    - Retornar con status 201 y header `Location: /api/v1/clients/${result.id}`
    - Seguir estructura de respuesta estándar con `success: true`, `data`, `message`, `timestamp`

  - [ ] Implementar endpoint **GET `/api/v1/clients/check-dni/:dni`**:
    - Decorar con `@RequireAction('clientes.ver')`
    - Decorar con `@ApiOperation({ summary: 'Verificar disponibilidad de DNI' })`
    - Decorar con `@ApiParam({ name: 'dni', description: 'DNI a verificar' })`
    - Decorar con `@ApiResponse({ status: 200, description: 'Resultado de verificación', type: CheckDniResponseDto })`
    - Método: `async checkDni(@Param('dni') dni: string): Promise<CheckDniResponseDto>`
    - Llamar al repositorio para buscar por DNI
    - Retornar `{ exists: boolean, message: string }`
    - Si existe: `{ exists: true, message: 'DNI ya registrado' }`
    - Si no existe: `{ exists: false, message: 'DNI disponible' }`

- [ ] **Exception Filter Global** (si no existe): `src/presentation/filters/domain-exception.filter.ts`
  - [ ] Implementar `@Catch()` que capture excepciones de dominio
  - [ ] Mapear `ClientAlreadyExistsException` → 409 Conflict
  - [ ] Mapear `InvalidDNIException`, `InvalidEmailException`, `InvalidPhoneException` → 400 Bad Request
  - [ ] Retornar estructura estándar de error con `success: false`, `error`, `message`, `details`, `timestamp`

- [ ] **Módulo de Presentación**: `src/presentation/controllers/client-presentation.module.ts`
  - [ ] Importar `ClientUseCasesModule`
  - [ ] Declarar `ClientController`
  - [ ] Exportar si es necesario

- [ ] **Registrar en `AppModule`**:
  - [ ] Agregar `ClientPresentationModule` al array de imports

#### Notifications (Infrastructure)
- [ ] **Email Service**: `src/infrastructure/notifications/email/email.service.ts`
  - [ ] Implementar método `sendWelcomeEmail(email: string, temporaryPassword: string): Promise<void>`
  - [ ] Template de email:
    ```html
    Asunto: Bienvenido a MyHotelFlow

    Estimado cliente,

    Su perfil ha sido creado exitosamente en MyHotelFlow.

    Credenciales de acceso:
    - Email: {email}
    - Contraseña temporal: {temporaryPassword}

    Por seguridad, le recomendamos cambiar su contraseña en su primer inicio de sesión.

    Link para cambiar contraseña: {frontendUrl}/auth/change-password

    Instrucciones:
    1. Inicie sesión con las credenciales proporcionadas
    2. Vaya a "Mi Perfil" > "Cambiar Contraseña"
    3. Ingrese una contraseña nueva y segura

    ¡Gracias por elegirnos!
    Equipo MyHotelFlow
    ```
  - [ ] Usar servicio de email configurado (NodeMailer, SendGrid, etc.)
  - [ ] Implementar manejo de errores (log pero no fallar si el email no se envía)

### Frontend

#### Componente Principal
- [ ] **Crear `CreateClientProfile.tsx`**: `src/pages/clients/CreateClientProfile.tsx`
  - [ ] Importar React Hook Form: `useForm` con schema Zod
  - [ ] Importar React Query: `useMutation` para llamadas API
  - [ ] Importar componentes UI del Design System
  - [ ] Implementar estados locales:
    - `dniChecking: boolean` para loading de verificación DNI
    - `dniAvailable: boolean | null` para resultado de verificación
    - `createdClient: ClientCreatedResponseDto | null` para mostrar modal de éxito

#### Schema de Validación con Zod
- [ ] Crear schema `createClientSchema`:
  ```typescript
  import { z } from 'zod';

  export const createClientSchema = z.object({
    dni: z.string()
      .min(7, 'El DNI debe tener al menos 7 dígitos')
      .max(8, 'El DNI debe tener máximo 8 dígitos')
      .regex(/^[0-9]+$/, 'El DNI debe contener solo números'),
    firstName: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
    lastName: z.string()
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(100, 'El apellido no puede exceder 100 caracteres')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
    email: z.string()
      .email('Ingrese un email válido')
      .max(255, 'El email no puede exceder 255 caracteres'),
    phone: z.string()
      .regex(/^[0-9]{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos')
      .optional()
      .or(z.literal('')),
  });

  export type CreateClientFormData = z.infer<typeof createClientSchema>;
  ```

#### Estructura del Formulario
- [ ] **Paso 1: Verificación de DNI**
  - [ ] Input de DNI con:
    - Validación en tiempo real (solo números)
    - Max length 8 caracteres
    - Formateo automático (sin guiones ni espacios)
    - Mensaje de error si < 7 dígitos
  - [ ] Botón "Verificar disponibilidad":
    - Deshabilitado si DNI inválido
    - Muestra spinner mientras verifica
    - Llama a `GET /api/v1/clients/check-dni/:dni`
  - [ ] Mostrar feedback visual:
    - Si DNI existe: badge rojo "DNI ya registrado" + botón "Buscar cliente existente"
    - Si DNI disponible: badge verde "DNI disponible" + habilitar formulario

- [ ] **Paso 2: Datos del Cliente**
  - [ ] Input "Nombre":
    - Placeholder: "Ej: Juan"
    - Validación: min 2 caracteres, solo letras
    - Capitalizar primera letra automáticamente
  - [ ] Input "Apellido":
    - Placeholder: "Ej: Pérez"
    - Validación: min 2 caracteres, solo letras
    - Capitalizar primera letra automáticamente
  - [ ] Input "Email":
    - Type email
    - Placeholder: "ejemplo@correo.com"
    - Validación de formato en tiempo real
    - Normalizar a minúsculas
  - [ ] Input "Teléfono" (opcional):
    - Placeholder: "Ej: 1123456789"
    - Type tel
    - Validación: 7-15 dígitos si se completa
    - Mostrar label "(Opcional)"

- [ ] **Paso 3: Confirmación**
  - [ ] Mostrar resumen de datos ingresados:
    ```
    DNI: 12345678
    Nombre completo: Juan Pérez
    Email: juan.perez@example.com
    Teléfono: 1123456789
    ```
  - [ ] Checkbox de confirmación:
    - "He verificado que los datos son correctos"
    - Requerido para habilitar botón "Crear cliente"
  - [ ] Información sobre contraseña:
    - Badge azul: "Se generará una contraseña segura automáticamente"
    - Texto: "La contraseña será enviada al email del cliente"

#### Botones de Acción
- [ ] Botón "Volver atrás":
  - Navegar a página anterior o dashboard de clientes
  - Mostrar modal de confirmación si hay datos sin guardar
- [ ] Botón "Limpiar formulario":
  - Reset de React Hook Form
  - Confirmación antes de limpiar
- [ ] Botón "Crear cliente":
  - Primario con estilo del Design System
  - Deshabilitado hasta que:
    - DNI verificado y disponible
    - Todos los campos requeridos válidos
    - Checkbox de confirmación marcado
  - Mostrar spinner mientras crea
  - Texto: "Creando cliente..."

#### Manejo de Respuestas
- [ ] **Éxito (201 Created)**:
  - [ ] Mostrar modal de éxito con:
    - Icono de check verde
    - Título: "Cliente creado exitosamente"
    - Información del cliente:
      ```
      DNI: 12345678
      Nombre: Juan Pérez
      Email: juan.perez@example.com
      Contraseña temporal: ab3f9d21
      ```
    - Badge de advertencia: "Esta contraseña no se mostrará nuevamente"
    - Botón "Copiar contraseña" con icono
    - Botón "Enviar email con contraseña" (si falla envío automático)
  - [ ] Opciones de acción:
    - Botón primario: "Crear reserva para este cliente" → redirigir a CUD02 con DNI precargado
    - Botón secundario: "Ver perfil del cliente" → redirigir a detalles del cliente
    - Botón ghost: "Crear otro cliente" → limpiar formulario y cerrar modal

- [ ] **Error (409 Conflict - DNI duplicado)**:
  - [ ] Toast/Alert de error rojo
  - [ ] Mensaje: "El DNI ya está registrado en el sistema"
  - [ ] Botón: "Buscar cliente existente" → redirigir a búsqueda con DNI

- [ ] **Error (400 Bad Request - Validación)**:
  - [ ] Mostrar errores específicos en cada campo
  - [ ] Resaltar campos con error en rojo
  - [ ] Scroll automático al primer campo con error
  - [ ] Mensaje general: "Por favor corrija los errores en el formulario"

- [ ] **Error (500 Internal Server Error)**:
  - [ ] Toast de error genérico
  - [ ] Mensaje: "Ocurrió un error al crear el cliente. Por favor intente nuevamente"
  - [ ] Opción para reportar el error

#### Accesibilidad y UX
- [ ] Labels descriptivos para todos los inputs
- [ ] `aria-labels` en botones con solo iconos
- [ ] Mensajes de error asociados con `aria-describedby`
- [ ] Navegación por teclado (Tab order lógico)
- [ ] Focus visible en todos los elementos interactivos
- [ ] Feedback visual para estados de carga
- [ ] Breadcrumb: "Inicio > Clientes > Crear Perfil"
- [ ] Tooltip en icono de ayuda con ejemplo de datos válidos

#### Estilos (Tailwind según Design System)
- [ ] Container principal: `max-w-2xl mx-auto px-4 py-8`
- [ ] Card de formulario: `bg-white rounded-lg shadow-md p-6`
- [ ] Inputs: clase base del Design System con estados focus/error
- [ ] Botón primario: `bg-primary-600 hover:bg-primary-700 text-white`
- [ ] Badges: usar clases del Design System para éxito/error/info
- [ ] Responsive: formulario en 1 columna en mobile, 2 columnas en tablet+

### Base de Datos

#### Migraciones
- [ ] Verificar tabla `clients` existe con columnas:
  ```sql
  CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(8) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(15) NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  ```

#### Índices
- [ ] Crear índice único en `dni`:
  ```sql
  CREATE UNIQUE INDEX idx_clients_dni ON clients(dni) WHERE is_active = true;
  ```
- [ ] Crear índice único en `email`:
  ```sql
  CREATE UNIQUE INDEX idx_clients_email ON clients(email) WHERE is_active = true;
  ```
- [ ] Crear índice compuesto para búsquedas:
  ```sql
  CREATE INDEX idx_clients_search ON clients(first_name, last_name, is_active);
  ```

#### Constraints
- [ ] Verificar constraint `CHECK (length(dni) >= 7 AND length(dni) <= 8)`
- [ ] Verificar constraint `CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$')`
- [ ] Verificar constraint `CHECK (phone IS NULL OR length(phone) >= 7)`

### Testing

#### Tests Unitarios (Domain)
- [ ] **Value Object `DNI`**:
  - [ ] Test: crear DNI válido con 7 dígitos → debe retornar instancia
  - [ ] Test: crear DNI válido con 8 dígitos → debe retornar instancia
  - [ ] Test: crear DNI con 6 dígitos → debe lanzar `InvalidDNIException`
  - [ ] Test: crear DNI con 9 dígitos → debe lanzar `InvalidDNIException`
  - [ ] Test: crear DNI con letras → debe lanzar `InvalidDNIException`
  - [ ] Test: método `equals` con DNIs iguales → debe retornar true
  - [ ] Test: método `equals` con DNIs diferentes → debe retornar false

- [ ] **Value Object `Email`**:
  - [ ] Test: crear email válido → debe retornar instancia y normalizar a minúsculas
  - [ ] Test: crear email sin `@` → debe lanzar `InvalidEmailException`
  - [ ] Test: crear email sin dominio → debe lanzar `InvalidEmailException`
  - [ ] Test: crear email con espacios → debe lanzar `InvalidEmailException`
  - [ ] Test: normalización: "TEST@Example.COM" → "test@example.com"

- [ ] **Entidad `Client`**:
  - [ ] Test: crear cliente con datos válidos → debe retornar instancia con valores correctos
  - [ ] Test: `generatePassword()` → debe retornar string de 8 caracteres alfanuméricos
  - [ ] Test: ejecutar `generatePassword()` 1000 veces → verificar que no haya duplicados (probabilidad muy baja)
  - [ ] Test: `generatePassword()` → debe contener solo caracteres [a-f0-9] (hexadecimal)

#### Tests Unitarios (Application)
- [ ] **Use Case `CreateClientUseCase`**:
  - [ ] Mock de `IClientRepository`, `IHashService`, `INotificationService`
  - [ ] Test: crear cliente exitosamente:
    - Setup: mock `findByDNI` retorna null, `findByEmail` retorna null
    - Ejecutar use case con datos válidos
    - Verificar: `clientRepository.save` llamado 1 vez con cliente correcto
    - Verificar: `hashService.hash` llamado 1 vez con password generado
    - Verificar: `notificationService.sendWelcomeEmail` llamado 1 vez
    - Verificar: retorna `ClientCreatedResponseDto` con `temporaryPassword`
  - [ ] Test: DNI duplicado → debe lanzar `ClientAlreadyExistsException`:
    - Setup: mock `findByDNI` retorna un cliente existente
    - Ejecutar use case
    - Verificar: lanza excepción con mensaje correcto
    - Verificar: `save` NO fue llamado
  - [ ] Test: Email duplicado → debe lanzar error:
    - Setup: mock `findByEmail` retorna un cliente existente
    - Ejecutar use case
    - Verificar: lanza excepción
  - [ ] Test: DNI inválido → debe lanzar `InvalidDNIException`:
    - Ejecutar con DTO con dni "12345" (solo 5 dígitos)
    - Verificar: lanza excepción al crear Value Object
  - [ ] Test: verificar que password temporal se incluya en response

#### Tests de Integración (Backend)
- [ ] **Endpoint POST `/api/v1/clients`**:
  - [ ] Test con base de datos en memoria (SQLite o PostgreSQL Testcontainer)
  - [ ] Test: crear cliente completo con todos los campos:
    - Enviar request con datos válidos incluyendo teléfono
    - Verificar: status 201 Created
    - Verificar: header `Location` presente
    - Verificar: response contiene `temporaryPassword`
    - Verificar: cliente existe en base de datos con password hasheado (no plano)
    - Verificar: email en base de datos está normalizado a minúsculas
  - [ ] Test: crear cliente sin teléfono (campo opcional):
    - Enviar request sin campo `phone`
    - Verificar: status 201
    - Verificar: cliente creado con `phone: null`
  - [ ] Test: DNI duplicado:
    - Insertar cliente con DNI "12345678"
    - Intentar crear otro con mismo DNI
    - Verificar: status 409 Conflict
    - Verificar: response con estructura de error estándar
    - Verificar: mensaje "Cliente con DNI 12345678 ya existe"
  - [ ] Test: Email duplicado:
    - Insertar cliente con email "test@example.com"
    - Intentar crear otro con mismo email (diferentes mayúsculas "TEST@example.com")
    - Verificar: status 409 o 400
  - [ ] Test: validación de DNI inválido (6 dígitos):
    - Enviar request con `dni: "123456"`
    - Verificar: status 400 Bad Request
    - Verificar: error en campo `dni`
  - [ ] Test: validación de email inválido:
    - Enviar request con `email: "invalido"`
    - Verificar: status 400
    - Verificar: error en campo `email`
  - [ ] Test: validación de teléfono inválido (letras):
    - Enviar request con `phone: "abc1234"`
    - Verificar: status 400
    - Verificar: error en campo `phone`
  - [ ] Test: campos faltantes (nombre vacío):
    - Enviar request sin `firstName`
    - Verificar: status 400
    - Verificar: error indicando campo requerido
  - [ ] Test: verificar que password se hashee con Argon2id:
    - Crear cliente
    - Consultar base de datos directamente
    - Verificar: `password` empieza con `$argon2id$`
    - Verificar: password NO es igual al temporal retornado
  - [ ] Test: verificar estructura de respuesta estándar:
    - Crear cliente exitosamente
    - Verificar response tiene:
      ```json
      {
        "success": true,
        "data": { ...ClientCreatedResponseDto },
        "message": "Cliente creado exitosamente",
        "timestamp": "ISO 8601 date"
      }
      ```

- [ ] **Endpoint GET `/api/v1/clients/check-dni/:dni`**:
  - [ ] Test: DNI disponible:
    - Llamar con DNI no existente
    - Verificar: status 200
    - Verificar: `{ exists: false, message: "DNI disponible" }`
  - [ ] Test: DNI ya registrado:
    - Insertar cliente con DNI "12345678"
    - Llamar con ese DNI
    - Verificar: status 200
    - Verificar: `{ exists: true, message: "DNI ya registrado" }`
  - [ ] Test: DNI con formato inválido:
    - Llamar con DNI "123" (menos de 7 dígitos)
    - Verificar: status 400 o manejar en endpoint
  - [ ] Test: cliente inactivo no cuenta como existente:
    - Insertar cliente con `is_active = false`
    - Llamar check-dni
    - Verificar: `exists: false`

#### Tests de Integración (Frontend)
- [ ] **Componente `CreateClientProfile`**:
  - [ ] Test: renderizado inicial:
    - Montar componente
    - Verificar: input DNI visible y habilitado
    - Verificar: formulario de datos deshabilitado inicialmente
    - Verificar: botón "Crear cliente" deshabilitado
  - [ ] Test: validación de DNI en tiempo real:
    - Escribir "12345" en input DNI
    - Verificar: mensaje de error "El DNI debe tener al menos 7 dígitos"
    - Completar a "1234567"
    - Verificar: error desaparece
  - [ ] Test: verificación de DNI disponible:
    - Mock de API retorna `{ exists: false }`
    - Escribir DNI válido y hacer clic en "Verificar disponibilidad"
    - Esperar respuesta
    - Verificar: badge verde "DNI disponible" visible
    - Verificar: formulario de datos se habilita
  - [ ] Test: verificación de DNI existente:
    - Mock de API retorna `{ exists: true }`
    - Escribir DNI y verificar
    - Verificar: badge rojo "DNI ya registrado" visible
    - Verificar: botón "Buscar cliente existente" visible
    - Verificar: formulario de datos permanece deshabilitado
  - [ ] Test: validación de email:
    - Escribir "invalido" en campo email
    - Hacer blur (perder foco)
    - Verificar: mensaje de error "Ingrese un email válido"
  - [ ] Test: teléfono opcional:
    - Dejar campo teléfono vacío
    - Verificar: formulario aún puede ser válido
    - Escribir "123" (inválido)
    - Verificar: mensaje de error aparece
  - [ ] Test: envío del formulario exitoso:
    - Mock de API retorna 201 con cliente creado
    - Completar todos los campos válidos
    - Marcar checkbox de confirmación
    - Hacer clic en "Crear cliente"
    - Esperar respuesta
    - Verificar: modal de éxito aparece
    - Verificar: contraseña temporal visible en modal
    - Verificar: botón "Copiar contraseña" funciona
  - [ ] Test: manejo de error 409 (DNI duplicado):
    - Mock de API retorna 409
    - Enviar formulario
    - Verificar: toast de error visible
    - Verificar: mensaje "El DNI ya está registrado"
  - [ ] Test: limpiar formulario:
    - Completar campos
    - Hacer clic en "Limpiar formulario"
    - Confirmar en modal
    - Verificar: todos los campos vacíos
    - Verificar: DNI no verificado (debe verificar nuevamente)

#### Tests E2E (Cypress / Playwright)
- [ ] **Flujo completo: Crear cliente desde cero**:
  - [ ] Iniciar sesión como Recepcionista con permiso `clientes.crear`
  - [ ] Navegar a "Clientes" > "Crear Perfil"
  - [ ] Ingresar DNI "98765432"
  - [ ] Hacer clic en "Verificar disponibilidad"
  - [ ] Esperar badge verde
  - [ ] Completar formulario:
    - Nombre: "María"
    - Apellido: "González"
    - Email: "maria.gonzalez@test.com"
    - Teléfono: "1198765432"
  - [ ] Marcar checkbox de confirmación
  - [ ] Hacer clic en "Crear cliente"
  - [ ] Esperar modal de éxito
  - [ ] Copiar contraseña temporal
  - [ ] Hacer clic en "Crear reserva para este cliente"
  - [ ] Verificar: redirige a formulario de reserva con DNI precargado

- [ ] **Flujo: Intentar crear cliente con DNI duplicado**:
  - [ ] Crear cliente con DNI "11111111" via API (setup)
  - [ ] Iniciar sesión
  - [ ] Navegar a formulario
  - [ ] Ingresar DNI "11111111" y verificar
  - [ ] Verificar: badge rojo "DNI ya registrado"
  - [ ] Hacer clic en "Buscar cliente existente"
  - [ ] Verificar: redirige a búsqueda de cliente

- [ ] **Flujo: Validación de campos requeridos**:
  - [ ] Navegar a formulario
  - [ ] Verificar DNI válido
  - [ ] Intentar enviar formulario sin completar nombre
  - [ ] Verificar: error "El nombre es obligatorio"
  - [ ] Verificar: scroll automático al campo con error
  - [ ] Completar nombre
  - [ ] Intentar enviar sin email
  - [ ] Verificar: error en email

- [ ] **Flujo: Crear cliente y luego crear reserva**:
  - [ ] Crear cliente "Carlos Ruiz" con DNI "22222222"
  - [ ] En modal de éxito, hacer clic en "Crear reserva para este cliente"
  - [ ] Verificar: formulario de reserva CUD02 se carga
  - [ ] Verificar: campo DNI está precargado con "22222222"
  - [ ] Verificar: datos del cliente aparecen automáticamente

#### Tests de Seguridad
- [ ] Test: verificar que password nunca se exponga en logs
- [ ] Test: verificar que password hasheado sea diferente cada vez (salt único)
- [ ] Test: verificar que endpoint requiera autenticación (token JWT)
- [ ] Test: verificar que endpoint requiera permiso `clientes.crear`
- [ ] Test: intentar crear cliente sin permiso → debe retornar 403 Forbidden
- [ ] Test: SQL injection en campo DNI → debe ser sanitizado
- [ ] Test: XSS en campo nombre → debe ser escapado

#### Tests de Performance
- [ ] Test: generación de 10,000 contraseñas debe tomar < 1 segundo
- [ ] Test: hasheo de password con Argon2id debe tomar < 500ms
- [ ] Test: endpoint debe responder en < 1 segundo bajo carga normal
- [ ] Test: verificación de DNI debe responder en < 200ms

#### Tests de Notificaciones
- [ ] Test: mock del servicio de email:
  - Crear cliente
  - Verificar: `sendWelcomeEmail` fue llamado con email y password correctos
  - Verificar: template de email contiene información del cliente
- [ ] Test: fallo en envío de email no debe impedir creación:
  - Mock de email service lanza error
  - Crear cliente
  - Verificar: cliente se crea exitosamente (status 201)
  - Verificar: se loggea el error del email
  - Verificar: response indica que email no se envió

### Documentación

#### API Documentation (Swagger)
- [ ] Documentar endpoint POST `/api/v1/clients` con:
  - [ ] Descripción detallada
  - [ ] Ejemplo de request body
  - [ ] Ejemplos de respuestas (201, 400, 409)
  - [ ] Indicar autenticación requerida
  - [ ] Indicar permiso requerido: `clientes.crear`

- [ ] Documentar endpoint GET `/api/v1/clients/check-dni/:dni` con:
  - [ ] Descripción
  - [ ] Parámetros
  - [ ] Ejemplos de respuesta

#### Comentarios en Código
- [ ] Documentar cada método público con TSDoc/JSDoc
- [ ] Comentar patrones de diseño utilizados
- [ ] Agregar TODOs para mejoras futuras (ej: envío de SMS)

#### Guía de Usuario (README del módulo)
- [ ] Crear `src/modules/clients/README.md` con:
  - [ ] Descripción del módulo
  - [ ] Casos de uso implementados
  - [ ] Estructura de carpetas
  - [ ] Cómo agregar nuevos features

---

### Checklist de Finalización

#### Pre-deployment
- [ ] Ejecutar todos los tests: `npm run test`
- [ ] Verificar cobertura de tests > 80%: `npm run test:cov`
- [ ] Ejecutar linter: `npm run lint`
- [ ] Ejecutar formatter: `npm run format`
- [ ] Verificar que no haya console.logs en producción
- [ ] Ejecutar typecheck: `npm run typecheck`
- [ ] Verificar que build funcione: `npm run build`
- [ ] Ejecutar tests E2E: `npm run test:e2e`

#### Code Review
- [ ] Verificar que se sigan las convenciones de MEJORES_PRACTICAS.md
- [ ] Verificar estructura de Clean Architecture
- [ ] Verificar que no haya lógica de negocio en controllers
- [ ] Verificar que todos los DTOs tengan validaciones
- [ ] Verificar manejo de errores consistente
- [ ] Verificar logs de auditoría para acciones críticas
- [ ] Verificar que passwords nunca se logueen

#### Deployment
- [ ] Ejecutar migraciones en base de datos de staging
- [ ] Verificar que índices se creen correctamente
- [ ] Verificar que servicio de email esté configurado
- [ ] Verificar variables de entorno necesarias
- [ ] Desplegar backend a staging
- [ ] Desplegar frontend a staging
- [ ] Ejecutar smoke tests en staging
- [ ] Obtener aprobación de QA
- [ ] Desplegar a producción
- [ ] Monitorear logs por 24 horas

---

## Relación con CUD02 (Crear Reserva)

### Flujo Integrado
1. Usuario intenta crear reserva (CUD02)
2. Ingresa DNI de cliente
3. DNI no existe en sistema
4. Frontend muestra botón "Crear nuevo cliente"
5. Redirige a CUD08 (Crear Perfil)
6. Usuario completa formulario y crea cliente
7. Modal de éxito muestra botón "Crear reserva ahora"
8. Redirige de vuelta a CUD02 con DNI precargado
9. Formulario de reserva continúa automáticamente con datos del cliente

### Implementación de la Redirección
- [ ] En `CreateReservationForm.tsx` (CUD02):
  - [ ] Al buscar DNI y no encontrar, mostrar botón "Crear nuevo cliente"
  - [ ] Botón redirige a `/clients/create?redirect=reservations&dni=12345678`
  - [ ] Guardar estado del formulario en sessionStorage antes de redirigir

- [ ] En `CreateClientProfile.tsx` (CUD08):
  - [ ] Leer query params `redirect` y `dni` de la URL
  - [ ] Si `redirect=reservations`, después de crear cliente:
    - Mostrar opción "Volver a crear reserva" en modal de éxito
    - Al hacer clic, redirigir a `/reservations/create?clientDni=X`
  - [ ] Si `dni` presente, precargar en campo DNI

- [ ] En `CreateReservationForm.tsx` (CUD02):
  - [ ] Leer query param `clientDni` de la URL
  - [ ] Si presente, buscar cliente automáticamente
  - [ ] Continuar con paso 2 del wizard automáticamente

---

## Notas de Implementación

### Seguridad
- Password temporal de 8 caracteres hexadecimales → 2^32 combinaciones (suficiente para temporal)
- Hasheo con Argon2id (implementado en `SecurityModule`)
- Password nunca se almacena en logs ni se expone excepto en response de creación
- Cliente debe cambiar password en primer login (implementar en CUD futuro)

### Performance
- Generación de password con `crypto.randomBytes` es rápida (< 1ms)
- Hasheo con Argon2id toma ~200-400ms (aceptable para creación de usuario)
- Índices en DNI y email optimizan búsquedas de duplicados
- Verificación de DNI se puede cachear brevemente (30 segundos) para evitar spam

### Escalabilidad
- Email enviado de forma asíncrona (no bloquear response)
- Si servicio de email falla, cliente igual se crea (log error, notificar admin)
- Considerar cola de mensajes (ej: Bull) para notificaciones en producción

### Mejoras Futuras
- [ ] Implementar verificación de email (link de confirmación)
- [ ] Agregar envío de SMS con password
- [ ] Implementar cambio de contraseña obligatorio en primer login
- [ ] Agregar 2FA opcional para clientes
- [ ] Implementar soft delete en lugar de borrado físico
- [ ] Agregar foto de perfil del cliente
- [ ] Implementar historial de cambios de perfil

---

## CUD09 - Modificar Perfil

### Backend
- [ ] Crear DTO `UpdateClientDto` con campos opcionales: nombre, apellido, email, telefono (todos pueden ser null)
- [ ] Implementar endpoint PATCH `/api/clients/:dni`
- [ ] Buscar cliente por DNI: `SELECT * FROM clients WHERE dni = :dni`
- [ ] Si no existe, retornar 404
- [ ] Actualizar solo los campos enviados en el DTO (merge con datos actuales)
- [ ] Si se modifica email, validar formato antes de actualizar
- [ ] Guardar cambios en base de datos y actualizar `updated_at`
- [ ] Llamar a `NotificationService.sendProfileUpdateEmail()` con lista de campos modificados
- [ ] Retornar cliente actualizado (sin password)
- [ ] Registrar modificación en `audit_logs`

### Frontend
- [ ] Crear componente `ModifyClientProfile.tsx`
- [ ] Implementar búsqueda inicial por DNI (input + botón "Buscar")
- [ ] Llamar a GET `/api/clients/:dni` para obtener datos actuales
- [ ] Mostrar formulario prellenado con: Nombre, Apellido, Email, Teléfono
- [ ] Permitir editar cualquier campo excepto DNI (mostrar DNI como readonly)
- [ ] Implementar validación en tiempo real para email modificado
- [ ] Resaltar campos modificados con color diferente (ej: borde azul)
- [ ] Crear botón "Guardar cambios" que llame a PATCH `/api/clients/:dni`
- [ ] Mostrar modal de confirmación: "Se modificarán los siguientes campos: Email, Teléfono. ¿Confirmar?"
- [ ] Después de modificar, mostrar notificación de éxito
- [ ] Manejar error 404: "Cliente no encontrado"
- [ ] Agregar botón "Cancelar" que restaure valores originales
- [ ] Implementar historial de cambios debajo del formulario (últimas 5 modificaciones con timestamps)

### Testing
- [ ] Test unitario: modificar solo email y verificar que otros campos no cambien
- [ ] Test de integración: modificar cliente y verificar actualización en base de datos
- [ ] Test de integración: verificar envío de email de notificación
- [ ] Test E2E: buscar cliente, modificar teléfono, confirmar y verificar cambio
- [ ] Test de validación: intentar actualizar con email inválido y verificar error 400

---

## CUD10 - Dar de Baja Cliente

### Backend
- [ ] Crear endpoint DELETE `/api/clients/:dni`
- [ ] Buscar cliente por DNI
- [ ] Si no existe, retornar 404
- [ ] Ejecutar query para verificar reservas activas:
  ```sql
  SELECT COUNT(*) FROM reservations 
  WHERE client_id = :clientId 
  AND status IN ('Confirmada', 'En curso')
  ```
- [ ] Si count > 0, retornar error 400: "No se puede borrar, hay reservas activas"
- [ ] Si count = 0, cambiar campo `active = false` en lugar de eliminar físicamente (soft delete)
- [ ] Llamar a `NotificationService.sendAccountDeletionEmail()`
- [ ] Registrar acción en `audit_logs` con detalles del cliente eliminado
- [ ] Retornar código 204 (No Content)

### Frontend
- [ ] Crear componente `DeleteClientProfile.tsx`
- [ ] Implementar búsqueda por DNI
- [ ] Llamar a GET `/api/clients/:dni` y mostrar datos del cliente en un card
- [ ] Mostrar warning prominente: "⚠️ Esta acción es irreversible" (aunque sea soft delete)
- [ ] Llamar a GET `/api/reservations?clientId=X&status=Confirmada,En curso` para verificar reservas activas
- [ ] Si hay reservas activas, mostrar tabla con las reservas y mensaje: "Debe cancelar estas reservas antes de eliminar el cliente"
- [ ] Deshabilitar botón "Eliminar cliente" si hay reservas activas
- [ ] Si no hay reservas activas, habilitar botón "Eliminar cliente" (color rojo)
- [ ] Crear modal de confirmación con doble verificación: "Escriba 'ELIMINAR' para confirmar"
- [ ] Al confirmar, llamar a DELETE `/api/clients/:dni`
- [ ] Mostrar notificación de éxito: "Cliente eliminado. Se envió notificación por email."
- [ ] Redirigir al dashboard de gestión de clientes
- [ ] Manejar error 400: mostrar mensaje "No se puede eliminar, hay reservas activas"

### Base de Datos
- [ ] Agregar columna `active BOOLEAN DEFAULT true` a tabla `clients`
- [ ] Modificar queries de búsqueda para incluir filtro `WHERE active = true` por defecto
- [ ] Crear vista `active_clients` que filtre solo clientes activos

### Testing
- [ ] Test unitario: intentar eliminar cliente con reserva activa y verificar error 400
- [ ] Test unitario: eliminar cliente sin reservas y verificar que `active = false`
- [ ] Test de integración: verificar que cliente eliminado no aparezca en búsquedas posteriores
- [ ] Test E2E: buscar cliente sin reservas, eliminar, verificar email de notificación
- [ ] Test de autorización: verificar que solo recepcionistas puedan eliminar clientes

---

## CUD11 - Ver Detalles Cliente

### Backend
- [ ] Crear endpoint GET `/api/clients/:dni/details`
- [ ] Buscar cliente por DNI y retornar: id, dni, nombre, apellido, email, telefono, created_at
- [ ] Ejecutar query para obtener historial de reservas:
  ```sql
  SELECT r.codigo, r.check_in, r.check_out, r.estado, 
         GROUP_CONCAT(rm.tipo) as tipos_habitacion, 
         COUNT(rr.room_id) as cantidad_habitaciones
  FROM reservations r
  JOIN reservation_rooms rr ON r.id = rr.reservation_id
  JOIN rooms rm ON rr.room_id = rm.id
  WHERE r.client_id = :clientId
  GROUP BY r.id
  ORDER BY r.created_at DESC
  ```
- [ ] Retornar objeto combinado: `{ client: {...}, reservations: [...] }`
- [ ] Si no existe el cliente, retornar 404

### Frontend
- [ ] Crear componente `ClientDetailsView.tsx`
- [ ] Implementar búsqueda por DNI
- [ ] Crear sección de "Datos personales" con card mostrando: DNI, Nombre completo, Email, Teléfono, Fecha de registro
- [ ] Agregar botones de acción: "Modificar datos" (link a CUD09), "Crear reserva" (link a CUD02)
- [ ] Implementar tabla de "Historial de reservas" con columnas: Código | Fechas | Tipo habitación | Estado | Acciones
- [ ] Ordenar reservas de más reciente a más antigua
- [ ] Agregar badges con colores según estado: verde (Confirmada), azul (En curso), rojo (Cancelada), gris (Finalizada)
- [ ] Implementar botones de acción en cada fila: "Ver detalles", "Modificar" (si estado = Confirmada), "Cancelar" (si estado = Confirmada)
- [ ] Mostrar mensaje "Sin reservas previas" si el historial está vacío
- [ ] Implementar estadísticas: "Total de reservas: X | Activas: Y | Canceladas: Z"
- [ ] Agregar gráfico de línea temporal con las reservas (eje X: fechas, eje Y: número de reserva)
- [ ] Crear botón "Imprimir perfil" que genere PDF con todos los datos
- [ ] Manejar error 404: "Cliente no encontrado"

### Testing
- [ ] Test unitario: verificar que reservas se ordenen correctamente (más reciente primero)
- [ ] Test de integración: buscar cliente con 5 reservas y verificar que todas aparezcan
- [ ] Test E2E: buscar cliente, visualizar historial, hacer clic en "Modificar reserva"
- [ ] Test de performance: cargar cliente con 100 reservas y verificar tiempo < 1 segundo

---

## CUD12 - Check-In

### Backend (Clean Architecture)
- [ ] **Domain Layer**:
  - Agregar método `Reservation.checkIn(paymentMethod, paymentDetails)` que valide estado = "Confirmada"
  - Crear Value Objects: `PaymentMethod` (enum: efectivo, tarjeta), `MoneyAmount`, `CardDetails`
  - Crear entidad `Payment` con métodos: `createDeposit()`, `createGuarantee()`
  - Implementar validación en `Payment`: si método = efectivo, amount >= reservation.total * 0.20
  - Crear excepción `InvalidPaymentAmountException` si seña < 20%
  - Crear excepción `InvalidCardException` si validación de Luhn falla
  - Crear evento de dominio `ReservationCheckedInEvent` con: reservationId, roomIds, checkedInAt, paymentMethod
- [ ] **Application Layer**:
  - Crear DTO `CheckInDto` con validaciones:
    - paymentMethod (enum: 'efectivo' | 'tarjeta')
    - depositAmount (if efectivo, isNumber, min: calculado)
    - cardNumber (if tarjeta, isCreditCard, length: 16)
    - cardExpiry (if tarjeta, matches: `MM/YY`, custom validator para fecha no vencida)
    - cardCVV (if tarjeta, isNumeric, length: 3-4)
  - Crear caso de uso `CheckInReservationUseCase` que:
    1. Obtenga reserva de `reservationRepository.findById()`
    2. Valide que fecha actual esté en rango [checkIn - 1 día, checkIn + 1 día]
    3. Si efectivo, valide monto >= 20% total
    4. Si tarjeta, valide con algoritmo de Luhn y tokenice (sin guardar número completo)
    5. Llame a `reservation.checkIn()`
    6. Actualice habitaciones con `room.setEstado('Ocupada')`
    7. Cree pago con `Payment.create()`
    8. Persista con transacción: reservationRepository + roomRepository + paymentRepository
    9. Publique evento `ReservationCheckedInEvent`
    10. Envíe notificación con `notificationService.sendCheckInConfirmation()`
  - Crear event handler `OnReservationCheckedInHandler` que registre en audit logs
  - Implementar servicio de dominio `LuhnValidator.validate(cardNumber)` para validación de tarjeta
  - Implementar servicio `CardTokenizer.tokenize(cardNumber)` que retorne solo últimos 4 dígitos + token seguro
- [ ] **Presentation Layer**:
  - Crear endpoint POST `/api/reservations/:id/check-in` con `@RequireAction('checkin.registrar')`
  - Validar que acción `checkin.adjuntarGarantia` esté presente si método = tarjeta
  - Retornar 400 si estado != "Confirmada" con mensaje: "Solo se puede hacer check-in a reservas confirmadas"
  - Retornar 400 si fecha actual fuera de rango válido
- [ ] **Infrastructure Layer**:
  - Implementar `PaymentRepository.save()` con INSERT en tabla payments
  - Implementar transacción usando TypeORM QueryRunner:
    ```typescript
    await queryRunner.startTransaction();
    await reservationRepo.update(id, { status: 'En curso', checked_in_at: now() });
    await roomRepo.update(roomIds, { estado: 'Ocupada' });
    await paymentRepo.insert({ ...paymentData });
    await queryRunner.commitTransaction();
    ```
  - Implementar `NotificationService.sendCheckInConfirmation()` con template que incluya:
    - Número(s) de habitación
    - Información WiFi (usuario/contraseña)
    - Horario de check-out
    - Servicios incluidos
    - Contacto de recepción
  - Integrar con servicio externo de tokenización de tarjetas (ej: Stripe, MercadoPago) o implementar encriptación AES-256

### Frontend
- [ ] Crear componente `CheckInForm.tsx`
- [ ] Implementar búsqueda por código de reserva o DNI
- [ ] Si es DNI, mostrar solo la reserva activa más próxima al check-in
- [ ] Mostrar card con detalles de la reserva: cliente, fechas, habitaciones, total a pagar
- [ ] Crear selector de método de pago con radiobuttons: "Efectivo" y "Tarjeta"
- [ ] Si selecciona "Efectivo":
  - Mostrar campo para monto de seña (calculado automáticamente: 20% del total)
  - Agregar validación: seña debe ser >= 20% del total
  - Mostrar mensaje: "Saldo restante al check-out: $X"
- [ ] Si selecciona "Tarjeta":
  - Mostrar formulario de tarjeta: número (16 dígitos), fecha expiración (MM/YY), CVV (3 dígitos)
  - Implementar máscara para número de tarjeta: mostrar solo últimos 4 dígitos después de ingresar
  - Validar formato de fecha (MM/YY) y que no esté vencida
  - Agregar iconos de tipos de tarjeta soportados (Visa, Mastercard)
  - Mostrar mensaje: "Se realizará cargo de garantía de $X (será devuelto al check-out)"
- [ ] Implementar botón "Confirmar Check-In"
- [ ] Crear modal de confirmación mostrando resumen: habitaciones asignadas, método de pago, monto
- [ ] Al confirmar, llamar a POST `/api/reservations/:id/check-in`
- [ ] Mostrar modal de éxito con:
  - Número de habitación(es)
  - Información de WiFi (usuario/contraseña)
  - Horario de check-out
  - Servicios incluidos
- [ ] Agregar botón "Imprimir resumen de check-in"
- [ ] Manejar error 400 si la reserva no está en estado "Confirmada"

### Base de Datos
- [ ] Crear tabla `payments` con: id, reservation_id (FK), method (ENUM: efectivo, tarjeta), amount (DECIMAL), status (ENUM: Pending, Completed, Refunded), card_last_four (VARCHAR 4), card_token (VARCHAR), created_at, updated_at
- [ ] Agregar columna `checked_in_at TIMESTAMP NULL` a tabla `reservations`
- [ ] Crear trigger que actualice automáticamente `rooms.estado = 'Ocupada'` cuando `reservations.status` cambie a 'En curso'

### Testing
- [ ] Test unitario: verificar cálculo de seña (20% de $500 = $100)
- [ ] Test unitario: validar algoritmo de Luhn para número de tarjeta
- [ ] Test de integración: hacer check-in con efectivo y verificar creación de registro en `payments`
- [ ] Test de integración: verificar que habitaciones cambien a estado "Ocupada"
- [ ] Test de integración: verificar envío de email con información de check-in
- [ ] Test E2E: buscar reserva, seleccionar método de pago, confirmar check-in
- [ ] Test de validación: intentar check-in con seña menor al 20% y verificar error

---

## CUD13 - Check-Out

### Backend
- [ ] Crear endpoint POST `/api/reservations/:id/check-out`
- [ ] Verificar que reserva exista y tenga estado "En curso"
- [ ] Calcular total final:
  - Obtener total base de la reserva (noches x precio)
  - Consultar servicios adicionales consumidos (si hay tabla `additional_services`)
  - Calcular impuestos (ej: IVA 21%)
  - Si hay seña pagada en efectivo, restar del total: `totalFinal = (base + servicios + impuestos) - seña`
- [ ] Si método de pago fue tarjeta, liberar garantía y procesarcargo final
- [ ] Implementar transacción para:
  - Actualizar `reservations.status = 'Finalizada'`
  - Actualizar `rooms.estado = 'Disponible'` para todas las habitaciones
  - Actualizar `payments.status = 'Completed'` y agregar `completed_at`
  - Guardar timestamp en `checked_out_at`
- [ ] Generar factura en PDF con detalles:
  - Datos del cliente y hotel
  - Fechas de estadía
  - Desglose: base + servicios + impuestos - seña
  - Total pagado
  - Método de pago
  - Número de factura único
- [ ] Guardar PDF en storage (ej: AWS S3 o sistema de archivos) con nombre: `FACTURA-{reservationCode}-{timestamp}.pdf`
- [ ] Llamar a `NotificationService.sendCheckOutConfirmation()` con link de descarga de factura
- [ ] Retornar objeto con: factura (URL o base64), totalPagado, metodoPago

### Frontend
- [ ] Crear componente `CheckOutForm.tsx`
- [ ] Implementar búsqueda por código de reserva o DNI
- [ ] Mostrar card con resumen de estadía:
  - Cliente
  - Fechas reales de estadía (check-in y check-out reales)
  - Habitaciones utilizadas
  - Noches totales
- [ ] Crear sección "Desglose de pago":
  - Subtotal (noches x precio): $X
  - Servicios adicionales: $Y (si hay)
  - Impuestos (21%): $Z
  - Seña pagada: -$W (si fue en efectivo)
  - **Total a pagar: $TOTAL**
- [ ] Si el método fue tarjeta, mostrar: "Cargo realizado a tarjeta terminada en XXXX"
- [ ] Si fue efectivo, mostrar: "Total a cobrar: $X (Seña ya pagada: $Y)"
- [ ] Implementar campo para "Servicios adicionales" con botón "+" para agregar items (descripción, monto)
- [ ] Crear botón "Confirmar Check-Out"
- [ ] Modal de confirmación: "¿Confirmar check-out y procesar pago de $X?"
- [ ] Al confirmar, llamar a POST `/api/reservations/:id/check-out`
- [ ] Mostrar modal de éxito con:
  - Mensaje "Check-out realizado exitosamente"
  - Link para descargar factura: "Descargar factura PDF"
  - Botón "Imprimir factura"
  - Resumen de pago
- [ ] Implementar visor de factura en modal (iframe o visor PDF)
- [ ] Manejar error 400 si la reserva no está en estado "En curso"
- [ ] Agregar opción para enviar factura por email al cliente

### Base de Datos
- [ ] Agregar columna `checked_out_at TIMESTAMP NULL` a tabla `reservations`
- [ ] Crear tabla `invoices` con: id, reservation_id (FK), invoice_number (UNIQUE), subtotal, services_amount, tax_amount, deposit_deducted, total_amount, payment_method, file_url (VARCHAR), issued_at
- [ ] Agregar columna `completed_at TIMESTAMP NULL` a tabla `payments`
- [ ] Crear tabla `additional_services` (opcional): id, reservation_id (FK), description (VARCHAR), amount (DECIMAL), requested_at

### Testing
- [ ] Test unitario: verificar cálculo correcto de total final (base + servicios + impuestos - seña)
- [ ] Test unitario: verificar generación de número de factura único
- [ ] Test de integración: hacer check-out y verificar que habitaciones se liberen
- [ ] Test de integración: verificar creación de registro en tabla `invoices`
- [ ] Test de integración: verificar que PDF se genere correctamente y se guarde en storage
- [ ] Test de integración: verificar envío de email con link de factura
- [ ] Test E2E: completar flujo check-in → agregar servicio adicional → check-out → descargar factura
- [ ] Test de validación: intentar check-out de reserva en estado "Confirmada" y verificar error

---

## Tareas Generales del Proyecto

### Configuración Inicial
- [ ] Crear repositorio en GitHub/GitLab con estructura de monorepo (backend + frontend)
- [ ] Inicializar backend con NestJS: `npm i -g @nestjs/cli && nest new my-hotel-flow-backend`
- [ ] Inicializar frontend con React + TypeScript: `npx create-react-app my-hotel-flow-frontend --template typescript`
- [ ] Configurar ESLint y Prettier para ambos proyectos
- [ ] Crear archivo `.env.example` con variables de entorno necesarias
- [ ] Configurar base de datos MySQL: crear database `my_hotel_flow_db`
- [ ] Configurar ORM (TypeORM o Prisma) con conexión a MySQL
- [ ] Implementar sistema de migraciones de base de datos
- [ ] Crear archivo README.md con instrucciones de instalación y ejecución

### Seguridad y Autenticación (Sistema de Grupos y Acciones)
- [ ] Implementar JWT authentication en backend con payload: `{ userId, grupos[], accionesParticulares[] }`
- [ ] Crear entidad de dominio `User` en capa Domain con: id, email, password, grupos[], acciones[], activo
- [ ] Crear entidad de dominio `Grupo` con: id, nombre, accionesAsociadas[], gruposPadre[]
- [ ] Crear Value Object `Accion` con formato: `recurso.operacion` (ej: `reservas.crear`)
- [ ] Implementar caso de uso `AuthenticateUserUseCase` en Application Layer que retorne token JWT
- [ ] Crear repositorio `IUserRepository` en Domain con métodos: `findByEmail()`, `findById()`, `save()`
- [ ] Implementar `UserRepository` en Infrastructure Layer usando TypeORM
- [ ] Crear tabla `users` con: id, email, password_hash, activo, created_at, updated_at
- [ ] Crear tabla `grupos` con: id, nombre, descripcion, created_at
- [ ] Crear tabla `acciones` con: id, codigo (UNIQUE, ej: 'reservas.crear'), descripcion
- [ ] Crear tabla intermedia `user_grupos` con: user_id (FK), grupo_id (FK)
- [ ] Crear tabla intermedia `user_acciones` (acciones particulares): user_id (FK), accion_id (FK)
- [ ] Crear tabla intermedia `grupo_acciones`: grupo_id (FK), accion_id (FK)
- [ ] Crear tabla `grupo_jerarquia` para grupos padres/hijos: grupo_id (FK), grupo_padre_id (FK)
- [ ] Implementar servicio de dominio `PermissionEvaluator` que resuelva acciones heredadas de grupos
- [ ] Crear método `PermissionEvaluator.hasPermission(user, accionRequerida)` que verifique:
  1. Si usuario tiene la acción particular directa
  2. Si algún grupo del usuario tiene la acción
  3. Si algún grupo padre tiene la acción (recursivo)
  4. Si usuario tiene wildcard (ej: `reservas.*` cubre `reservas.crear`)
- [ ] Implementar decorator `@RequireAction('reservas.crear')` en controllers que use guard de autorización
- [ ] Crear `PermissionGuard` en Infrastructure/Web que:
  - Extraiga token JWT del header Authorization
  - Obtenga userId del token
  - Llame a `PermissionEvaluator.hasPermission()`
  - Retorne 403 si no tiene permiso
- [ ] Seedear acciones iniciales en base de datos:
  ```typescript
  // reservas
  'reservas.listar', 'reservas.ver', 'reservas.crear', 'reservas.modificar', 'reservas.cancelar'
  // checkin
  'checkin.registrar', 'checkin.asignarHabitacion', 'checkin.adjuntarGarantia', 'checkin.imprimirComprobante'
  // checkout
  'checkout.calcularCargos', 'checkout.registrarPago', 'checkout.cerrar', 'checkout.imprimirComprobante'
  // comprobantes
  'comprobantes.emitir', 'comprobantes.anular', 'comprobantes.imprimir', 'comprobantes.ver'
  // habitaciones
  'habitaciones.listar', 'habitaciones.ver', 'habitaciones.crear', 'habitaciones.modificar', 'habitaciones.cambiarEstado'
  // clientes
  'clientes.listar', 'clientes.ver', 'clientes.crear', 'clientes.modificar'
  // pagos
  'pagos.registrar', 'pagos.devolver', 'pagos.ver'
  // servicios
  'servicios.listar', 'servicios.asignar', 'servicios.remover'
  // notificaciones
  'notificaciones.enviar', 'notificaciones.ver'
  // reportes
  'reportes.ver', 'reportes.exportar'
  // config
  'config.usuarios.*', 'config.grupos.*', 'config.acciones.*'
  ```
- [ ] Seedear grupos iniciales:
  ```typescript
  // rol.cliente: reservas.crear, reservas.ver, comprobantes.ver, clientes.modificar
  // rol.recepcionista: reservas.*, checkin.*, checkout.*, comprobantes.imprimir, pagos.registrar, clientes.*, habitaciones.listar, habitaciones.ver, habitaciones.cambiarEstado
  // rol.admin: config.usuarios.*, config.grupos.*, config.acciones.* (o superuser)
  ```
- [ ] Crear grupo compositorio `group.frontdesk` con acciones de mostrador y asignarlo como hijo de `rol.recepcionista`
- [ ] Implementar endpoint POST `/auth/login` en Presentation Layer que llame a `AuthenticateUserUseCase`
- [ ] Implementar endpoint POST `/auth/refresh` para renovar tokens
- [ ] Configurar CORS en backend para permitir requests desde frontend
- [ ] Implementar rate limiting (express-rate-limit) para prevenir ataques de fuerza bruta: 5 intentos por 15 min
- [ ] Configurar helmet.js para headers de seguridad HTTP
- [ ] Implementar encriptación de contraseñas con bcrypt (salt rounds: 10) en `User.setPassword()`
- [ ] Agregar logs de seguridad en tabla `security_logs`: id, user_id, action_attempted, resource, result (allowed/denied), ip_address, user_agent, created_at
- [ ] Crear índice compuesto en `user_grupos(user_id, grupo_id)` y `grupo_acciones(grupo_id, accion_id)` para optimizar queries de permisos

### Testing
- [ ] Configurar Jest para tests unitarios en backend
- [ ] Configurar Jest + React Testing Library para frontend
- [ ] Implementar tests unitarios con cobertura mínima del 80%
- [ ] Configurar Cypress o Playwright para tests E2E
- [ ] Crear suite de tests de integración para cada caso de uso
- [ ] Implementar tests de rendimiento con K6 o Artillery
- [ ] Configurar CI/CD pipeline (GitHub Actions) para ejecutar tests automáticamente
- [ ] Crear ambientes de testing/staging/production

### Despliegue
- [ ] Configurar Docker para containerización (Dockerfile + docker-compose.yml)
- [ ] Crear script de build para producción
- [ ] Configurar hosting para backend (ej: Railway, Heroku, AWS EC2)
- [ ] Configurar hosting para frontend (ej: Vercel, Netlify, AWS S3 + CloudFront)
- [ ] Configurar base de datos en la nube (AWS RDS, PlanetScale)
- [ ] Implementar sistema de backups automáticos de base de datos
- [ ] Configurar monitoreo y logging (ej: Sentry para errores, LogRocket para sessions)
- [ ] Configurar CDN para assets estáticos
- [ ] Implementar HTTPS con certificados SSL

### Documentación
- [ ] Documentar API con Swagger/OpenAPI
- [ ] Crear manual de usuario para recepcionistas
- [ ] Documentar arquitectura del sistema (diagramas de componentes, deployment)
- [ ] Crear guía de contribución para desarrolladores
- [ ] Documentar procesos de despliegue y mantenimiento
- [ ] Crear changelog para tracking de versiones

---

## Notas Importantes

### Buenas Prácticas de Desarrollo
- Usar nombres descriptivos en variables, funciones y componentes
- Implementar manejo de errores robusto con try-catch y mensajes específicos
- Validar datos tanto en frontend como en backend (nunca confiar solo en validación de cliente)
- Implementar logging para todas las operaciones críticas
- Usar transacciones de base de datos para operaciones que modifican múltiples tablas
- Implementar paginación en todos los listados que puedan tener muchos resultados
- Crear índices en columnas que se usan frecuentemente en búsquedas
- Usar variables de entorno para configuraciones sensibles (nunca hardcodear credenciales)

### Consideraciones de UX
- Mostrar indicadores de loading durante operaciones asíncronas
- Implementar mensajes de confirmación para acciones destructivas
- Mostrar notificaciones toast/snackbar para feedback inmediato
- Hacer el sistema responsive para tablets (recepcionistas móviles)
- Implementar shortcuts de teclado para acciones comunes
- Agregar tooltips explicativos en campos complejos
- Mantener consistencia en colores, tipografía y espaciados

### Performance
- Implementar lazy loading de componentes en frontend
- Usar índices compuestos en queries frecuentes
- Implementar caché de queries con TTL apropiado
- Optimizar queries N+1 con JOINs o eager loading
- Comprimir respuestas HTTP con gzip
- Minificar y bundlear assets de frontend
- Implementar service workers para funcionalidad offline básica

### Accesibilidad
- Usar etiquetas semánticas de HTML5
- Implementar navegación por teclado (tab index)
- Agregar atributos ARIA donde sea necesario
- Mantener contraste de colores accesible (WCAG AA)
- Agregar alt text descriptivo a todas las imágenes

---

## Arquitectura del Proyecto

### Estructura de Clean Architecture (Backend)

```
src/
├── domain/                           # Capa de Dominio (sin dependencias externas)
│   ├── entities/                     # Entidades de negocio
│   │   ├── Reservation.ts
│   │   ├── Client.ts
│   │   ├── Room.ts
│   │   ├── Payment.ts
│   │   └── User.ts
│   ├── value-objects/               # Objetos de valor inmutables
│   │   ├── DNI.ts
│   │   ├── Email.ts
│   │   ├── DateRange.ts
│   │   ├── ReservationCode.ts
│   │   ├── MoneyAmount.ts
│   │   ├── PaymentMethod.ts
│   │   ├── CardDetails.ts
│   │   ├── Password.ts
│   │   └── Accion.ts
│   ├── services/                    # Servicios de dominio
│   │   ├── PermissionEvaluator.ts
│   │   ├── ReservationCodeGenerator.ts
│   │   ├── LuhnValidator.ts
│   │   └── CardTokenizer.ts
│   ├── repositories/                # Interfaces de repositorios (puertos)
│   │   ├── IReservationRepository.ts
│   │   ├── IClientRepository.ts
│   │   ├── IRoomRepository.ts
│   │   ├── IPaymentRepository.ts
│   │   ├── IUserRepository.ts
│   │   └── IAuditLogRepository.ts
│   ├── events/                      # Eventos de dominio
│   │   ├── ReservationCreatedEvent.ts
│   │   ├── ReservationCancelledEvent.ts
│   │   ├── ReservationCheckedInEvent.ts
│   │   └── ReservationCheckedOutEvent.ts
│   └── exceptions/                  # Excepciones de dominio
│       ├── InvalidDNIException.ts
│       ├── RoomNotAvailableException.ts
│       ├── InvalidReservationStateException.ts
│       ├── ClientAlreadyExistsException.ts
│       ├── InvalidPaymentAmountException.ts
│       └── InvalidCardException.ts
│
├── application/                      # Capa de Aplicación (casos de uso)
│   ├── use-cases/
│   │   ├── reservations/
│   │   │   ├── CreateReservationUseCase.ts
│   │   │   ├── CancelReservationUseCase.ts
│   │   │   ├── ModifyReservationUseCase.ts
│   │   │   ├── SearchReservationUseCase.ts
│   │   │   ├── CheckInReservationUseCase.ts
│   │   │   ├── CheckOutReservationUseCase.ts
│   │   │   └── GetReservationManagementMenuUseCase.ts
│   │   ├── clients/
│   │   │   ├── CreateClientProfileUseCase.ts
│   │   │   ├── ModifyClientProfileUseCase.ts
│   │   │   ├── DeleteClientProfileUseCase.ts
│   │   │   ├── SearchClientByDNIUseCase.ts
│   │   │   └── GetClientDetailsUseCase.ts
│   │   ├── auth/
│   │   │   ├── AuthenticateUserUseCase.ts
│   │   │   └── RefreshTokenUseCase.ts
│   │   └── rooms/
│   │       ├── GetAvailableRoomsUseCase.ts
│   │       └── GetOccupancyReportUseCase.ts
│   ├── dtos/                        # Data Transfer Objects
│   │   ├── CreateReservationDto.ts
│   │   ├── CancelReservationDto.ts
│   │   ├── CheckInDto.ts
│   │   ├── CheckOutDto.ts
│   │   ├── CreateClientDto.ts
│   │   └── ...
│   ├── event-handlers/              # Manejadores de eventos de dominio
│   │   ├── OnReservationCreatedHandler.ts
│   │   ├── OnReservationCancelledHandler.ts
│   │   ├── OnReservationCheckedInHandler.ts
│   │   └── OnReservationCheckedOutHandler.ts
│   └── services/                    # Interfaces de servicios (puertos)
│       ├── INotificationService.ts
│       ├── IEmailService.ts
│       └── IPdfGeneratorService.ts
│
├── infrastructure/                   # Capa de Infraestructura (adaptadores)
│   ├── persistence/                 # Implementación de repositorios
│   │   ├── typeorm/
│   │   │   ├── entities/           # Entidades de TypeORM (mapeo a tablas)
│   │   │   │   ├── ReservationEntity.ts
│   │   │   │   ├── ClientEntity.ts
│   │   │   │   ├── RoomEntity.ts
│   │   │   │   ├── PaymentEntity.ts
│   │   │   │   ├── UserEntity.ts
│   │   │   │   ├── GrupoEntity.ts
│   │   │   │   ├── AccionEntity.ts
│   │   │   │   └── AuditLogEntity.ts
│   │   │   ├── repositories/       # Implementación de repositorios
│   │   │   │   ├── ReservationRepository.ts
│   │   │   │   ├── ClientRepository.ts
│   │   │   │   ├── RoomRepository.ts
│   │   │   │   ├── PaymentRepository.ts
│   │   │   │   ├── UserRepository.ts
│   │   │   │   └── AuditLogRepository.ts
│   │   │   └── migrations/         # Migraciones de base de datos
│   │   │       └── ...
│   │   └── seeds/                  # Datos iniciales
│   │       ├── acciones.seed.ts
│   │       ├── grupos.seed.ts
│   │       └── usuarios.seed.ts
│   ├── services/                    # Implementación de servicios externos
│   │   ├── EmailService.ts         # Implementa IEmailService
│   │   ├── NotificationService.ts  # Implementa INotificationService
│   │   ├── PdfGeneratorService.ts  # Implementa IPdfGeneratorService
│   │   ├── TwilioSmsService.ts
│   │   └── StripePaymentService.ts
│   └── web/                         # Configuración web (NestJS)
│       ├── guards/
│       │   ├── JwtAuthGuard.ts
│       │   └── PermissionGuard.ts
│       ├── decorators/
│       │   ├── RequireAction.ts
│       │   └── CurrentUser.ts
│       └── filters/
│           └── DomainExceptionFilter.ts
│
└── presentation/                     # Capa de Presentación (controllers, REST API)
    ├── controllers/
    │   ├── ReservationManagementController.ts
    │   ├── ReservationController.ts
    │   ├── ClientController.ts
    │   ├── RoomController.ts
    │   ├── AuthController.ts
    │   └── ...
    ├── middlewares/
    │   └── LoggingMiddleware.ts
    └── swagger/
        └── api-documentation.ts
```

### Principios de Clean Architecture

- [ ] **Independencia de frameworks**: La lógica de negocio no depende de NestJS, TypeORM u otros frameworks
- [ ] **Testeable**: Las reglas de negocio pueden testearse sin UI, BD, servidor web o elementos externos
- [ ] **Independencia de la UI**: La UI puede cambiar sin afectar el resto del sistema
- [ ] **Independencia de la BD**: Las reglas de negocio no están atadas a una base de datos específica
- [ ] **Regla de dependencia**: Las dependencias del código fuente solo apuntan hacia adentro (Domain ← Application ← Infrastructure/Presentation)

### Flujo de una Request

```
1. HTTP Request → Controller (Presentation)
2. Controller → Use Case (Application)
3. Use Case → Repository Interface (Domain)
4. Repository Implementation (Infrastructure) → Database
5. Database → Repository Implementation
6. Repository → Use Case
7. Use Case → Domain Entity (para ejecutar lógica de negocio)
8. Use Case → Service Interface (Domain)
9. Service Implementation (Infrastructure) → External API
10. Use Case → Controller
11. Controller → HTTP Response
```

### Sistema de Permisos (Grupos y Acciones)

#### Flujo de Verificación de Permisos
```
Request con JWT → PermissionGuard extrae userId → 
PermissionEvaluator.hasPermission(userId, 'reservas.crear') →
  1. Busca acciones particulares del usuario
  2. Busca grupos del usuario
  3. Busca acciones de cada grupo (recursivamente con padres)
  4. Evalúa wildcards (reservas.* cubre reservas.crear)
  5. Retorna true/false
→ Si false: HTTP 403 Forbidden
→ Si true: Continúa al Controller
```

#### Ejemplo de Evaluación
```typescript
// Usuario tiene grupo: rol.recepcionista
// rol.recepcionista tiene acción: reservas.*
// Request requiere: @RequireAction('reservas.crear')

PermissionEvaluator.hasPermission(userId, 'reservas.crear')
  → Busca acción particular 'reservas.crear': NO encontrada
  → Busca en grupos del usuario: [rol.recepcionista]
  → Busca acciones de rol.recepcionista: [reservas.*, checkin.*, ...]
  → Evalúa wildcard: 'reservas.*' coincide con 'reservas.crear'
  → Retorna TRUE ✓
```

### Eventos de Dominio

Los eventos de dominio permiten desacoplar la lógica:

```typescript
// En el caso de uso
await reservation.checkIn(paymentDetails);
await reservationRepository.save(reservation);

// El repositorio publica automáticamente eventos pendientes
eventBus.publish(new ReservationCheckedInEvent(reservation.id));

// Event handler separado maneja efectos secundarios
@EventHandler(ReservationCheckedInEvent)
class OnReservationCheckedInHandler {
  async handle(event: ReservationCheckedInEvent) {
    await auditLogRepository.log({
      action: 'CHECK_IN',
      entityId: event.reservationId,
      userId: event.userId,
      timestamp: event.occurredAt
    });
    
    await notificationService.sendCheckInConfirmation(
      event.reservationId
    );
  }
}
```

### Mapeo entre Capas

```typescript
// Domain Entity (sin decoradores de TypeORM)
class Reservation {
  constructor(
    private id: string,
    private code: ReservationCode,
    private client: Client,
    private rooms: Room[],
    private dateRange: DateRange,
    private status: ReservationStatus
  ) {}
}

// Infrastructure Entity (TypeORM)
@Entity('reservations')
class ReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  codigo: string;

  @ManyToOne(() => ClientEntity)
  client: ClientEntity;
  
  // ... más decoradores
}

// Mapper
class ReservationMapper {
  static toDomain(entity: ReservationEntity): Reservation {
    return new Reservation(
      entity.id,
      new ReservationCode(entity.codigo),
      ClientMapper.toDomain(entity.client),
      entity.rooms.map(RoomMapper.toDomain),
      new DateRange(entity.checkIn, entity.checkOut),
      entity.estado as ReservationStatus
    );
  }

  static toPersistence(domain: Reservation): ReservationEntity {
    const entity = new ReservationEntity();
    entity.id = domain.getId();
    entity.codigo = domain.getCode().getValue();
    // ... más mapeo
    return entity;
  }
}
```
