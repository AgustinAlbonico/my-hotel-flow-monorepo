# 👥 Cuentas de Usuario - Seed Inicial

Este documento contiene todas las cuentas de usuario creadas por el seed inicial del sistema MyHotelFlow.

## 🔐 Credenciales de Acceso

### 👨‍💼 Administrador

| Campo | Valor |
|-------|-------|
| **Usuario** | `admin` |
| **Email** | `admin@hotel.com` |
| **Contraseña** | `Admin123!` |
| **Nombre Completo** | Administrador |
| **Grupo** | Administrador (`rol.admin`) |
| **Estado** | ✅ Activo |

**Permisos:** Acceso completo a todas las funcionalidades del sistema.

---

### 👩‍💼 Recepcionistas

#### Recepcionista 1

| Campo | Valor |
|-------|-------|
| **Usuario** | `recepcionista1` | 
| **Email** | `recepcionista1@hotel .com` |
| **Contraseña** | `Recep123!` |
| **Nombre Completo** | María García |
| **Grupo** | Recepcionista (`rol.recepcionista`) |
| **Estado** | ✅ Activo |

**Permisos:** Operaciones de mostrador y recepción del cliente.

#### Recepcionista 2

| Campo | Valor |
|-------|-------|
| **Usuario** | `recepcionista2` |
| **Email** | `recepcionista2@hotel.com` |
| **Contraseña** | `Recep123!` |
| **Nombre Completo** | Carlos Rodríguez |
| **Grupo** | Recepcionista (`rol.recepcionista`) |
| **Estado** | ✅ Activo |

**Permisos:** Operaciones de mostrador y recepción del cliente.

---

### 👤 Clientes

#### Cliente 1

| Campo | Valor |
|-------|-------|
| **Usuario** | `cliente1` |
| **Email** | `cliente1@hotel.com` |
| **Contraseña** | `Cliente123!` |
| **Nombre Completo** | Juan Pérez |
| **Grupo** | Cliente (`rol.cliente`) |
| **Estado** | ✅ Activo |

**Permisos:** Usuario cliente con permisos básicos de reserva.

#### Cliente 2

| Campo | Valor |
|-------|-------|
| **Usuario** | `cliente2` |
| **Email** | `cliente2@hotel.com` |
| **Contraseña** | `Cliente123!` |
| **Nombre Completo** | Ana Martínez |
| **Grupo** | Cliente (`rol.cliente`) |
| **Estado** | ✅ Activo |

**Permisos:** Usuario cliente con permisos básicos de reserva.

#### Cliente 3

| Campo | Valor |
|-------|-------|
| **Usuario** | `cliente3` |
| **Email** | `cliente3@hotel.com` |
| **Contraseña** | `Cliente123!` |
| **Nombre Completo** | Luis Fernández |
| **Grupo** | Cliente (`rol.cliente`) |
| **Estado** | ✅ Activo |

**Permisos:** Usuario cliente con permisos básicos de reserva.

---

## 🚀 Ejecutar el Seed

Para crear estos usuarios en la base de datos, ejecuta:

```bash
# Opción 1: Desde la API (con backend corriendo)
curl -X POST http://localhost:3000/users/seed

# Opción 2: Desde la UI
# Puedes crear un endpoint en el frontend o ejecutarlo manualmente
```

## 📋 Resumen de Cuentas

| Tipo | Cantidad | Usuarios |
|------|----------|----------|
| **Administradores** | 1 | admin |
| **Recepcionistas** | 2 | recepcionista1, recepcionista2 |
| **Clientes** | 3 | cliente1, cliente2, cliente3 |
| **TOTAL** | **6** | |

## 🔒 Política de Contraseñas

Todas las contraseñas del seed cumplen con los requisitos de seguridad:

- ✅ Mínimo 8 caracteres
- ✅ Al menos 1 mayúscula
- ✅ Al menos 1 minúscula
- ✅ Al menos 1 número
- ✅ Al menos 1 carácter especial

## ⚠️ Importante

> **NOTA DE SEGURIDAD:** Estas son cuentas de desarrollo/testing. En producción, debes:
> 1. Cambiar todas las contraseñas
> 2. Usar contraseñas únicas y seguras
> 3. Habilitar autenticación de dos factores
> 4. Eliminar o desactivar las cuentas de prueba

## 🔄 Actualizar Usuario por Defecto

Si necesitas cambiar los datos de algún usuario del seed, edita el archivo:

```
backend/src/modules/users/users.service.ts
```

Busca el método `seed()` y modifica el array `usersToSeed`.

---

**Última actualización:** 30 de octubre de 2025
