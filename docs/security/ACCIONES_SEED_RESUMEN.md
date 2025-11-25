# Acciones sembradas vs. documentación

Este documento resume el estado actual del **seed de acciones** (`run-seed.ts`) y su alineación con la documentación de seguridad.

## 1. Módulos y acciones sembradas actualmente

Fuente principal: `apps/backend/src/infrastructure/persistence/typeorm/seeds/run-seed.ts`

### 1.1 Reservas
- `reservas.listar`
- `reservas.ver`
- `reservas.crear`
- `reservas.modificar`
- `reservas.cancelar`
- `reservas.checkin`
- `reservas.checkout`

### 1.2 Check-in (legacy / sin uso directo)
- `checkin.registrar`
- `checkin.asignarHabitacion`
- `checkin.adjuntarGarantia`
- `checkin.imprimirComprobante`

### 1.3 Check-out (legacy / en desuso)
- `checkout.calcularCargos`
- `checkout.registrarPago`
- `checkout.cerrar`
- `checkout.imprimirComprobante`

### 1.4 Comprobantes (legacy)
- `comprobantes.emitir`
- `comprobantes.anular`
- `comprobantes.imprimir`
- `comprobantes.ver`

### 1.5 Habitaciones
- `habitaciones.listar`
- `habitaciones.ver`
- `habitaciones.crear`
- `habitaciones.modificar`
- `habitaciones.eliminar`
- `habitaciones.cambiarEstado`

> Nota: estas acciones cubren la gestión de habitaciones pero **no existen acciones específicas para tipos de habitación ni características** (solo se siembran datos, no permisos específicos).

### 1.6 Clientes
- `clientes.listar`
- `clientes.ver`
- `clientes.crear`
- `clientes.modificar`
- `clientes.eliminar`

### 1.7 Pagos
- `pagos.listar`
- `pagos.ver`
- `pagos.registrar`
- `pagos.anular`

### 1.8 Facturación
- `facturas.listar`
- `facturas.ver`
- `facturas.crear`
- `facturas.anular`

### 1.9 Cuenta Corriente
- `cuentaCorriente.ver`
- `cuentaCorriente.crear`
- `cuentaCorriente.modificar`

### 1.10 MercadoPago
- `mercadopago.crear`

### 1.11 Servicios
- `servicios.listar`
- `servicios.asignar`
- `servicios.remover`

### 1.12 Notificaciones
- `notificaciones.enviar`
- `notificaciones.ver`

### 1.13 Reportes
- `reportes.ver`
- `reportes.exportar`

### 1.14 Configuración - Usuarios
- `config.usuarios.listar`
- `config.usuarios.ver`
- `config.usuarios.crear`
- `config.usuarios.modificar`
- `config.usuarios.eliminar`
- `config.usuarios.asignarGrupos`
- `config.usuarios.asignarAcciones`
- `config.usuarios.resetearPassword`

### 1.15 Configuración - Grupos
- `config.grupos.listar`
- `config.grupos.ver`
- `config.grupos.crear`
- `config.grupos.modificar`
- `config.grupos.eliminar`
- `config.grupos.asignarAcciones`
- `config.grupos.asignarHijos`

### 1.16 Configuración - Acciones
- `config.acciones.listar`
- `config.acciones.ver`
- `config.acciones.crear`
- `config.acciones.modificar`
- `config.acciones.eliminar`

---

## 2. Acciones relevantes para Habitaciones / Tipos / Características

### 2.1 Qué existe hoy

A nivel de permisos, solo existe el módulo genérico de habitaciones:

- `habitaciones.*` (gestiona la entidad habitación)

A nivel de datos, el seed crea:

- Características (`CaracteristicaOrmEntity`) mediante `CaracteristicaAndRoomTypeSeed`
- Tipos de habitación (`RoomTypeOrmEntity`) y sus relaciones con características

Es decir, **las características y tipos de habitación se siembran como datos, pero no tienen acciones/permisos dedicados** para su gestión desde el panel de configuración.

### 2.2 Acciones faltantes sugeridas

Tomando como referencia el resto del sistema (patrón `modulo.listar/ver/crear/modificar/eliminar`) y los documentos de habitaciones, se recomiendan las siguientes acciones nuevas:

#### Módulo: Tipos de Habitación
- `tiposHabitacion.listar` — Listar tipos de habitación
- `tiposHabitacion.ver` — Ver detalle de tipo de habitación
- `tiposHabitacion.crear` — Crear nuevo tipo de habitación
- `tiposHabitacion.modificar` — Modificar tipo de habitación
- `tiposHabitacion.eliminar` — Eliminar tipo de habitación

#### Módulo: Características de Habitación
- `caracteristicas.listar` — Listar características
- `caracteristicas.ver` — Ver detalle de característica
- `caracteristicas.crear` — Crear nueva característica
- `caracteristicas.modificar` — Modificar característica
- `caracteristicas.eliminar` — Eliminar característica

Opcionalmente, si se quiere controlar la asignación de características a tipos de habitación con permisos específicos:

- `tiposHabitacion.asignarCaracteristica` — Asociar característica a tipo de habitación
- `tiposHabitacion.removerCaracteristica` — Quitar característica de tipo de habitación

---

## 3. Sugerencias de cambios en el seed

Para alinear el seed con la documentación y la funcionalidad de habitaciones, se recomienda:

1. **Agregar al array `actionsData` de `run-seed.ts`** las acciones propuestas en la sección 2.2.
2. Crear (o reutilizar) controladores/endpoints que usen estas acciones mediante el decorador `@Actions()` para:
   - CRUD de tipos de habitación
   - CRUD de características
   - Asignación de características a tipos (si aplica)
3. Incluir las nuevas acciones en los grupos relevantes:
   - `rol.recepcionista`: al menos `tiposHabitacion.listar`, `tiposHabitacion.ver`, `caracteristicas.listar`, `caracteristicas.ver`.
   - `rol.admin`: todas las acciones nuevas (ya está cubierto porque el admin se alimenta de TODAS las acciones del seed).

---

## 4. Resumen rápido

- El seed actual **sí incluye** todas las acciones básicas de habitaciones (`habitaciones.*`).
- El seed **NO define** acciones para gestionar explícitamente **tipos de habitación** ni **características**, aunque sí siembra esos datos.
- Se propone agregar un módulo de `tiposHabitacion.*` y `caracteristicas.*` al `actionsData` y mapearlos a controladores/guards, siguiendo el mismo patrón que clientes, habitaciones y servicios.

---

**Última actualización:** 18 de noviembre de 2025
