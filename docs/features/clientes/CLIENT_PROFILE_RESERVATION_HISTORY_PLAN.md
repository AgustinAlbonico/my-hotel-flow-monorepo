# Plan de Implementación - Historial de Reservas en Perfil de Cliente

## 1. Contexto y Objetivo

- **Objetivo**: Permitir que, en el perfil de un cliente (ruta frontend `clients/:id`, por ejemplo `clients/1`), se visualice el historial de reservas asociadas a ese cliente.
- **Alcance**: Solo vista interna para recepcionistas/admin (no portal de cliente). Se reutilizan al máximo contratos y lógica existente del módulo de **Reservas**.
- **Rol principal**: Recepcionista que abre el perfil de un cliente y necesita ver rápidamente todas sus reservas pasadas, presentes y futuras, con estado y datos clave.

---

## 2. Requisitos Funcionales

### 2.1 Vista en el Perfil de Cliente

1. **Ubicación**: Dentro de la página `clients/:id` (ej. `clients/1`):
   - Sección/tab "Historial de reservas" dentro del perfil del cliente.
   - Debe convivir con la información básica del cliente (datos personales, deudas, etc.).
2. **Listado de reservas**:
   - Mostrar una tabla o lista con las reservas del cliente ordenadas por `checkIn` descendente (más reciente primero).
   - Campos mínimos a mostrar por reserva:
     - Código de reserva (`code` o `codigoReserva`).
     - Fechas de estadía: `checkIn`, `checkOut`.
     - Habitación (`room.numeroHabitacion` o equivalente) y tipo de habitación si está disponible.
     - Estado de la reserva (`status` / `estado`): `IN_PROGRESS`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, etc.
     - Monto total (si está disponible en el contrato actual: `totalPrice`, `precioTotal`).
   - Mostrar **badge** de estado con colores definidos por el Design System.
3. **Filtros y orden**:
   - Filtro por **estado** de la reserva (select): Todos, Activas/Futuras, Finalizadas, Canceladas.
   - Filtro por **rango de fechas** (opcional, v1 puede ser solo lectura sin filtros, pero se deja contemplado en el plan).
   - Orden por fecha de check-in (descendente por defecto; permitir orden ascendente/descendente).
4. **Acciones rápidas** (solo plan, implementación posterior si se decide):
   - Botón/link para **ver detalle de la reserva** (navegar a ruta de administración de reservas, si existe, ej. `/reservations/:id`).
   - Botón para **crear nueva reserva** prellenando el cliente (llevar al flujo actual de creación de reserva con `clientId` precargado).
5. **Estados vacíos y errores**:
   - Si el cliente no tiene reservas: mostrar un estado vacío tipo "Este cliente aún no tiene reservas" + CTA "Crear reserva".
   - Si hay error de carga (problema de red o backend): mostrar mensaje de error controlado y opción de reintentar.

### 2.2 Seguridad y Autorización

1. Solo usuarios con permisos para ver clientes y reservas podrán ver el historial.
2. El backend debe validar que:
   - Un **cliente** autenticado solo ve su propio historial.
   - Un **recepcionista/admin** puede filtrar por `clientId` y ver el historial de cualquier cliente.
3. Respetar la política de respuesta de errores y códigos definidos en `docs/security` y `ESTRUCTURA_RESPUESTAS_API_IMPLEMENTADO.md`.

---

## 3. Diseño de API / Backend

### 3.1 Reutilización de `GET /api/v1/reservations`

Según `docs/features/reservas/05-contratos-api.md`, ya existe el endpoint:
- `GET /api/v1/reservations` con query params (`status`, `checkInFrom`, `checkInTo`, `clientId`, `roomId`, paginación, etc.).

**Estrategia preferida**:
- Reutilizar este endpoint para listar reservas por `clientId`.
- Asegurar que la implementación actual:
  - Aplica correctamente la regla de que un cliente solo ve sus reservas.
  - Permite a recepcionistas/admin filtrar con `clientId` arbitrario.
  - Retorna una estructura coherente con el uso de frontend (probablemente `{ data, pagination }`).

### 3.2 Ajustes necesarios en Backend

1. **DTO de query**: Confirmar/ajustar `ListReservationsQueryDto` para incluir `clientId` y reglas de validación.
2. **Caso de uso**: Revisar `list-reservations.use-case.ts` para:
   - Asegurar filtro por `clientId` cuando se recibe el parámetro.
   - Respetar restricciones según el rol del usuario autenticado.
3. **Controlador / Módulo de presentación**:
   - Verificar que el endpoint `/reservations` esté expuesto en el módulo `ReservationModule` y que acepte `clientId` en la query.
   - Si es necesario, documentar en Swagger la capacidad de listar por cliente.
4. **Orden por defecto**:
   - Asegurar que el orden por defecto de este listado sea `checkIn` DESC o `createdAt` DESC, de manera consistente con la vista de historial.
5. **Respuesta compacta**:
   - Confirmar que el DTO de respuesta incluya al menos:
     - `id`, `code`, `clientId`, `roomId`, `status`, `checkIn`, `checkOut`, `totalNights`, `totalPrice`, datos básicos de habitación y cliente.
   - Si falta algún campo necesario para el historial, extender el DTO de salida manteniendo compatibilidad.

### 3.3 Endpoint específico (opcional)

Si fuese necesario por performance/claridad, se podría definir un alias específico:
- `GET /api/v1/clients/:id/reservations`
- Internamente reutilizaría el caso de uso de `list-reservations` con `clientId = :id`.

Para esta primera iteración, el plan asumirá uso de `GET /reservations?clientId={id}` desde el frontend.

---

## 4. Diseño de Frontend

### 4.1 API Client

1. **Nuevo método en `apps/web/src/api/reservations.api.ts`**:
   - `getReservationsByClient(clientId: number, filters?: { status?: string; from?: string; to?: string; page?: number; limit?: number; }): Promise<{ data: ReservationListItem[]; ... }>`
   - Reutilizar el mismo patrón que `searchReservationsByDate`:
     - Llamar a `GET /reservations` con query params `clientId`, `status`, `checkInFrom`, `checkInTo`, `page`, `limit`.
     - Manejar la respuesta en los dos formatos posibles: plano (`ReservationListItem[]`) o envuelto ({ data, pagination }).

2. **Extender `ReservationListItem` si es necesario**:
   - Agregar campos opcionales: `roomNumber?: string; roomType?: string; totalPrice?: number; totalNights?: number;` respetando lo que devuelva el backend.

### 4.2 Rutas y Layout de Cliente

1. Ubicar las rutas de clientes (ej: `apps/web/src/routes` o dentro de `pages/clients`).
2. En la página `ClientDetailPage` o equivalente que usa ruta `clients/:id`:
   - Añadir una pestaña o sección "Historial de reservas".
   - El ID del cliente se obtiene desde `useParams()` o mecanismo equivalente de routing.

3. Si existe contexto global de cliente (ej: `ClientContext`):
   - Reutilizarlo para pasar `clientId` y quizás datos básicos de cliente al componente de historial.

### 4.3 Nuevo componente de Historial

Crear un componente dedicado, por ejemplo:
- `apps/web/src/components/clients/ClientReservationHistory.tsx`

Responsabilidades:
1. Recibir `clientId: number` como prop.
2. Hacer la llamada a `getReservationsByClient(clientId, filters)`:
   - Manejar estado de `loading`, `error`, `data`.
   - Exponer filtros básicos (opcional en v1) y paginación si aporta valor.
3. Renderizar la lista/tabla de reservas:
   - Usar componentes de diseño existentes (tabla, badges, tooltips) siguiendo `DESIGN_SYSTEM.md`.
   - Mostrar una fila por reserva con los campos mínimos definidos.
4. Estados especiales:
   - Vista de "cargando" con skeletons o spinner.
   - Vista de "sin reservas" con CTA.
   - Vista de error con botón de reintentar.

### 4.4 Integración en la página de Cliente

1. Incluir `ClientReservationHistory` en la página `clients/:id`:
   - Por ejemplo, como tab dentro de un layout de tipo `Tabs` junto a "Datos del cliente" / "Deudas" / etc.
2. Asegurar consistencia de URLs:
   - Si se usan subrutas (`clients/:id/history`), documentarlo en este plan y alinear con el router.

---

## 5. Reglas de Negocio para el Historial

1. **Qué reservas se muestran**:
   - Todas las reservas asociadas a `clientId` (pasadas, presentes y futuras) salvo que se decida un filtro específico.
   - Opcional: permitir en la UI un toggle "Mostrar solo reservas activas".
2. **Orden**:
   - Por defecto: `checkIn` DESC.
   - En caso de empate, orden secundario por `createdAt` DESC si está disponible.
3. **Estados y etiquetas**:
   - Mapear enums de backend a etiquetas amigables en español:
     - `CONFIRMED` → "Confirmada".
     - `IN_PROGRESS` → "En curso".
     - `CANCELLED` → "Cancelada".
     - `COMPLETED`/`FINALIZED` → "Finalizada".
   - Definir colores según Design System (ej.: verde para confirmadas, gris para finalizadas, rojo para canceladas, azul para en curso).
4. **Datos sensibles**:
   - No mostrar datos que no corresponden al módulo de reservas (ej. datos de pago sensibles, detalles internos de facturación) salvo que ya estén expuestos y aprobados en contratos existentes.

---

## 6. Consideraciones de UX

1. **Resumen arriba + listado abajo**:
   - Mostrar en el encabezado de la sección un pequeño resumen:
     - Cantidad total de reservas.
     - Cantidad de reservas activas/futuras.
     - Última reserva realizada (fecha de `checkIn` y estado).
2. **Accesos directos**:
   - Desde cada fila, link para abrir el detalle de la reserva o ir al módulo de gestión de reservas.
3. **Consistencia visual**:
   - Reutilizar estilos de tablas/labels ya usados para otros listados (reservas activas, deudores, etc.).

---

## 7. Pruebas y Validación

### 7.1 Backend

1. **Tests de caso de uso** (`list-reservations.use-case.spec.ts`):
   - Añadir tests que verifiquen filtrado correcto por `clientId`.
   - Tests de autorización: cliente solo ve sus reservas, recepcionista/admin puede filtrar por cualquier `clientId`.
2. **Tests E2E** (si aplica):
   - `GET /api/v1/reservations?clientId={id}` devuelve solo reservas de ese cliente.

### 7.2 Frontend

1. **Tests de componente** para `ClientReservationHistory`:
   - Render en estado loading, success (con data), empty y error.
   - Verificar que se llama a la API con el `clientId` correcto.
2. **Tests de integración/routing**:
   - Abrir ruta `clients/:id` y confirmar que el historial se muestra y consume la API esperada.

---

## 8. Plan de Implementación Paso a Paso

1. **Backend**:
   1. Revisar implementación actual de `GET /reservations` (controlador, caso de uso, repositorio).
   2. Confirmar/ajustar soporte de `clientId` como filtro y reglas de autorización según rol.
   3. Ajustar orden por defecto del listado (checkIn DESC) si es necesario.
   4. Verificar/expandir DTO de respuesta para incluir campos necesarios para el historial.
   5. Añadir/actualizar tests de `list-reservations.use-case.spec.ts`.

2. **Frontend - API**:
   1. Añadir `getReservationsByClient` en `reservations.api.ts`.
   2. Ajustar `ReservationListItem` con campos necesarios para la vista.

3. **Frontend - UI**:
   1. Localizar página `clients/:id` y su componente principal.
   2. Crear componente `ClientReservationHistory`.
   3. Integrar el componente en la página de cliente (tabs/sección).
   4. Añadir estados de loading, empty y error.
   5. (Opcional) Añadir filtros por estado y fechas.

4. **Pruebas y validación manual**:
   1. Correr tests de backend relacionados con reservas.
   2. Correr tests de frontend si existen para el área de clientes.
   3. Validar manualmente en entorno local:
      - Cliente con múltiples reservas.
      - Cliente sin reservas.
      - Cliente con reservas canceladas.

---

## 9. Riesgos y Consideraciones

- **Consistencia de contratos**: Cuidar que cualquier cambio en el DTO de reservas no rompa otras pantallas que ya consumen `/reservations`.
- **Performance**: Si la cantidad de reservas por cliente puede ser alta, considerar paginación en la vista (apoyada por el backend).
- **Seguridad**: Validar bien la filtración por `clientId` para evitar que un cliente pueda ver reservas de otro cliente.

---

## 10. Próximos Pasos

- Validar este plan con negocio/equipo.
- Una vez aprobado, crear tareas técnicas concretas (tickets) para Backend y Frontend siguiendo el plan de implementación (sección 8).
