# ADR-005 – Módulo de Checkout, Pagos y Comprobantes

## Contexto

- El sistema ya cuenta con:
  - Entidades de dominio para `Invoice`, `Payment`, `AccountMovement`, `Reservation` y `Client`.  
  - Casos de uso para:
    - `PerformCheckOutUseCase` (cierra reserva y genera factura).  
    - `GenerateInvoiceUseCase` (generación manual de factura).  
    - `RegisterPaymentUseCase` (pagos manuales).  
    - `CreatePaymentPreferenceUseCase` y `ProcessMercadoPagoWebhookUseCase` (integración MercadoPago).  
  - Endpoints y páginas para ver facturas y un recibo imprimible (`InvoiceReceiptPage`).
- Aun así, desde la perspectiva del usuario:
  - El flujo de **check-out con pago en efectivo** no termina de forma “redonda” en un comprobante imprimible.  
  - Hay duplicidad conceptual entre `reservas.checkout` y acciones `checkout.*` documentadas pero no usadas.  
  - No existe una capa clara para extender a **comprobantes fiscales** (ARCA) en modo prueba.

## Decisión

1. **Centralizar el flujo de cierre de estadía en `PerformCheckOutUseCase`**  
   - Este caso de uso será la **fuente de verdad** para:  
     - Cerrar reservas (`IN_PROGRESS → COMPLETED`).  
     - Actualizar estado de habitación.  
     - Generar la factura asociada si aún no existe.  
   - `GenerateInvoiceUseCase` queda como camino manual / de backoffice, **no** como parte del flujo normal de check-out.

2. **Establecer `Invoice` + `Payment` como base de todos los comprobantes no fiscales**  
   - El “recibo” que ve el usuario (y que imprime desde `InvoiceReceiptPage`) es una **vista de lectura** basada en:
     - La factura (`Invoice`: totales, impuestos, saldo).  
     - Los pagos (`Payment`: monto, método, referencia).  
   - No se crean nuevas entidades para recibos; los comprobantes son una representación del estado de la factura y sus pagos.

3. **Mantener un único modelo de pago unificado**  
   - `Payment` representa tanto pagos manuales (CASH, TRANSFER, etc.) como pagos de pasarela (MercadoPago), con campos MP opcionales.  
   - La entidad `MercadoPagoPayment` existente se considera auxiliar/histórica; la lógica de negocio se apoya en `Payment` como fuente única.  
   - Todos los ajustes de factura, cuenta corriente y deuda del cliente se hacen a partir de `Payment` (manual o completado vía webhook).

4. **Priorizar la experiencia de “cobro + comprobante inmediato” en la UI**  
   - Después de registrar un pago exitoso:
     - Si la factura queda saldada (`PAID`, saldo = 0), el flujo estándar debe llevar al usuario a la vista de recibo (`/invoices/:id/receipt`) para imprimir o guardar PDF.  
     - Si la factura queda parcial (`PARTIAL`), se ofrece igualmente acceso directo al recibo parcial.
   - Este patrón se aplicará tanto en:
     - Check-out (`ActiveReservationsPage`).  
     - Pantallas de facturas.  
     - Módulo de deudas (`SettleDebtModal`).

5. **Preparar una capa de facturación fiscal desacoplada (ARCA / facturitas)**  
   - Se introduce el puerto de dominio `IFiscalInvoicingProvider` y un `FiscalInfo` asociado a `Invoice`, sin implementarlo aún.  
   - Se define que:
     - La emisión fiscal se hará via caso de uso dedicado (`EmitFiscalInvoiceUseCase`).  
     - La implementación concreta (ej. `ArcaFiscalProvider` usando `facturitas`) se limitará inicialmente a **modo sandbox**.  
   - La UI mostrará, cuando exista, la información fiscal (CAE, tipo de comprobante, etc.) como **capa adicional** sobre el recibo ya existente.

6. **Mantener `reservas.checkout` como acción canónica, deprecar `checkout.*` para flujos nuevos**  
   - Las acciones `checkout.registrarPago`, `checkout.cerrar`, `checkout.imprimirComprobante` se consideran legacy/no usadas.  
   - Los permisos efectivos son:
     - `reservas.checkout` para ejecutar el check-out.  
     - `facturas.ver` para ver facturas y comprobantes.  
     - Permisos de pagos existentes (`pagos.*`) para registrar y listar pagos.

## Consecuencias

- **Positivas**
  - El flujo de check-out queda más simple: “cerrar estadía → usar factura resultante para cobrar e imprimir”.  
  - Los comprobantes no fiscales se estandarizan como vistas sobre `Invoice` + `Payment`, facilitando reporting y análisis.  
  - La integración con MercadoPago permanece consistente y extensible; cualquier pasarela futura se acoplará al mismo modelo de `Payment`.  
  - La UI de recepción mejora sensiblemente: siempre hay un camino explícito para llegar a un comprobante imprimible después de cobrar.  
  - La futura integración con ARCA / facturación fiscal se puede agregar sin romper contratos actuales ni la experiencia de usuario.

- **Negativas / riesgos**
  - Se requiere refactor moderado en el frontend de check-out para redirigir al recibo después del pago y no depender de flujos “implícitos”.  
  - La coexistencia temporal de acciones `checkout.*` documentadas pero no usadas puede generar confusión si no se actualiza la documentación funcional.

- **Próximos pasos**
  - Ajustar `ActiveReservationsPage` para redirigir a `/invoices/:id/receipt` después de pagos exitosos.  
  - Revisar documentación de seguridad para marcar `checkout.*` como deprecadas en favor de `reservas.checkout`.  
  - Diseñar e implementar `IFiscalInvoicingProvider` + `EmitFiscalInvoiceUseCase` y endpoints asociados en modo sandbox, usando `facturitas` o SDK equivalente de ARCA.


