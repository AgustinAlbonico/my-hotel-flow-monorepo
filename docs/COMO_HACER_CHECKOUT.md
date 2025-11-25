# Guía: Cómo Realizar Check-out y Generar Facturas

## 🎯 Flujo Completo

### 1. **Crear una Reserva**
- Ve a **Gestión de Reservas** desde el menú principal
- Haz clic en "**Crear nueva reserva**"
- Completa el wizard:
  - Busca el cliente por DNI
  - Selecciona fechas de check-in y check-out
  - Elige tipo de habitación y capacidad
  - Selecciona una habitación disponible
  - Confirma la reserva

### 2. **Realizar Check-in** (Opcional - puede hacerse automáticamente)
- La reserva queda en estado `CONFIRMED`
- Para iniciar la estadía, debe hacerse check-in (cambia a `IN_PROGRESS`)
- **Nota**: Actualmente este paso puede requerir acceso directo a la base de datos o API

### 3. **Realizar Check-out** 🎉
Esta es la nueva funcionalidad que acabamos de implementar:

#### Acceso:
1. Ve a **Gestión de Reservas** → **Check-out**
   - O directamente: `http://localhost:5173/reservations/checkout`

2. Verás la lista de **reservas activas** (huéspedes alojados actualmente)

3. Para cada reserva verás:
   - Código de reserva
   - Cliente
   - Número de habitación
   - Fechas de check-in y check-out previstas
   - Estado actual

#### Proceso de Check-out:

1. **Haz clic en "Realizar Check-out"** en la reserva deseada

2. **Selecciona la condición de la habitación**:
   - ✅ **Buena**: La habitación está en buen estado
   - ⚠️ **Necesita limpieza**: Requiere limpieza profunda (quedará en estado `MAINTENANCE`)
   - 🔴 **Dañada**: Hay daños en la habitación (quedará en estado `MAINTENANCE`)

3. **Agrega observaciones** (opcional):
   - Cualquier detalle sobre el estado de la habitación
   - Objetos olvidados
   - Daños específicos

4. **Haz clic en "Confirmar Check-out"**

### 4. **¿Qué Sucede Automáticamente?** ⚙️

Cuando realizas el check-out, el sistema ejecuta **automáticamente**:

1. ✅ **Cambia el estado de la reserva** a `COMPLETED`

2. 📄 **Genera la factura automáticamente**:
   - Calcula el total según las noches y precio por noche
   - Aplica IVA (21%)
   - Genera número de factura único
   - Asocia la factura a la reserva y al cliente

3. 💰 **Registra el cargo en la cuenta corriente del cliente**:
   - Crea un movimiento tipo `CHARGE` (cargo)
   - Actualiza el balance del cliente
   - Referencia la factura generada

4. 🚪 **Actualiza el estado de la habitación**:
   - Si seleccionaste "Buena" → la habitación queda `AVAILABLE`
   - Si seleccionaste "Necesita limpieza" o "Dañada" → queda en `MAINTENANCE`

### 5. **Ver la Factura Generada** 📋

Después del check-out:

1. Ve a **Facturación** → **Facturas** desde el menú principal
2. Busca la factura del cliente (ordenadas por fecha)
3. Haz clic en "Ver detalles" para ver:
   - Información completa de la factura
   - Detalles de la reserva
   - Estado de pago
   - **Botón "Pagar con MercadoPago"** 💳

### 6. **Ver Cuenta Corriente del Cliente** 📊

1. Ve a **Clientes** → busca y selecciona el cliente
2. En su perfil, haz clic en **"Ver Cuenta Corriente"**
3. Verás:
   - Lista de movimientos (cargos y pagos)
   - Balance actual
   - Detalles de cada transacción
   - Referencias a facturas

### 7. **Procesar Pago con MercadoPago** 💳

Desde la página de detalles de la factura:

1. Haz clic en el botón **"Pagar con MercadoPago"**
2. Se abrirá la página de pago de MercadoPago
3. Completa el pago usando:
   - **Tarjeta de prueba**: `4509 9535 6623 3704`
   - CVV: cualquier 3 dígitos
   - Fecha: cualquier fecha futura
   - Nombre: cualquier nombre

4. Al aprobar el pago:
   - MercadoPago enviará un webhook al backend
   - Se creará un movimiento tipo `PAYMENT` (pago)
   - Se actualizará el balance del cliente
   - La factura cambiará a estado `PAID`

## 🔄 Flujo Visual Completo

```
1. Crear Reserva (CONFIRMED)
         ↓
2. Check-in manual/automático (IN_PROGRESS)
         ↓
3. CHECK-OUT (COMPLETED) ← ¡Nueva funcionalidad!
         ↓
   [Automático]
   - Genera Factura
   - Crea Cargo en Cuenta Corriente
   - Actualiza Estado Habitación
         ↓
4. Ver Factura
         ↓
5. Pagar con MercadoPago
         ↓
   [Automático]
   - Webhook procesa pago
   - Crea Pago en Cuenta Corriente
   - Actualiza Balance Cliente
         ↓
6. Ver Cuenta Corriente actualizada
```

## 🎨 URLs Importantes

- **Gestión de Reservas**: `http://localhost:5173/reservations`
- **Check-out**: `http://localhost:5173/reservations/checkout`
- **Crear Reserva**: `http://localhost:5173/reservations/create`
- **Facturas**: `http://localhost:5173/invoices`
- **Cuenta Corriente**: `http://localhost:5173/account-statement/:clientId`

## 🔐 Permisos Necesarios

Para usar esta funcionalidad necesitas los siguientes permisos:

- `reservas.checkout` - Para realizar check-out
- `reservas.listar` - Para ver reservas activas
- `facturacion.ver` - Para ver facturas generadas
- `clientes.ver` - Para ver cuenta corriente del cliente

## 🧪 Cómo Probar el Flujo Completo

### Paso a Paso:

1. **Inicia los servidores**:
   ```powershell
   pnpm run dev
   ```

2. **Crea una reserva de prueba**:
   - Cliente con DNI existente (o crea uno nuevo)
   - Fechas: hoy hasta mañana
   - Selecciona una habitación disponible

3. **Cambia el estado a IN_PROGRESS** (temporalmente vía DB):
   ```sql
   UPDATE reservations 
   SET status = 'IN_PROGRESS' 
   WHERE id = [ID_DE_TU_RESERVA];
   ```

4. **Ve a Check-out** (`/reservations/checkout`)
   - Deberías ver tu reserva listada
   - Haz clic en "Realizar Check-out"
   - Selecciona condición "Buena"
   - Agrega una observación de prueba
   - Confirma

5. **Verifica la factura generada** (`/invoices`)
   - Debería aparecer una nueva factura
   - Con estado "Pendiente"
   - Asociada a tu reserva

6. **Revisa la cuenta corriente** (desde el perfil del cliente)
   - Debería haber un cargo por el monto de la factura
   - Balance actualizado

7. **Paga con MercadoPago**:
   - Desde los detalles de la factura
   - Usa la tarjeta de prueba
   - Completa el pago

8. **Verifica el pago procesado**:
   - La cuenta corriente debería mostrar el pago
   - Balance reducido o en cero
   - Factura marcada como pagada

## 📝 Notas Importantes

- ⚠️ **Check-in automático**: Actualmente las reservas se crean en estado `CONFIRMED`. Para probarlas en check-out, necesitas cambiarlas manualmente a `IN_PROGRESS` en la base de datos.

- 🔧 **Precio por noche**: Actualmente el sistema usa un precio fijo de $1000 por noche. Esto debería mejorarse para usar el precio real del tipo de habitación.

- 🧪 **Credenciales de prueba**: Las credenciales de MercadoPago actuales son de TEST. Para producción necesitas reemplazarlas con credenciales PRODUCTION.

- 🌐 **Webhook URL**: Para que MercadoPago envíe notificaciones en producción, necesitas una URL pública. En desarrollo puedes usar **ngrok** o similar.

### 🔐 Seguridad del Webhook y Reconciliación

- Configura estas variables de entorno en el backend:
   - `MERCADOPAGO_ACCESS_TOKEN`: Access token de tu cuenta (TEST/PROD)
   - `MERCADOPAGO_PUBLIC_KEY`: Public key para el frontend
   - `MERCADOPAGO_NOTIFICATION_URL`: URL pública hacia `POST /api/webhooks/mercadopago`
   - `MERCADOPAGO_WEBHOOK_SECRET`: Secreto de firma del webhook (Developer Console → Webhooks)

- El backend ahora:
   - Verifica la firma del webhook vía header `x-signature` usando `ts` y `v1` (HMAC SHA256)
   - Reconcilia el pago llamando a la API de MercadoPago (`getPayment`) para obtener el estado real del pago antes de registrarlo

### 🧾 Endpoint de Recibo

- Ruta: `GET /api/invoices/:id/receipt`
- Respuesta: JSON con `invoice`, `client`, `payments`, `totals` y `meta.printable`
- Uso: ideal para generar PDFs del recibo en servidor o enviar por email en el futuro

## 🚀 Próximos Pasos Sugeridos

1. Implementar check-in desde la interfaz
2. Mejorar el cálculo de precios usando el precio real del room type
3. Agregar filtros en la página de check-out
4. Implementar notificaciones por email al generar factura
5. Agregar reportes de check-outs realizados
6. Dashboard con estadísticas de ocupación

## ❓ Preguntas Frecuentes

**P: ¿Por qué no veo reservas en la página de check-out?**
R: Solo se muestran reservas en estado `IN_PROGRESS`. Verifica que hayas hecho check-in primero.

**P: ¿Puedo hacer check-out de una reserva en estado CONFIRMED?**
R: No, primero debe hacerse check-in para cambiarla a `IN_PROGRESS`.

**P: ¿La factura se genera automáticamente?**
R: Sí, al hacer check-out se genera automáticamente y se registra el cargo en la cuenta corriente.

**P: ¿Puedo editar la factura después del check-out?**
R: No directamente, pero puedes crear ajustes en la cuenta corriente si es necesario.

---

¡Listo! 🎉 Ahora tienes un flujo completo de gestión de reservas con facturación integrada.
