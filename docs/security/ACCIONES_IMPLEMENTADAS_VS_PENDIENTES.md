# Resumen de Acciones Implementadas vs Pendientes

## 📊 Estado General
- **Total de acciones definidas:** 79
- **Acciones implementadas:** 50 ✅
- **Acciones pendientes:** 29 ⏳
- **Porcentaje de completitud:** 63.3%

## ✅ Módulos Completamente Implementados (50 acciones)

### 1. Reservas (7/7 - 100%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `reservas.listar` | ✅ | ReservationController |
| `reservas.ver` | ✅ | ReservationController |
| `reservas.crear` | ✅ | ReservationController |
| `reservas.modificar` | ✅ | ReservationController |
| `reservas.cancelar` | ✅ | ReservationController |
| `reservas.checkin` | ✅ | ReservationController |
| `reservas.checkout` | ✅ | ReservationController |

### 2. Habitaciones (6/6 - 100%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `habitaciones.listar` | ✅ | RoomController |
| `habitaciones.ver` | ✅ | RoomController |
| `habitaciones.crear` | ✅ | RoomController |
| `habitaciones.modificar` | ✅ | RoomController |
| `habitaciones.eliminar` | ✅ | RoomController |
| `habitaciones.cambiarEstado` | ✅ | RoomController |

### 3. Clientes (5/5 - 100%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `clientes.listar` | ✅ | ClientController |
| `clientes.ver` | ✅ | ClientController |
| `clientes.crear` | ✅ | ClientController |
| `clientes.modificar` | ✅ | ClientController |
| `clientes.eliminar` | ✅ | ClientController |

### 4. Pagos (3/4 - 75%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `pagos.listar` | ✅ | PaymentsController |
| `pagos.ver` | ✅ | PaymentsController |
| `pagos.registrar` | ✅ | PaymentsController |
| `pagos.anular` | ⏳ | Pendiente |

### 5. Facturación (3/4 - 75%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `facturas.listar` | ✅ | InvoicesController |
| `facturas.ver` | ✅ | InvoicesController |
| `facturas.crear` | ✅ | InvoicesController |
| `facturas.anular` | ⏳ | Pendiente |

### 6. Cuenta Corriente (1/3 - 33%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `cuentaCorriente.ver` | ✅ | AccountStatementsController |
| `cuentaCorriente.crear` | ⏳ | Pendiente (se crea automáticamente) |
| `cuentaCorriente.modificar` | ⏳ | Pendiente |

### 7. MercadoPago (2/2 - 100%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `mercadopago.crear` | ✅ | MercadoPagoWebhooksController |
| `mercadopago.webhook` | ✅ | MercadoPagoWebhooksController (público) |

### 8. Configuración - Usuarios (8/8 - 100%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `config.usuarios.listar` | ✅ | UserController |
| `config.usuarios.ver` | ✅ | UserController |
| `config.usuarios.crear` | ✅ | UserController |
| `config.usuarios.modificar` | ✅ | UserController |
| `config.usuarios.eliminar` | ✅ | UserController |
| `config.usuarios.asignarGrupos` | ✅ | UserController |
| `config.usuarios.asignarAcciones` | ✅ | UserController |
| `config.usuarios.resetearPassword` | ✅ | UserController |

### 9. Configuración - Grupos (7/7 - 100%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `config.grupos.listar` | ✅ | GroupController |
| `config.grupos.ver` | ✅ | GroupController |
| `config.grupos.crear` | ✅ | GroupController |
| `config.grupos.modificar` | ✅ | GroupController |
| `config.grupos.eliminar` | ✅ | GroupController |
| `config.grupos.asignarAcciones` | ✅ | GroupController |
| `config.grupos.asignarHijos` | ✅ | GroupController |

### 10. Configuración - Acciones (5/5 - 100%)
| Acción | Estado | Controlador |
|--------|--------|-------------|
| `config.acciones.listar` | ✅ | ActionController |
| `config.acciones.ver` | ✅ | ActionController |
| `config.acciones.crear` | ✅ | ActionController |
| `config.acciones.modificar` | ✅ | ActionController |
| `config.acciones.eliminar` | ✅ | ActionController |

## ⏳ Módulos Pendientes de Implementación (29 acciones)

### 11. Servicios (0/5 - 0%)
| Acción | Estado | Notas |
|--------|--------|-------|
| `servicios.listar` | ⏳ | No implementado |
| `servicios.ver` | ⏳ | No implementado |
| `servicios.crear` | ⏳ | No implementado |
| `servicios.modificar` | ⏳ | No implementado |
| `servicios.eliminar` | ⏳ | No implementado |

### 12. Notificaciones (0/3 - 0%)
| Acción | Estado | Notas |
|--------|--------|-------|
| `notificaciones.listar` | ⏳ | No implementado |
| `notificaciones.marcarLeida` | ⏳ | No implementado |
| `notificaciones.eliminar` | ⏳ | No implementado |

### 13. Reportes (0/3 - 0%)
| Acción | Estado | Notas |
|--------|--------|-------|
| `reportes.ocupacion` | ⏳ | No implementado |
| `reportes.ingresos` | ⏳ | No implementado |
| `reportes.clientes` | ⏳ | No implementado |

### 14. Check-out (Legacy - 0/3 - 0%)
| Acción | Estado | Notas |
|--------|--------|-------|
| `checkout.registrarPago` | ⏳ | No usado - reemplazado por `reservas.checkout` |
| `checkout.cerrar` | ⏳ | No usado - reemplazado por `reservas.checkout` |
| `checkout.imprimirComprobante` | ⏳ | No implementado |

**Nota:** Estas acciones están definidas pero NO se usan. El sistema utiliza `reservas.checkout` que realiza todo el proceso automáticamente.

### 15. Comprobantes (Legacy - 0/4 - 0%)
| Acción | Estado | Notas |
|--------|--------|-------|
| `comprobantes.emitir` | ⏳ | No usado - sistema usa Facturas |
| `comprobantes.anular` | ⏳ | No usado - sistema usa Facturas |
| `comprobantes.imprimir` | ⏳ | No implementado |
| `comprobantes.ver` | ⏳ | No usado - sistema usa Facturas |

**Nota:** Estas acciones están definidas para compatibilidad pero el sistema usa el módulo de Facturación en su lugar.

### 16. Check-in (Módulo vacío - 0/0 - N/A)
**Pendiente de definición** - Actualmente se usa `reservas.checkin` que es suficiente.

## 🎯 Flujos Implementados

### Flujo 1: Crear Reserva → Check-in → Check-out → Factura
```
1. reservas.crear      ✅ Crear nueva reserva
2. reservas.checkin    ✅ Iniciar estadía (CONFIRMED → IN_PROGRESS)
3. reservas.checkout   ✅ Finalizar y generar factura automáticamente
   └─> facturas.crear  ✅ Factura generada automáticamente
   └─> cuentaCorriente.ver ✅ Cargo registrado en cuenta corriente
```

### Flujo 2: Ver Factura → Pagar con MercadoPago → Actualizar Cuenta
```
1. facturas.ver           ✅ Ver detalles de factura
2. mercadopago.crear      ✅ Crear preferencia de pago
3. mercadopago.webhook    ✅ Recibir notificación de pago (automático)
4. pagos.registrar        ✅ Registrar pago automáticamente
5. cuentaCorriente.ver    ✅ Ver pago en cuenta corriente
```

### Flujo 3: Gestión de Clientes y Cuenta Corriente
```
1. clientes.crear         ✅ Registrar nuevo cliente
2. reservas.crear         ✅ Crear reserva para el cliente
3. reservas.checkout      ✅ Check-out → genera cargo
4. cuentaCorriente.ver    ✅ Ver estado de cuenta del cliente
5. mercadopago.crear      ✅ Generar link de pago
6. pagos.ver              ✅ Ver historial de pagos
```

## 📋 Acciones que Requieren Seed/Migración

Para usar el sistema correctamente, estas acciones deben estar en la base de datos:

### Acciones Críticas (ya incluidas en seed):
- ✅ `reservas.*` (7 acciones)
- ✅ `habitaciones.*` (6 acciones)
- ✅ `clientes.*` (5 acciones)
- ✅ `config.usuarios.*` (8 acciones)
- ✅ `config.grupos.*` (7 acciones)
- ✅ `config.acciones.*` (5 acciones)

### Acciones Nuevas que DEBES AGREGAR al seed:
- ⚠️ `pagos.listar`
- ⚠️ `pagos.ver`
- ⚠️ `pagos.registrar`
- ⚠️ `facturas.listar`
- ⚠️ `facturas.ver`
- ⚠️ `facturas.crear`
- ⚠️ `cuentaCorriente.ver`
- ⚠️ `mercadopago.crear`

## 🔧 Próximos Pasos Recomendados

1. **Actualizar seed script** para incluir las nuevas acciones de:
   - Pagos (3)
   - Facturación (3)
   - Cuenta Corriente (1)
   - MercadoPago (1)

2. **Implementar módulos pendientes** en orden de prioridad:
   - Servicios (para agregar consumos extras)
   - Reportes (para análisis del negocio)
   - Notificaciones (para comunicación con clientes)

3. **Actualizar permisos de roles**:
   - Agregar nuevas acciones a `rol.recepcionista`
   - Agregar nuevas acciones a `rol.admin`

4. **Implementar acciones faltantes**:
   - `pagos.anular`
   - `facturas.anular`
   - `cuentaCorriente.crear` (manual)
   - `cuentaCorriente.modificar`

## 📝 Comandos Útiles

### Ejecutar seed actualizado:
```bash
cd apps/backend
npm run seed
```

### Verificar acciones en la base de datos:
```sql
SELECT key, name, description FROM actions ORDER BY key;
```

### Verificar permisos de un grupo:
```sql
SELECT g.key as grupo, a.key as accion
FROM groups g
JOIN group_actions ga ON g.id = ga.group_id
JOIN actions a ON a.id = ga.action_id
WHERE g.key = 'rol.recepcionista'
ORDER BY a.key;
```

---

**Generado:** 13 de noviembre de 2025  
**Versión:** 2.0.0
