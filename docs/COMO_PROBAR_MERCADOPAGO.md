# 🚀 Guía Completa: Cómo Probar MercadoPago desde Cero

Esta guía te llevará paso a paso para configurar y probar la funcionalidad de pagos con MercadoPago en modo TEST.

---

## ✅ Pre-requisitos Verificados

Tu proyecto ya tiene:
- ✅ Credenciales de TEST configuradas en `.env`
- ✅ Backend con endpoints de MercadoPago implementados
- ✅ Frontend con componente `MercadoPagoButton`
- ✅ Webhook handler implementado

---

## 🔧 Paso 1: Verificar Configuración

### 1.1. Revisar Variables de Entorno

Abre el archivo `.env` en la raíz del proyecto y verifica que tengas:

```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-access-token-de-prueba-aqui
MERCADOPAGO_PUBLIC_KEY=TEST-0a286c6b-59b5-46e7-ab8a-9fc0ec922031
MERCADOPAGO_BACK_URL=http://localhost:5173
MERCADOPAGO_NOTIFICATION_URL=http://localhost:3000/api/v1/webhooks/mercadopago
```

**⚠️ IMPORTANTE:** 
- El `MERCADOPAGO_BACK_URL` debe apuntar al frontend (puerto 5173)
- El `MERCADOPAGO_NOTIFICATION_URL` debe apuntar al backend (puerto 3000)

### 1.2. Actualizar MERCADOPAGO_BACK_URL

Si tienes `http://localhost:3000`, cámbialo a:

```bash
MERCADOPAGO_BACK_URL=http://localhost:5173
```

---

## 🚀 Paso 2: Iniciar los Servicios

### 2.1. Iniciar el Backend

Abre una terminal PowerShell y ejecuta:

```powershell
cd "C:\Users\AgustinNotebook\Desktop\Proyectos\myhotelflow\My hotel flow codigo"
npm run dev
```

O si usas turbo:

```powershell
npx turbo dev
```

### 2.2. Verificar que el Backend Esté Corriendo

El backend debería estar en: `http://localhost:3000`

Verifica que MercadoPago esté configurado:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/webhooks/mercadopago/config" -Method GET
```

Deberías ver:

```json
{
  "success": true,
  "data": {
    "publicKey": "TEST-0a286c6b-59b5-46e7-ab8a-9fc0ec922031",
    "isConfigured": true
  }
}
```

### 2.3. Verificar el Frontend

El frontend debería estar en: `http://localhost:5173`

---

## 🧪 Paso 3: Probar el Flujo Completo de Pago

### 3.1. Crear una Reserva con Checkout

1. Abre el navegador en `http://localhost:5173`
2. Inicia sesión con una cuenta de recepcionista:
   - **Usuario:** `recepcionista@hotel.com`
   - **Contraseña:** `password123`

3. Ve a la sección de **Reservas**
4. Crea una nueva reserva o selecciona una existente
5. Haz click en **"Hacer Check-out"**

### 3.2. Proceso de Check-out

1. El sistema generará una factura automáticamente
2. Se abrirá un modal con el detalle de la factura
3. Verás opciones de pago

### 3.3. Iniciar Pago con MercadoPago

1. En el modal de pago, selecciona **"Tarjeta de Débito"** o **"Tarjeta de Crédito"**
2. Haz click en el botón **"Pagar con MercadoPago"**
3. Serás redirigido al checkout de MercadoPago

### 3.4. Completar el Pago en MercadoPago

Usa estos datos de prueba:

**Tarjeta de Prueba (Aprobada):**
- **Número:** `4509 9535 6623 3704` (Visa)
- **Vencimiento:** Cualquier fecha futura (ej: `12/25`)
- **CVV:** Cualquier 3 dígitos (ej: `123`)
- **Nombre:** `APRO` (importante para aprobar)
- **DNI:** Cualquier número (ej: `12345678`)

**Otras Tarjetas de Prueba:**

| Tarjeta | Número | Resultado |
|---------|--------|-----------|
| Visa Aprobada | `4509 9535 6623 3704` | ✅ Pago aprobado |
| Mastercard Aprobada | `5031 7557 3453 0604` | ✅ Pago aprobado |
| Visa Rechazada | `4509 9535 6623 3704` (nombre: OTHE) | ❌ Pago rechazado |

### 3.5. Verificar el Webhook

1. Después de completar el pago, MercadoPago enviará una notificación al webhook
2. Revisa los logs del backend (en la terminal donde corre el servidor)
3. Deberías ver mensajes como:

```
[MercadoPagoWebhooksController] Webhook recibido: {"type":"payment","data":{"id":"123456"}}
[ProcessMercadoPagoWebhookUseCase] Procesando webhook de MercadoPago: 123456 - Status: approved
```

### 3.6. Verificar la Factura

1. El sistema debería redirigirte de vuelta al frontend
2. La factura debería aparecer como **"Pagada"**
3. Ve a la sección de **Facturas** para verificar
4. El pago debería aparecer registrado

---

## 🔍 Paso 4: Verificar en la Base de Datos

Puedes verificar que el pago se registró correctamente:

### 4.1. Verificar Tabla `payments`

```sql
SELECT * FROM payments WHERE method IN ('DEBIT_CARD', 'CREDIT_CARD') ORDER BY id DESC LIMIT 5;
```

Deberías ver:
- `status`: `COMPLETED`
- `mp_external_payment_id`: ID del pago de MercadoPago
- `mp_preference_id`: ID de la preferencia

### 4.2. Verificar Tabla `invoices`

```sql
SELECT id, total, paid, status FROM invoices WHERE status = 'PAID' ORDER BY id DESC LIMIT 5;
```

La factura debería tener:
- `paid` = `total`
- `status` = `PAID`

---

## 🐛 Solución de Problemas

### Problema 1: "MercadoPago no está configurado en el servidor"

**Solución:**
1. Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté en el `.env`
2. Reinicia el servidor backend
3. Verifica el endpoint: `Invoke-WebRequest -Uri "http://localhost:3000/api/v1/webhooks/mercadopago/config"`

### Problema 2: No se recibe el webhook

**Causa:** En desarrollo local, MercadoPago no puede enviar webhooks a `localhost`

**Soluciones:**

#### Opción A: Usar ngrok (Recomendado)

```powershell
# Instalar ngrok
npm install -g ngrok

# Exponer el puerto 3000
ngrok http 3000
```

Esto te dará una URL pública como: `https://abc123.ngrok.io`

Actualiza el `.env`:

```bash
MERCADOPAGO_NOTIFICATION_URL=https://abc123.ngrok.io/api/v1/webhooks/mercadopago
```

Reinicia el backend.

#### Opción B: Simular el webhook manualmente

Puedes simular el webhook enviando un request POST:

```powershell
$body = @{
    type = "payment"
    data = @{
        id = "123456789"
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/v1/webhooks/mercadopago" -Method POST -Body $body -ContentType "application/json"
```

### Problema 3: El pago se aprobó pero no se registró

**Solución:**
1. Revisa los logs del backend
2. Verifica que la `external_reference` coincida con el formato `INV-{invoiceId}`
3. Verifica que la factura exista en la base de datos

### Problema 4: Error de autenticación al crear la preferencia

**Solución:**
1. Asegúrate de estar logueado en el sistema
2. Verifica que tu usuario tenga el permiso `mercadopago.crear`
3. Revisa que el token JWT sea válido

---

## 📊 Flujo Completo (Diagrama)

```
1. Usuario hace checkout
   ↓
2. Frontend → POST /api/v1/webhooks/mercadopago/create-preference
   ↓
3. Backend crea preferencia en MercadoPago
   ↓
4. Backend guarda Payment con status PENDING
   ↓
5. Backend devuelve init_point (URL de pago)
   ↓
6. Frontend redirige al checkout de MercadoPago
   ↓
7. Usuario completa el pago
   ↓
8. MercadoPago → POST /api/v1/webhooks/mercadopago (webhook)
   ↓
9. Backend procesa webhook y actualiza Payment
   ↓
10. Backend marca factura como PAID
   ↓
11. Backend registra movimiento contable
   ↓
12. MercadoPago redirige al usuario al frontend
```

---

## 🎯 Casos de Prueba

### Caso 1: Pago Aprobado
- **Tarjeta:** `4509 9535 6623 3704`
- **Nombre:** `APRO`
- **Resultado Esperado:** Factura pagada, movimiento contable creado

### Caso 2: Pago Rechazado
- **Tarjeta:** `4509 9535 6623 3704`
- **Nombre:** `OTHE`
- **Resultado Esperado:** Pago rechazado, factura sigue pendiente

### Caso 3: Pago Pendiente
- **Tarjeta:** `4509 9535 6623 3704`
- **Nombre:** `CONT`
- **Resultado Esperado:** Pago pendiente, factura no pagada

---

## 📝 Notas Importantes

1. **Credenciales de TEST:** Las credenciales actuales son de TEST. Para producción necesitas cambiarlas por credenciales de PRODUCTION.

2. **Webhooks en desarrollo:** En desarrollo local, considera usar ngrok para recibir webhooks reales.

3. **Seguridad:** El `MERCADOPAGO_WEBHOOK_SECRET` es opcional pero recomendado. Si lo configuras, el sistema verificará la firma de los webhooks.

4. **Timeouts:** MercadoPago tiene un timeout de 30 días para completar pagos pendientes.

5. **Reconciliación:** El sistema reconcilia contra la API de MercadoPago para garantizar que el estado del pago es real.

---

## 🔗 Recursos Adicionales

- [Tarjetas de Prueba MercadoPago](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing)
- [Documentación de Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [Panel de Desarrolladores](https://www.mercadopago.com.ar/developers/panel)

---

## ✅ Checklist de Verificación

Antes de probar, asegúrate de:

- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Variables de entorno configuradas correctamente
- [ ] Endpoint de config devuelve `isConfigured: true`
- [ ] Base de datos con migraciones aplicadas
- [ ] Usuario con permisos de `mercadopago.crear`

---

**¡Listo! Ahora puedes probar el flujo completo de pagos con MercadoPago.** 🎉
