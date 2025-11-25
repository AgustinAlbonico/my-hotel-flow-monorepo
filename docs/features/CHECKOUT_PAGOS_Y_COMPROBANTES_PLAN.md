# Módulo de Checkout, Pagos y Comprobantes (Plan Profesional v2)

> Documento de planificación para consolidar y profesionalizar el flujo de **check-out**, **cobros** (manuales y MercadoPago) y **comprobantes/recibos**, dejando listo el terreno para facturación fiscal (ARCA) en modo test.

## 1. Estado actual (resumen rápido)

- **Backend (NestJS, capa Application/Domain)**  
  - `PerformCheckOutUseCase`  
    - Cierra la reserva (`Reservation`), actualiza habitación (`Room`) y **genera automáticamente la factura** (`Invoice`) si no existe.  
    - Registra el cargo en cuenta corriente (`AccountMovement`) y aumenta la deuda del cliente.
  - `GenerateInvoiceUseCase`  
    - Genera factura para una reserva (uso manual / alternativo).  
  - `RegisterPaymentUseCase`  
    - Registra pagos **manuales** (`Payment`) contra una factura.  
    - Marca el pago como `COMPLETED`, actualiza factura (`amountPaid`, `status`), movimientos de cuenta y deuda del cliente.
  - `CreatePaymentPreferenceUseCase`  
    - Valida factura y cliente, calcula saldo pendiente, crea **preferencia de pago en MercadoPago** (SDK oficial).  
    - Registra un `Payment` unificado en estado `PENDING` con metadatos de MP.
  - `ProcessMercadoPagoWebhookUseCase`  
    - Recibe datos del pago desde el webhook (vía `MercadoPagoWebhooksController` + `MercadoPagoService.getPayment`).  
    - Actualiza el `Payment` unificado (status MP, referencia, etc.), ajusta factura, deuda y cuenta corriente.
  - `InvoicesController`  
    - CRUD de lectura de facturas + `GET /invoices/:id/receipt` que arma un JSON listo para recibo (invoice + payments + client).
  - `PaymentsController`  
    - Alta y consultas de pagos (manuales y de MP, ya unificados).
  - `MercadoPagoWebhooksController`  
    - Endpoint público `POST /webhooks/mercadopago` con verificación de firma opcional.  
    - Endpoint autenticado `POST /webhooks/mercadopago/create-preference`.  
    - Endpoint público `GET /webhooks/mercadopago/config`.

- **Frontend (React, apps/web)**  
  - Página `ActiveReservationsPage` (`/reservations/checkout`)  
    - Llama a `performCheckOut` (backend) para cerrar reserva.  
    - Luego llama a `generateInvoice` y abre modal de pago.  
    - Modal de pago muestra:
      - `PaymentForm` para pagos manuales (CASH, TRANSFER, DEBIT, CREDIT).  
      - `MercadoPagoButton` cuando el método seleccionado es tarjeta.
    - Después de un pago **manual** exitoso, se cierra el modal y se resetea el estado, **sin navegación directa a comprobante**.
  - `InvoiceDetailPage` (`/invoices/:id`)  
    - Muestra detalles de factura y su historial de pagos.  
    - Ofrece:
      - Formulario de pago manual (`PaymentForm`).  
      - Botón `MercadoPagoButton` para tarjeta.  
      - Enlace a recibo imprimible: `Imprimir Recibo` → `/invoices/:id/receipt`.  
      - Link “Ver versión imprimible ↗” en el panel de pago.  
    - Usa **polling** suave tras volver de MP para refrescar estado.
  - `InvoiceReceiptPage` (`/invoices/:id/receipt`)  
    - Vista limpia imprimible (HTML + `window.print`), muestra totales y pagos.
  - `SettleDebtModal`  
    - Permite saldar deudas históricas por factura (PaymentForm + MercadoPagoButton) pero **no expone link directo a recibos**.

- **Permisos y acciones**  
  - Se usa `reservas.checkout` para el flujo completo de check-out.  
  - Existen acciones `checkout.*` (`checkout.registrarPago`, `checkout.cerrar`, `checkout.imprimirComprobante`) definidas pero marcadas como no usadas en la documentación de seguridad.

- **Documentación existente**  
  - `CHECKOUT_MODULE.md` ya define un diseño robusto de check-out y cobros.  
  - `MERCADOPAGO_SETUP.md` documenta configuración y pruebas con MP.  
  - `SISTEMA_IMPLEMENTADO.md` confirma entidades de facturación, pagos y deuda de cliente.

## 2. Problemas y oportunidades detectadas

- **Experiencia de check-out con efectivo**  
  - El flujo actual desde `/reservations/checkout` permite registrar el pago en efectivo, pero una vez confirmada la operación, el usuario **no queda posicionado en ningún lugar donde se vea claramente el comprobante**.  
  - El recibo existe (vía `InvoiceDetailPage` + `InvoiceReceiptPage`), pero está “escondido” detrás de la sección de facturas.

- **Duplicidad conceptual en generación de facturas**  
  - `PerformCheckOutUseCase` ya genera factura automáticamente.  
  - Desde frontend, luego del check-out se llama igualmente a `generateInvoice`.  
  - Aunque conceptualmente es idempotente (una factura por reserva), esto complica el modelo mental del operador.

- **Acciones `checkout.*` sin uso real**  
  - El código y las rutas usan `reservas.checkout` para todo.  
  - Las acciones `checkout.registrarPago`, `checkout.cerrar`, `checkout.imprimirComprobante` quedan como “fantasmas” documentados pero sin endpoint asociado, lo que puede confundir.

- **Comprobantes “no fiscales” vs “fiscales”**  
  - El sistema hoy emite un **recibo no fiscal** (basado en `Invoice` + `Payment`).  
  - No existe una capa clara para **comprobantes fiscales** (AFIP/ARCA) ni un modelo para CAE, tipo de comprobante, etc.

- **MercadoPago funcional, pero con espacio para endurecer**  
  - El backend está bien estructurado y usa el SDK oficial.  
  - Hay verificación de firma opcional, logs y mapeo de estados.  
  - Falta consolidar una UX clara de “pago aprobado → mostrar comprobante” tanto en check-out como en otras pantallas (ej: saldar deuda).

## 3. Objetivos del rediseño

- **Negocio / producto**
  - Que el flujo de **check-out + cobro + comprobante** sea claro, rápido y vendible a hoteles reales.  
  - Que el operador siempre tenga un **camino explícito para imprimir o descargar un comprobante** después de cobrar, sea efectivo o tarjeta.
  - Preparar el modelo para que, en una iteración posterior, se pueda integrar **facturación fiscal con ARCA** (usando una librería tipo `facturitas`) en modo sandbox.

- **Técnicos / arquitectura**
  - Mantener la **clean architecture**: entidades y lógica intactas, con puertos/adapters para pasarelas y fiscal.  
  - Unificar el concepto de **recibo**: derivado de `Invoice` + `Payment`, con una capa adicional opcional de datos fiscales.  
  - Reducir duplicaciones (especialmente generación de factura) y dejar claro qué caso de uso es “la verdad” en cada flujo.

## 4. Modelo de dominio objetivo

> Nota: se apoya en las entidades actuales (`Invoice`, `Payment`, `AccountMovement`, `Reservation`, `Client`) y agrega sólo extensiones para la parte fiscal.

- **Invoice (ya implementado)**  
  - Sigue siendo la **unidad de facturación interna**: totales, impuestos, estado (PENDING, PARTIAL, PAID, CANCELLED).

- **Payment (ya implementado, unificado)**  
  - Única entidad de pago (manual o pasarela).  
  - Campos MP opcionales (`mpPreferenceId`, `mpExternalPaymentId`, etc.) ya incorporados.

- **AccountMovement (ya implementado)**  
  - Registra cargos (facturas) y créditos (pagos) para mantener la cuenta corriente del cliente.

- **Reglas de deuda en el modelo objetivo**  
  - La **deuda del cliente** (`Client.outstandingBalance`) pasa a representar el **compromiso económico de la estadía**, no sólo facturas ya generadas:  
    - En el **check-in** se registra un cargo inicial por el importe estimado de la estadía (noches planificadas × tarifa), que impacta en `AccountMovement` y en `Client.outstandingBalance`.  
    - En el **check-out** se genera la factura final y se ajusta la cuenta corriente: si el total real difiere del estimado (por extensión de noches, consumos extra o salida anticipada), se registran movimientos adicionales de cargo o de ajuste para que la deuda quede alineada con la factura.  
    - Los **pagos** (manuales o MercadoPago) siguen reduciendo la deuda a través de `RegisterPaymentUseCase` / `ProcessMercadoPagoWebhookUseCase` (`client.reduceDebt(amount)`).

- **Extensión para comprobantes fiscales (ARCA / facturitas)**  
  - **Value Object `FiscalInfo` asociado a `Invoice`** (no se implementa aún, sólo se diseña):
    - `fiscalType` (ej: `FACTURA_A`, `FACTURA_B`, `TICKET`, etc.).  
    - `fiscalStatus` (ej: `PENDING`, `EMITTED`, `REJECTED`).  
    - `arcaInvoiceId` / `externalId`.  
    - `cae` / `codigoAutorizacion` y `caeExpirationDate`.  
    - `qrUrl` o `barcodeData`.  
    - `rawResponse` (JSON de la API para debugging en entorno test).
  - Puerto de dominio **`IFiscalInvoicingProvider`**:
    - `emitInvoice(invoice: Invoice, client: Client): Promise<FiscalInfo>`.  
    - `cancelInvoice(fiscalInfo: FiscalInfo): Promise<FiscalInfo>` (opcional).  
    - `getInvoiceStatus(fiscalInfo: FiscalInfo): Promise<FiscalInfo>` (opcional).  
  - Adapter de infraestructura (futuro) **`ArcaFiscalProvider`** que use la librería `facturitas` o similar en modo sandbox.

## 5. Flujos de negocio deseados

### 5.0. Flujo previo – Check-in y registro inicial de deuda

1. **Recepcionista** realiza el check-in desde la UI correspondiente (`PerformCheckInUseCase`).  
2. Backend:
   - Verifica que la reserva esté en estado válido (CONFIRMED/IN_PROGRESS según reglas de reservas).  
   - Cambia el estado de la reserva a “en estadía” y la habitación a `OCCUPIED`.  
   - Calcula el **importe estimado de la estadía**:
     - `nochesPlanificadas × tarifaPorNoche` (idealmente desde `RoomType`/precio configurado).  
   - Registra en cuenta corriente:
     - `AccountMovement.createCharge(...)` por el importe estimado de la estadía, marcando la referencia con el código de reserva.  
   - Actualiza al cliente:
     - `client.addDebt(importeEstimado)` → el cliente pasa a figurar con deuda desde el inicio de su estadía.  
3. De esta forma, incluso si el huésped abandona el hotel sin completar el flujo de check-out, **ya figura como deudor** y puede ser bloqueado para nuevas reservas hasta regularizar su situación.

### 5.1. Flujo 1 – Check-out + pago manual (efectivo / transferencia)

1. **Recepcionista** entra a `/reservations/checkout` (permiso `reservas.checkout`).  
2. Selecciona una reserva `IN_PROGRESS`, completa condición de habitación y observaciones.  
3. Frontend llama a `POST /reservations/:id/check-out`.  
   - `PerformCheckOutUseCase`:
     - Completa reserva.  
     - Actualiza habitación.  
     - Genera factura `Invoice` si no existe, registra cargo en cuenta y aumenta deuda del cliente.
4. Frontend obtiene la factura:
   - Preferencia recomendada: `GET /invoices/reservation/:reservationId`.  
   - Alternativa idempotente: `POST /invoices/generate/:reservationId` (si no existe).
5. Se abre **modal de pago** con:
   - Resumen de factura (total y saldo pendiente).  
   - `PaymentForm` con método por defecto `CASH`.
6. Operador ingresa monto (total o parcial) y confirma.  
   - Frontend → `POST /payments` (`RegisterPaymentUseCase`).  
   - Backend:
     - Crea `Payment` (status `COMPLETED`).  
     - Actualiza `Invoice` (`amountPaid`, `status`).  
     - Crea `AccountMovement` de pago.  
     - Reduce deuda del cliente.
7. **Comportamiento deseado post-pago**:
   - Si `outstandingBalance === 0` →  
     - Cerrar modal y **redireccionar automáticamente a `/invoices/:id/receipt`** dentro de la misma ventana.  
   - Si `outstandingBalance > 0` →  
     - Mantener contexto de check-out pero mostrar:
       - Toast de éxito con link “Ver recibo parcial”.  
       - Botón “Imprimir Recibo” que también lleve a `/invoices/:id/receipt`.

### 5.2. Flujo 2 – Check-out + pago con MercadoPago (tarjeta)

1. Pasos 1–5 iguales al flujo anterior.  
2. En el modal de pago, el recepcionista elige método `DEBIT_CARD` o `CREDIT_CARD` en `PaymentForm`.  
3. Se muestra el bloque de pago con MP (`MercadoPagoButton`):
   - Frontend → `POST /webhooks/mercadopago/create-preference` con `invoiceId` + `method`.  
   - `CreatePaymentPreferenceUseCase`:
     - Valida factura y cliente.  
     - Verifica saldo pendiente > 0.  
     - Crea preferencia en MP (`MercadoPagoService.createPreference`).  
     - Registra `Payment` unificado `PENDING` con `mpPreferenceId`.  
   - Frontend redirige a `initPoint` de MercadoPago.
4. El huésped completa el pago en el **checkout de MercadoPago**.  
5. MercadoPago dispara un webhook a `POST /webhooks/mercadopago`:
   - `MercadoPagoWebhooksController` verifica firma (si hay secreto).  
   - Llama a `MercadoPagoService.getPayment(paymentId)` y mapea el resultado a `PaymentData`.  
   - Ejecuta `ProcessMercadoPagoWebhookUseCase`:
     - Localiza el `Payment` unificado (por external payment id o preferencia).  
     - Actualiza info de MP (status, method, email, metadata).  
     - Si status `approved`:
       - Marca el `Payment` como `COMPLETED`.  
       - Ajusta `Invoice` (`recordPayment`).  
       - Crea `AccountMovement` de pago.  
       - Reduce deuda del cliente.
6. UX al regresar de MP:
   - Desde `InvoiceDetailPage`, ya hay un **polling** que refresca factura y pagos durante 60s.  
   - Para check-out:
     - Opciones recomendadas:
       - Redirigir a `InvoiceDetailPage` al volver de MP.  
       - O bien, mantener la ruta de check-out pero mostrar un botón “Ver factura” que lleva a `InvoiceDetailPage`.
   - Una vez que la factura quede `PAID`, el operador puede:
     - Click en `Imprimir Recibo` → `/invoices/:id/receipt`.  
     - O desde el modal inicial, mostrar un link “Ver recibo” cuando el saldo se detecte en 0.

### 5.3. Flujo 3 – Cobro de deudas históricas

1. Desde búsqueda de cliente o intents de nueva reserva, se detecta que el cliente está deudor (`outstandingBalance > 0`).  
2. Se abre `SettleDebtModal`:
   - Muestra estado de cuenta y facturas con saldo (`useClientInvoices`).  
   - Para cada factura:
     - Bloque de pago con MP si método seleccionado es tarjeta.  
     - `PaymentForm` para pagos manuales.
3. Después de cada pago:
   - Se refresca estado de facturas y saldo de cuenta.  
   - Cuando `statement.currentBalance <= 0` se permite continuar.
4. **Mejora deseada**:
   - Incorporar, junto a cada factura, un link “Ver recibo” → `/invoices/:id/receipt`.  
   - Opcional: botón global “Imprimir recibo última factura cobrada”.

### 5.4. Flujo 4 – Emisión de comprobante fiscal (ARCA, modo test)

> Fase futura, pero se diseña ahora para no romper el modelo.

1. Una vez que una factura está **emitida internamente** (`Invoice`) y opcionalmente **pagada**:
   - Regla sugerida: emitir comprobante fiscal **cuando la factura pasa a `PAID`**.
2. `EmitFiscalInvoiceUseCase`:
   - Recupera `Invoice` y `Client`.  
   - Construye DTO de `facturitas` / ARCA (items, totales, datos del receptor).  
   - Llama a `IFiscalInvoicingProvider.emitInvoice(...)`.  
   - Recibe `FiscalInfo` (con CAE, tipo, etc.) y lo almacena asociado a la `Invoice`.  
   - Marca `fiscalStatus = EMITTED`.
3. Frontend:
   - En `InvoiceDetailPage` y `InvoiceReceiptPage`, si existe `FiscalInfo`, se muestra:  
     - Tipo de comprobante, número, CAE, vencimiento, QR/CAE.  
     - Aclaración visual de que es un comprobante **fiscal** (aunque esté en sandbox).
4. Importante:
   - Usar **credenciales de prueba** y CUIT/razón social de prueba.  
   - Nunca exponer ni almacenar datos fiscales reales en este entorno de pruebas.

### 5.5. Extender estadía / agregar noches a una reserva

1. **Escenario**: el huésped ya tiene una reserva creada (y normalmente ya hizo check-in) y desea **agregar noches** (extender la fecha de salida).  
2. Frontend ofrece una acción de “Extender estadía” sobre la reserva (por ejemplo, reutilizando internamente el caso de uso de actualización de fechas de reserva).  
3. Backend:
   - Caso de uso (conceptual) `ExtendStayUseCase` o `UpdateReservationDatesUseCase`:
     - Recibe un nuevo `checkOut` propuesto.  
     - Valida:
       - Que la reserva esté en un estado que permita cambios (ej. IN_PROGRESS/CONFIRMED).  
       - Que **no existan solapamientos** con otras reservas:
         - La condición estándar: no debe existir otra reserva para la misma habitación tal que  
           `existing.checkIn < nuevoCheckOut AND existing.checkOut > checkInActual`  
           (reutilizable de la lógica de prevención de overbooking).  
     - Si hay solapamiento, rechaza la extensión con error de conflicto de disponibilidad.  
   - Si la extensión es válida:
     - Calcula la **diferencia de noches** respecto al `checkOut` original (nuevas noches agregadas).  
     - Obtiene la tarifa por noche y calcula el **importe adicional**.  
     - Registra en cuenta corriente:
       - Un nuevo `AccountMovement.createCharge(...)` por el importe adicional, con referencia a la misma reserva.  
     - Actualiza al cliente:
       - `client.addDebt(importeAdicional)` → la deuda aumenta por las noches extra.  
     - Actualiza la reserva con el nuevo `checkOut`.  
4. En el **check-out final**, la factura generada tomará como base las fechas definitivas y el total de noches, de forma consistente con los cargos registrados en cuenta corriente y con la deuda acumulada del cliente.

## 6. Diseño de API y casos de uso (backend)

### 6.1. Endpoints consolidados

- **Reservas**
  - `POST /reservations/:id/check-out`  
    - Caso de uso: `PerformCheckOutUseCase`.  
    - Genera factura si no existe y actualiza estado de reserva/habitación.

- **Facturas**
  - `POST /invoices/generate/:reservationId`  
    - Uso manual. Desde check-out se recomienda preferir `GET /invoices/reservation/:reservationId`.  
  - `GET /invoices/:id`  
  - `GET /invoices/reservation/:reservationId`  
  - `GET /invoices/client/:clientId`  
  - `GET /invoices/list/overdue`  
  - `GET /invoices/:id/receipt`  
    - Devuelve estructura completa para recibo imprimible (invoice + payments + client + totals).

- **Pagos**
  - `POST /payments`  
    - Caso de uso: `RegisterPaymentUseCase`.  
  - `GET /payments/:id`  
  - `GET /payments/invoice/:invoiceId`  
  - `GET /payments/client/:clientId`

- **MercadoPago**
  - `POST /webhooks/mercadopago`  
    - Webhook público, verifica firma si `MERCADOPAGO_WEBHOOK_SECRET` está definido.  
    - Caso de uso: `ProcessMercadoPagoWebhookUseCase`.  
  - `POST /webhooks/mercadopago/create-preference`  
    - Autenticado + permiso `mercadopago.crear`.  
    - Caso de uso: `CreatePaymentPreferenceUseCase`.  
  - `GET /webhooks/mercadopago/config`  
    - Devuelve `publicKey` + `isConfigured`.

- **Futuro – Fiscal**
  - `POST /invoices/:id/fiscal/emit`  
    - Caso de uso: `EmitFiscalInvoiceUseCase`.  
    - Sólo modo sandbox, protegido por permisos de facturación fiscal (a definir).  
  - `GET /invoices/:id/fiscal`  
    - Devuelve `FiscalInfo` asociado a la factura (si existe).

### 6.2. Casos de uso clave a mantener/refinar

- `PerformCheckOutUseCase`
  - Asegurar que cubre completamente la generación de factura (y que `GenerateInvoiceUseCase` no es necesario en el flujo normal de check-out, salvo como fallback manual).

- `RegisterPaymentUseCase`
  - Mantener como **único entry point** para pagos manuales, incluyendo pagos desde check-out y desde `SettleDebtModal`.

- `CreatePaymentPreferenceUseCase` y `ProcessMercadoPagoWebhookUseCase`
  - Mantener la unificación de pagos MP en `Payment`, evitando entidades duplicadas.

- Futuro: `EmitFiscalInvoiceUseCase`
  - Implementado en módulo de billing, usando `IFiscalInvoicingProvider`.

## 7. Diseño de la UI (frontend) orientado a comprobantes

### 7.1. Check-out (`ActiveReservationsPage`)

- **Antes del cambio**  
  - Tras registrar un pago manual se cierra el modal y no se ofrece link directo al recibo.

- **Después del cambio deseado**  
  - Después de `registerPayment`:
    - Volver a consultar la factura (`getInvoiceById` o `getInvoiceByReservation`).  
    - Si saldo = 0:
      - Redirigir automáticamente a `/invoices/:id/receipt`.  
    - Si saldo > 0:
      - Mantener en check-out pero mostrar un botón “Ver recibo (parcial)” que también lleva a `/invoices/:id/receipt`.  
  - Opcional: agregar un pequeño bloque resumen “Comprobante de pago” con botón “Imprimir”.

### 7.2. Listado y detalle de facturas

- `InvoicesPage`  
  - Ya lista facturas con estados y saldos.  
  - Mantener como hub para administración.

- `InvoiceDetailPage`
  - Mantener:
    - Botón `Imprimir Recibo`.  
    - Panel con `PaymentForm` y botón MP.  
    - Enlace “Ver versión imprimible ↗”.
  - Futuro fiscal:
    - Mostrar “Comprobante fiscal emitido” con datos de CAE si existen.

- `InvoiceReceiptPage`
  - Mantener como **única vista imprimible**.  
  - Agregar (futuro) sección de datos fiscales cuando estén disponibles.  
  - Mejorar pequeños detalles visuales (colores condicionales, etc.) sin romper estructura.

### 7.3. Módulo de deudas (`SettleDebtModal`)

- Añadir, junto a cada factura con saldo:
  - Link “Ver recibo” → `/invoices/:id/receipt`.  
  - Esto permite al operador entregar un comprobante aun cuando se está cobrando una deuda previa, no sólo en check-out.

## 8. Plan de implementación por fases

### Fase 0 – Alineación sin cambios de dominio

- **Backend**
  - Documentar explícitamente que `PerformCheckOutUseCase` es el responsable de generar factura al cerrar la reserva.  
  - Revisar y asegurar que `GenerateInvoiceUseCase` es idempotente respecto a la reserva (no crea duplicados).

- **Frontend**
  - Ajustar flujo de `ActiveReservationsPage` para:
    - Obtener la factura vía `GET /invoices/reservation/:reservationId` tras `check-out`.  
    - Después de registrar un pago manual:
      - Reconsultar la factura.  
      - Redirigir a `/invoices/:id/receipt` cuando saldo = 0.  
      - Mostrar link de recibo parcial cuando saldo > 0.
  - En `SettleDebtModal`, agregar links a recibos (`/invoices/:id/receipt`) por cada factura.

### Fase 1 – Hardening de MercadoPago

- Verificar y probar:
  - Firma del webhook (`x-signature`, `x-request-id`) en entorno test.  
  - Manejo de reintentos (webhooks repetidos).  
  - Estados de pago (approved, rejected, pending).  
  - Flujos de vuelta al sistema (desde URLs `/payment/success`, `/payment/failure`, `/payment/pending` si se implementan vistas dedicadas).

- Ajustar UX para:
  - Redirigir a `InvoiceDetailPage` o a `/invoices/:id/receipt` después de pagos aprobados.

### Fase 2 – Capa de comprobantes fiscales (sandbox ARCA)

- **Backend**
  - Definir `IFiscalInvoicingProvider` y DTOs mínimos.  
  - Implementar `ArcaFiscalProvider` usando `facturitas` o SDK equivalente, sólo en entorno sandbox.  
  - Agregar `FiscalInfo` a `Invoice` (como value object o entidad embebida).  
  - Implementar `EmitFiscalInvoiceUseCase` y endpoints `POST /invoices/:id/fiscal/emit` y `GET /invoices/:id/fiscal`.

- **Frontend**
  - En `InvoiceDetailPage` y `InvoiceReceiptPage`, mostrar:
    - Datos fiscales cuando existan (CAE, tipo, etc.).  
    - Bandera clara de “Modo prueba ARCA”.

- **Operación / seguridad**
  - Variables de entorno separadas para ARCA sandbox (`ARCA_API_KEY_TEST`, `ARCA_ENV=sandbox`, etc.).  
  - No registrar datos reales en este entorno.  

### Fase 3 – Refinamientos y automatización

- Automatizar emisión fiscal cuando la factura cambia a `PAID` (evento de dominio).  
- Enviar comprobante (PDF/HTML) por email al cliente una vez emitido el fiscal (si corresponde).  
- Agregar métricas y dashboards:
  - Cantidad de check-outs/día.  
  - Monto cobrado por método de pago.  
  - Tasa de errores en pasarela/ARCA.

---

**Resultado esperado:** con este plan, tu módulo de **checkout + pagos + comprobantes** queda alineado con la arquitectura existente, mejora significativamente la experiencia de usuario (especialmente en pagos en efectivo) y deja una capa bien delimitada para sumar **facturación fiscal con ARCA** en modo test sin romper lo que ya funciona.


