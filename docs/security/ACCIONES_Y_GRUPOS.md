# Acciones y Grupos del Sistema

Este documento define todas las acciones (permisos) y grupos (roles) del sistema My Hotel Flow.

## Formato de Keys

Las acciones siguen el formato: `modulo.submodulo.operacion` o `modulo.operacion`

- Permite múltiples niveles de jerarquía separados por puntos
- Ejemplos: `reservas.crear`, `config.usuarios.listar`, `checkin.habitacion.asignar`

## Acciones del Sistema (79 total)

### Módulo: Reservas (7 acciones - ✅ IMPLEMENTADO)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `reservas.listar` | Listar Reservas | Ver listado y menú de gestión de reservas |
| `reservas.ver` | Ver Reserva | Ver detalles de una reserva específica |
| `reservas.crear` | Crear Reserva | Registrar nuevas reservas en el sistema |
| `reservas.modificar` | Modificar Reserva | Editar fechas o detalles de reservas existentes |
| `reservas.cancelar` | Cancelar Reserva | Cancelar reservas confirmadas |
| `reservas.checkin` | Realizar Check-in | Cambiar estado de reserva a IN_PROGRESS |
| `reservas.checkout` | Realizar Check-out | Finalizar reserva y generar factura automáticamente |

### Módulo: Check-in (No implementado aún)
*Pendiente de definición - Actualmente se usa `reservas.checkin`*

### Módulo: Check-out (3 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `checkout.registrarPago` | Registrar Pago de Check-out | Registrar pagos al hacer check-out |
| `checkout.cerrar` | Cerrar Check-out | Finalizar proceso de check-out |
| `checkout.imprimirComprobante` | Imprimir Comprobante de Check-out | Imprimir comprobante al finalizar |

*Nota: Estas acciones están definidas pero no se usan. Actualmente se usa `reservas.checkout` que realiza todo el proceso.*

### Módulo: Comprobantes (4 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `comprobantes.emitir` | Emitir Comprobante | Generar nuevos comprobantes fiscales |
| `comprobantes.anular` | Anular Comprobante | Anular comprobantes emitidos |
| `comprobantes.imprimir` | Imprimir Comprobante | Imprimir comprobantes |
| `comprobantes.ver` | Ver Comprobante | Visualizar detalles de comprobantes |

*Nota: No implementado aún. El sistema usa Facturas en su lugar.*

### Módulo: Habitaciones (6 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `habitaciones.listar` | Listar Habitaciones | Ver listado de habitaciones |
| `habitaciones.ver` | Ver Habitación | Ver detalles de una habitación |
| `habitaciones.crear` | Crear Habitación | Dar de alta nuevas habitaciones |
| `habitaciones.modificar` | Modificar Habitación | Editar datos de habitaciones |
| `habitaciones.eliminar` | Eliminar Habitación | Dar de baja habitaciones |
| `habitaciones.cambiarEstado` | Cambiar Estado de Habitación | Modificar estado (disponible, ocupada, limpieza, etc.) |

### Módulo: Clientes (5 acciones - ✅ IMPLEMENTADO)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `clientes.listar` | Listar Clientes | Ver listado de clientes |
| `clientes.ver` | Ver Cliente | Ver detalles de un cliente |
| `clientes.crear` | Crear Cliente | Registrar nuevos clientes |
| `clientes.modificar` | Modificar Cliente | Editar datos de clientes |
| `clientes.eliminar` | Eliminar Cliente | Dar de baja clientes |

### Módulo: Pagos (4 acciones - ✅ IMPLEMENTADO)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `pagos.listar` | Listar Pagos | Ver listado de pagos registrados |
| `pagos.ver` | Ver Pago | Ver detalles de un pago específico |
| `pagos.registrar` | Registrar Pago | Registrar nuevos pagos (manual o automático) |
| `pagos.anular` | Anular Pago | Anular pagos registrados (no implementado) |

### Módulo: Facturación (4 acciones - ✅ IMPLEMENTADO)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `facturas.listar` | Listar Facturas | Ver listado de facturas generadas |
| `facturas.ver` | Ver Factura | Ver detalles de una factura específica |
| `facturas.crear` | Crear Factura | Generar nuevas facturas manualmente |
| `facturas.anular` | Anular Factura | Anular facturas emitidas (no implementado) |

### Módulo: Cuenta Corriente (3 acciones - ✅ IMPLEMENTADO)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `cuentaCorriente.ver` | Ver Cuenta Corriente | Ver estado de cuenta de un cliente |
| `cuentaCorriente.crear` | Crear Movimiento | Crear movimientos manuales (cargos/pagos/ajustes) |
| `cuentaCorriente.modificar` | Modificar Movimiento | Editar o anular movimientos existentes |

### Módulo: MercadoPago (2 acciones - ✅ IMPLEMENTADO)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `mercadopago.crear` | Crear Preferencia de Pago | Generar link de pago con MercadoPago |
| `mercadopago.webhook` | Procesar Webhook | Recibir notificaciones de pago (público, sin auth) |

*Nota: `mercadopago.webhook` no requiere autenticación ya que es llamado por MercadoPago.*

### Módulo: Servicios (5 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `servicios.listar` | Listar Servicios | Ver listado de servicios |
| `servicios.ver` | Ver Servicio | Ver detalles de un servicio |
| `servicios.crear` | Crear Servicio | Dar de alta nuevos servicios |
| `servicios.modificar` | Modificar Servicio | Editar datos de servicios |
| `servicios.eliminar` | Eliminar Servicio | Dar de baja servicios |

### Módulo: Notificaciones (3 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `notificaciones.listar` | Listar Notificaciones | Ver listado de notificaciones |
| `notificaciones.marcarLeida` | Marcar Notificación como Leída | Marcar notificaciones como leídas |
| `notificaciones.eliminar` | Eliminar Notificación | Eliminar notificaciones |

### Módulo: Reportes (3 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `reportes.ocupacion` | Ver Reporte de Ocupación | Acceder a reportes de ocupación |
| `reportes.ingresos` | Ver Reporte de Ingresos | Acceder a reportes financieros |
| `reportes.clientes` | Ver Reporte de Clientes | Acceder a reportes de clientes |

### Módulo: Configuración - Usuarios (7 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `config.usuarios.listar` | Listar Usuarios | Ver listado de usuarios del sistema |
| `config.usuarios.ver` | Ver Usuario | Ver detalles de un usuario |
| `config.usuarios.crear` | Crear Usuario | Crear nuevos usuarios |
| `config.usuarios.modificar` | Modificar Usuario | Editar datos de usuarios |
| `config.usuarios.eliminar` | Eliminar Usuario | Dar de baja usuarios |
| `config.usuarios.asignarGrupos` | Asignar Grupos a Usuario | Asignar roles/grupos a usuarios |
| `config.usuarios.asignarAcciones` | Asignar Acciones a Usuario | Asignar permisos directos a usuarios |
| `config.usuarios.resetearPassword` | Resetear Contraseña de Usuario | Resetear contraseñas (acción de admin) |

### Módulo: Configuración - Grupos (7 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `config.grupos.listar` | Listar Grupos | Ver listado de grupos/roles |
| `config.grupos.ver` | Ver Grupo | Ver detalles de un grupo |
| `config.grupos.crear` | Crear Grupo | Crear nuevos grupos/roles |
| `config.grupos.modificar` | Modificar Grupo | Editar datos de grupos |
| `config.grupos.eliminar` | Eliminar Grupo | Dar de baja grupos |
| `config.grupos.asignarAcciones` | Asignar Acciones a Grupo | Asignar permisos a grupos |
| `config.grupos.asignarHijos` | Asignar Grupos Hijos | Configurar jerarquía de grupos |

### Módulo: Configuración - Acciones (5 acciones)
| Key | Nombre | Descripción |
|-----|--------|-------------|
| `config.acciones.listar` | Listar Acciones | Ver listado de acciones/permisos |
| `config.acciones.ver` | Ver Acción | Ver detalles de una acción |
| `config.acciones.crear` | Crear Acción | Crear nuevas acciones/permisos |
| `config.acciones.modificar` | Modificar Acción | Editar datos de acciones |
| `config.acciones.eliminar` | Eliminar Acción | Dar de baja acciones |

## Grupos del Sistema (3 roles)

### 1. Cliente (`rol.cliente`)
**Descripción:** Usuario final del hotel (huésped)

**Permisos (3 acciones):**
- `reservas.listar` - Ver sus propias reservas
- `notificaciones.listar` - Ver sus notificaciones
- `notificaciones.marcarLeida` - Marcar notificaciones como leídas

### 2. Recepcionista (`rol.recepcionista`)
**Descripción:** Personal de recepción del hotel

**Permisos (38 acciones):**

*Gestión de Reservas:*
- `reservas.listar`
- `reservas.ver`
- `reservas.crear`
- `reservas.modificar`
- `reservas.cancelar`
- `reservas.checkin`
- `reservas.checkout`

*Comprobantes:*
- `comprobantes.emitir`
- `comprobantes.imprimir`
- `comprobantes.ver`

*Habitaciones:*
- `habitaciones.listar`
- `habitaciones.ver`
- `habitaciones.cambiarEstado`

*Clientes:*
- `clientes.listar`
- `clientes.ver`
- `clientes.crear`
- `clientes.modificar`

*Pagos:*
- `pagos.listar`
- `pagos.ver`
- `pagos.registrar`

*Facturación:*
- `facturas.listar`
- `facturas.ver`
- `facturas.crear`

*Cuenta Corriente:*
- `cuentaCorriente.ver`
- `cuentaCorriente.crear`

*MercadoPago:*
- `mercadopago.crear`

### 3. Administrador (`rol.admin`)
**Descripción:** Administrador del sistema con acceso total

**Permisos:** TODAS las 79 acciones del sistema

*Incluye todas las acciones de:*
- Reservas (7)
- Habitaciones (6)
- Clientes (5)
- Pagos (4)
- Facturación (4)
- Cuenta Corriente (3)
- MercadoPago (2)
- Servicios (5)
- Notificaciones (3)
- Reportes (3)
- Configuración - Usuarios (8)
- Configuración - Grupos (7)
- Configuración - Acciones (5)
- Check-out (3 - legacy)
- Comprobantes (4 - legacy)
- Check-in (pendiente)

## Arquitectura de Permisos

### Modelo de Datos
```
User N:M Groups (tabla: user_groups)
User N:M Actions (tabla: user_actions) - Permisos directos
Group N:M Actions (tabla: group_actions)
Group N:M Group (tabla: group_children) - Jerarquía de grupos (actualmente no utilizada)
```

### Resolución de Permisos
Los permisos efectivos de un usuario se calculan como:

```
Permisos Efectivos = user.actions ∪ flatten(user.groups[].actions)
```

- Se obtienen las acciones directas del usuario
- Se obtienen las acciones de todos los grupos del usuario
- Se hace una unión eliminando duplicados (por action.id)
- Los grupos son actualmente **PLANOS** (sin jerarquía children, aunque la estructura lo soporta)

### Validación en Controllers
Los endpoints protegidos usan el decorador `@Actions()`:

```typescript
@Get()
@Actions('config.usuarios.listar')
async listUsers() {
  return this.listUsersUseCase.execute();
}
```

El guard `ActionsGuard` verifica que el usuario tenga la acción requerida en sus permisos efectivos.

### Endpoints de Autenticación

#### Login
```
POST /api/v1/auth/login
Body: { identity: "username o email", password: "string" }
Response: { accessToken, refreshToken, user, permissions: string[] }
```

#### Obtener Permisos del Usuario Actual
```
GET /api/v1/auth/permissions
Headers: Authorization: Bearer {token}
Response: string[] (array de action keys)
```

## Usuarios de Seed (Desarrollo)

| Username | Password | Email | Grupo |
|----------|----------|-------|-------|
| `admin` | `Admin123!` | admin@hotel.com | `rol.admin` |
| `recepcionista1` | `Recep123!` | recep1@hotel.com | `rol.recepcionista` |
| `recepcionista2` | `Recep123!` | recep2@hotel.com | `rol.recepcionista` |
| `gerente` | `Gerente123!` | gerente@hotel.com | `rol.admin` |
| `cliente1` | `Cliente123!` | cliente1@hotel.com | `rol.cliente` |
| `cliente2` | `Cliente123!` | cliente2@hotel.com | `rol.cliente` |

## Notas Técnicas

### Validación de Keys
- Las action keys se validan con regex: `/^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/`
- Permite múltiples niveles: `modulo.operacion` o `modulo.submodulo.operacion`
- Caracteres permitidos: letras, números, guiones y guiones bajos
- Debe tener al menos un punto separador

### Campo `User.role`
- **DEPRECADO**: El campo `role` existe en la entidad User pero **NO se usa** para autorización
- La autorización se basa completamente en el sistema de Groups y Actions
- Se mantiene por compatibilidad pero puede ser removido en el futuro

### Grupos Jerárquicos
- La estructura de datos soporta jerarquía de grupos (Group N:M Group via `group_children`)
- **Actualmente NO se utiliza**: todos los grupos son planos
- El método `Group.getEffectiveActions()` soporta recursión para cuando se implemente
- Cuando se active, los grupos heredarán acciones de sus grupos hijos

### Seed Script
- Ubicación: `backend/src/infrastructure/persistence/typeorm/seeds/run-seed.ts`
- Crear/actualizar: `npm run seed`
- El script es **idempotente**: puede ejecutarse múltiples veces sin duplicar datos
- Actualiza automáticamente grupos de usuarios si cambian

## Próximos Pasos / Pendientes

1. **Definir acciones del módulo Check-in** (actualmente vacío)
2. **Implementar jerarquía de grupos** si es necesario (ej: grupo "Gerente" que herede de "Recepcionista")
3. **Considerar remover campo `User.role`** por estar deprecado
4. **Agregar acciones faltantes** según necesidades del negocio
5. **Documentar permisos requeridos** en cada endpoint de la API

---

**Última actualización:** 13 de noviembre de 2025  
**Versión del sistema:** 2.0.0  
**Cambios recientes:**
- Agregadas 2 acciones de Check-in/Check-out: `reservas.checkin`, `reservas.checkout` ✅
- Agregadas 4 acciones de Facturación: `facturas.listar`, `facturas.ver`, `facturas.crear`, `facturas.anular`
- Agregadas 3 acciones de Cuenta Corriente: `cuentaCorriente.ver`, `cuentaCorriente.crear`, `cuentaCorriente.modificar`
- Agregadas 2 acciones de MercadoPago: `mercadopago.crear`, `mercadopago.webhook`
- Actualizadas acciones de Pagos con implementación completa
- Total de acciones aumentado de 60 a 79

**Módulos implementados:**
- ✅ Reservas (7 acciones)
- ✅ Habitaciones (6 acciones)
- ✅ Clientes (5 acciones)
- ✅ Pagos (4 acciones)
- ✅ Facturación (4 acciones)
- ✅ Cuenta Corriente (3 acciones)
- ✅ MercadoPago (2 acciones)
- ✅ Configuración - Usuarios (8 acciones)
- ✅ Configuración - Grupos (7 acciones)
- ✅ Configuración - Acciones (5 acciones)
- ⏳ Servicios (0/5 acciones)
- ⏳ Notificaciones (0/3 acciones)
- ⏳ Reportes (0/3 acciones)

**Funcionalidades destacadas:**
1. **Sistema de Reservas Completo**: Desde crear reserva hasta check-out con generación automática de factura
2. **Integración con MercadoPago**: Pagos online con webhooks y cuenta corriente automática
3. **Cuenta Corriente**: Movimientos automáticos de cargos y pagos vinculados a facturas
4. **Facturación Automática**: Las facturas se generan automáticamente al hacer check-out
5. **Gestión de Permisos Granular**: 79 acciones distribuidas en 3 roles principales
