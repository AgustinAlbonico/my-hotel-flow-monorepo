# Módulo de Check-out y Cobro (Robusto)

Este documento describe el diseño y la implementación del flujo de check-out con registro de pagos, integración con pasarela (MercadoPago), generación de factura y recibo imprimible.

## Objetivos
- Registrar check-out con confirmación de estado de habitación y observaciones.
- Generar factura automáticamente al finalizar el check-out.
- Capturar pagos:
  - Manuales: efectivo, transferencia, cheque, otros.
  - Con tarjeta: MercadoPago (link/redirección), con webhook para actualizar estado.
- Actualizar estado de factura (PENDING/PARTIAL/PAID/CANCELLED).
- Generar recibo imprimible y opción de guardado como PDF.

## Flujo resumido
1) Operador confirma check-out (condición de habitación + observaciones).
2) Backend cambia estado de reserva y genera factura.
3) UI abre modal de pago con 2 vías:
   - Pago manual: registra Payment inmediato y actualiza factura/saldo.
   - Pago con tarjeta: genera preferencia MP y redirige; al volver, un polling corto refresca la factura. El webhook de MP consolida el pago (idempotente) y actualiza saldo/estado.
4) Operador puede imprimir el recibo desde el detalle de factura o desde la ruta dedicada.

## Endpoints (backend)
- POST /reservations/:id/check-out (existente)
- POST /invoices/generate/:reservationId (existente)
- GET /invoices/:id (existente)
- GET /invoices/reservation/:reservationId (existente)
- GET /invoices/client/:clientId (existente)
- GET /invoices/list/overdue (existente)
- POST /payments (existente)
- GET /payments/:id (existente)
- GET /payments/invoice/:invoiceId (existente)
- GET /payments/client/:clientId (existente)
- POST /webhooks/mercadopago/create-preference (existente)
- POST /webhooks/mercadopago (webhook, existente)

Notas:
- El webhook procesa el pago via `ProcessMercadoPagoWebhookUseCase`, mapea estados y registra el Payment si es aprobado. Idempotencia por referencia `MP-<paymentId>`.
- `CreatePaymentPreferenceUseCase` genera preferencia con external_reference `INV-<invoiceId>` y crea registro pending en `mercadopago_payments`.

## Frontend (apps/web)
- Página Check-out: `ActiveReservationsPage.tsx`
  - Confirmación de check-out -> genera factura -> abre modal de pago.
  - Modal de pago incluye botón MercadoPago y formulario manual.
- Detalle de factura: `InvoiceDetailPage.tsx`
  - Botón MercadoPago en sidebar, formulario manual, y enlace a recibo.
  - Polling 5s x 60s para refrescar estado al volver de pasarela.
- Recibo imprimible: `InvoiceReceiptPage.tsx` (ruta `/invoices/:id/receipt`)
  - Muestra totales, pagos, cliente y fechas, con botón Imprimir.

## Estados y reglas
- Invoice:
  - PENDING: sin pagos.
  - PARTIAL: pagos parciales (< total).
  - PAID: saldo 0.
  - CANCELLED: no admite pagos.
- Payment:
  - Manual: COMPLETED inmediatamente.
  - MP: PENDING -> APPROVED/REJECTED via webhook; sólo APPROVED genera Payment COMPLETED y afecta saldo/factura.

## Seguridad y permisos
- Rutas protegidas con JWT + ActionsGuard.
- `mercadopago.crear` para generar preferencia.
- Facturas visibles con permiso `facturas.ver`.

## Impresión/PDF
- Fase 1: impresión del HTML (window.print) en `InvoiceReceiptPage`.
- Fase 2 (futuro): endpoint PDF server-side con template (ej. Handlebars + Puppeteer) y/o envío por email automático.

## Observabilidad
- Logs en webhook con status y errores.
- Se recomienda métricas (contador pagos aprobados/rechazados) en módulo metrics a futuro.

## Backlog (mejoras)
- Verificación de firma de MercadoPago (x-signature) en webhook.
- Reprocesamiento de webhooks fallidos.
- Reintentos y reconciliación vía consulta a API de MP por `paymentId`.
- Recibos con numeración y CAE (si aplica fiscalmente) en futuras integraciones.
- Configuración visual (logo, datos del hotel) desde base de datos.# Módulo de Check-out y Cobranza (Versión Inicial Robusta)

> Objetivo: Implementar un flujo completo, profesional y robusto para realizar el **check-out** de una reserva incluyendo: evaluación de habitación, generación automática de factura, registro de pagos (manuales y con pasarela), manejo de saldos parciales, emisión de comprobante y posibilidad de imprimir / descargar.

## 1. Alcance (Scope)

Incluye:
1. Flujo UI de check-out desde reservas activas.
2. Generación de factura (una por reserva al momento del check-out, con impuestos y totales calculados).
3. Registro de uno o múltiples pagos (parciales / totales).
4. Integración con pasarela (MercadoPago) para pagos con tarjeta (crédito / débito) con preferencia y webhook.
5. Actualización automática del estado de la factura (PENDING → PARTIAL → PAID / CANCELLED).
6. Emisión de comprobante / recibo imprimible (vista + opción `window.print`).
7. Auditoría mínima (timestamps: checkoutTime, paidAt por cada pago).
8. Soporte para métodos manuales: EFECTIVO, TRANSFERENCIA, CHEQUE, OTROS.

Fuera de alcance inicial (se documenta para próximas iteraciones):
- Facturación fiscal electrónica AFIP (CAEs, etc.).
- Notificaciones automáticas por email / WhatsApp del comprobante.
- Devoluciones / reembolsos integrados.
- Multi-moneda y tipos de cambio.

## 2. Flujo de Usuario (High Level)

```text
Reservas Activas -> Seleccionar Reserva -> Datos de check-out (estado habitación + observaciones)
-> Confirmar -> Ejecutar UseCase PerformCheckOut (backend) -> Generar Factura
-> Modal Pago:
      [A] Pago con tarjeta (MercadoPago): crear preferencia -> redirigir -> webhook confirma -> refrescar estado -> mostrar botón "Imprimir Recibo"
      [B] Pago manual: registrar pago (puede ser parcial) -> si saldo > 0 permanece abierto -> si saldo = 0 mostrar botón "Imprimir Recibo"
-> Vista detallada de factura / recibo imprimible.
```

## 3. Estados y Transiciones

- Reserva: IN_PROGRESS → (check-out) → COMPLETED.
- Factura:
  - PENDING (sin pagos)
  - PARTIAL (monto pagado < total)
  - PAID (monto pagado = total)
  - CANCELLED (manual / futura lógica)
- Pago MercadoPago:
  - pending → approved/rejected → (applied) genera Payment interno.

## 4. Entidades / Datos (Contratos)

### Factura (Invoice)
- id, invoiceNumber, reservationId, clientId
- subtotal, taxRate, taxAmount, total
- amountPaid, outstandingBalance
- status (PENDING | PARTIAL | PAID | CANCELLED)
- issuedAt, dueDate, notes

### Pago Manual (Payment)
- id, invoiceId, clientId, amount
- method (CASH | CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | CHECK | OTHER)
- status (PENDING, COMPLETED, FAILED, REFUNDED) – manual = directamente COMPLETED
- reference (string opcional) – ej: nro transferencia
- paidAt

### Pago Pasarela (MercadoPagoPayment)
- id, invoiceId, clientId, preferenceId
- externalPaymentId, status, paymentType, amount
- paymentMethodId (visa, mastercard, etc.)
- payerEmail
- createdAt / updatedAt
- metadata (JSON)

## 5. Endpoints Backend (Actuales + A Agregar)

Ya existen (según inspección):
- POST /reservations/checkout (o caso de uso PerformCheckOut)
- POST /invoices/generate (generateInvoice(reservationId))
- POST /payments (registerPayment)
- POST /webhooks/mercadopago/create-preference
- GET  /webhooks/mercadopago/config

Por agregar / completar:
- POST /webhooks/mercadopago/notification (webhook oficial) → Actualiza estado & crea Payment interno cuando status = approved.
- GET  /invoices/:id/receipt (JSON estructurado para recibo / potencial PDF en iteración futura).
- GET  /payments/invoice/:invoiceId
- (Opcional futuro) POST /payments/:id/refund

## 6. Lógica de Negocio Clave

1. Generar factura una vez por reserva al completar check-out.
2. Permitir múltiples pagos parciales; cada pago reduce outstandingBalance.
3. Cuando outstandingBalance == 0: estado factura → PAID.
4. Pagos con MercadoPago:
   - Crear preferencia con invoiceId y monto pendiente.
   - Redirigir a `initPoint`.
   - Webhook recibe notificación (topic: payment) y consulta estado → si `approved` crear Payment interno (method CREDIT_CARD/DEBIT_CARD) y actualizar factura.
5. Evitar registrar manualmente pagos duplicados sobre la misma factura (validación: amount <= outstandingBalance).
6. Recibo imprimible debe mostrar: datos hotel, fecha, cliente, detalle de conceptos (en esta versión: total global), métodos de pago utilizados y firma/campos para conformidad.

## 7. UX / Componentes Frontend

Nuevos / Modificados:
1. ActiveReservationsPage: Modal de pago incluir botón de MercadoPago + formulario manual.
2. InvoiceDetailPage: Botón "Imprimir Recibo" si status = PAID o PARTIAL (imprime estado actual).
3. InvoiceReceiptPage (nueva ruta `/invoices/:id/receipt`): versión limpia para impresión (estilos minimalistas, formato A4).
4. Components:
   - `ReceiptPrintView.tsx`: layout de recibo (props: invoice, payments, hotelInfo?).
   - `PrintButton.tsx` (simple helper) → `window.print()`.
5. Toasts claros para: preferencia creada, pago registrado, pago aprobado vía pasarela.

## 8. Seguridad / Permisos

- Reutilizar permisos facturas.ver para visualizar factura y recibo.
- Permiso reservas.checkout ya requerido para iniciar proceso.
- Endpoint webhook público: validar firma o token (pendiente en siguiente iteración).

## 9. Errores y Edge Cases

- Factura ya existente al intentar generar de nuevo (devolver existente).
- MercadoPago preference falla → mostrar toast y permitir reintento.
- Webhook duplicado → idempotencia basada en externalPaymentId.
- Pago manual excede saldo → 400.
- Sin conexión tras redirigir a pasarela → usuario puede volver y aún registrar manual.

## 10. Tareas (Backlog Técnico Inicial)

Frontend:
- [x] Agregar botón MercadoPago en Modal de pago de check-out.
- [ ] Nueva ruta y página `InvoiceReceiptPage`.
- [ ] Componente `ReceiptPrintView`.
- [ ] Botón imprimir en InvoiceDetailPage.
- [ ] Mejorar PaymentForm para indicar pago parcial vs total.

Backend (conceptual - pendientes de implementación si no existen):
- [ ] Endpoint webhook payment notification.
- [ ] Servicio que traduce webhook → creación Payment interno.
- [ ] Endpoint receipt JSON/PDF.

## 11. Próximas Iteraciones (Roadmap)

- PDF server-side (pdfkit) con logo y numeración oficial.
- Envío automático de recibo por email.
- Manejo de reembolsos / devoluciones.
- Conciliación automática de pagos pendientes.

---
Versión: 1.0 (Base inicial robusta) – Documento vivo, actualizar al completar tareas.
