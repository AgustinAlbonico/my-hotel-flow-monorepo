# Clean Architecture - Definición del Sistema

## Índice
1. [Introducción](#introducción)
2. [Principios de Clean Architecture](#principios-de-clean-architecture)
3. [Capas de la Arquitectura](#capas-de-la-arquitectura)
4. [Estructura de Directorios Propuesta](#estructura-de-directorios-propuesta)
5. [Flujo de Dependencias](#flujo-de-dependencias)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Patrones y Convenciones](#patrones-y-convenciones)

---

## Introducción

Este documento define la arquitectura limpia que se implementará en el backend de MyHotelFlow. El objetivo es lograr un sistema:

- **Independiente de frameworks**: La lógica de negocio no debe depender de NestJS, TypeORM u otros frameworks
- **Testeable**: Las reglas de negocio pueden probarse sin UI, BD, servidor web o elementos externos
- **Independiente de la UI**: La UI puede cambiar sin afectar el sistema
- **Independiente de la base de datos**: Podemos cambiar de PostgreSQL a MySQL u otra BD
- **Independiente de agentes externos**: Las reglas de negocio no saben nada sobre el mundo exterior

---

## Principios de Clean Architecture

### 1. Regla de Dependencia
**Las dependencias siempre apuntan hacia adentro (hacia el dominio)**

```
Presentación → Aplicación → Dominio
     ↓              ↓           ↑
Infraestructura ────────────────┘
```

- El dominio NO conoce nada de las capas externas
- La capa de aplicación solo conoce el dominio
- La infraestructura implementa interfaces definidas en el dominio
- La presentación orquesta la aplicación y maneja HTTP

### 2. Inversión de Dependencias (Dependency Inversion)
- Las capas externas implementan interfaces definidas en capas internas
- Ejemplo: `UserRepository` (interfaz en dominio) ← `TypeOrmUserRepository` (implementación en infraestructura)

### 3. Separación de Responsabilidades
- Cada capa tiene una responsabilidad única y bien definida
- No mezclar lógica de negocio con detalles de infraestructura

---

## Capas de la Arquitectura

### 1. Capa de Dominio (Domain Layer)
**Ubicación**: `src/domain/`

**Responsabilidad**: Contiene la lógica de negocio pura y las reglas del dominio.

**Contenido**:
- **Entidades**: Objetos de negocio con identidad (User, Group, Action)
- **Value Objects**: Objetos inmutables sin identidad (Email, Password, ActionKey)
- **Interfaces de Repositorio**: Contratos que define el dominio (IUserRepository, IGroupRepository)
- **Interfaces de Servicios**: Contratos para servicios externos (IHashService, IEmailService)
- **Excepciones de Dominio**: Errores específicos del negocio (UserAlreadyExistsException)
- **Enums y Constantes**: Valores del dominio (UserRole, ActionType)

**Reglas**:
- ❌ NO puede importar nada de otras capas
- ❌ NO depende de TypeORM, NestJS u otros frameworks
- ✅ Solo usa TypeScript puro y lógica de negocio
- ✅ Puede contener lógica de validación y cálculos de negocio

**Ejemplo de Estructura**:
```
src/domain/
├── entities/
│   ├── user.entity.ts          # Clase User con lógica de negocio
│   ├── group.entity.ts
│   └── action.entity.ts
├── value-objects/
│   ├── email.vo.ts             # Email con validación
│   ├── password.vo.ts
│   └── action-key.vo.ts
├── repositories/
│   ├── user.repository.interface.ts
│   ├── group.repository.interface.ts
│   └── action.repository.interface.ts
├── services/
│   ├── hash.service.interface.ts
│   ├── email.service.interface.ts
│   └── token.service.interface.ts
├── exceptions/
│   ├── user-already-exists.exception.ts
│   ├── user-locked.exception.ts
│   └── invalid-credentials.exception.ts
└── enums/
    ├── user-role.enum.ts
    └── action-type.enum.ts
```

---

### 2. Capa de Aplicación (Application Layer / Use Cases)
**Ubicación**: `src/application/`

**Responsabilidad**: Orquesta el flujo de datos hacia y desde las entidades. Implementa los casos de uso del sistema.

**Contenido**:
- **Use Cases**: Cada caso de uso es una operación completa del sistema
  - `CreateUserUseCase`
  - `LoginUseCase`
  - `AssignGroupsToUserUseCase`
- **DTOs de Entrada/Salida**: Objetos de transferencia de datos para los casos de uso
- **Interfaces de Casos de Uso**: Contratos para los casos de uso

**Reglas**:
- ✅ Puede importar del dominio
- ❌ NO conoce detalles de HTTP, controllers, o frameworks de presentación
- ❌ NO conoce detalles de base de datos o infraestructura
- ✅ Usa interfaces de repositorio definidas en el dominio
- ✅ Contiene lógica de aplicación (no de negocio puro)

**Características de un Use Case**:
1. Recibe DTOs de entrada
2. Valida datos de entrada (validación de aplicación, no de negocio)
3. Llama a repositorios a través de interfaces
4. Ejecuta lógica de orquestación
5. Devuelve DTOs de salida
6. Maneja transacciones si es necesario

**Ejemplo de Estructura**:
```
src/application/
├── use-cases/
│   ├── user/
│   │   ├── create-user.use-case.ts
│   │   ├── update-user.use-case.ts
│   │   ├── delete-user.use-case.ts
│   │   ├── find-user.use-case.ts
│   │   ├── list-users.use-case.ts
│   │   ├── assign-groups.use-case.ts
│   │   └── reset-password.use-case.ts
│   ├── auth/
│   │   ├── login.use-case.ts
│   │   ├── logout.use-case.ts
│   │   ├── refresh-token.use-case.ts
│   │   ├── change-password.use-case.ts
│   │   ├── request-password-recovery.use-case.ts
│   │   └── confirm-password-recovery.use-case.ts
│   ├── group/
│   │   ├── create-group.use-case.ts
│   │   ├── assign-actions.use-case.ts
│   │   └── set-children-groups.use-case.ts
│   └── action/
│       ├── create-action.use-case.ts
│       └── list-actions.use-case.ts
└── dtos/
    ├── user/
    │   ├── create-user.dto.ts
    │   ├── update-user.dto.ts
    │   └── user-response.dto.ts
    ├── auth/
    │   ├── login.dto.ts
    │   └── auth-tokens.dto.ts
    └── common/
        └── pagination.dto.ts
```

---

### 3. Capa de Infraestructura (Infrastructure Layer)
**Ubicación**: `src/infrastructure/`

**Responsabilidad**: Implementa los detalles técnicos y herramientas externas. Provee implementaciones concretas de las interfaces definidas en el dominio.

**Contenido**:
- **Repositorios**: Implementaciones concretas usando TypeORM
- **Servicios Externos**: Implementaciones de servicios
  - Hash (Argon2)
  - JWT/Tokens
  - Email
  - Cache (Redis)
- **Persistencia**: Configuración de base de datos, entidades ORM, migraciones
- **Adaptadores**: Conectores a servicios externos

**Reglas**:
- ✅ Puede importar del dominio (para implementar interfaces)
- ✅ Puede importar de aplicación (para algunos servicios)
- ✅ Aquí viven TypeORM, bibliotecas externas, APIs
- ❌ NO contiene lógica de negocio
- ✅ Implementa las interfaces del dominio

**Ejemplo de Estructura**:
```
src/infrastructure/
├── persistence/
│   ├── typeorm/
│   │   ├── config/
│   │   │   ├── typeorm.config.ts
│   │   │   └── data-source.ts
│   │   ├── entities/
│   │   │   ├── user.orm-entity.ts      # Entidad TypeORM (separada del dominio)
│   │   │   ├── group.orm-entity.ts
│   │   │   └── action.orm-entity.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.impl.ts  # Implementa IUserRepository
│   │   │   ├── group.repository.impl.ts
│   │   │   └── action.repository.impl.ts
│   │   ├── mappers/
│   │   │   ├── user.mapper.ts          # Convierte ORM ↔ Dominio
│   │   │   ├── group.mapper.ts
│   │   │   └── action.mapper.ts
│   │   └── migrations/
│   │       └── 1700000000000-CreateSecurityTables.ts
│   └── cache/
│       ├── redis.service.ts
│       └── cache.repository.impl.ts
├── security/
│   ├── hash.service.impl.ts            # Implementa IHashService
│   ├── token.service.impl.ts           # Implementa ITokenService
│   └── encryption.service.impl.ts
├── notifications/
│   └── email.service.impl.ts           # Implementa IEmailService
└── external/
    └── third-party-api.adapter.ts
```

---

### 4. Capa de Presentación (Presentation Layer)
**Ubicación**: `src/presentation/`

**Responsabilidad**: Maneja la comunicación con el mundo exterior (HTTP, WebSockets, CLI, etc.). Adapta las peticiones externas a casos de uso.

**Contenido**:
- **Controllers**: Endpoints HTTP que delegan a casos de uso
- **DTOs de API**: Objetos específicos de la API REST
- **Guards**: Autenticación y autorización
- **Interceptors**: Transformación de respuestas
- **Filters**: Manejo de excepciones
- **Decorators**: Decoradores personalizados de NestJS
- **Validators**: Validación de entrada usando class-validator

**Reglas**:
- ✅ Puede importar de aplicación (casos de uso)
- ✅ Puede importar del dominio (para excepciones y enums)
- ✅ Aquí vive todo lo relacionado con NestJS controllers
- ❌ NO contiene lógica de negocio
- ❌ NO accede directamente a repositorios
- ✅ Delega toda la lógica a casos de uso

**Ejemplo de Estructura**:
```
src/presentation/
├── controllers/
│   ├── user.controller.ts
│   ├── auth.controller.ts
│   ├── group.controller.ts
│   ├── action.controller.ts
│   └── health.controller.ts
├── dtos/
│   ├── user/
│   │   ├── create-user-request.dto.ts  # Con validadores
│   │   ├── update-user-request.dto.ts
│   │   └── user-list-query.dto.ts
│   └── auth/
│       ├── login-request.dto.ts
│       └── change-password-request.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── actions.guard.ts
├── interceptors/
│   ├── transform.interceptor.ts
│   └── logging.interceptor.ts
├── filters/
│   └── domain-exception.filter.ts
├── decorators/
│   ├── current-user.decorator.ts
│   ├── actions.decorator.ts
│   └── public.decorator.ts
└── mappers/
    ├── user-response.mapper.ts         # Convierte dominio → API response
    └── auth-response.mapper.ts
```

---

## Estructura de Directorios Propuesta

```
backend/
├── src/
│   ├── domain/                         # ← CAPA 1: Dominio (núcleo)
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── exceptions/
│   │   └── enums/
│   │
│   ├── application/                    # ← CAPA 2: Casos de uso
│   │   ├── use-cases/
│   │   │   ├── user/
│   │   │   ├── auth/
│   │   │   ├── group/
│   │   │   └── action/
│   │   └── dtos/
│   │
│   ├── infrastructure/                 # ← CAPA 3: Implementaciones técnicas
│   │   ├── persistence/
│   │   │   ├── typeorm/
│   │   │   └── cache/
│   │   ├── security/
│   │   ├── notifications/
│   │   └── external/
│   │
│   ├── presentation/                   # ← CAPA 4: API/Controllers
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── decorators/
│   │   └── mappers/
│   │
│   ├── shared/                         # ← Utilidades compartidas
│   │   ├── logger/
│   │   ├── config/
│   │   └── utils/
│   │
│   ├── app.module.ts                   # Módulo principal de NestJS
│   └── main.ts                         # Bootstrap
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── docs/
    ├── CLEAN_ARCHITECTURE_DEFINITION.md    # Este archivo
    └── MIGRATION_PLAN.md                   # Plan de migración
```

---

## Flujo de Dependencias

### Flujo de una Petición (Ejemplo: Crear Usuario)

```
1. HTTP POST /users
   ↓
2. UserController (Presentación)
   - Valida CreateUserRequestDto
   - Extrae datos de la petición
   ↓
3. CreateUserUseCase (Aplicación)
   - Recibe CreateUserDto
   - Verifica reglas de aplicación
   - Llama a IUserRepository.findByEmail()
   - Si no existe, crea User entity
   - Llama a IUserRepository.save()
   ↓
4. TypeOrmUserRepository (Infraestructura)
   - Implementa IUserRepository
   - Convierte User entity → UserOrmEntity
   - Usa TypeORM para persistir
   - Convierte UserOrmEntity → User entity
   ↓
5. Respuesta
   - Retorna User entity a UseCase
   - UseCase retorna UserResponseDto
   - Controller convierte a HTTP response
   - Cliente recibe JSON
```

### Diagrama de Dependencias

```
┌─────────────────────────────────────────────────────────┐
│                     Presentación                        │
│  (Controllers, DTOs, Guards, Interceptors)              │
│                          │                               │
│                          ↓ usa                          │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      Aplicación                         │
│            (Use Cases, Application DTOs)                │
│                          │                               │
│                          ↓ usa                          │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                       Dominio                           │
│  (Entities, VOs, Interfaces, Exceptions, Enums)        │
│                          ↑                               │
│                          │ implementa                   │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Infraestructura                       │
│  (TypeORM, Argon2, JWT, Redis, Email, etc.)            │
└─────────────────────────────────────────────────────────┘
```

**Las flechas indican la dirección de las dependencias: todas apuntan hacia el dominio**

---

## Ejemplos Prácticos

### Ejemplo 1: Entidad de Dominio (User)

```typescript
// src/domain/entities/user.entity.ts

import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserRole } from '../enums/user-role.enum';
import { Group } from './group.entity';
import { Action } from './action.entity';

export class User {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly email: Email,
    private passwordHash: string,
    public fullName?: string,
    public role: UserRole = UserRole.CLIENT,
    public isActive: boolean = true,
    public groups: Group[] = [],
    public actions: Action[] = [],
    public lastLoginAt?: Date,
    public failedLoginAttempts: number = 0,
    public lockedUntil?: Date,
  ) {}

  // Lógica de negocio: ¿Está bloqueado?
  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  // Lógica de negocio: Incrementar intentos fallidos
  incrementFailedAttempts(lockoutThreshold: number, lockoutDuration: number): void {
    this.failedLoginAttempts++;
    if (this.failedLoginAttempts >= lockoutThreshold) {
      this.lockedUntil = new Date(Date.now() + lockoutDuration);
    }
  }

  // Lógica de negocio: Resetear intentos fallidos
  resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = undefined;
    this.lastLoginAt = new Date();
  }

  // Lógica de negocio: Obtener acciones efectivas (propias + de grupos)
  getEffectiveActions(): Set<string> {
    const actionKeys = new Set<string>();

    // Acciones propias
    this.actions.forEach(action => actionKeys.add(action.key));

    // Acciones de grupos (incluyendo hijos recursivamente)
    this.groups.forEach(group => {
      const groupActions = group.getAllActions();
      groupActions.forEach(action => actionKeys.add(action.key));
    });

    return actionKeys;
  }

  // Lógica de negocio: ¿Puede realizar esta acción?
  canPerformAction(actionKey: string): boolean {
    if (!this.isActive) return false;
    if (this.isLocked()) return false;

    const effectiveActions = this.getEffectiveActions();
    return effectiveActions.has(actionKey);
  }
}
```

### Ejemplo 2: Interfaz de Repositorio (Dominio)

```typescript
// src/domain/repositories/user.repository.interface.ts

import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAll(options: FindUsersOptions): Promise<PaginatedResult<User>>;
  save(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  exists(email: Email): Promise<boolean>;
}

export interface FindUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

### Ejemplo 3: Caso de Uso (Aplicación)

```typescript
// src/application/use-cases/user/create-user.use-case.ts

import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IHashService } from '../../../domain/services/hash.service.interface';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserAlreadyExistsException } from '../../../domain/exceptions/user-already-exists.exception';
import { CreateUserDto } from '../../dtos/user/create-user.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hashService: IHashService,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // 1. Validar que no exista el usuario
    const email = new Email(dto.email);
    const existsByEmail = await this.userRepository.exists(email);

    if (existsByEmail) {
      throw new UserAlreadyExistsException('Email already exists');
    }

    const existingByUsername = await this.userRepository.findByUsername(dto.username);
    if (existingByUsername) {
      throw new UserAlreadyExistsException('Username already exists');
    }

    // 2. Hashear contraseña
    const passwordHash = await this.hashService.hash(dto.password);

    // 3. Crear entidad de dominio
    const user = new User(
      0, // ID temporal, será asignado por el repositorio
      dto.username,
      email,
      passwordHash,
      dto.fullName,
      dto.role,
      dto.isActive ?? true,
    );

    // 4. Persistir
    const savedUser = await this.userRepository.save(user);

    // 5. Retornar DTO de respuesta
    return this.mapToResponse(savedUser);
  }

  private mapToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

### Ejemplo 4: Implementación de Repositorio (Infraestructura)

```typescript
// src/infrastructure/persistence/typeorm/repositories/user.repository.impl.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IUserRepository, FindUsersOptions, PaginatedResult } from '../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../domain/entities/user.entity';
import { Email } from '../../../../domain/value-objects/email.vo';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
    private readonly mapper: UserMapper,
  ) {}

  async findById(id: number): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
      relations: ['groups', 'actions'],
    });

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { email: email.value },
      relations: ['groups', 'actions'],
    });

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { username },
      relations: ['groups', 'actions'],
    });

    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findAll(options: FindUsersOptions): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, search, role, isActive } = options;
    const skip = (page - 1) * limit;

    // Construir query
    const queryBuilder = this.ormRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.groups', 'groups')
      .leftJoinAndSelect('user.actions', 'actions');

    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.fullName LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [ormEntities, total] = await queryBuilder.getManyAndCount();

    const data = ormEntities.map(entity => this.mapper.toDomain(entity));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async save(user: User): Promise<User> {
    const ormEntity = this.mapper.toOrm(user);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async exists(email: Email): Promise<boolean> {
    const count = await this.ormRepository.count({
      where: { email: email.value },
    });
    return count > 0;
  }
}
```

### Ejemplo 5: Controller (Presentación)

```typescript
// src/presentation/controllers/user.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/user/create-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/user/delete-user.use-case';
import { FindUserUseCase } from '../../application/use-cases/user/find-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/user/list-users.use-case';
import { CreateUserRequestDto } from '../dtos/user/create-user-request.dto';
import { UpdateUserRequestDto } from '../dtos/user/update-user-request.dto';
import { UserListQueryDto } from '../dtos/user/user-list-query.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { RequireActions } from '../decorators/actions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ) {}

  @Post()
  @RequireActions('users.create')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserRequestDto) {
    return await this.createUserUseCase.execute({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role,
      isActive: dto.isActive,
    });
  }

  @Get()
  @RequireActions('users.list')
  @ApiOperation({ summary: 'List all users with pagination' })
  async findAll(@Query() query: UserListQueryDto) {
    return await this.listUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      isActive: query.isActive,
    });
  }

  @Get(':id')
  @RequireActions('users.read')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.findUserUseCase.execute(id);
  }

  @Patch(':id')
  @RequireActions('users.update')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRequestDto,
  ) {
    return await this.updateUserUseCase.execute(id, dto);
  }

  @Delete(':id')
  @RequireActions('users.delete')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteUserUseCase.execute(id);
    return { message: 'User deleted successfully' };
  }
}
```

---

## Patrones y Convenciones

### 1. Naming Conventions

#### Entidades de Dominio
- **Archivo**: `user.entity.ts`
- **Clase**: `User` (sin sufijo Entity en el nombre de la clase)
- **Ubicación**: `src/domain/entities/`

#### Entidades ORM
- **Archivo**: `user.orm-entity.ts`
- **Clase**: `UserOrmEntity`
- **Ubicación**: `src/infrastructure/persistence/typeorm/entities/`

#### Repositorios
- **Interfaz**: `user.repository.interface.ts` → `IUserRepository`
- **Implementación**: `user.repository.impl.ts` → `TypeOrmUserRepository`

#### Use Cases
- **Archivo**: `create-user.use-case.ts`
- **Clase**: `CreateUserUseCase`
- **Método principal**: `execute()`

#### Value Objects
- **Archivo**: `email.vo.ts`
- **Clase**: `Email`

#### Excepciones de Dominio
- **Archivo**: `user-already-exists.exception.ts`
- **Clase**: `UserAlreadyExistsException`

### 2. Inyección de Dependencias

Usar interfaces en constructores (Dependency Inversion):

```typescript
// ✅ CORRECTO
constructor(
  private readonly userRepository: IUserRepository,
  private readonly hashService: IHashService,
) {}

// ❌ INCORRECTO
constructor(
  private readonly userRepository: TypeOrmUserRepository,
  private readonly hashService: Argon2HashService,
) {}
```

### 3. Mappers

Los mappers convierten entre capas:

```typescript
// Infrastructure Mapper: ORM ↔ Domain
export class UserMapper {
  toDomain(ormEntity: UserOrmEntity): User { ... }
  toOrm(domainEntity: User): UserOrmEntity { ... }
}

// Presentation Mapper: Domain ↔ API Response
export class UserResponseMapper {
  toResponse(domainEntity: User): UserApiResponse { ... }
}
```

### 4. Manejo de Excepciones

#### Excepciones de Dominio
```typescript
// src/domain/exceptions/user-already-exists.exception.ts
export class UserAlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserAlreadyExistsException';
  }
}
```

#### Exception Filter (Presentación)
```typescript
// src/presentation/filters/domain-exception.filter.ts
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof UserAlreadyExistsException) {
      return response.status(409).json({
        statusCode: 409,
        message: exception.message,
        error: 'Conflict',
      });
    }
    // ... otros casos
  }
}
```

### 5. Módulos de NestJS

Cada capa tiene sus propios módulos:

```typescript
// src/domain/domain.module.ts
@Module({
  providers: [
    // Aquí NO hay providers, el dominio es código puro
  ],
  exports: [],
})
export class DomainModule {}

// src/application/application.module.ts
@Module({
  providers: [
    CreateUserUseCase,
    UpdateUserUseCase,
    // ... otros use cases
  ],
  exports: [
    CreateUserUseCase,
    UpdateUserUseCase,
  ],
})
export class ApplicationModule {}

// src/infrastructure/infrastructure.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, GroupOrmEntity, ActionOrmEntity]),
  ],
  providers: [
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
    {
      provide: 'IHashService',
      useClass: Argon2HashService,
    },
    // ... otros servicios
  ],
  exports: [
    'IUserRepository',
    'IHashService',
    // ...
  ],
})
export class InfrastructureModule {}

// src/presentation/presentation.module.ts
@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [
    UserController,
    AuthController,
    GroupController,
    ActionController,
  ],
})
export class PresentationModule {}
```

### 6. Testing

#### Unit Tests (Dominio)
```typescript
// test/unit/domain/entities/user.entity.spec.ts
describe('User Entity', () => {
  it('should lock user after 5 failed attempts', () => {
    const user = new User(...);
    for (let i = 0; i < 5; i++) {
      user.incrementFailedAttempts(5, 900000);
    }
    expect(user.isLocked()).toBe(true);
  });
});
```

#### Unit Tests (Use Cases con mocks)
```typescript
// test/unit/application/use-cases/create-user.use-case.spec.ts
describe('CreateUserUseCase', () => {
  it('should create user successfully', async () => {
    const mockRepository = {
      exists: jest.fn().mockResolvedValue(false),
      findByUsername: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(mockUser),
    };

    const useCase = new CreateUserUseCase(mockRepository, mockHashService);
    const result = await useCase.execute(dto);

    expect(result.username).toBe('testuser');
  });
});
```

#### Integration Tests
```typescript
// test/integration/user.integration.spec.ts
describe('User Integration Tests', () => {
  it('should create and retrieve user from database', async () => {
    // Test real con base de datos de test
  });
});
```

---

## Beneficios de Esta Arquitectura

### 1. Testabilidad
- El dominio puede testearse sin BD, sin HTTP, sin frameworks
- Los use cases se mockean fácilmente
- Tests más rápidos y confiables

### 2. Mantenibilidad
- Cada capa tiene una responsabilidad clara
- Cambios en una capa no afectan a las demás
- Código más legible y organizado

### 3. Flexibilidad
- Cambiar de TypeORM a Prisma: solo modificar infraestructura
- Cambiar de REST a GraphQL: solo modificar presentación
- Agregar CLI, WebSockets, gRPC: agregar nueva capa de presentación

### 4. Escalabilidad
- Fácil agregar nuevos casos de uso
- Fácil agregar nuevas entidades
- Equipos pueden trabajar en paralelo en diferentes capas

### 5. Independencia de Frameworks
- La lógica de negocio no depende de NestJS
- Podemos migrar a otro framework sin tocar el dominio
- El dominio es reutilizable en otros proyectos

---

## Conclusión

Esta arquitectura limpia nos permite construir un sistema:
- **Robusto**: Reglas de negocio protegidas y centralizadas
- **Testeable**: Cada capa puede probarse independientemente
- **Mantenible**: Código organizado y con responsabilidades claras
- **Flexible**: Fácil de modificar y extender
- **Escalable**: Preparado para crecer

El siguiente paso es seguir el plan de migración detallado en `MIGRATION_PLAN.md`.
