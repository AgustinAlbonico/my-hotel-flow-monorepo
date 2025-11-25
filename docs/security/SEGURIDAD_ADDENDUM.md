# SEGURIDAD_ADDENDUM.md — Extensión y arquitectura

## Arquitectura usada
- **Clean Architecture** con enfoque **Hexagonal (Ports & Adapters)**.
- Capas:
  - **Domain**: entidades, value objects, políticas, servicios de dominio, eventos.
  - **Application**: casos de uso, DTOs y mappers; depende de **puertos** (interfaces).
  - **Infrastructure**: adapters a tecnología (TypeORM, Mailer, Redis, JWT/Token, Hash).
  - **Interface/Presentation**: NestJS (controllers, guards, decorators, pipes, filters) + Swagger.

## Puertos principales
- `UserRepository`, `GroupRepository`, `ActionRepository`
- `TokenService`, `HashService`, `Mailer`, `Cache`

## Modelo de permisos (Composite)
- **Acción**: string namespaced (ej. `reservas.crear`).
- **Grupo**: contiene acciones y/o grupos hijos (jerárquico sin ciclos).
- **Usuario**: tiene grupos + acciones propias.
- **Permisos efectivos**: unión recursiva de acciones de grupos + acciones propias.
- **Cache**: `user:perm:{id}` en Redis (TTL 15m).

## Catálogo mínimo de acciones (resumen)
- `reservas.*`, `checkin.*`, `checkout.*`, `comprobantes.*`, `habitaciones.*`, `clientes.*`, `pagos.*`, `servicios.*`, `notificaciones.*`, `reportes.*`, `config.*`

## Grupos iniciales (resumen)
- `rol.cliente`, `rol.recepcionista` (puede heredar `group.frontdesk`), `rol.admin`

## Políticas de seguridad
- **Password**: min 10, 1U/1l/1d/1s, Argon2id; lockout 5 intentos/15m; rehash si cambian parámetros.
- **Tokens**: JWT access 15m, refresh 7–30d, `jti`, rotation + blacklist.
- **Hardening**: CORS, Helmet, Rate limit a `/auth/*`, DTO whitelist, mensajes neutros en recover.
- **Auditoría**: `audit_log` (auth y ABM seguridad).

## Endpoints (resumen)
- **Auth**: `/auth/login|refresh|logout|recover/request|recover/confirm`, `/me`, `/me/password`
- **Users**: CRUD + `set groups` + `set actions` + `reset password`
- **Groups**: CRUD + `set actions` + `set children`
- **Actions**: catálogo

## DTOs clave
```ts
class LoginDto { identity: string; password: string; }
class RecoverRequestDto { email: string; }
class RecoverConfirmDto { token: string; newPassword: string; }
class ChangePasswordDto { currentPassword: string; newPassword: string; }
class CreateUserDto { username: string; email: string; password?: string; isActive?: boolean; }
class SetUserGroupsDto { groupKeys: string[]; }
class SetUserActionsDto { actionKeys: string[]; }
class CreateGroupDto { key: string; name: string; }
class SetGroupActionsDto { actionKeys: string[]; }
class SetGroupChildrenDto { childGroupKeys: string[]; }
```

## Guard y Decorator (uso)
```ts
export const ACTIONS_KEY = 'actions';
export const Actions = (...acts: string[]) => SetMetadata(ACTIONS_KEY, acts);

@UseGuards(JwtAuthGuard, ActionsGuard)
@Post('reservas')
@Actions('reservas.crear')
createReserva(@Body() dto: CrearReservaDto) {}
```

## Estrategia anti-ciclos (idea)
- DFS desde `child`; si alcanza `parent` → **ciclo**. Bloquear operación y responder `422`.

## Pruebas (resumen)
- Unit: autorización (composición), política password, token (rotation), anti-ciclos.
- E2E: login/refresh/logout; CRUD Users/Groups; protección de endpoints; recover.
- Seguridad: rate-limit, enumeración, revocation, escalation.

## DevOps
- `.env` ejemplo: `DATABASE_URL`, `REDIS_URL`, `JWT_*`, parámetros Argon2, SMTP.
- `docker-compose`: `api`, `db (postgres)`, `cache (redis)`, `mailhog (dev)`.
