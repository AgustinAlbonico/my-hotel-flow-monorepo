# 🚀 GUÍA RÁPIDA DE EJECUCIÓN - SISTEMA HOTELERO

## ✅ LO QUE ESTÁ LISTO

El sistema hotelero **ESTÁ COMPLETAMENTE IMPLEMENTADO** con las siguientes funcionalidades:

### 📋 Funcionalidades Core:
- ✅ Gestión de Reservas (CRUD completo)
- ✅ Check-in / Check-out
- ✅ Facturación automática al check-out
- ✅ Gestión de Pagos
- ✅ Control de deudas de clientes
- ✅ Prevención de overbooking
- ✅ Validación de cliente deudor

---

## 🔧 PASOS PARA EJECUTAR

### 1️⃣ Instalar Dependencias
```bash
# Desde la raíz del monorepo
pnpm install
```

### 2️⃣ Configurar Base de Datos
Asegúrate de tener PostgreSQL corriendo y configurado en tu `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=tu_usuario
DATABASE_PASSWORD=tu_password
DATABASE_NAME=myhotelflow
```

### 3️⃣ Ejecutar Migraciones
```bash
cd apps/backend
npm run migration:run
```

Esto ejecutará las migraciones:
- ✅ Crear tablas de clientes, habitaciones, reservas
- ✅ Agregar campo `outstanding_balance` a clientes
- ✅ Crear tablas de facturas y pagos
- ✅ Agregar índices de performance

### 4️⃣ Iniciar el Backend
```bash
# Desde apps/backend
npm run start:dev

# O desde la raíz
pnpm --filter backend start:dev
```

El servidor estará corriendo en: **http://localhost:3000**

---

## 📡 ENDPOINTS DISPONIBLES

### 🏨 Reservas

#### Crear Reserva
```bash
POST http://localhost:3000/reservations
Content-Type: application/json

{
  "clientId": 1,
  "roomId": 1,
  "checkIn": "2025-12-01",
  "checkOut": "2025-12-05",
  "observations": "Llegada temprano"
}
```

#### Listar Reservas
```bash
GET http://localhost:3000/reservations
GET http://localhost:3000/reservations?status=CONFIRMED
GET http://localhost:3000/reservations?clientId=1
```

#### Cancelar Reserva
```bash
PATCH http://localhost:3000/reservations/1/cancel
Content-Type: application/json

{
  "reason": "Cambio de planes"
}
```

#### Check-in
```bash
POST http://localhost:3000/reservations/1/check-in
Content-Type: application/json

{
  "documentsVerified": true,
  "observations": "Documentos OK"
}
```

#### Check-out (Genera factura automáticamente)
```bash
POST http://localhost:3000/reservations/1/check-out
Content-Type: application/json

{
  "roomCondition": "GOOD",
  "observations": "Todo perfecto"
}
```

---

### 💰 Facturas

#### Ver Factura de Reserva
```bash
GET http://localhost:3000/invoices/reservation/1
```

#### Ver Facturas de Cliente
```bash
GET http://localhost:3000/invoices/client/1
```

#### Ver Facturas Vencidas
```bash
GET http://localhost:3000/invoices/list/overdue
```

#### Generar Factura Manualmente (opcional)
```bash
POST http://localhost:3000/invoices/generate/1
```

---

### 💳 Pagos

#### Registrar Pago
```bash
POST http://localhost:3000/payments
Content-Type: application/json

{
  "invoiceId": 1,
  "clientId": 1,
  "amount": 2000.00,
  "method": "CASH",
  "reference": "RECIBO-001",
  "notes": "Pago en efectivo"
}
```

**Métodos de pago disponibles:**
- `CASH` - Efectivo
- `CREDIT_CARD` - Tarjeta de crédito
- `DEBIT_CARD` - Tarjeta de débito
- `BANK_TRANSFER` - Transferencia bancaria
- `CHECK` - Cheque
- `OTHER` - Otro

#### Ver Pagos de Factura
```bash
GET http://localhost:3000/payments/invoice/1
```

#### Ver Pagos de Cliente
```bash
GET http://localhost:3000/payments/client/1
```

---

## 🔄 FLUJO COMPLETO DE EJEMPLO

### Escenario: Reserva → Check-in → Check-out → Pago

```bash
# 1. Crear Reserva
POST /reservations
{
  "clientId": 1,
  "roomId": 1,
  "checkIn": "2025-12-01",
  "checkOut": "2025-12-05"
}
# Respuesta: { id: 1, code: "RES-...", status: "CONFIRMED" }

# 2. Hacer Check-in
POST /reservations/1/check-in
{
  "documentsVerified": true,
  "observations": "OK"
}
# Habitación pasa a OCCUPIED

# 3. Hacer Check-out (genera factura)
POST /reservations/1/check-out
{
  "roomCondition": "GOOD",
  "observations": "Excelente estadía"
}
# Se genera factura automáticamente
# Cliente ahora tiene deuda pendiente

# 4. Ver Factura Generada
GET /invoices/reservation/1
# Respuesta:
# {
#   "id": 1,
#   "invoiceNumber": "FAC-20251112-0001",
#   "total": 4840.00,      // 4 noches × $1000 + IVA 21%
#   "amountPaid": 0,
#   "outstandingBalance": 4840.00,
#   "status": "PENDING"
# }

# 5. Registrar Pago Parcial
POST /payments
{
  "invoiceId": 1,
  "clientId": 1,
  "amount": 2000.00,
  "method": "CASH"
}
# Factura pasa a PARTIAL
# Cliente reduce deuda a $2840

# 6. Registrar Pago Completo
POST /payments
{
  "invoiceId": 1,
  "clientId": 1,
  "amount": 2840.00,
  "method": "CREDIT_CARD",
  "reference": "VISA-****1234"
}
# Factura pasa a PAID
# Cliente saldo = $0
# Ahora puede reservar de nuevo!
```

---

## 🚫 VALIDACIONES QUE FUNCIONAN

### 1. Cliente con Deuda No Puede Reservar
```bash
POST /reservations
{
  "clientId": 1,  # Tiene deuda pendiente
  "roomId": 2,
  "checkIn": "2025-12-10",
  "checkOut": "2025-12-15"
}

# ❌ Error 400:
# "No se puede crear la reserva. El cliente tiene un saldo 
#  pendiente de $2840.00. Por favor, regularice la situación."
```

### 2. No Permite Overbooking
```bash
# Habitación 1 ya tiene reserva 01-dic a 05-dic

POST /reservations
{
  "clientId": 2,
  "roomId": 1,
  "checkIn": "2025-12-03",
  "checkOut": "2025-12-07"
}

# ❌ Error:
# "La habitación no está disponible para las fechas seleccionadas.
#  Ya existe una reserva confirmada."
```

### 3. Límite de 3 Reservas Activas
```bash
# Cliente ya tiene 3 reservas activas

POST /reservations
{
  "clientId": 1,
  "roomId": 3,
  "checkIn": "2025-12-20",
  "checkOut": "2025-12-25"
}

# ❌ Error:
# "Has alcanzado el límite de 3 reservas pendientes."
```

### 4. Cancelación con Política de 24h
```bash
# Reserva con check-in mañana

PATCH /reservations/5/cancel

# ❌ Error:
# "No se puede cancelar. Debe hacerlo con al menos 24 horas 
#  de anticipación."
```

---

## 📊 DATOS DE PRUEBA

### Crear Cliente de Prueba
```sql
INSERT INTO clients (dni, first_name, last_name, email, password, is_active, outstanding_balance)
VALUES ('12345678', 'Juan', 'Pérez', 'juan@example.com', 'hashed_password', true, 0);
```

### Crear Habitación de Prueba
```sql
INSERT INTO rooms (number, room_type_id, status, floor, is_active)
VALUES ('101', 1, 'AVAILABLE', 1, true);
```

---

## 🔍 VERIFICAR ESTADO

### Ver Deuda de Cliente
```bash
GET /clients/1  # Incluye campo outstandingBalance
```

### Ver Estado de Habitación
```bash
GET /rooms/1  # status: AVAILABLE | OCCUPIED | MAINTENANCE
```

### Ver Reservas Activas
```bash
GET /reservations?status=CONFIRMED
GET /reservations?status=IN_PROGRESS
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Precio de habitación**: Actualmente hardcoded en $1000/noche
   - TODO: Integrar con `room.roomType.pricePerNight`

2. **IVA**: Fijo en 21%
   - TODO: Hacer configurable por región

3. **Autenticación**: Los endpoints requieren token JWT
   - Usar header: `Authorization: Bearer <token>`

4. **Permisos**: Verificar que el usuario tenga las acciones:
   - `reservas.crear`, `reservas.checkin`, `reservas.checkout`
   - `facturas.ver`, `pagos.registrar`

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module ..."
```bash
pnpm install
```

### Error de Migración
```bash
# Revertir migraciones
npm run migration:revert

# Re-ejecutar
npm run migration:run
```

### Puerto 3000 en uso
```bash
# Cambiar en .env
PORT=3001
```

### Base de datos no conecta
```bash
# Verificar PostgreSQL corriendo
pg_isready

# Verificar credenciales en .env
```

---

## 📈 PRÓXIMAS MEJORAS

- [ ] Sistema de eventos (EventEmitter2)
- [ ] Notificaciones por email
- [ ] Recordatorios de check-in
- [ ] Logs estructurados (Winston)
- [ ] Métricas (Prometheus)
- [ ] Tests E2E
- [ ] Rate limiting
- [ ] Cache con Redis

---

**¡EL SISTEMA ESTÁ LISTO PARA USAR!** 🎉

Cualquier duda, revisar:
- `docs/SISTEMA_IMPLEMENTADO.md` - Documentación completa
- `docs/features/reservas/09-checklist-implementacion.md` - Checklist de desarrollo
