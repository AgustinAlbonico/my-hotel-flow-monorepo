# 🔐 Sistema de Permisos y Control de Acceso

## 📋 Resumen

MyHotelFlow implementa un sistema de permisos basado en **Acciones** y **Grupos** con control de acceso en múltiples capas:

1. **Backend**: Guards de NestJS (`@Actions()`)
2. **Frontend - Rutas**: `ProtectedRoute` con `requiredPermissions`
3. **Frontend - UI**: Componente `<Can>` para ocultar elementos

---

## 👥 Roles y Permisos por Defecto

### 🔴 Administrador (`rol.admin`)

**Acceso:** ✅ COMPLETO a todo el sistema

**Permisos incluidos:**
- Todos los permisos de configuración (`config.*`)
- Todos los permisos de operaciones (`op.*`)
- Gestión de usuarios, grupos y acciones
- Todas las funcionalidades del sistema

**Puede ver en el menú:**
- Dashboard
- Usuarios
- Grupos
- Acciones
- Reservas
- Habitaciones
- Comprobantes
- Pagos

---

### 🔵 Recepcionista (`rol.recepcionista`)

**Acceso:** ✅ Operaciones de recepción y atención al cliente

+**Permisos incluidos:**
```
reservas.listar
reservas.ver
reservas.crear
reservas.modificar
checkin.registrar
checkin.asignarHabitacion
checkout.calcularCargos
checkout.registrarPago
checkout.cerrar
habitaciones.listar
habitaciones.ver
habitaciones.cambiarEstado
clientes.listar
clientes.ver
clientes.crear
clientes.modificar
```

**Puede ver en el menú:**
- Dashboard
- Reservas
- Habitaciones
- Clientes

**NO puede ver:**
- ❌ Usuarios
- ❌ Grupos
- ❌ Acciones
- ❌ Configuración del sistema

---

### 🟢 Cliente (`rol.cliente`)

**Acceso:** ✅ Solo consulta de sus propias reservas

**Permisos incluidos:**
```
reservas.listar
reservas.ver
```

**Puede ver en el menú:**
- Dashboard
- Mis Reservas

**NO puede ver:**
- ❌ Usuarios
- ❌ Grupos
- ❌ Acciones
- ❌ Habitaciones
- ❌ Check-in/Check-out
- ❌ Configuración del sistema

---

## 🛡️ Protección de Rutas Frontend

Cada ruta está protegida con permisos específicos:

### Rutas de Usuarios

| Ruta | Permiso Requerido | Descripción |
|------|-------------------|-------------|
| `/users` | `config.usuarios.listar` | Ver lista de usuarios |
| `/users/create` | `config.usuarios.crear` | Crear nuevo usuario |
| `/users/:id/edit` | `config.usuarios.modificar` | Editar usuario |
| `/users/:id/permissions` | `config.usuarios.asignarGrupos` | Gestionar permisos |

### Rutas de Grupos

| Ruta | Permiso Requerido | Descripción |
|------|-------------------|-------------|
| `/groups` | `config.grupos.listar` | Ver lista de grupos |
| `/groups/create` | `config.grupos.crear` | Crear nuevo grupo |
| `/groups/:id/edit` | `config.grupos.modificar` | Editar grupo |
| `/groups/:id/actions` | `config.grupos.asignarAcciones` | Asignar acciones |
| `/groups/:id/children` | `config.grupos.asignarHijos` | Asignar subgrupos |

### Rutas de Acciones

| Ruta | Permiso Requerido | Descripción |
|------|-------------------|-------------|
| `/actions` | `config.acciones.listar` | Ver lista de acciones |
| `/actions/create` | `config.acciones.crear` | Crear nueva acción |
| `/actions/:id/edit` | `config.acciones.modificar` | Editar acción |

---

## 🔒 ¿Qué sucede si un usuario intenta acceder sin permisos?

### Escenario 1: Intenta acceder a una ruta protegida

```
Cliente intenta ir a /users
↓
ProtectedRoute verifica: ¿Tiene permiso 'config.usuarios.listar'?
↓
❌ NO → Redirige a /forbidden (Página 403)
```

### Escenario 2: Intenta hacer una petición al backend

```
Recepcionista intenta POST /users
↓
Backend Guard verifica: ¿Tiene permiso 'config.usuarios.crear'?
↓
❌ NO → HTTP 403 Forbidden
```

### Escenario 3: Ve la interfaz

```
Cliente carga el sidebar
↓
Componente <Can> verifica permisos para cada enlace
↓
Solo muestra: Dashboard, Mis Reservas
Oculta: Usuarios, Grupos, Acciones, etc.
```

---

## 🧪 Cómo Probar el Sistema de Permisos

### Prueba 1: Login como Cliente

```bash
Usuario: cliente1
Contraseña: Cliente123!
```

**Resultado esperado:**
- ✅ Puede ver Dashboard
- ✅ Solo ve enlace "Mis Reservas" en sidebar
- ❌ Si intenta ir manualmente a `/users` → Redirige a /forbidden
- ❌ No ve ningún enlace de configuración

### Prueba 2: Login como Recepcionista

```bash
Usuario: recepcionista1
Contraseña: Recep123!
```

**Resultado esperado:**
- ✅ Puede ver Dashboard
- ✅ Ve enlaces: Reservas, Habitaciones, Clientes
- ❌ NO ve: Usuarios, Grupos, Acciones
- ❌ Si intenta ir manualmente a `/groups` → Redirige a /forbidden

### Prueba 3: Login como Administrador

```bash
Usuario: admin
Contraseña: Admin123!
```

**Resultado esperado:**
- ✅ Ve TODOS los enlaces en el sidebar
- ✅ Puede acceder a todas las rutas
- ✅ Tiene acceso completo al sistema

---

## 📐 Arquitectura del Sistema de Permisos

```
┌─────────────────────────────────────────┐
│         USUARIO (User Entity)           │
├─────────────────────────────────────────┤
│ - username                              │
│ - email                                 │
│ - role (admin/recepcionista/cliente)    │
└─────────────────────────────────────────┘
           │
           │ ManyToMany
           ▼
┌─────────────────────────────────────────┐
│          GRUPOS (Group Entity)          │
├─────────────────────────────────────────┤
│ - key (rol.admin, rol.cliente, etc)     │
│ - name                                  │
│ - description                           │
└─────────────────────────────────────────┘
           │
           │ ManyToMany
           ▼
┌─────────────────────────────────────────┐
│        ACCIONES (Action Entity)         │
├─────────────────────────────────────────┤
│ - key (config.usuarios.crear, etc)      │
│ - name                                  │
│ - description                           │
└─────────────────────────────────────────┘
```

### Herencia de Permisos

```
Usuario "recepcionista1"
    ↓
Tiene grupo "rol.recepcionista"
    ↓
Grupo tiene acciones: [reservas.listar, reservas.ver, ...]
    ↓
Usuario hereda esas acciones
    ↓
Frontend/Backend verifican permisos efectivos
```

---

## 🔧 Cómo Agregar un Nuevo Permiso

### 1. Crear la acción en el backend

```typescript
// backend/src/modules/actions/actions.service.ts
{
  key: 'nuevaCategoria.nuevaAccion',
  name: 'Nueva Acción',
  description: 'Descripción de la acción',
}
```

### 2. Asignar a un grupo

```typescript
// backend/src/modules/groups/groups.service.ts
const recepcionistaActions = [
  'reservas.listar',
  'nuevaCategoria.nuevaAccion', // ← Agregar aquí
];
```

### 3. Proteger ruta en el frontend

```tsx
// frontend/src/routes/AppRoutes.tsx
<Route element={<ProtectedRoute requiredPermissions={['nuevaCategoria.nuevaAccion']} />}>
  <Route path="/nueva-funcionalidad" element={<NuevaPage />} />
</Route>
```

### 4. Proteger endpoint en el backend

```typescript
// backend/src/modules/algo/algo.controller.ts
@Actions('nuevaCategoria.nuevaAccion')
@Get('nueva-funcionalidad')
async nuevaFuncionalidad() {
  // ...
}
```

### 5. Ocultar UI si no tiene permiso

```tsx
// frontend/src/components/algo/AlgoComponent.tsx
<Can perform="nuevaCategoria.nuevaAccion">
  <button>Nueva Funcionalidad</button>
</Can>
```

---

## ⚠️ Notas de Seguridad

1. **Nunca confíes solo en el frontend:** El frontend oculta elementos, pero un usuario técnico podría intentar acceder directamente a las rutas.

2. **Siempre protege el backend:** Los Guards de NestJS son la línea de defensa real.

3. **Triple capa de protección:**
   - Frontend: `<Can>` (UI)
   - Frontend: `ProtectedRoute` (Rutas)
   - Backend: `@Actions()` (API)

4. **Permisos granulares:** No uses "admin" como único permiso. Usa acciones específicas para cada funcionalidad.

---

## 🐛 Troubleshooting

### Problema: Cliente/Recepcionista puede ver rutas de configuración

**Causa:** Rutas no están protegidas correctamente

**Solución:** Verificar que cada ruta esté envuelta en `<ProtectedRoute requiredPermissions={[...]}>` en `AppRoutes.tsx`

---

### Problema: Enlaces aparecen en el sidebar pero no debería

**Causa:** Falta el componente `<Can>` o el permiso no coincide

**Solución:** Envolver cada `<NavLink>` en `<Can perform="permiso.correcto">` en `Sidebar.tsx`

---

### Problema: Usuario tiene el grupo pero no puede acceder

**Causa:** El grupo no tiene la acción asignada

**Solución:** 
1. Ir a `/groups/:id/actions`
2. Asignar la acción correspondiente al grupo
3. O ejecutar el seed de acciones: `POST /groups/seed-actions`

---

**Última actualización:** 30 de octubre de 2025
