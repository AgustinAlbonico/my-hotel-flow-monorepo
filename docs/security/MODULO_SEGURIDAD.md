# SEGURIDAD.md — Plan de construcción (NestJS + TypeORM)
_Sistema: Reservas Hoteleras (Recepción, Check-in/Out, Facturación, Servicios)_

> **Cambio solicitado**: se elimina el concepto de **Formulario**. El modelo de seguridad queda **solo con _Grupos_ y _Acciones_** (patrón **Composite**). Las acciones estarán **namespaced** por área funcional (p. ej., `reservas.crear`, `checkin.registrar`).

---

## 0) Objetivo y alcance
- Implementar **autenticación y autorización** granular basada en **ACCIONES** y **GRUPOS** (sin formularios).  
- Cubrir los **casos de uso**: Iniciar sesión, Cerrar sesión, Cambiar clave, Recuperar clave, Gestionar Usuarios (ABM + reset), Gestionar Grupos (ABM + asignación de acciones), **Habilitar Acciones** (asignación directa a usuario o a grupos).  
- Entregar artefactos exigidos por cátedra: DCU detallados, RNF de seguridad, auditoría, matriz CU↔RN↔entidades, pruebas, etc.
- Inspiración de proyecto de referencia (PHP/Laravel) trasladada a **NestJS Modules + Controllers + Services + Guards**.

---

## 1) Actores / Roles iniciales
- **Cliente/Usuario**: autenticarse, ver/actualizar perfil, reservar (si habilitado), consultar comprobantes.
- **Recepcionista**: operar reservas, check‑in/out, emitir/imprimir comprobantes, gestionar pagos.
- **Administrador**: gestionar usuarios, grupos y acciones; parametrizar seguridad (asignaciones, políticas, auditorías).

> Los _roles_ son etiquetas funcionales; la autorización real surge de **acciones efectivas** (grupos + excepciones por usuario) según **Composite**.

---

## 2) Modelo de permisos (Composite)

### 2.1. Conceptos
- **Acción** (`Action`): permiso atómico (p. ej., `reservas.crear`, `checkin.registrar`, `checkout.cerrar`, `comprobantes.imprimir`).  
- **Grupo** (`Group`): conjunto de **Acciones** y opcionalmente de otros **Grupos** (jerarquía).  
- **Usuario** (`User`): posee **Grupos** y **Acciones propias** (excepciones puntuales).  
- **Permisos efectivos**: `accionesUsuario ∪ acciones(grupos del usuario y sus hijos recursivos)`.

### 2.2. Resolución de permisos
1. `effective = Set<string>()`  
2. Agregar **acciones del usuario** (excepciones).  
3. Recorrer recursivamente **grupos** del usuario, agregando sus **acciones** y las de sus **grupos hijos**.  
4. Aplicar **deny** explícitos (si se implementan) al final.  
5. **Cache** por `userId` (p. ej., Redis) con invalidación al modificar grupos/acciones.

---

## 3) Entidades (TypeORM)

```ts
// Action (permiso atómico)
@Entity('action')
export class ActionEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) key: string;        // 'reservas.crear', 'checkin.registrar', etc.
  @Column() description: string;
}

// Group (Composite)
@Entity('group')
export class GroupEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) key: string;        // 'rol.cliente', 'rol.recepcionista', 'rol.admin', etc.
  @Column() name: string;

  @ManyToMany(() => ActionEntity, { eager: true })
  @JoinTable({ name: 'group_actions' })
  actions: ActionEntity[];

  @ManyToMany(() => GroupEntity, { eager: true })
  @JoinTable({ name: 'group_children' })
  children?: GroupEntity[];
}

// User
@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) username: string;
  @Column({ unique: true }) email: string;
  @Column() passwordHash: string;
  @Column({ default: true }) isActive: boolean;
  @Column({ nullable: true }) lastLoginAt?: Date;

  @ManyToMany(() => GroupEntity, { eager: true })
  @JoinTable({ name: 'user_groups' })
  groups: GroupEntity[];

  @ManyToMany(() => ActionEntity, { eager: true })
  @JoinTable({ name: 'user_actions' })
  actions: ActionEntity[]; // excepciones
}

// (Opcional) Revocación de tokens (JWT)
@Entity('revoked_token')
export class RevokedToken {
  @PrimaryGeneratedColumn() id: number;
  @Column() jti: string;
  @Column() expiresAt: Date;
}

// Auditoría
@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) userId?: number;
  @Column() action: string;        // 'auth.login', 'users.create', 'groups.assign-actions', etc.
  @Column({ nullable: true }) entity?: string;  // 'user','group','action'
  @Column({ nullable: true }) entityId?: string;
  @Column('jsonb', { nullable: true }) metadata?: any;
  @Column({ nullable: true }) ip?: string;
  @Column({ nullable: true }) userAgent?: string;
  @CreateDateColumn() createdAt: Date;
}
```

> **No hay entidad `Formulario` ni `Módulo`**. La taxonomía queda implícita en el **namespace** de la `key` del `Action` (p. ej., `reservas.crear`).

---

## 4) Catálogo de **Acciones** (mínimo sugerido)

- **reservas**: `reservas.listar`, `reservas.ver`, `reservas.crear`, `reservas.modificar`, `reservas.cancelar`
- **checkin**: `checkin.registrar`, `checkin.asignarHabitacion`, `checkin.adjuntarGarantia`, `checkin.imprimirComprobante`
- **checkout**: `checkout.calcularCargos`, `checkout.registrarPago`, `checkout.cerrar`, `checkout.imprimirComprobante`
- **comprobantes**: `comprobantes.emitir`, `comprobantes.anular`, `comprobantes.imprimir`, `comprobantes.ver`
- **habitaciones**: `habitaciones.listar`, `habitaciones.ver`, `habitaciones.crear`, `habitaciones.modificar`, `habitaciones.cambiarEstado`
- **clientes**: `clientes.listar`, `clientes.ver`, `clientes.crear`, `clientes.modificar`
- **pagos**: `pagos.registrar`, `pagos.devolver`, `pagos.ver`
- **servicios**: `servicios.listar`, `servicios.asignar`, `servicios.remover`
- **notificaciones**: `notificaciones.enviar`, `notificaciones.ver`
- **reportes**: `reportes.ver`, `reportes.exportar`
- **config**: `config.usuarios.*`, `config.grupos.*`, `config.acciones.*`

> Se pueden añadir o quitar acciones sin romper el modelo.

---

## 5) Grupos iniciales (seeding)

- `rol.cliente`
  - `reservas.crear`, `reservas.ver`, `comprobantes.ver`, `clientes.modificar`
- `rol.recepcionista`
  - `reservas.*`, `checkin.*`, `checkout.*`, `comprobantes.imprimir`, `pagos.registrar`, `clientes.*`, `habitaciones.listar`, `habitaciones.ver`, `habitaciones.cambiarEstado`
- `rol.admin`
  - `config.usuarios.*`, `config.grupos.*`, `config.acciones.*` y/o `superuser`

> **Composición**: crear `group.frontdesk` con acciones de mostrador y asignarlo como hijo de `rol.recepcionista`.

---

## 6) Casos de uso (criterios de aceptación)

### CU-S1: Iniciar sesión
- Entrada: `email|username`, `password`
- Validaciones: usuario activo, hash (Argon2id), lockout 5/15m
- Salida: `accessToken`, `refreshToken`, `profile`, **effectiveActions**
- Auditoría: IP, agente, `lastLoginAt`

### CU-S2: Cerrar sesión
- Revocar token (blacklist o rotate); auditar

### CU-S3: Cambiar clave (autenticado)
- Política de complejidad y expiración; invalidar sesiones

### CU-S4: Recuperar clave (no autenticado)
- Token de reset one‑time + rate‑limit; expiración; auditar

### CU-S5: Gestionar Usuarios (Admin)
- ABM + activación/desactivación; **asignar Grupos** y **Acciones particulares**; resetear clave

### CU-S6: Resetear clave (Admin)
- Generar clave temporal o token; notificar por correo

### CU-S7: Gestionar Grupos (Admin)
- ABM grupo; **asignar Acciones** y **Grupos hijos**; evitar ciclos

### CU-S8: Habilitar Acciones (asignación)
- Asignación directa de **Acciones**: a un **Usuario** o a un **Grupo** (sin formularios)
- Criterio: el cambio se refleja inmediatamente en `effectiveActions` (o al limpiar cache)

---

## 7) Arquitectura (NestJS)

```
src/
  modules/
    auth/         # login, refresh, logout, change/reset password
    users/        # ABM + asignación de grupos/acciones
    groups/       # ABM + composición
    actions/      # catálogo + seeding
    audit/        # logs de seguridad
  common/
    decorators/   # @Actions(), @Public(), @CurrentUser()
    guards/       # JwtAuthGuard, ActionsGuard
    utils/
  infra/
    persistence/  # entities, migrations, seeds
    mailer/
    cache/        # Redis
```

- JWT access (15m) + refresh (7–30d) con blacklist/rotation.
- Password hashing: **Argon2id**.
- **ActionsGuard** verifica que el usuario tenga todas las acciones declaradas en el endpoint.

```ts
export const ACTIONS_KEY = 'actions';
export const Actions = (...acts: string[]) => SetMetadata(ACTIONS_KEY, acts);

@UseGuards(JwtAuthGuard, ActionsGuard)
@Post('reservas')
@Actions('reservas.crear')
createReserva(@Body() dto: CrearReservaDto) { /* ... */ }
```

Servicio de autorización (resumen):
```ts
async getEffectiveActions(userId: number): Promise<Set<string>> {
  const user = await this.usersRepo.findOne({
    where: { id: userId },
    relations: ['groups', 'groups.children', 'groups.actions', 'actions'],
  });

  const visited = new Set<number>();
  const result = new Set<string>();

  const addGroup = (g: GroupEntity) => {
    if (visited.has(g.id)) return;
    visited.add(g.id);
    g.actions?.forEach(a => result.add(a.key));
    g.children?.forEach(addGroup);
  };

  user.actions?.forEach(a => result.add(a.key));
  user.groups?.forEach(addGroup);
  return result;
}
```

---

## 8) API (rutas)

```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/recover/request
POST   /auth/recover/confirm

GET    /me
PATCH  /me/password

# Admin
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
POST   /users/:id/reset-password
PATCH  /users/:id/groups    # set
PATCH  /users/:id/actions   # set excepciones

GET    /groups
POST   /groups
GET    /groups/:id
PATCH  /groups/:id
DELETE /groups/:id
PATCH  /groups/:id/actions   # set
PATCH  /groups/:id/children  # set

GET    /actions              # catálogo
```

---

## 9) RNF de seguridad
- Política de clave (longitud, complejidad, expiración opcional, historial opcional).
- Lockout (5 intentos/15m por defecto).
- Auditoría completa: login/logout/reset/cambio clave/ABM y asignaciones.
- Logs sin datos sensibles; enmascarar PII.
- Backups incluyen tablas de seguridad y auditoría.
- Cache de permisos con invalidación consistente.

---

## 10) Migraciones y Seeding
1. Tablas: `action`, `group`, `group_actions`, `group_children`, `user`, `user_groups`, `user_actions`, `revoked_token`, `audit_log`.
2. Seeder de `actions` (catálogo de §4) y `groups` (`rol.cliente`, `rol.recepcionista`, `rol.admin`).
3. Usuario admin (`admin@hotel.com`) con `rol.admin`.

---

## 11) Pruebas
- **Unit (Jest)**: `AuthorizationService.getEffectiveActions`, `PasswordService`, `ActionsGuard`.
- **E2E (Supertest)**: login/refresh/logout; ABM users/groups; asignaciones; protección de endpoints.
- **Postman**: colección `Auth`, `Users`, `Groups`, `Actions` con variables de entorno.

---

## 12) Auditoría y reportes
- `audit_log` con export CSV.
- Filtros por usuario, fecha, acción y entidad.

---

## 13) UI/Backoffice (impacto)
- **Gestionar Usuarios**: ABM + pestañas “Grupos” y “Acciones particulares”.
- **Gestionar Grupos**: ABM + “Acciones del grupo” + “Grupos hijos”.
- **Habilitar Acciones**: **sin formularios**, solo selección de acciones y asignación a usuario/grupo.

---

## 14) Entregables por iteración
- DCU actualizados, diagrama de clases (seguridad), secuencias (login y autorización), migraciones + seeds, endpoints, pruebas, colección Postman, RNF y auditoría, demo con tres perfiles.

---

## 15) Checklist
- [ ] Entidades/migraciones/seeds
- [ ] Guards/Decorators + cache
- [ ] Endpoints Auth/Users/Groups/Actions
- [ ] Auditoría
- [ ] Tests unit/E2E + Postman
- [ ] Documentación y diagramas actualizados
