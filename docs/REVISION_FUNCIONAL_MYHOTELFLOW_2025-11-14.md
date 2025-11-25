## Revisión funcional del sistema MyHotelFlow (14/11/2025)

Este documento resume una **revisión funcional profunda** del backend (NestJS) y frontend (React) de MyHotelFlow, contrastando lo implementado con:

- Documentos de dominio y casos de uso (`SISTEMA_IMPLEMENTADO.md`, `checklist-casos-de-uso-my-hotel-flow.md`).
- Lo esperable en un **buen sistema hotelero** de uso real.

La intención es servir como **insumo de mejora continua**, no como auditoría de código puntual.

---

## 1. Cobertura funcional actual (visión general)

- **Reservas**
  - Entidad de dominio `Reservation` con estados `CONFIRMED`, `IN_PROGRESS`, `CANCELLED`, `COMPLETED` y reglas de negocio coherentes (validación de duración, ventana de cancelación de 24h, modificación solo en estado `CONFIRMED`, etc.).  
  - Casos de uso implementados:
    - `CreateReservationUseCase`: valida cliente activo, sin deuda (`Client.hasOutstandingDebt()`), habitación activa, límite de 3 reservas pendientes por cliente y previene overbooking con `findOverlappingReservations` + `isRoomAvailable`.
    - `CancelReservationUseCase`: valida posibilidad de cancelar via `reservation.canBeCancelled()` y aplica `reservation.cancel(reason)`.
    - `UpdateReservationDatesUseCase`: permite modificar fechas con validación de solapamientos, usando también `findOverlappingReservations`.
    - `PerformCheckInUseCase`: pasa la reserva a `IN_PROGRESS`, crea `CheckInRecord` y marca la habitación como ocupada.
    - `PerformCheckOutUseCase`: pasa la reserva a `COMPLETED`, ajusta estado de habitación según condición de salida, genera factura si no existe y actualiza cuenta corriente y deuda del cliente.
    - `ListReservationsUseCase`: soporta filtros por estado, rango de check-in, cliente, habitación y búsqueda por código/DNI/nombre.
  - Presentación:
    - `ReservationController` expone endpoints para crear, listar, cancelar, modificar fechas, check-in y check-out.
    - `ReservationManagementController` devuelve el menú dinámico de gestión de reservas según permisos del usuario.

- **Clientes**
  - Entidad de dominio `Client` con gestión de deuda (`outstandingBalance` y métodos `hasOutstandingDebt`, `addDebt`, `reduceDebt`), datos personales y soft delete (`deactivate`).
  - Casos de uso para crear, listar, obtener por id, actualizar y dar de baja clientes.
  - `ClientController` correctamente protegido con `JwtAuthGuard` + `ActionsGuard` y validaciones de DTO (`CreateClientRequestDto`, `UpdateClientRequestDto`).
  - Frontend: `CreateClientProfile`, `ClientsListPage`, `ClientProfilePage`, `EditClientPage` ofrecen flujo bastante completo de gestión de clientes.

- **Habitaciones y tipos de habitación**
  - Entidades de dominio `Room` y `RoomType` con reglas de negocio (capacidad máxima, precio por noche, activación/desactivación, mantenimiento, etc.).
  - Casos de uso para crear, actualizar, cambiar estado, listar y borrar habitaciones y tipos.
  - Frontend: páginas para listar, crear/editar habitaciones (`RoomListPage`, `RoomFormPage`, `RoomDetailPage`) y tipos (`RoomTypesListPage`, `RoomTypeFormPage`), integradas con permisos.

- **Facturación, pagos y cuenta corriente**
  - Entidades de dominio `Invoice`, `Payment`, `AccountMovement` con estados claros (`InvoiceStatus`, `PaymentStatus`), cálculo de IVA y saldo pendiente.
  - Casos de uso:
    - `GenerateInvoiceUseCase`: genera factura basada en una reserva (precio por noche actualmente hardcodeado).
    - `RegisterPaymentUseCase`: registra pago en transacción, aplica monto a la factura, actualiza saldo y crea movimiento de cuenta corriente.
    - `GetAccountStatementUseCase`: compone cuenta corriente del cliente a partir de movimientos.
    - Integración con **MercadoPago** (`CreatePaymentPreferenceUseCase`, `ProcessMercadoPagoWebhookUseCase`, `MercadoPagoWebhooksController`) para pagos con tarjeta.
  - `BillingModule` registra entidades TypeORM, repositorios, mappers y controladores (`InvoicesController`, `PaymentsController`, `AccountStatementsController`).
  - Frontend: páginas de facturas, detalle de factura, recibo e integración con MercadoPago (`InvoicesPage`, `InvoiceDetailPage`, `InvoiceReceiptPage`, `MercadoPagoButton`), más estado de cuenta (`AccountStatementPage`).

- **Seguridad, autenticación y permisos**
  - Autenticación JWT con `JwtStrategy`, `JwtAuthGuard` y `AuthController` (login, refresh, etc.).
  - Sistema de acciones y grupos (`ActionController`, `GroupController`, `UserController`, `AuthorizationService`, `ActionsGuard`, decorator `@Actions`) siguiendo el diseño de *acciones* del dominio.
  - Frontend usa `ProtectedRoute` con `requiredPermissions` alineadas con acciones de backend (p.ej. `reservas.crear`, `habitaciones.listar`, `facturas.ver`).

- **Observabilidad y soporte operativo**
  - `HealthModule` y `MetricsModule` implementados y registrados en `AppModule`.
  - `TransformInterceptor` y filtros globales (`DomainExceptionFilter`, `HttpExceptionFilter`, `GlobalExceptionFilter`) estandarizan respuestas y manejo de errores.
  - Notificaciones por email/SMS implementadas vía `INotificationService` + `MailService` (`profile-created`, `reservation-confirmation`), con Twilio opcional.

En resumen, el **core del flujo hotelero clásico (reserva → check-in → check-out → factura → pago → deuda**), más la gestión de clientes, habitaciones y permisos, está bastante bien cubierto y alineado con los docs.

---

## 2. Problemas funcionales detectados (bugs o inconsistencias)

### 2.1 Check-out: mismatch entre frontend y backend en `roomCondition`

- Backend:
  - El DTO `CheckOutDto` usa `RoomCondition` del dominio, con valores válidos: `GOOD`, `REGULAR`, `NEEDS_DEEP_CLEANING`.
  - `PerformCheckOutUseCase` decide el nuevo estado de la habitación en base a `checkOutRecord.requiresDeepCleaning()` (solo `NEEDS_DEEP_CLEANING` lleva a `RoomStatus.MAINTENANCE`; el resto vuelve a `AVAILABLE`).
- Frontend:
  - `useCheckOut` y `ActiveReservationsPage` envían valores `'GOOD' | 'NEEDS_CLEANING' | 'DAMAGED'` al endpoint `/reservations/:id/check-out`.
  - Estos valores **no coinciden** con el enum de backend:
    - `NEEDS_CLEANING` no existe (backend espera `NEEDS_DEEP_CLEANING`).
    - `DAMAGED` no existe en `RoomCondition`.
- Consecuencias:
  - Cualquier check-out con opción "Necesita limpieza" o "Dañada" producirá un **400 de validación** (el DTO no pasa `IsEnum(RoomCondition)`).
  - El sistema nunca llega a marcar la habitación en mantenimiento por limpieza profunda según las reglas actuales.
- Recomendación:
  - Unificar contrato:
    - O bien cambiar el enum de backend para contemplar `NEEDS_CLEANING` / `DAMAGED` con reglas claras, o
    - Ajustar el frontend para usar exactamente los valores del enum de dominio (`GOOD`, `REGULAR`, `NEEDS_DEEP_CLEANING`) y mapear "Dañada" a una combinación de `RoomCondition` + otro mecanismo (ej. flag de daño y flujo de mantenimiento).

### 2.2 Falta de persistencia del estado de habitación al crear reserva

- En `CreateReservationUseCase`:
  - Tras guardar la reserva se llama a `room.changeStatus(RoomStatus.OCCUPIED)`, pero **no se persiste** el cambio (no se invoca `roomRepository.update(room)`).
  - Por tanto, en la base de datos el estado de la habitación **no cambia realmente** al crear la reserva.
- Consecuencias:
  - Inconsistencia entre el estado del objeto en memoria y el estado persistido.
  - Cualquier reporte que dependa del estado de la habitación (ej. futura ocupación diaria basada en `RoomStatus`) no reflejaría las reservas recién creadas.
- Recomendación:
  - Decidir si realmente se quiere cambiar el estado de la habitación al crear la reserva (ver siguiente sección) y, si es así, persistirlo con `roomRepository.update(room)` dentro de una transacción.

### 2.3 Inconsistencia conceptual en `RoomStatus` al crear reserva

- Documentación (`SISTEMA_IMPLEMENTADO.md`) y código de dominio:
  - El flujo propuesto dice:  
    - **Crear Reserva** → estado de reserva `CONFIRMED`.  
    - **Check-in** → estado de reserva `IN_PROGRESS` + habitación `OCCUPIED`.  
    - **Check-out** → estado de reserva `COMPLETED` + habitación `AVAILABLE/MAINTENANCE`.
  - El enum `RoomStatus` se documenta como:
    - `AVAILABLE`: disponible para reservar.
    - `OCCUPIED`: ocupada por una reserva en curso.
    - `MAINTENANCE`: en mantenimiento.
    - `OUT_OF_SERVICE`: fuera de servicio.
- Sin embargo:
  - `CreateReservationUseCase` llama a `room.changeStatus(RoomStatus.OCCUPIED)` **en el momento de crear la reserva**, antes del check-in.
- Consecuencias:
  - Conceptualmente, la habitación se marca como *ocupada* cuando en realidad solo está *reservada*, rompiendo la semántica de `OCCUPIED`.
  - `PerformCheckInUseCase` vuelve a marcar la habitación como `OCCUPIED`, lo que resulta redundante e inconsistente con la definición de estados.
- Recomendación:
  - Mantener `RoomStatus.AVAILABLE` mientras la reserva está `CONFIRMED` y usar solo las consultas de reservas (`findOverlappingReservations`, `isRoomAvailable`) para prevenir overbooking.
  - O, si se quiere distinguir "reservada" de "disponible", introducir un estado `RESERVED` en `RoomStatus` y adaptar reglas de negocio y reportes de ocupación.

### 2.4 Check-in / Check-out: `userId` fijo = 1

- En `ReservationController`:
  - Tanto `performCheckIn` como `performCheckOut` usan `const userId = 1; // Placeholder - debe venir del contexto de autenticación`.
  - Ese `userId` se pasa a `PerformCheckInUseCase` / `PerformCheckOutUseCase`, que lo usan para construir `CheckInRecord` / `CheckOutRecord`.
- Consecuencias:
  - Todos los check-in y check-out quedan registrados como realizados por el usuario `1`, sin reflejar al recepcionista real.
  - Se invalida cualquier auditoría que dependa de `performedBy`, y se pierde trazabilidad crítica.
- Recomendación:
  - Extraer el usuario autenticado desde el `JwtAuthGuard` (p.ej. con un decorator `@CurrentUser`) y pasar su `id` al caso de uso.
  - No liberar esta funcionalidad a producción mientras el `userId` sea fijo, dado el impacto en cumplimiento y auditoría.

### 2.5 Cancelar reserva no libera la habitación

- `CancelReservationUseCase`:
  - Llama a `reservation.cancel(dto.reason)` y persiste la reserva con `reservationRepository.update(reservation)`.
  - Tiene TODO explícito: **"Liberar habitación si estaba marcada como OCCUPIED"**, pero no realiza ninguna operación sobre el repositorio de habitaciones.
- Consecuencias:
  - Si en el futuro se decide marcar habitaciones como `OCCUPIED` al reservar o al hacer check-in, una cancelación podría dejar la habitación en estado incorrecto.
  - Esto afectaría disponibilidad y cualquier reporte de ocupación basado en `RoomStatus`.
- Recomendación:
  - Inyectar `IRoomRepository` en el caso de uso de cancelación y, si la reserva estaba activa, volver la habitación a `AVAILABLE` (o al estado que corresponda según reglas).

### 2.6 Idempotencia de reservas no implementada

- El repositorio `IReservationRepository` y el ORM tienen soporte para:
  - Campo `idempotencyKey` en `ReservationOrmEntity`.
  - Método `findByIdempotencyKey`.
- `ReservationController.createReservation`:
  - Reconoce header `X-Idempotency-Key`, pero lo ignora (`void _idempotencyKey;`) y no lo pasa al DTO ni al caso de uso.
- Consecuencias:
  - Llamadas repetidas (por timeouts de red o reintentos del frontend) pueden crear **reservas duplicadas**, especialmente crítico si en el futuro se agregan transacciones con cobro inmediato.
- Recomendación:
  - Extender `CreateReservationDto` y `Reservation` para guardar la clave de idempotencia.
  - En `CreateReservationUseCase`, consultar `findByIdempotencyKey` antes de crear una nueva reserva y devolver la existente en caso de duplicado.

### 2.7 Seguridad: operaciones de reservas, facturas y pagos sin `JwtAuthGuard`

- Algunos controladores están correctamente protegidos:
  - `ClientController`, `GroupController`, `ActionController`, `ReservationManagementController`, `AccountStatementsController` usan `@UseGuards(JwtAuthGuard, ActionsGuard)`.
- Sin embargo, otros controladores sensibles **no** tienen `@UseGuards`:
  - `ReservationController` (crear reservas, check-in, check-out, cancelación, listado).
  - `InvoicesController` (generar y ver facturas).
  - `PaymentsController` (registrar y listar pagos).
- No hay registro de guards globales (`APP_GUARD`) ni `useGlobalGuards` en `main.ts`, por lo que estos endpoints quedan de facto **públicos**, aunque utilicen el decorator `@Actions`.
- Consecuencias:
  - Riesgo muy alto: un cliente no autenticado podría crear reservas, disparar check-in/out y registrar pagos si llega a conocer los endpoints.
  - El frontend sí usa `ProtectedRoute`, pero eso solo protege **la UI**, no la API.
- Recomendación:
  - Añadir `@UseGuards(JwtAuthGuard, ActionsGuard)` (y `@ApiBearerAuth` en Swagger) a `ReservationController`, `InvoicesController` y `PaymentsController`.
  - Alternativamente, declarar `JwtAuthGuard` y `ActionsGuard` como `APP_GUARD` globales (pero revisando endpoints públicos como webhooks de MercadoPago).

### 2.8 Doble camino para generación de facturas con comportamiento distinto

- `PerformCheckOutUseCase`:
  - Genera factura automáticamente al hacer check-out si no existe (`Invoice.create(...)`) y, además, crea `AccountMovement` y actualiza `Client.outstandingBalance`.
- `GenerateInvoiceUseCase` + `InvoicesController.generateInvoice`:
  - Permiten generar una factura manualmente para una reserva.
  - Este camino **solo crea la factura** y no actualiza cuenta corriente ni deuda.
- Frontend:
  - `ActiveReservationsPage` llama a `performCheckOut` (que puede generar la factura) y luego llama a `generateInvoice` para obtenerla y mostrarla / registrar pago.
  - Gracias a la idempotencia de `GenerateInvoiceUseCase` (si existe factura la devuelve), no se generan duplicados, pero el flujo es confuso.
- Consecuencias:
  - Si alguien llama `POST /invoices/generate/:reservationId` fuera del contexto de check-out, la deuda del cliente **no se actualiza**, rompiendo el modelo de cuenta corriente.
- Recomendación:
  - Definir un único flujo canónico de generación de factura (idealmente desde check-out) y dejar `GenerateInvoiceUseCase` solo como helper interno.
  - O bien mover la lógica de actualización de deuda y movimientos a un servicio compartido llamado desde ambos caminos, para mantener consistencia.

### 2.9 Check-in sin validaciones de ventana temporal ni garantías

- El caso de uso `PerformCheckInUseCase` valida únicamente:
  - Que la reserva exista.
  - Que no esté ya `IN_PROGRESS`.
  - Que el estado actual sea `CONFIRMED`.
  - Luego crea `CheckInRecord` y marca la habitación como `OCCUPIED`.
- En `checklist-casos-de-uso-my-hotel-flow.md` (CUD12 - Check-In) se planean reglas adicionales:
  - Validar que la fecha actual esté en un rango razonable respecto al check-in previsto.
  - Manejar una seña/garantía (efectivo o tarjeta) con reglas de monto mínimo (p.ej. 20%).
  - Integración más profunda con pagos.
- Consecuencias:
  - Hoy se puede hacer check-in de reservas muy antiguas o futuras sin restricciones.
  - No existe control sobre garantías ni depósitos, que son habituales en hoteles.
- Recomendación:
  - Añadir validaciones de ventana temporal (p.ej. check-in permitido solo el mismo día o ±1 día).
  - Definir y programar el flujo de depósito/garantía mínimo, conectando con `Payment` y/o MercadoPago si corresponde.

### 2.10 Check-in: sin marca de “documentos verificados”

- `CheckInRecord` tiene campo `documentsVerified`, pero:
  - El DTO `CheckInDto` solo admite `observations`.
  - El frontend (`CheckInPage`) no ofrece ninguna opción para marcar documentos como verificados.
- Resultado:
  - Todos los check-in se guardan con `documentsVerified = false`, perdiendo información de control de identidad.
- Recomendación:
  - Extender `CheckInDto` para recibir `documentsVerified`.
  - Añadir un control claro en la UI de check-in para que el recepcionista marque documentos como verificados cuando corresponda.

---

## 3. Funcionalidad planteada en los docs y aún no implementada (o incompleta)

En base al checklist de casos de uso (`checklist-casos-de-uso-my-hotel-flow.md`) y a los TODOs del código, se identifican las siguientes brechas relevantes.

### 3.1 Cancelar reserva (CUD03) – backend casi listo, frontend pendiente

- Backend:
  - `CancelReservationUseCase` implementa la lógica de cancelación con validaciones de estado/ventana de 24h (`Reservation.canBeCancelled`).
  - Endpoint `PATCH /reservations/:id/cancel` existe en `ReservationController`.
  - Falta:
    - Liberar la habitación (ver sección 2.5).
    - Emitir evento de dominio `ReservationCancelledEvent`.
    - Enviar notificación al cliente.
- Frontend:
  - El dashboard de reservas muestra opción "Cancelar reserva" (vía menú), pero:
    - No existe página `CancelReservationForm.tsx`.
    - No hay ruta declarada para `/reservations/cancel` en `AppRoutes.tsx`.
  - Resultado: el usuario ve la opción en el menú pero cae en 404 al hacer click.

### 3.2 Modificar reserva (CUD04) – backend implementado, sin UI

- Backend:
  - `UpdateReservationDatesUseCase` soporta modificación de fechas con validación de solapamientos y estado (`canBeModified()`).
  - Endpoint `PATCH /reservations/:id/dates` ya existe.
  - Falta completar el soporte de *optimistic locking* usando el campo `version` (TODO en el caso de uso).
  - No se recalcula ninguna factura existente después de modificar la reserva (si ya se generó una factura, queda desalineada).
- Frontend:
  - El menú de gestión tiene la opción "Modificar reserva", pero:
    - No hay componente `ModifyReservationForm`.
    - No hay ruta `/reservations/modify` en `AppRoutes.tsx`.

### 3.3 Consultar reservas por fechas / reportes (CUD05) – backend casi listo, sin pantalla dedicada

- Backend:
  - `ListReservationsUseCase` + `ListReservationsQueryDto` permiten filtrar por:
    - `status`, `checkInFrom`, `checkInTo`, `clientId`, `roomId`, `search`.
    - Paginación (`page`, `limit`).
  - Esto es suficiente para implementar la mayoría de los requisitos de búsqueda por fecha/rango planteados.
- Frontend:
  - No existe una pantalla específica tipo `ReservationSearchByDate` que exponga estos filtros en una UI de reportes.
  - Hoy los flujos de check-in y check-out usan `getConfirmedReservations` y `getActiveReservations`, pero no hay una vista tipo "listado histó rico" o "reporte de reservas".

### 3.4 Ocupación diaria (CUD06) – no implementado

- Backend:
  - No existe caso de uso ni endpoint `/occupancy/daily`.
  - Sí hay una opción en el menú de reservas (`GetReservationManagementMenuUseCase`) con path `/reservations/occupancy`, pero es solo un enlace, sin lógica.
- Frontend:
  - No hay componente `DailyOccupancyReport.tsx` ni ruta `/reservations/occupancy`.
- Impacto:
  - Se pierde una funcionalidad muy valiosa para la operación hotelera diaria (conocer ocupación por tipo de habitación, porcentaje, etc.).

### 3.5 Gestión avanzada de clientes (CUD08–CUD11) – parcialmente implementada

- Lo que sí está:
  - Crear clientes (CUD08) está implementado de forma bastante completa (`CreateClientProfile`, `CreateClientUseCase`, `ClientController`).
  - Listar, ver detalle, editar y dar de baja clientes (`ClientsListPage`, `ClientProfilePage`, `EditClientPage`, `deleteClient`, `deleteClientUseCase`).
- Lo que falta / está simplificado respecto al checklist:
  - No hay historial detallado de perfil ni de cambios (`reservation_history`, historial de modificaciones de cliente).
  - No se expone un endpoint dedicado a "ver detalles de cliente con historial de reservas" tal cual está diseñado en CUD11 (aunque parte de esa info podría obtenerse combinando endpoints actuales).
  - No hay una pantalla única de detalle de cliente que muestre a la vez perfil + historial y estadísticas avanzadas (gráficos, etc.) como plantea el documento.

### 3.6 Check-In / Check-Out avanzados (CUD12–CUD13)

- Check-In:
  - El caso de uso actual es una versión reducida del planificado (sin depósito, sin validaciones temporales, sin tokenización de tarjetas ni eventos de auditoría).
- Check-Out:
  - No se contemplan servicios adicionales consumidos durante la estadía (`additional_services`), que el checklist preveía.
  - No se está generando ni almacenando PDF de factura; el frontend usa datos JSON para un "recibo" visual/imprimible.

---

## 4. Riesgos de robustez y concurrencia

- **Ausencia de transacciones en flujos críticos**
  - `CreateReservationUseCase`, `PerformCheckInUseCase`, `PerformCheckOutUseCase` y `UpdateReservationDatesUseCase` hacen múltiples operaciones (leer reserva, leer habitación, actualizar estados, crear factura/movimientos) sin estar envueltas en una transacción.
  - `TypeOrmReservationRepository` sí tiene `findWithLock` y el proyecto ya usa transacciones en pagos (`RegisterPaymentUseCase`, `ProcessMercadoPagoWebhookUseCase`), lo que muestra el camino a seguir.
  - Riesgos:
    - Inconsistencias en caso de errores parciales (por ejemplo, reserva actualizada pero habitación no).
    - Condiciones de carrera bajo alta concurrencia (dos reservas intentando tomar la misma habitación casi al mismo tiempo).
- **Bloqueos / locking no utilizados**
  - Aunque existe `findWithLock` (pessimistic write) en el repositorio de reservas, los casos de uso de reservas no lo usan.
- **Idempotencia aún no activada**
  - Ya comentado en 2.6: sin idempotencia real, es posible crear reservas duplicadas ante reintentos.

Recomendación general: priorizar la implementación de **transacciones + locking** en los tres flujos más sensibles:

1. Crear reserva.
2. Check-in.
3. Check-out + generación de factura/deuda.

---

## 5. Calidad de testing y observabilidad

- **Testing**
  - El proyecto tiene algunos tests (auth, guards, mail service) y una buena guía de qué probar en el checklist, pero:
    - No hay una suite clara de tests unitarios para las nuevas entidades de dominio de reservas/facturación/deuda.
    - No hay tests de integración para los casos de uso más complejos (crear reserva con deuda, check-in/out, generación de facturas y pagos).
    - No se observan tests E2E que recorran flujos completos de front+back para reservas.
  - Dado el nivel de lógica de negocio, sería recomendable:
    - Añadir tests unitarios específicos para `Reservation`, `Room`, `Client`, `Invoice`, `Payment`.
    - Tests de integración para `CreateReservationUseCase`, `PerformCheckOutUseCase`, `RegisterPaymentUseCase`.
    - Al menos 1–2 flujos E2E clave (crear cliente → crear reserva → check-in → check-out → factura → pago).

- **Observabilidad**
  - `HealthModule` y `MetricsModule` ya están presentes, lo cual es muy positivo.
  - Faltan todavía:
    - Auditoría de acciones críticas (cancelación, check-in, check-out, pagos).
    - Métricas específicas de negocio (ocupación, reservas por día, facturación diaria).

---

## 6. Sugerencias de funcionalidades para un “buen sistema hotelero”

Sin salir del alcance del diseño actual, hay algunas áreas que podrían potenciar mucho el valor del sistema:

- **Multi-habitación por reserva**
  - El dominio actual modela `Reservation` con una sola `roomId`. Para hoteles que manejan familias o grupos, sería muy útil permitir reservar varias habitaciones en una sola reserva (aprovechando el diseño de `reservation_rooms` que figura en la documentación).

- **Tarifas avanzadas**
  - Hoy el precio por noche proviene de `RoomType.precioPorNoche`, y parte de la lógica de facturación sigue usando un valor hardcodeado (1000).
  - Futuras mejoras:
    - Tarifas por temporada (alta/baja).
    - Tarifas corporativas o por canal (web, OTA, agencia).

- **Módulo de housekeeping / mantenimiento**
  - El sistema ya distingue entre `RoomStatus.AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, etc., y el check-out marca habitaciones que requieren limpieza profunda.
  - Un pequeño módulo de housekeeping podría:
    - Listar habitaciones por estado y prioridad de limpieza.
    - Registrar tareas de limpieza y cierre de mantenimiento.

- **Reportes operativos**
  - La ocupación diaria (CUD06) sería un primer gran reporte.
  - Otros reportes útiles:
    - Reservas por canal.
    - Ingresos por tipo de habitación.
    - Deudores y envejecimiento de deuda (bucket de días vencidos).

- **Hardening de seguridad**
  - Una vez corregidos los guards, añadir:
    - Rate limiting en endpoints sensibles (login, creación de reserva).
    - Más logging de seguridad (`security_logs`) para intentos fallidos.

---

## 7. Prioridades recomendadas (backlog funcional)

Ordenadas aproximádamente por **impacto** (funcional + riesgo) y **esfuerzo**:

1. **Proteger `ReservationController`, `InvoicesController` y `PaymentsController` con `JwtAuthGuard` + `ActionsGuard`.**
2. **Corregir el contrato de `roomCondition` en check-out** (unificar enum backend/frontend).
3. **Completar flujo de cancelación**: liberar habitación + evento + notificación.
4. **Refinar semántica de `RoomStatus` en creación de reserva** (y persistir correctamente el estado si corresponde).
5. **Añadir transacciones en creación de reserva, check-in y check-out**, usando `QueryRunner` o servicios transaccionales.
6. Implementar **idempotencia real** en creación de reservas.
7. Exponer **UI para cancelar/modificar reservas** y para **reportes por fecha** apoyándose en `ListReservationsUseCase`.
8. Implementar **ocupación diaria (CUD06)** y su pantalla en frontend.
9. Añadir **tests unitarios e integración** básicos para los flujos críticos mencionados.

Con estos pasos, el sistema pasaría de un muy buen MVP avanzado a una plataforma hotelera sólida, robusta y lista para crecer en funcionalidades más sofisticadas.


