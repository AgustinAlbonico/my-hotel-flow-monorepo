# Sistema de Comprobantes Automáticos - My Hotel Flow

## 📋 Descripción

Sistema completo para generar comprobantes de pago en PDF automáticamente cuando se registra un pago en la aplicación. El comprobante incluye toda la información de la estadía, servicios consumidos y detalles del pago.

**🎯 Endpoint Principal de Descarga:** `GET /invoices/:id/receipt`

## ✅ Implementación Completa

### 1. **Backend - Generación de PDFs**

#### 📦 Instalación de Dependencias
```bash
npm install puppeteer @types/puppeteer --save
```

#### 🛠️ Componentes Creados

**PdfGeneratorService** (`apps/backend/src/infrastructure/pdf/pdf-generator.service.ts`)
- Servicio para generar PDFs usando Puppeteer
- Convierte templates HTML Handlebars a PDF
- Gestiona almacenamiento de archivos en `uploads/receipts/`
- Métodos:
  - `generateReceipt(data: ReceiptData)`: Genera el PDF del comprobante
  - `getReceiptFile(filePath)`: Lee un PDF existente
  - `receiptExists(filePath)`: Verifica existencia del archivo

**Template HTML** (`apps/backend/src/infrastructure/pdf/templates/receipt.hbs`)
- Template Handlebars basado en factura.html
- Incluye:
  - Datos fiscales del hotel (My Hotel Flow)
  - Información del cliente
  - Detalles de la reserva y estadía
  - Listado de servicios consumidos
  - Totales y cálculos
  - Información del pago realizado
  - Badge de "PAGO CONFIRMADO"

### 2. **Entidad Payment Actualizada**

**Cambios en Domain Entity** (`domain/entities/payment.entity.ts`)
- Nuevo campo: `_receiptPath: string | null`
- Nuevo getter: `get receiptPath()`
- Nuevo método: `setReceiptPath(path: string)`

**Cambios en ORM Entity** (`infrastructure/persistence/typeorm/entities/payment.orm-entity.ts`)
```typescript
@Column({ name: 'receipt_path', type: 'varchar', length: 500, nullable: true })
receiptPath: string | null;
```

**Mapper Actualizado** (`infrastructure/persistence/typeorm/mappers/payment.mapper.ts`)
- Incluye `receiptPath` en toDomain() y toPersistence()

### 3. **Use Case Modificado**

**RegisterPaymentUseCase** (`application/use-cases/payment/register-payment.use-case.ts`)
- Genera automáticamente el PDF después de registrar el pago
- Datos del comprobante incluyen:
  - Info del hotel (hardcoded por ahora)
  - Datos del cliente desde la BD
  - Información de la reserva y habitación
  - Detalles de servicios de la factura
  - Información del pago (método, monto, fecha, referencia)
- Manejo de errores: Si falla la generación del PDF, el pago igualmente queda registrado

### 4. **Endpoints de API**

#### 🎯 Descarga desde Factura (Recomendado para Frontend)

**InvoicesController** (`presentation/controllers/invoices.controller.ts`)

Endpoint principal:
```typescript
GET /invoices/:id/receipt
```

**Características:**
- Requiere autenticación (JwtAuthGuard)
- Requiere permiso: `facturas.ver`
- Descarga el comprobante del último pago de la factura
- Headers configurados:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="comprobante-factura-{invoiceNumber}.pdf"`
- Validaciones:
  - Factura existe
  - Tiene al menos un pago
  - El pago tiene comprobante generado
  - Archivo físico existe

**Respuestas:**
- `200 OK`: Descarga del PDF
- `404 Not Found`: Factura no encontrada / Sin pagos / Comprobante no existe

#### Descarga desde Pago (Alternativo)

**PaymentsController** (`presentation/controllers/payments.controller.ts`)

Endpoint alternativo:
```typescript
GET /payments/:id/receipt
```

**Características:**
- Requiere autenticación (JwtAuthGuard)
- Requiere permiso: `pagos.ver`
- Retorna el PDF como descarga
- Headers configurados:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="comprobante-pago-{id}.pdf"`
- Validaciones:
  - Pago existe
  - Tiene comprobante generado
  - Archivo físico existe

**Respuestas:**
- `200 OK`: Descarga del PDF
- `404 Not Found`: Pago no encontrado / Comprobante no existe

### 5. **Migración de Base de Datos**

**Archivo:** `migrations/1733353200000-AddReceiptPathToPayments.ts`

```sql
ALTER TABLE payments ADD COLUMN receipt_path VARCHAR(500) NULL;
```

**Ejecutar migración:**
```bash
cd apps/backend
npm run migration:run
```

### 6. **Módulos Configurados**

**PdfModule** (`infrastructure/pdf/pdf.module.ts`)
- Exporta PdfGeneratorService
- Inicializa directorio de uploads

**BillingModule** (`modules/billing/billing.module.ts`)
- Importa PdfModule

**AppModule** (`app.module.ts`)
- Importa PdfModule globalmente

## 🔄 Flujo Completo

1. **Usuario realiza checkout** en la aplicación
2. **Frontend llama** `POST /payments` con datos del pago
3. **RegisterPaymentUseCase** ejecuta:
   - Valida factura y cliente
   - Crea registro de Payment
   - Actualiza factura
   - Registra movimiento contable
   - **Genera comprobante PDF automáticamente**
   - Guarda ruta del PDF en `payment.receiptPath`
4. **PDF se almacena** en `apps/backend/uploads/receipts/`
5. **Usuario puede descargar** el comprobante con `GET /payments/:id/receipt`

## 📄 Estructura del Comprobante

### Información Incluida:
- ✅ Datos fiscales del hotel (CUIT, dirección, razón social)
- ✅ Tipo y número de comprobante
- ✅ Fecha de emisión
- ✅ Datos completos del cliente
- ✅ Período de estadía (check-in / check-out)
- ✅ Habitación y tipo
- ✅ Desglose de servicios consumidos
- ✅ Totales (subtotal, descuentos, IVA, total)
- ✅ Método de pago
- ✅ Monto pagado y fecha
- ✅ Número de referencia (si existe)
- ✅ Badge de "PAGO CONFIRMADO"

## 🎨 Personalización

### Datos del Hotel
Actualmente hardcoded en `RegisterPaymentUseCase.generateReceipt()`:
```typescript
hotel: {
  name: 'My Hotel Flow Gestión Hotelera S.A.',
  cuit: '30-71234567-8',
  address: 'Av. Corrientes 1234, CABA, Argentina',
  email: 'info@myhotelflow.com',
  phone: '+54 11 4567-8900',
}
```

**TODO:** Mover a configuración o tabla de BD

### Template HTML
Ubicación: `apps/backend/src/infrastructure/pdf/templates/receipt.hbs`

Puedes modificar:
- Estilos CSS
- Estructura del documento
- Información mostrada
- Logo del hotel (actualmente sin logo)

## 🔐 Seguridad

- ✅ Endpoint protegido con JWT
- ✅ Requiere permiso `facturas.ver` (para endpoint de invoices) o `pagos.ver` (para endpoint de payments)
- ✅ Validación de existencia de factura/pago
- ✅ Validación de archivo físico
- ✅ Solo el ID de la factura/pago es accesible en la URL

## 📊 Ejemplo de Uso

### Desde el Frontend (Recomendado)

```typescript
// Descargar comprobante desde una factura
async function downloadReceipt(invoiceId: number, token: string) {
  const response = await fetch(`/api/invoices/${invoiceId}/receipt`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error al descargar el comprobante');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comprobante-factura-${invoiceId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Uso: Después del checkout o desde la vista de facturas
downloadReceipt(123, userToken);
```

### Alternativa: Desde Pago Directo

```typescript
// Descargar comprobante desde un pago específico
async function downloadPaymentReceipt(paymentId: number, token: string) {
  const response = await fetch(`/api/payments/${paymentId}/receipt`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Error al descargar el comprobante');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comprobante-pago-${paymentId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

## 🚀 Próximas Mejoras

1. **Configuración del Hotel**
   - Tabla `hotel_settings` para datos fiscales
   - Logo personalizable

2. **Envío por Email**
   - Adjuntar PDF en email de confirmación
   - Usar servicio de notificaciones existente

3. **Numeración Fiscal**
   - Integración con AFIP (opcional)
   - Generación de CAE
   - Validación de tipo de comprobante

4. **Templates Múltiples**
   - Diferentes diseños según tipo de pago
   - Versión simplificada / completa

5. **Caché de PDFs**
   - No regenerar si ya existe
   - Limpieza automática de archivos antiguos

## 🐛 Troubleshooting

### El PDF no se genera
- Verificar que Puppeteer esté instalado correctamente
- Revisar permisos en directorio `uploads/receipts/`
- Logs en consola del backend

### Error "Comprobante no encontrado"
- Verificar que el pago tenga `receiptPath` en BD
- Verificar que el archivo exista físicamente
- Migración ejecutada correctamente

### Errores de memoria con Puppeteer
- Ajustar argumentos de Chromium en PdfGeneratorService
- Considerar generación asíncrona en cola

## ✨ Conclusión

El sistema está completamente funcional y genera automáticamente comprobantes profesionales en PDF cada vez que se registra un pago. Los usuarios pueden descargarlos en cualquier momento desde la aplicación.
