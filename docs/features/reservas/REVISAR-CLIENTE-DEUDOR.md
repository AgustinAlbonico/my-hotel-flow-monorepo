# Revisión Cliente Deudor en Flujo de Reserva

## 1. Objetivo
En el paso 1 del asistente de creación de reservas (wizard), al buscar un cliente por DNI se debe impedir avanzar a la selección de fechas si el cliente tiene deuda pendiente. Debe abrirse un modal que muestre el detalle de la deuda (facturas impagas / saldo en cuenta corriente) y permitir saldarla usando el módulo de pagos (manual / MercadoPago). Una vez el saldo llega a 0 se habilita continuar con la reserva.

## 2. Estado Actual
- Endpoint backend `POST /reservations/search-client` devuelve datos básicos del cliente (sin `outstandingBalance`).
- El frontend (`CreateReservationWizard.tsx`) tras encontrar el cliente hace una llamada a `accountMovementsApi.getAccountStatement(client.id)` para comprobar `currentBalance`.
- Si `currentBalance > 0` abre el modal `SettleDebtModal`; si no, avanza directamente a Step 2 (fechas).
- El modal `SettleDebtModal` ya permite:
  - Listar facturas del cliente (hook `useClientInvoices`).
  - Mostrar saldo corriente (`useAccountStatement`).
  - Registrar pagos manuales (`PaymentForm`) y vía MercadoPago.
- El DTO `ClientFoundDto` no expone deuda; hay duplicidad de llamadas (buscar cliente y luego estado de cuenta).

## 3. Gaps / Problemas
1. Lógica de verificación está acoplada al wizard; se podría centralizar en backend para reducir round-trips.
2. No se devuelven razones de la deuda directamente en el endpoint de búsqueda (requiere segunda llamada).
3. Falta un contrato explícito de "estado deudor" (boolean + detalle) para habilitar extensiones futuras (políticas, scoring, bloqueo duro, etc.).
4. Riesgo de condiciones de carrera: si se registra un pago desde otro terminal mientras el modal está abierto.
5. Experiencia de usuario podría mejorar mostrando desde el primer momento el motivo exacto (factura vencida, parcial, etc.).

## 4. Propuesta (Resumen)
Incorporar un nuevo use case `GetClientDebtStatusUseCase` y ampliar el endpoint de búsqueda de cliente o crear uno separado:
- Opción A (recomendada por simplicidad UX): extender `POST /reservations/search-client` para retornar además:
  - `outstandingBalance: number`
  - `isDebtor: boolean`
  - `debtInvoices: { id, invoiceNumber, total, amountPaid, outstandingBalance, status, isOverdue }[]` (solo si `isDebtor=true`).
- El frontend usa esta respuesta para decidir abrir el modal inmediatamente sin necesidad de segunda llamada a estado de cuenta básica (se mantiene el modal para registrar pagos y refrescar). Se conserva `accountStatements` para movimientos históricos pero no para la decisión inicial.
- Agregar endpoint opcional `GET /clients/:id/debt-status` (futuro) si se requiere desacoplar del contexto de reservas.

## 5. Flujo Detallado
1. Usuario ingresa DNI y dispara búsqueda.
2. Backend busca cliente. Si no existe: `CLIENT_NOT_FOUND`.
3. Backend obtiene facturas del cliente con `outstandingBalance > 0` (filtrando por `InvoiceStatus !== PAID && !== CANCELLED`).
4. Calcula `outstandingBalance` (ya en entidad `Client` o suma de facturas + otros cargos.
5. Retorna payload extendido incluyendo detalle de cada factura impaga:
  - `reservationId`
  - `checkIn`, `checkOut`
  - `roomNumber`, `roomType`
  - `description` (ej: `Estadía del 2025-11-10 al 2025-11-13 en habitación 204 (Suite Deluxe)`)
6. Front:
   - Si `isDebtor=false` → avanza a Step 2.
   - Si `isDebtor=true` → abre `SettleDebtModal`, no avanza.
7. En el modal el usuario registra pagos:
   - Pago manual → POST `/payments`.
   - Pago vía MercadoPago → flujo existente.
   - Tras cada pago, se refetch de facturas + deuda (nuevo endpoint o reutilizar hooks adaptados).
8. Cuando deuda = 0 se habilita botón "Continuar" que cierra modal y avanza a Step 2.

## 6. Cambios Backend
### 6.1. Dominio
- Ya existen `Client.hasOutstandingDebt()` y lógica de `Invoice.getOutstandingBalance()`. No se requieren cambios en entidades.

### 6.2. Application Layer
- Crear `GetClientDebtStatusUseCase`:
  - Input: `clientId`.
  - Dependencias: `IClientRepository`, `IInvoiceRepository`.
  - Output DTO: `ClientDebtStatusDto` (`clientId, outstandingBalance, isDebtor, invoices: DebtInvoiceDto[]`).
- Modificar `SearchClientByDNIUseCase` o envolver su respuesta en nuevo coordinador:
  - Opción recomendada: crear `SearchClientWithDebtByDNIUseCase` que compone búsqueda de cliente + deuda.

### 6.3. DTOs Nuevos
```ts
export class DebtInvoiceDto {
  id: number;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  outstandingBalance: number;
  status: string;
  isOverdue: boolean;
}
export class ClientFoundExtendedDto extends ClientFoundDto {
  outstandingBalance: number;
  isDebtor: boolean;
  invoices?: DebtInvoiceDto[]; // opcional, sólo si isDebtor
}
```

### 6.4. Controllers
- En `ReservationController.searchClient`:
  - Sustituir uso directo de `SearchClientByDNIUseCase` por `SearchClientWithDebtByDNIUseCase`.
  - Responder siempre `{ success: true, data: ClientFoundExtendedDto }`.
- Mantener compatibilidad: Front podría tolerar ausencia de nuevos campos inicialmente. (Versión rápida: agregar sin romper claves existentes.)

### 6.5. Repositorios / Infra
- `IInvoiceRepository.findByClientId(clientId)` ya disponible.
- Filtrar en use case las facturas con `invoice.getOutstandingBalance() > 0`.
- Performance: si número de facturas puede crecer, añadir paginación futura. Por ahora OK.

### 6.6. Seguridad / Permisos
- Endpoint sigue usando `@Actions('clientes.ver')`.
- Agregar validación eventual para política: si cliente en lista negra → devolver nuevo código `CLIENT_BLOCKED`.

### 6.7. Migraciones
- Columna `clients.outstanding_balance` ya existe. No se requieren migraciones nuevas.

## 7. Cambios Frontend
### 7.1. Tipos
- Actualizar `ClientFound` → `ClientFoundExtended`:
```ts
export interface ClientFoundExtended {
  id: number; dni: string; nombre: string; apellido: string; email: string; telefono: string | null;
  outstandingBalance: number; isDebtor: boolean; invoices?: {
    id: number; invoiceNumber: string; total: number; amountPaid: number; outstandingBalance: number; status: string; isOverdue: boolean;
  }[];
}
```

### 7.2. API Client
- Actualizar `searchClientByDNI` para mapear nuevos campos si presentes.
- Eliminar llamada inmediata a `accountMovementsApi.getAccountStatement` en `CreateReservationWizard` para decisión inicial; usar valores del cliente.
- Conservar hooks actuales para refrescar tras cada pago (mantiene historial movimientos).

### 7.3. Wizard (`CreateReservationWizard.tsx`)
- Simplificar `onSuccess` de `searchClientMutation`:
  - `if (data.isDebtor) setShowDebtModal(true); else setCurrentStep(2);`
- Al cerrar modal exitoso (deuda saldada) ejecutar `setCurrentStep(2);`.
- Añadir estado `checkingDebt` si hay transición.

### 7.4. Modal `SettleDebtModal`
- Si se dispone de `invoices` dentro del cliente, permitir inyección inicial para reducir un fetch (opcional).
- Añadir botón "Refrescar deuda" que refetch ambos hooks.
- Mostrar badges: vencida (`isOverdue`), parcial, etc.

### 7.5. UX Ajustes
- Feedback inmediato si pago reduce saldo: animación / toast.
- Deshabilitar botón continuar mientras `currentBalance > 0`.

## 8. Estados / Errores / Edge Cases
| Caso | Manejo |
|------|--------|
| Cliente no existe | Mostrar error en Step 1 (ya implementado). |
| Cliente bloqueado (futuro) | Mostrar modal de bloqueo con mensaje y abortar flujo. |
| Facturas sin deuda | Modal muestra verde "No hay facturas impagas" y habilita continuar. |
| Pago excede saldo | Backend lanza error; mostrar toast y refetch. |
| Pago concurrente externo | Refetch periódico (cada X seg) o al foco del modal. |
| Timeout MercadoPago | Botón de reintento y mensaje de estado. |
| Fallo red deuda inicial | Retener en Step 1 y ofrecer reintentar. |

## 9. Plan de Pruebas
### 9.1. Unit (Backend)
- `SearchClientWithDebtByDNIUseCase`:
  - Cliente sin facturas → `isDebtor=false`.
  - Cliente con 1 factura parcial → cálculo correcto.
  - Cliente con varias facturas vencidas → lista completa y `isOverdue` correcto.
- Validar que no se exponen facturas pagadas.

### 9.2. Integration / e2e (Backend)
- Endpoint `/reservations/search-client` retorna campos extendidos.
- Registro de pago reduce deuda y cambia `isDebtor` en siguiente llamada.

### 9.3. Frontend Unit
- Wizard: render condicional de modal según `isDebtor`.
- Modal: habilita continuar cuando saldo llega a 0.

### 9.4. Frontend e2e (Cypress / Playwright)
- Flujo completo: cliente deudor → pago parcial → todavía bloqueado → pago restante → desbloqueo.
- Cliente sin deuda pasa directo a Step 2.

## 10. Checklist Implementación
Backend:
- [ ] Crear DTOs `DebtInvoiceDto`, `ClientFoundExtendedDto`.
- [ ] Crear use case `SearchClientWithDebtByDNIUseCase`.
- [ ] Inyectar en módulo de reservas.
- [ ] Actualizar controlador `search-client`.
- [ ] Añadir tests unitarios.
Frontend:
- [ ] Actualizar tipos `ClientFoundExtended`.
- [ ] Adaptar `searchClientByDNI` API client.
- [ ] Simplificar lógica Step 1.
- [ ] Ajustar `SettleDebtModal` para opcional preload invoices.
- [ ] Tests unitarios Wizard + Modal.
QA:
- [ ] Escenarios de pago concurrente.
- [ ] Validación de seguridad/permisos.
Docs:
- [ ] Actualizar README de módulo reservas si aplica.

## 11. Despliegue / Migración
- No hay migraciones nuevas.
- Despliegue coordinado: backend se publica primero (campos nuevos son aditivos). Frontend puede convivir transitoriamente ignorando campos extra.

## 12. Futuras Mejoras
- Endpoint dedicado `/clients/:id/debt-status` cacheable.
- WebSocket / SSE para actualizar saldo en tiempo real durante pagos.
- Reglas de negocio: bloqueo por monto máximo o días de mora.
- Integrar scoring de riesgo.

## 13. Contrato Resumido (Nuevo Use Case)
- Input: `{ dni: string }`
- Output: `{ id, dni, nombre, apellido, email, telefono, outstandingBalance, isDebtor, invoices? }`
- Error Modes: `CLIENT_NOT_FOUND`, (futuro) `CLIENT_BLOCKED`.
- Invariantes: `outstandingBalance >= 0`; si `isDebtor=false` entonces `invoices` ausente o `[]`.

## 14. Métricas (Opcional)
- Latencia búsqueda antes vs después (objetivo: no superar +15% con agregación de facturas).
- Tasa de conversion reserva clientes deudores (después de permitir saldar inmediatamente).

---
**Conclusión:** El sistema ya posee gran parte de la infraestructura (modal de pago, entidades con saldo). La mejora consiste en centralizar y exponer el estado de deuda al inicio, reduciendo llamadas y mejorando la UX con un contrato más claro.
