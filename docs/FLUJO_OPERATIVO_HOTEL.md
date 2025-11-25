# 🏨 Flujo Operativo Completo - My Hotel Flow

## 📋 Índice

1. [Visión General](#visión-general)
2. [Entidades del Sistema](#entidades-del-sistema)
3. [Flujo de Reservas](#flujo-de-reservas)
4. [Flujo de Check-In](#flujo-de-check-in)
5. [Flujo de Check-Out](#flujo-de-check-out)
6. [Flujo de Facturación](#flujo-de-facturación)
7. [Flujo de Pagos](#flujo-de-pagos)
8. [Estados y Transiciones](#estados-y-transiciones)
9. [Reglas de Negocio](#reglas-de-negocio)

---

## 🎯 Visión General

My Hotel Flow es un sistema completo de gestión hotelera que maneja todo el ciclo de vida de una estadía:

```
Cliente → Reserva → Check-In → Estadía → Check-Out → Factura → Pagos → Cierre
```

---

## 📦 Entidades del Sistema

### **Entidades Principales**

#### 1. **Client (Cliente)**
```typescript
{
  id: number
  firstName: string
  lastName: string
  dni: string
  email: string
  phone: string
  address: string
  outstandingBalance: number  // 💰 Deuda pendiente
  createdAt: Date
}
```
**Responsabilidad:** Almacenar información del huésped y su saldo de deuda.

**Métodos clave:**
- `hasOutstandingDebt()` - Verifica si tiene deuda
- `addDebt(amount)` - Incrementa la deuda
- `reduceDebt(amount)` - Reduce la deuda al pagar

---

#### 2. **Room (Habitación)**
```typescript
{
  id: number
  roomNumber: string
  floor: number
  roomTypeId: number
  status: RoomStatus // AVAILABLE, OCCUPIED, MAINTENANCE, OUT_OF_SERVICE
  createdAt: Date
}
```
**Responsabilidad:** Representar habitaciones físicas del hotel.

**Estados:**
- `AVAILABLE` - Disponible para reservar
- `OCCUPIED` - Actualmente ocupada
- `MAINTENANCE` - En mantenimiento
- `OUT_OF_SERVICE` - Fuera de servicio

---

#### 3. **RoomType (Tipo de Habitación)**
```typescript
{
  id: number
  name: string
  description: string
  basePrice: number  // Precio base por noche
  maxOccupancy: number
  amenities: string[]
  createdAt: Date
}
```
**Responsabilidad:** Definir categorías de habitaciones (Single, Doble, Suite, etc.).

---

#### 4. **Reservation (Reserva)**
```typescript
{
  id: number
  clientId: number
  roomId: number
  checkInDate: Date
  checkOutDate: Date
  numberOfGuests: number
  totalPrice: number
  status: ReservationStatus
  specialRequests: string
  createdAt: Date
}
```
**Responsabilidad:** Gestionar reservas de habitaciones.

**Estados:**
- `PENDING` - Reserva creada, pendiente de confirmación
- `CONFIRMED` - Reserva confirmada
- `CHECKED_IN` - Cliente ya hizo check-in
- `CHECKED_OUT` - Cliente ya hizo check-out
- `CANCELLED` - Reserva cancelada

**Métodos clave:**
- `confirmReservation()` - Confirma la reserva
- `performCheckIn()` - Realiza el check-in
- `performCheckOut()` - Realiza el check-out
- `cancel()` - Cancela la reserva

---

#### 5. **Invoice (Factura)**
```typescript
{
  id: number
  invoiceNumber: string  // Ej: "INV-2025-00001"
  reservationId: number
  clientId: number
  subtotal: number
  taxRate: number        // 0.21 (21% IVA)
  taxAmount: number
  total: number
  amountPaid: number
  status: InvoiceStatus
  issuedAt: Date
  dueDate: Date
  notes: string
  createdAt: Date
}
```
**Responsabilidad:** Facturar servicios y estadías.

**Estados:**
- `PENDING` - Factura emitida, sin pagos
- `PARTIAL` - Pagos parciales realizados
- `PAID` - Totalmente pagada
- `CANCELLED` - Factura cancelada

**Métodos clave:**
- `recordPayment(amount)` - Registra un pago
- `getOutstandingBalance()` - Calcula saldo pendiente
- `isOverdue()` - Verifica si está vencida
- `canReceivePayment()` - Valida si puede recibir pagos

---

#### 6. **Payment (Pago)**
```typescript
{
  id: number
  invoiceId: number
  clientId: number
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference: string      // Número de comprobante, transferencia, etc.
  notes: string
  paidAt: Date
  createdAt: Date
}
```
**Responsabilidad:** Registrar pagos realizados.

**Métodos de Pago:**
- `CASH` - Efectivo
- `CREDIT_CARD` - Tarjeta de crédito
- `DEBIT_CARD` - Tarjeta de débito
- `BANK_TRANSFER` - Transferencia bancaria
- `CHECK` - Cheque
- `OTHER` - Otro método

**Estados:**
- `PENDING` - Pago iniciado, pendiente de confirmación
- `COMPLETED` - Pago confirmado
- `FAILED` - Pago fallido
- `REFUNDED` - Pago reembolsado

**Métodos clave:**
- `markAsCompleted()` - Marca como completado
- `markAsFailed()` - Marca como fallido
- `markAsRefunded()` - Marca como reembolsado
- `canBeAppliedToInvoice(invoice)` - Valida si puede aplicarse a una factura

---

## 🔄 Flujo de Reservas

### **1. Búsqueda de Disponibilidad**

**Actor:** Recepcionista  
**Caso de Uso:** `SearchAvailableRoomsUseCase`

```typescript
// Request
{
  checkInDate: "2025-12-01",
  checkOutDate: "2025-12-05",
  roomTypeId: 2,
  numberOfGuests: 2
}

// Response
[
  {
    id: 101,
    roomNumber: "101",
    floor: 1,
    roomType: { name: "Doble Superior", basePrice: 150 },
    status: "AVAILABLE"
  },
  {
    id: 102,
    roomNumber: "102",
    floor: 1,
    roomType: { name: "Doble Superior", basePrice: 150 },
    status: "AVAILABLE"
  }
]
```

**Validaciones:**
- ✅ Fechas válidas (check-out > check-in)
- ✅ No hay reservas que se superpongan
- ✅ Habitación no está en mantenimiento
- ✅ Capacidad suficiente para huéspedes

---

### **2. Búsqueda de Cliente**

**Actor:** Recepcionista  
**Caso de Uso:** `SearchClientByDNIUseCase`

```typescript
// Request
{
  dni: "12345678"
}

// Response
{
  id: 5,
  firstName: "Juan",
  lastName: "Pérez",
  dni: "12345678",
  email: "juan@example.com",
  phone: "+54911234567",
  outstandingBalance: 0  // ⚠️ Sin deudas
}
```

**Reglas:**
- ⚠️ Si `outstandingBalance > 0` → **No puede reservar** (bloqueo por deuda)

---

### **3. Creación de Reserva**

**Actor:** Recepcionista  
**Caso de Uso:** `CreateReservationUseCase`

```typescript
// Request
{
  clientId: 5,
  roomId: 101,
  checkInDate: "2025-12-01",
  checkOutDate: "2025-12-05",
  numberOfGuests: 2,
  specialRequests: "Cama matrimonial"
}

// Process
1. Validar que el cliente NO tenga deuda
2. Verificar disponibilidad de la habitación
3. Calcular precio total (días × precio base)
4. Crear reserva en estado PENDING
5. Retornar reserva creada

// Response
{
  id: 450,
  status: "PENDING",
  totalPrice: 600,  // 4 noches × $150
  confirmationCode: "RES-2025-00450"
}
```

**Validaciones:**
- ✅ Cliente existe
- ✅ Cliente NO tiene deuda pendiente
- ✅ Habitación disponible en las fechas
- ✅ Número de huéspedes ≤ capacidad máxima
- ✅ Check-out > Check-in

**Código de Error:** `CLIENT_HAS_OUTSTANDING_DEBT` si tiene deuda.

---

### **4. Confirmación de Reserva**

**Trigger:** Pago de seña o confirmación manual  
**Caso de Uso:** `ConfirmReservationUseCase`

```typescript
// Reserva pasa de PENDING → CONFIRMED
reservation.confirmReservation()
```

---

## 🔑 Flujo de Check-In

### **Realizar Check-In**

**Actor:** Recepcionista  
**Caso de Uso:** `PerformCheckInUseCase`  
**Momento:** Cliente llega al hotel en la fecha de check-in

```typescript
// Request
{
  reservationId: 450
}

// Process
1. Verificar que la reserva existe
2. Validar estado = CONFIRMED
3. Validar que la fecha actual >= checkInDate
4. Marcar reserva como CHECKED_IN
5. Marcar habitación como OCCUPIED
6. Retornar confirmación

// Response
{
  reservation: {
    id: 450,
    status: "CHECKED_IN",
    room: { roomNumber: "101", status: "OCCUPIED" }
  }
}
```

**Validaciones:**
- ✅ Reserva en estado `CONFIRMED`
- ✅ Fecha actual ≥ fecha de check-in
- ✅ Habitación disponible (no ocupada por otro)

**Cambios de Estado:**
- Reservation: `CONFIRMED` → `CHECKED_IN`
- Room: `AVAILABLE` → `OCCUPIED`

---

## 🚪 Flujo de Check-Out

### **Realizar Check-Out**

**Actor:** Recepcionista  
**Caso de Uso:** `PerformCheckOutUseCase`  
**Momento:** Cliente abandona el hotel

```typescript
// Request
{
  reservationId: 450
}

// Process
1. Verificar que la reserva existe
2. Validar estado = CHECKED_IN
3. Marcar reserva como CHECKED_OUT
4. Liberar habitación (OCCUPIED → AVAILABLE)
5. 🧾 GENERAR FACTURA AUTOMÁTICAMENTE
6. Actualizar deuda del cliente
7. Retornar factura generada

// Response
{
  reservation: {
    id: 450,
    status: "CHECKED_OUT"
  },
  invoice: {
    id: 78,
    invoiceNumber: "INV-2025-00078",
    total: 726,        // Subtotal + IVA
    subtotal: 600,
    taxAmount: 126,    // 21% IVA
    status: "PENDING",
    dueDate: "2025-12-19"  // 14 días desde emisión
  },
  room: {
    roomNumber: "101",
    status: "AVAILABLE"
  }
}
```

**Proceso Automático:**
1. **Reserva:** `CHECKED_IN` → `CHECKED_OUT`
2. **Habitación:** `OCCUPIED` → `AVAILABLE`
3. **Factura:** Se crea automáticamente
4. **Cliente:** `outstandingBalance` += total de factura

**Validaciones:**
- ✅ Reserva en estado `CHECKED_IN`
- ✅ No existe factura previa para esta reserva

---

## 🧾 Flujo de Facturación

### **1. Generación Automática (en Check-Out)**

**Caso de Uso:** `GenerateInvoiceUseCase`  
**Trigger:** Automático al hacer check-out

```typescript
// Cálculo de Factura
const nights = 4
const pricePerNight = 150
const subtotal = nights × pricePerNight = 600
const taxRate = 0.21  // 21% IVA
const taxAmount = subtotal × taxRate = 126
const total = subtotal + taxAmount = 726

// Factura Creada
{
  invoiceNumber: "INV-2025-00078",
  reservationId: 450,
  clientId: 5,
  subtotal: 600,
  taxRate: 0.21,
  taxAmount: 126,
  total: 726,
  amountPaid: 0,
  status: "PENDING",
  issuedAt: "2025-12-05T14:00:00Z",
  dueDate: "2025-12-19T23:59:59Z",  // +14 días
  notes: "Estadía del 01/12 al 05/12"
}
```

**Cliente Actualizado:**
```typescript
client.outstandingBalance += 726  // Deuda aumenta
```

---

### **2. Consulta de Facturas**

#### **Obtener Factura por ID**
```typescript
GET /invoices/:id

Response:
{
  id: 78,
  invoiceNumber: "INV-2025-00078",
  total: 726,
  amountPaid: 0,
  outstandingBalance: 726,  // Calculado
  status: "PENDING",
  isOverdue: false
}
```

#### **Obtener Factura por Reserva**
```typescript
GET /invoices/reservation/:reservationId

Response: Invoice
```

#### **Facturas de un Cliente**
```typescript
GET /invoices/client/:clientId

Response: Invoice[]
```

#### **Facturas Vencidas**
```typescript
GET /invoices/overdue

Response: [
  {
    invoiceNumber: "INV-2025-00045",
    total: 850,
    dueDate: "2025-11-01",
    daysOverdue: 11
  }
]
```

---

## 💳 Flujo de Pagos

### **1. Registrar Pago**

**Actor:** Recepcionista  
**Caso de Uso:** `RegisterPaymentUseCase`

```typescript
// Request
POST /payments/register
{
  invoiceId: 78,
  clientId: 5,
  amount: 300,  // Pago parcial
  method: "CREDIT_CARD",
  reference: "VISA-1234"
}

// Process (Transacción Atómica)
1. Validar que la factura existe
2. Validar que el cliente existe
3. Validar que la factura puede recibir pagos
4. Validar que amount ≤ saldo pendiente
5. Crear el pago
6. Marcar pago como COMPLETED
7. Actualizar factura:
   - amountPaid += 300
   - Si amountPaid >= total → status = PAID
   - Si 0 < amountPaid < total → status = PARTIAL
8. Reducir deuda del cliente:
   - client.outstandingBalance -= 300

// Response
{
  payment: {
    id: 152,
    amount: 300,
    method: "CREDIT_CARD",
    status: "COMPLETED",
    paidAt: "2025-12-05T14:30:00Z"
  },
  invoice: {
    total: 726,
    amountPaid: 300,
    outstandingBalance: 426,
    status: "PARTIAL"
  },
  client: {
    outstandingBalance: 426
  }
}
```

**Proceso Transaccional:**
- ✅ Todo se ejecuta en una transacción de base de datos
- ✅ Si algo falla, todo se revierte (rollback)
- ✅ Garantiza consistencia de datos

---

### **2. Segundo Pago (Completar)**

```typescript
// Request
POST /payments/register
{
  invoiceId: 78,
  clientId: 5,
  amount: 426,  // Resto
  method: "CASH"
}

// Process
1. Crear pago de $426
2. Actualizar factura:
   - amountPaid = 726
   - status = PAID (totalmente pagada)
3. Reducir deuda del cliente:
   - outstandingBalance = 0

// Response
{
  invoice: {
    status: "PAID",
    outstandingBalance: 0
  },
  client: {
    outstandingBalance: 0  // ✅ Sin deuda
  }
}
```

---

### **3. Consulta de Pagos**

#### **Pagos de una Factura**
```typescript
GET /payments/invoice/:invoiceId

Response: [
  { amount: 300, method: "CREDIT_CARD", paidAt: "2025-12-05" },
  { amount: 426, method: "CASH", paidAt: "2025-12-06" }
]
```

#### **Pagos de un Cliente**
```typescript
GET /payments/client/:clientId

Response: Payment[]
```

---

## 📊 Estados y Transiciones

### **Diagrama de Estados - Reservation**

```
    ┌─────────┐
    │ PENDING │ ← Reserva creada
    └────┬────┘
         │
         │ confirmReservation()
         ▼
  ┌───────────┐
  │ CONFIRMED │ ← Reserva confirmada
  └─────┬─────┘
        │
        │ performCheckIn()
        ▼
  ┌────────────┐
  │ CHECKED_IN │ ← Cliente en el hotel
  └─────┬──────┘
        │
        │ performCheckOut()
        ▼
  ┌─────────────┐
  │ CHECKED_OUT │ ← Cliente se fue
  └─────────────┘

  Desde cualquier estado (excepto CHECKED_OUT):
        │
        │ cancel()
        ▼
  ┌───────────┐
  │ CANCELLED │
  └───────────┘
```

---

### **Diagrama de Estados - Invoice**

```
    ┌─────────┐
    │ PENDING │ ← Sin pagos
    └────┬────┘
         │
         │ recordPayment(partial)
         ▼
   ┌─────────┐
   │ PARTIAL │ ← Pagos parciales
   └────┬────┘
        │
        │ recordPayment(complete)
        ▼
    ┌──────┐
    │ PAID │ ← Totalmente pagada
    └──────┘

  Desde PENDING o PARTIAL:
        │
        │ cancel()
        ▼
  ┌───────────┐
  │ CANCELLED │
  └───────────┘
```

---

### **Diagrama de Estados - Room**

```
  ┌───────────┐
  │ AVAILABLE │ ← Disponible
  └─────┬─────┘
        │
        │ checkIn()
        ▼
  ┌──────────┐
  │ OCCUPIED │ ← Ocupada
  └─────┬────┘
        │
        │ checkOut()
        ▼
  ┌───────────┐
  │ AVAILABLE │
  └───────────┘

  Desde AVAILABLE:
        │
        │ markMaintenance()
        ▼
  ┌─────────────┐
  │ MAINTENANCE │
  └──────┬──────┘
         │
         │ markAvailable()
         ▼
   ┌───────────┐
   │ AVAILABLE │
   └───────────┘

  Desde cualquier estado:
         │
         │ markOutOfService()
         ▼
  ┌────────────────┐
  │ OUT_OF_SERVICE │
  └────────────────┘
```

---

## ⚖️ Reglas de Negocio

### **1. Gestión de Deuda**

| Regla | Descripción |
|-------|-------------|
| **RN-01** | Cliente con `outstandingBalance > 0` **NO puede crear nuevas reservas** |
| **RN-02** | Al hacer check-out, el total de la factura se suma a la deuda del cliente |
| **RN-03** | Al registrar un pago, se reduce la deuda del cliente en el monto del pago |
| **RN-04** | Un pago no puede exceder el saldo pendiente de la factura |

---

### **2. Facturación**

| Regla | Descripción |
|-------|-------------|
| **RN-05** | La factura se genera **automáticamente** al hacer check-out |
| **RN-06** | El IVA es del **21%** sobre el subtotal |
| **RN-07** | La fecha de vencimiento es **14 días** desde la emisión |
| **RN-08** | Una factura cancelada NO puede recibir pagos |
| **RN-09** | Una factura totalmente pagada NO puede recibir más pagos |

---

### **3. Reservas**

| Regla | Descripción |
|-------|-------------|
| **RN-10** | No pueden existir reservas superpuestas para la misma habitación |
| **RN-11** | El número de huéspedes no puede exceder la capacidad máxima del tipo de habitación |
| **RN-12** | Solo reservas en estado `CONFIRMED` pueden hacer check-in |
| **RN-13** | Solo reservas en estado `CHECKED_IN` pueden hacer check-out |
| **RN-14** | Una reserva cancelada no puede cambiar de estado |

---

### **4. Pagos**

| Regla | Descripción |
|-------|-------------|
| **RN-15** | Los pagos se ejecutan en **transacciones atómicas** |
| **RN-16** | Si un pago falla, no se actualiza ni la factura ni el cliente |
| **RN-17** | Pagos en efectivo/tarjeta se marcan como `COMPLETED` inmediatamente |
| **RN-18** | Cada pago debe tener un método de pago válido |

---

## 🔄 Flujo Completo - Ejemplo Real

### **Escenario: Familia Pérez - 4 noches en habitación Doble**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: BÚSQUEDA Y RESERVA                                     │
└─────────────────────────────────────────────────────────────────┘

1. Recepcionista busca disponibilidad (01-05 dic, 2 huéspedes)
2. Sistema muestra habitación 101 disponible ($150/noche)
3. Recepcionista busca cliente por DNI "12345678"
4. Sistema muestra Juan Pérez, outstandingBalance = $0 ✅
5. Se crea reserva:
   - Precio total: 4 noches × $150 = $600
   - Estado: PENDING
6. Se confirma reserva → Estado: CONFIRMED

┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: CHECK-IN (01 Diciembre)                                │
└─────────────────────────────────────────────────────────────────┘

7. Cliente llega al hotel
8. Recepcionista hace check-in
9. Sistema actualiza:
   - Reserva: CONFIRMED → CHECKED_IN
   - Habitación 101: AVAILABLE → OCCUPIED

┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: CHECK-OUT (05 Diciembre)                               │
└─────────────────────────────────────────────────────────────────┘

10. Cliente abandona el hotel
11. Recepcionista hace check-out
12. Sistema ejecuta:
    - Reserva: CHECKED_IN → CHECKED_OUT
    - Habitación 101: OCCUPIED → AVAILABLE
    - 🧾 GENERA FACTURA:
      * Subtotal: $600
      * IVA (21%): $126
      * Total: $726
      * Estado: PENDING
      * Vencimiento: 19 Diciembre
    - Cliente: outstandingBalance = $0 + $726 = $726

┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: PAGO PARCIAL (05 Diciembre - mismo día)                │
└─────────────────────────────────────────────────────────────────┘

13. Cliente paga $300 con tarjeta de crédito
14. Sistema ejecuta en transacción:
    - Crea pago: $300, CREDIT_CARD, COMPLETED
    - Actualiza factura:
      * amountPaid: $0 + $300 = $300
      * outstandingBalance: $726 - $300 = $426
      * Estado: PENDING → PARTIAL
    - Actualiza cliente:
      * outstandingBalance: $726 - $300 = $426

┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: INTENTO DE NUEVA RESERVA (06 Diciembre)                │
└─────────────────────────────────────────────────────────────────┘

15. Cliente intenta reservar otra habitación
16. Sistema valida: outstandingBalance = $426 > 0 ❌
17. Sistema BLOQUEA la reserva
18. Error: "CLIENT_HAS_OUTSTANDING_DEBT"

┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: PAGO FINAL (10 Diciembre)                              │
└─────────────────────────────────────────────────────────────────┘

19. Cliente paga el resto en efectivo
20. Sistema ejecuta en transacción:
    - Crea pago: $426, CASH, COMPLETED
    - Actualiza factura:
      * amountPaid: $300 + $426 = $726
      * outstandingBalance: $0
      * Estado: PARTIAL → PAID ✅
    - Actualiza cliente:
      * outstandingBalance: $426 - $426 = $0 ✅

┌─────────────────────────────────────────────────────────────────┐
│ RESULTADO FINAL                                                 │
└─────────────────────────────────────────────────────────────────┘

✅ Reserva completada y pagada
✅ Cliente sin deuda → Puede reservar nuevamente
✅ Habitación disponible para otros huéspedes
✅ Factura cerrada y archivada
```

---

## 📋 Endpoints API - Resumen

### **Reservas**
```
POST   /reservations                    - Crear reserva
GET    /reservations/:id                - Obtener reserva
GET    /reservations                    - Listar reservas
POST   /reservations/:id/check-in       - Realizar check-in
POST   /reservations/:id/check-out      - Realizar check-out
POST   /reservations/:id/cancel         - Cancelar reserva
GET    /rooms/available                 - Buscar habitaciones disponibles
```

### **Clientes**
```
GET    /clients/search/dni/:dni         - Buscar por DNI
GET    /clients/:id                     - Obtener cliente
POST   /clients                         - Crear cliente
PUT    /clients/:id                     - Actualizar cliente
```

### **Facturas**
```
POST   /invoices/generate/:reservationId  - Generar factura (automático en check-out)
GET    /invoices/:id                      - Obtener factura
GET    /invoices/reservation/:id          - Factura por reserva
GET    /invoices/client/:id               - Facturas del cliente
GET    /invoices/overdue                  - Facturas vencidas
```

### **Pagos**
```
POST   /payments/register                 - Registrar pago
GET    /payments/:id                      - Obtener pago
GET    /payments/invoice/:id              - Pagos de factura
GET    /payments/client/:id               - Pagos del cliente
```

---

## 🎨 Frontend - Páginas Implementadas

### **Páginas de Facturación**

1. **`/invoices`** - Listado de Facturas
   - Muestra facturas vencidas
   - Filtros: Todas / Vencidas
   - Cards con información resumida

2. **`/invoices/:id`** - Detalle de Factura
   - Información completa de la factura
   - Historial de pagos
   - Formulario para registrar nuevos pagos
   - Cálculo de saldo pendiente en tiempo real

### **Componentes UI**

- `InvoiceCard` - Tarjeta de factura
- `InvoiceStatusBadge` - Badge de estado (Pending/Partial/Paid/Cancelled)
- `PaymentForm` - Formulario de registro de pagos
- `PaymentMethodBadge` - Badge de método de pago
- `PaymentListItem` - Item de historial de pagos
- `DebtBadge` - Indicador de deuda del cliente

---

## 🔐 Seguridad y Permisos

### **Acciones Requeridas**

| Operación | Permiso Requerido |
|-----------|-------------------|
| Crear reserva | `reservas.crear` |
| Ver reservas | `reservas.listar` |
| Check-in | `reservas.checkIn` |
| Check-out | `reservas.checkOut` |
| Ver facturas | `facturas.ver` |
| Generar factura | `facturas.crear` |
| Registrar pago | `pagos.registrar` |
| Ver pagos | `pagos.listar` |

---

## 💡 Observaciones Importantes

### **✅ Ventajas del Sistema**

1. **Generación Automática de Facturas:** Al hacer check-out, se crea automáticamente la factura
2. **Control de Deuda:** Clientes con deuda no pueden hacer nuevas reservas
3. **Transacciones Atómicas:** Los pagos son seguros y consistentes
4. **Trazabilidad:** Cada operación queda registrada con timestamps
5. **Validaciones Robustas:** Múltiples capas de validación previenen errores

### **⚠️ Pendientes de Implementación**

1. **Sistema de Eventos:** Para notificaciones y sincronización
2. **Notificaciones Email/SMS:** Confirmaciones y recordatorios
3. **Observabilidad:** Logs estructurados, métricas
4. **Tests:** Cobertura completa de tests
5. **Transacciones SERIALIZABLE:** Para prevención total de overbooking
6. **Optimistic Locking:** Control de concurrencia avanzado

---

## 📚 Referencias

- **Arquitectura:** Clean Architecture (Domain-Application-Infrastructure-Presentation)
- **Base de Datos:** PostgreSQL con TypeORM
- **Backend:** NestJS
- **Frontend:** React + TypeScript + TailwindCSS
- **State Management:** React Query (@tanstack/react-query)

---

**Última actualización:** 12 de Noviembre de 2025  
**Versión:** 1.0.0
