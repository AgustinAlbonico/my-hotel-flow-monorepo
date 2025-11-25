# MEJORES_PRACTICAS — IA / Desarrollo (MyHotelFlow)

Este documento define las mejores prácticas que la IA (y los desarrolladores) deben seguir al programar para el proyecto MyHotelFlow. El objetivo es mantener código sin errores de TypeScript ni de ESLint, con alta calidad, consistente con patrones de diseño y apto para entornos empresariales.

Última actualización: Octubre 2025

---

## Resumen ejecutivo
- Requisitos obligatorios:
  - Código sin errores de TypeScript (usar `strict` y `noImplicitAny`).
  - Código sin errores de ESLint.
  - Uso adecuado de patrones de diseño cuando corresponda; comentar cuál patrón se usa y por qué.
  - Tests unitarios/integ. y cobertura mínima en módulos críticos.

- Ámbito: Backend (NestJS + TypeORM + PostgreSQL) y Frontend (React + React Query + Tailwind + React Hook Form + Zod).

---

## Contenido
1. Reglas generales
2. TypeScript: convenciones y ejemplos
3. ESLint / Linting / Formato
4. Estructura de código y organización de módulos
5. Patrones de diseño (cuándo usarlos y ejemplos)
6. Comentarios y documentación
7. Manejo de errores y excepciones
8. Validación de datos (Zod + DTOs)
9. Testing y cobertura
10. Git, commits y versionado
11. Performance y optimización
12. Seguridad
13. Accesibilidad (frontend)
14. Checklist de CI / Comandos

---

## 1) Reglas generales
- Siempre trabajar en TypeScript con `tsconfig.json` en `strict` mode (requerido).
- No introducir "any" salvo en casos puntuales y explícitamente comentados (usar `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- explicación razonada`).
- Antes de abrir PR ejecutar en local (y en CI): typecheck, lint, test y build.
- No introducir console.log en código de producción; usar logger centralizado (Winston o el logger de NestJS).
- Todas las funciones públicas deben tener tipos de entrada y salida explícitos.
- Preferir funciones puras y evitar side-effects donde sea posible.
- Seguir convenciones de nomenclatura (ver sección 3).

---

## 2) TypeScript: convenciones y ejemplos
- tsconfig recomendado (resumen):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "incremental": true
  }
}
```

- Reglas prácticas:
  - Preferir `interface` para shapes públicas y `type` para uniones y utilitarios.
  - Usar tipos genéricos con nombres claros: `T`, `U` solo en utilitarios; `TEntity`, `TDTO` en contextos de dominio.
  - Evitar `as any` y `// @ts-ignore` a menos que sea imprescindible y documentado.

Ejemplo correcto vs incorrecto (función de servicio):

Incorrecto:

```ts
// Incorrecto: sin tipos explícitos, uso de any
async function getUser(id) {
  const user: any = await repo.findOne(id)
  return user
}
```

Correcto:

```ts
// Correcto: tipos explícitos
async function getUser(id: number): Promise<UserEntity | null> {
  const user = await repo.findOne({ where: { id } })
  return user ?? null
}
```

---

## 3) ESLint / Linting / Formato
- Configuración mínima sugerida:
  - ESLint con parser `@typescript-eslint/parser` y plugin `@typescript-eslint`.
  - Reglas: `no-unused-vars`, `@typescript-eslint/no-explicit-any` (error), `@typescript-eslint/explicit-function-return-type` (en librerías compartidas), `no-console` (warn/error según entorno).
  - Integrar Prettier para formateo y `eslint-config-prettier` para evitar conflictos.
- Pre-commit hooks: Husky + lint-staged para correr lint y tests rápidos.

Snippet básico .eslintrc.json:

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

Ejemplo correcto vs incorrecto (lintable):

Incorrecto:

```ts
// uso de any y variable sin usar
const x: any = fetchSomething()
function foo() {
  const unused = 1
}
```

Correcto:

```ts
const x = await fetchSomething() // tipado inferido o explícito
function foo(): void {
  // argumento descartado con prefijo _ si no se usa
}
```

---

## 4) Estructura de código y organización de módulos
- Backend (NestJS): módulos por dominio (`auth`, `users`, `groups`, `actions`, `reservas`, `rooms`), cada módulo con controller, service, dto, entity, repository.
- Archivos: usar kebab-case para nombres de archivo (`users.controller.ts`, `create-user.dto.ts`). Clases en PascalCase.
- Imports: usar alias `@/modules/...` o `@/common/...` via `tsconfig.paths`; evitar imports relativos largos.
- Exports: prefer `export class` y `export interface`; evitar `default export` en TypeScript para consistencia.

Ejemplo:
```
src/modules/users/
  users.module.ts
  users.controller.ts
  users.service.ts
  dto/create-user.dto.ts
  entities/user.entity.ts
```

---

## 5) Patrones de diseño (cuándo y cómo usarlos)
- Siempre comentar el patrón cuando se aplique (línea de comentario al inicio de la clase/archivo), p. ej. `// Patrón: Repository — permite encapsular acceso a datos`.
- Principales patrones recomendados:
  - Repository (Domain persistence) — para encapsular lógica DB (TypeORM repositories / custom repos).
  - Factory — para creación compleja de objetos (ej.: construcción de DTOs/ValueObjects).
  - Strategy — para variar algoritmos (ej.: distintos métodos de cálculo de cargos, diferentes gateways de pago).
  - Adapter — para integrar servicios externos (mailer, gateways de pago) adaptando su interfaz a la aplicación.
  - Decorator — para añadir comportamiento a objetos en runtime (ej.: logging, caching) — usar con prudencia.
  - Singleton (con cuidado) — para recursos compartidos (ej.: instancia de configuración). En NestJS preferir providers con scope `DEFAULT`.
  - Command / CQRS — para flujos complejos y separación de comandos/queries; considerar `@nestjs/cqrs` si la escala lo justifica.

Ejemplo (Repository pattern):

```ts
// Patrón: Repository — encapsula acceso a UserEntity
export class UserRepository {
  constructor(private dataSource: DataSource) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.dataSource.getRepository(UserEntity).findOne({ where: { email } })
  }
}
```

Explicar por qué: mejora testabilidad, encapsula queries complejas y evita fuga de detalles de la infraestructura al dominio.

---

## 6) Comentarios y documentación
- Comentarios deben explicar "por qué" no "qué" (el "qué" debe ser legible en el código).
- Para cada clase/función pública usar TSDoc/JSDoc con `@param`, `@returns` y ejemplos cuando sea útil.

Ejemplo:

```ts
/**
 * Busca usuario activo por email.
 * @param email - Email del usuario
 * @returns UserEntity | null
 */
async function findActiveByEmail(email: string): Promise<UserEntity | null> {
  // ...
}
```

- Documentar patrones usados en la cabecera del archivo:
  - `// Patrón: Strategy — se usa para permitir múltiples implementaciones de cobro`.

---

## 7) Manejo de errores y excepciones
- Nunca silenciar errores.
- Usar tipos de error (custom errors) y mapear a códigos HTTP en los controladores (NestJS `HttpException` y filtros globales).
- No devolver mensajes con detalles internos (stack trace) a clientes; logs internos sí.
- Flow recomendado:
  1. Validación en DTO (Zod / class-validator).  
  2. Service lanza Error/DomainError.  
  3. Controller captura con filtro global o deja que filtro lance `HttpException` adecuado.

Ejemplo de custom error:

```ts
export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

// En controller (NestJS)
try {
  const user = await this.usersService.find(id)
  if (!user) throw new NotFoundError('User not found')
} catch (err) {
  if (err instanceof NotFoundError) throw new NotFoundException(err.message)
  throw err // dejar manejar por filtro global
}
```

- Logs: auditar eventos sensibles (login, cambios de permisos, ABM de seguridad).

---

## 7.1) Estructura estándar de respuestas API

### Principios generales
- Todas las respuestas de la API deben seguir una estructura consistente y predecible.
- Usar códigos HTTP apropiados (2xx éxito, 4xx error cliente, 5xx error servidor).
- Incluir metadata útil (timestamps, request ID para trazabilidad).
- Diferenciar claramente entre respuestas de éxito y error.

---

### Respuestas de éxito

#### Operación exitosa con datos (GET, POST, PATCH)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@hotel.com",
    "createdAt": "2025-10-30T12:34:56.789Z"
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**Códigos HTTP**: 200 (GET, PATCH), 201 (POST creación)

#### Operación exitosa con lista de datos

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Usuario 1" },
    { "id": 2, "name": "Usuario 2" }
  ],
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz",
    "total": 2
  }
}
```

#### Operación exitosa con paginación

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

#### Operación exitosa sin contenido (DELETE, logout)

```json
{
  "success": true,
  "message": "User deleted successfully",
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**Código HTTP**: 200 o 204 (No Content - sin body)

---

### Respuestas de error

#### Estructura general de error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      {
        "field": "password",
        "message": "Password must be at least 10 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

#### Códigos de error estándar

| Código HTTP | Error Code | Descripción |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 400 | `BAD_REQUEST` | Solicitud malformada |
| 401 | `UNAUTHORIZED` | No autenticado (falta token o token inválido) |
| 401 | `TOKEN_EXPIRED` | Token expirado |
| 403 | `FORBIDDEN` | Sin permisos para esta acción |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 409 | `CONFLICT` | Conflicto (ej: email ya existe) |
| 422 | `UNPROCESSABLE_ENTITY` | Datos válidos pero no procesables |
| 429 | `RATE_LIMIT_EXCEEDED` | Demasiadas solicitudes |
| 500 | `INTERNAL_SERVER_ERROR` | Error interno del servidor |
| 503 | `SERVICE_UNAVAILABLE` | Servicio temporalmente no disponible |

#### Ejemplos de errores específicos

**Error de validación (400)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "username",
        "message": "Username must be at least 3 characters",
        "constraint": "minLength",
        "value": "ab"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**Error de autenticación (401)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**Error de permisos (403)**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action",
    "requiredPermissions": ["config.usuarios.crear"]
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**Error de recurso no encontrado (404)**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User with id 999 not found",
    "resource": "User",
    "resourceId": 999
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**Error de conflicto (409)**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "User with email admin@hotel.com already exists",
    "conflictField": "email",
    "conflictValue": "admin@hotel.com"
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**Error interno (500)**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "errorId": "err_abc123xyz"
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

**IMPORTANTE**: En errores 500, NO incluir stack traces ni detalles internos en producción. Logear internamente con el `errorId` para trazabilidad.

---

### Reglas de implementación en NestJS

#### 1. Crear interceptor para respuestas de éxito

```typescript
// src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: PaginationMeta;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || uuidv4();

    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      })),
    );
  }
}
```

#### 2. Crear filtro de excepciones global

```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errorCode = (exceptionResponse as any).error || errorCode;
        details = (exceptionResponse as any).details;
      } else {
        message = exceptionResponse as string;
      }
    }

    // Log error internamente (NO enviar al cliente en prod)
    console.error(`[${requestId}] Error:`, exception);

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
        ...(status === 500 && { errorId: uuidv4() }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  }
}
```

#### 3. Aplicar globalmente en main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aplicar interceptor y filtro globalmente
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
bootstrap();
```

#### 4. Uso en controladores

```typescript
// Ejemplo: controller devuelve datos directamente
@Get(':id')
async findOne(@Param('id') id: number) {
  // El interceptor envolverá automáticamente en la estructura estándar
  return await this.usersService.findOne(id);
}

// Ejemplo: con paginación
@Get()
async findAll(@Query() query: PaginationDto) {
  const result = await this.usersService.findAll(query);

  // Devolver con estructura de paginación
  return {
    data: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
      hasNextPage: result.page < Math.ceil(result.total / result.limit),
      hasPreviousPage: result.page > 1,
    },
  };
}

// Ejemplo: lanzar error con detalles
@Post()
async create(@Body() dto: CreateUserDto) {
  const exists = await this.usersService.findByEmail(dto.email);

  if (exists) {
    throw new ConflictException({
      error: 'CONFLICT',
      message: `User with email ${dto.email} already exists`,
      conflictField: 'email',
      conflictValue: dto.email,
    });
  }

  return await this.usersService.create(dto);
}
```

---

### Casos especiales

#### Lista vacía
```json
{
  "success": true,
  "data": [],
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz",
    "total": 0
  }
}
```

#### Operación parcialmente exitosa (bulk operations)
```json
{
  "success": true,
  "data": {
    "processed": 10,
    "succeeded": 8,
    "failed": 2,
    "errors": [
      {
        "index": 3,
        "id": "user_123",
        "error": "Email already exists"
      },
      {
        "index": 7,
        "id": "user_456",
        "error": "Invalid data"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-30T12:34:57.000Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

## 8) Validación de datos (Zod + DTOs)
- Backend (NestJS): validar DTOs con `class-validator` o usar `nestjs-zod` para Zod integration.
- Frontend: validar con Zod + `react-hook-form` resolvers.

Ejemplo Zod (shared schema):

```ts
import { z } from 'zod'

export const CreateUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(10)
})

export type CreateUserDto = z.infer<typeof CreateUserSchema>
```

- Mantener un único origen de verdad para shapes (si es posible compartir schemas entre frontend y backend usar generación/paquetes compartidos o generar clientes a partir de OpenAPI/Zod).

---

## 9) Testing y cobertura
- Tests:
  - Unit: Jest (backend), Vitest (frontend)
  - Integration: Supertest para endpoints (backend)
  - E2E: Playwright (opcional)
- Cobertura:
  - Objetivo mínimo: 80% en módulos críticos (auth, payments, reservas)
- Buenas prácticas:
  - Tests determinísticos (evitar tiempos reales y dependencias externas; mockear servicios externos con MSW o doubles)
  - Usar factories/fixtures para datos de test
  - En tests, cubrir happy path y 2-3 edge cases

Ejemplo de test unitario (Jest):

```ts
it('should return null when user not found', async () => {
  jest.spyOn(repo, 'findOne').mockResolvedValue(null)
  const result = await service.getUser(999)
  expect(result).toBeNull()
})
```

---

## 10) Git, commits y versionado
- Commits: usar Conventional Commits (feat, fix, chore, docs, refactor, test)
- PR: incluir descripción, captura de pruebas locales y checklist de QA
- Branches: `main` (prod), `develop` (integración), feature branches `feature/<descripcion>`
- Releases: semver (MAJOR.MINOR.PATCH)
- Tags: usar `vX.Y.Z` y changelog automatizado (release-drafter o GitHub releases)

---

## 11) Performance y optimización
- Backend:
  - Evitar N+1 queries con `relations` selectivas o QueryBuilder en TypeORM.
  - Paginación con `skip`/`take` o cursores.
  - Indices en columnas buscadas frecuentemente (email, createdAt, etc.).
  - Caching selectivo con Redis para read-heavy endpoints (cache key naming: `model:by:id`).
  - Usar query streaming para grandes dumps (pg-query-stream + TypeORM raw queries).
- Frontend:
  - Suspense/React.lazy para carga de rutas.
  - Memoización (useMemo/useCallback) únicamente cuando hay pruebas de bottleneck.
  - Evitar re-renders masivos: claves estables y key props.

---

## 12) Seguridad
- Passwords: Argon2id con parámetros configurables y re-hashing.
- Tokens: access 15m / refresh 7-30d / jti / rotation / blacklist en Redis.
- Rate limiting: `@nestjs/throttler` en endpoints sensibles (`/auth/*`).
- Sanitización de inputs y protección contra SQLi (usar QueryBuilder y parámetros)
- CORS restrictivo, Helmet, content security policy.
- No almacenar información sensible en logs (PII). Enmascarar o truncar.
- Auditoría: `audit_log` con userId, action, ip, userAgent y metadata.

---

## 13) Accesibilidad (frontend)
- Seguir WCAG 2.1 AA como mínimo.
- Componentes accesibles: roles ARIA, focus management, contrast ratio, labels for inputs.
- Usar Radix UI/Headless UI para componentes accesibles y personalizables.
- Tests de accesibilidad automatizados (axe-core) en componentes críticos.

Ejemplo (input con label accesible):

```tsx
<label htmlFor="email">Email</label>
<input id="email" name="email" type="email" aria-required="true" />
```

---

## 14) Checklist e integración CI (comandos)
- Comandos locales / CI (ejecutar en este orden):

```bash
# instalar dependencias
npm ci

# typecheck
npm run typecheck # (tsc --noEmit)

# lint
npm run lint

# tests unitarios
npm run test:ci

# build
npm run build
```

- En CI, detener pipeline si cualquiera falla.
- Opcional: tarea extra para `npm run test:e2e` en entorno con docker-compose.

---

## 15) Ejemplos concretos adicionales
- Evitar business logic en controllers; controllers deben delegar a services.

Incorrecto (controller con lógica):

```ts
@Post()
async create(@Body() dto: CreateDto) {
  // lógica compleja aquí -> NO
  const exists = await this.repo.findOne({ where: { email: dto.email } })
  if (exists) throw new BadRequestException('exists')
  // creación
}
```

Correcto:

```ts
@Post()
async create(@Body() dto: CreateDto) {
  return this.usersService.create(dto)
}

// users.service.ts
async create(dto: CreateDto) {
  const exists = await this.userRepo.findByEmail(dto.email)
  if (exists) throw new BadRequestException('exists')
  // creación
}
```

- Documentar patrón usado:
  - `// Patrón: Service Layer — centraliza reglas de negocio y orquesta repositorios`.

---

## 16) Documentar el porqué de las decisiones
- Cada decisión técnica importante debe registrarse en el PR o en `docs/decisiones/` con:
  - Problema a resolver
  - Opciones consideradas
  - Decisión tomada y justificación

---

## 17) Reglas para la IA que genera código
Cuando la IA genere código para este repo debe seguir estrictamente:
1. Ejecutar y pasar `tsc --noEmit` mentalmente: no generar código que introduzca errores de tipado.
2. Generar código que pase ESLint (usar reglas definidas). Si un rule se rompe, corregirlo en la misma iteración.
3. Si se aplica un patrón de diseño, incluir un comentario al inicio: `// Patrón: <Nombre> — <justificación breve>`.
4. Comentarios: explicar decisiones complejas; evitar comentarios triviales.
5. Tests: por cada cambio no trivial, generar tests unitarios para el happy path y al menos 1 caso de error.
6. No introducir secretos (keys, passwords); usar variables de entorno.
7. Si se crean migraciones, incluir `down()` reversibles y documentar el efecto en la DB.
8. En endpoints nuevos, incluir validación DTO y especificación mínima Swagger.
9. Evitar cambios masivos sin PR y sin documentación; preferir cambios incrementales y revisables.

---

## 18) Recursos y enlaces rápidos
- NestJS docs: https://docs.nestjs.com
- TypeORM docs: https://typeorm.io
- Zod docs: https://zod.dev
- React docs: https://react.dev
- Tailwind docs: https://tailwindcss.com
- ESLint + TypeScript: https://typescript-eslint.io

---

## 19) Resumen / cierre
Seguir estas prácticas asegurará que el código generado sea consistente, tipado, lint-free y apto para producción. La IA debe comportarse como un desarrollador senior: justificar patrones, cubrir con tests y respetar la arquitectura y políticas de seguridad del proyecto.


---

Si quieres, procedo a:
- Añadir ejemplos adicionales por cada patrón.
- Generar el `.eslintrc.json` y `tsconfig.json` completos en el repo.
- Crear plantillas de PR y checklist de revisión.

Dime cuál de estos pasos quieres que complete ahora.