# 🔐 Configuración de MercadoPago

Este documento explica cómo obtener y configurar las credenciales de MercadoPago para el sistema.

---

## 📋 Requisitos Previos

1. **Cuenta de MercadoPago**: Crea una cuenta en [mercadopago.com.ar](https://www.mercadopago.com.ar)
2. **Acceso al Panel de Desarrolladores**: [developers.mercadopago.com.ar](https://www.mercadopago.com.ar/developers)

---

## 🔑 Obtener Credenciales

### **Paso 1: Acceder al Panel de Desarrolladores**

1. Ve a [https://www.mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel)
2. Inicia sesión con tu cuenta de MercadoPago
3. En el menú lateral, selecciona **"Credenciales"**

### **Paso 2: Obtener las Credenciales de TEST**

Para desarrollo y pruebas, usa las **Credenciales de TEST**:

1. En la pestaña **"Credenciales de prueba"**
2. Copia el **Access Token** (comienza con `TEST-`)
3. Copia la **Public Key** (comienza con `TEST-`)

**Importante:** Las credenciales de TEST permiten hacer pruebas sin dinero real.

### **Paso 3: Tarjetas de Prueba**

Para probar pagos en modo TEST, usa estas tarjetas:

**Tarjetas Aprobadas:**
- Visa: `4509 9535 6623 3704`
- Mastercard: `5031 7557 3453 0604`

**Datos de prueba:**
- CVV: Cualquier número de 3 dígitos
- Fecha de vencimiento: Cualquier fecha futura
- Nombre: APRO (para aprobar) / OTHE (para rechazar)
- DNI: Cualquier número

**Lista completa:** [Tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing)

---

## ⚙️ Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```bash
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef-ghijklmnop
MERCADOPAGO_PUBLIC_KEY=TEST-abc123-def456-ghi789
MERCADOPAGO_BACK_URL=http://localhost:5173
MERCADOPAGO_NOTIFICATION_URL=http://localhost:3000/api/webhooks/mercadopago
```

### **Descripción de Variables:**

- **`MERCADOPAGO_ACCESS_TOKEN`**: Token privado para crear preferencias de pago (server-side)
- **`MERCADOPAGO_PUBLIC_KEY`**: Clave pública para el frontend (si usas Checkout Pro)
- **`MERCADOPAGO_BACK_URL`**: URL base del frontend para redirecciones después del pago
- **`MERCADOPAGO_NOTIFICATION_URL`**: URL del webhook para recibir notificaciones de pago

---

## 🔄 Configurar Webhook en Producción

### **Paso 1: Exponer tu servidor local (solo para testing)**

Para que MercadoPago pueda enviar notificaciones a tu servidor local:

**Opción A: Usar ngrok** (recomendado)
```bash
# Instalar ngrok
npm install -g ngrok

# Exponer el puerto 3000
ngrok http 3000
```

Esto te dará una URL pública como: `https://abc123.ngrok.io`

**Opción B: Usar localtunnel**
```bash
npx localtunnel --port 3000
```

### **Paso 2: Actualizar la variable de entorno**

```bash
MERCADOPAGO_NOTIFICATION_URL=https://abc123.ngrok.io/api/webhooks/mercadopago
```

### **Paso 3: Configurar Webhook en MercadoPago**

1. Ve a [https://www.mercadopago.com.ar/developers/panel/notifications/webhooks](https://www.mercadopago.com.ar/developers/panel/notifications/webhooks)
2. Click en **"Configurar webhook"**
3. Ingresa la URL: `https://abc123.ngrok.io/api/webhooks/mercadopago`
4. Selecciona los eventos:
   - ✅ `payment.created`
   - ✅ `payment.updated`
5. Guarda la configuración

---

## 🚀 Producción

### **Obtener Credenciales de PRODUCCIÓN**

1. En el panel de desarrolladores, ve a **"Credenciales de producción"**
2. Copia el **Access Token** (comienza con `APP_USR-`)
3. Copia la **Public Key** (comienza con `APP_USR-`)

### **Actualizar .env**

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-abcdef-ghijklmnop
MERCADOPAGO_PUBLIC_KEY=APP_USR-abc123-def456-ghi789
MERCADOPAGO_BACK_URL=https://tudominio.com
MERCADOPAGO_NOTIFICATION_URL=https://tudominio.com/api/webhooks/mercadopago
```

### **Configurar Webhook de Producción**

Usa la URL pública de tu servidor en producción.

---

## ✅ Verificar Configuración

### **1. Verificar Backend**

```bash
cd apps/backend
npm run dev
```

Prueba el endpoint de configuración:
```bash
curl http://localhost:3000/api/webhooks/mercadopago/config
```

Deberías ver:
```json
{
  "publicKey": "TEST-...",
  "isConfigured": true
}
```

### **2. Probar Flujo de Pago**

1. Genera una factura en el sistema
2. Click en **"Pagar con MercadoPago"**
3. Serás redirigido al checkout de MercadoPago
4. Usa una tarjeta de prueba para completar el pago
5. El webhook procesará el pago automáticamente

---

## 🐛 Troubleshooting

### **"MercadoPago no está configurado en el servidor"**

- Verifica que `MERCADOPAGO_ACCESS_TOKEN` esté configurado
- Reinicia el servidor backend

### **"No se reciben notificaciones del webhook"**

- Verifica que la URL del webhook sea accesible públicamente
- Revisa los logs del backend para ver errores
- Comprueba la configuración en el panel de MercadoPago

### **"El pago se aprobó pero no se registró en el sistema"**

- Revisa los logs del webhook en el backend
- Verifica que la referencia externa (`external_reference`) coincida
- Comprueba que la migración de `mercadopago_payments` se ejecutó correctamente

---

## 📚 Recursos Adicionales

- [Documentación oficial de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs)
- [SDK de Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Checkout API](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/landing)
- [Webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
