# Clean Architecture - Documentación Técnica

## 📐 Arquitectura General

Este proyecto ha sido migrado a **Clean Architecture** siguiendo los principios de Domain-Driven Design (DDD). La arquitectura está organizada en capas concéntricas donde las dependencias fluyen hacia adentro.

### Principios Fundamentales

1. **Independencia de Frameworks**: La lógica de negocio no depende de NestJS, TypeORM u otros frameworks
2. **Testeable**: La lógica de negocio puede testearse sin UI, base de datos o servicios externos
3. **Independencia de UI**: La UI puede cambiar sin afectar el resto del sistema
4. **Independencia de Base de Datos**: Puedes cambiar de PostgreSQL a MongoDB sin afectar las reglas de negocio
5. **Independencia de Agentes Externos**: Las reglas de negocio no conocen nada del mundo exterior

## 🏗️ Estructura de Capas

```
src/
├── domain/                    # Capa de Dominio (Núcleo)
│   ├── entities/             # Entidades de negocio con lógica
│   ├── value-objects/        # Objetos de valor inmutables
│   ├── enums/                # Enumeraciones de dominio
│   ├── exceptions/           # Excepciones de negocio
│   ├── repositories/         # Interfaces de repositorios
│   └── services/             # Interfaces de servicios de dominio
│
├── application/              # Capa de Aplicación
│   ├── dtos/                # Data Transfer Objects
│   └── use-cases/           # Casos de uso (orquestación)
│
├── infrastructure/          # Capa de Infraestructura
│   ├── persistence/         # Implementaciones de persistencia
│   │   └── typeorm/        
│   │       ├── entities/   # Entidades ORM (TypeORM)
│   │       ├── mappers/    # Conversión Domain ↔ ORM
│   │       └── repositories/ # Implementaciones de repositorios
│   └── security/           # Implementaciones de servicios
│
├── presentation/            # Capa de Presentación
│   ├── controllers/        # Controladores REST
│   ├── dtos/              # DTOs de request/response con validaciones
│   └── guards/            # Guards de autorización
│
└── shared/                 # Código compartido entre capas
    └── utils/
```

## 🔄 Flujo de Datos

```
HTTP Request
    ↓
Controller (Presentation)
    ↓
Use Case (Application)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Infrastructure)
    ↓
Database
```

## 📦 Módulos Migrados

### ✅ Fase 2: Módulo Actions
- **Entidades**: Action
- **Use Cases**: 5 (List, GetById, Create, Update, Delete)
- **Endpoints**: `/api/v1/actions`
- **Estado**: ✅ Completado y testeado

### ✅ Fase 3: Módulo Groups
- **Entidades**: Group (con relaciones jerárquicas)
- **Value Objects**: Ninguno
- **Use Cases**: 8 (CRUD + AssignActions + AssignChildren + GetEffectiveActions)
- **Endpoints**: `/api/v1/groups`
- **Características especiales**:
  - Detección de ciclos en jerarquía
  - Cálculo recursivo de acciones efectivas
  - Validación de grupos hijos
- **Estado**: ✅ Completado y testeado

### ✅ Fase 4: Módulo Users
- **Entidades**: User (con lógica de seguridad)
- **Value Objects**: Email (con validación y normalización)
- **Enums**: UserRole (ADMIN, RECEPCIONISTA, CLIENTE)
- **Excepciones de Dominio**: 4
  - `UserAlreadyExistsException`
  - `UserLockedException` (con minutos restantes)
  - `InvalidCredentialsException`
  - `UserNotActiveException`
- **Use Cases**: 9 (CRUD + AssignGroups + AssignActions + GetInheritedActions + ResetPassword)
- **Endpoints**: `/api/v1/users`
- **Características especiales**:
  - Bloqueo de cuenta (5 intentos fallidos = 15 minutos)
  - Gestión de tokens de reset de contraseña (1 hora de validez)
  - Cálculo recursivo de permisos heredados desde grupos
  - Integración con IHashService (Argon2id)
- **Estado**: ✅ Completado y testeado

### ✅ Fase 5: Módulo Auth
- **Interfaces de Dominio**:
  - `IHashService` (Argon2id)
  - `ITokenService` (JWT)
- **Use Cases**: 5
  - `LoginUseCase` (con verificación de bloqueo y registro de intentos)
  - `RefreshTokenUseCase`
  - `ChangePasswordUseCase`
  - `ForgotPasswordUseCase`
  - `ResetPasswordWithTokenUseCase`
- **Endpoints**: `/api/v1/auth` (stubs temporales)
- **Módulos Infraestructura**:
  - `SecurityModule` (provee IHashService e ITokenService)
- **Estado**: ⚠️ Use Cases completos, Controller con stubs

## 🔧 Patrones de Diseño Utilizados

### 1. Repository Pattern
```typescript
// Domain - Interface (contrato)
export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
}

// Infrastructure - Implementation
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(@InjectRepository(UserOrmEntity) private repo: Repository<UserOrmEntity>) {}
  
  async findById(id: number): Promise<User | null> {
    const ormEntity = await this.repo.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }
}
```

### 2. Use Case Pattern
```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository') private userRepository: IUserRepository,
    @Inject('IHashService') private hashService: IHashService,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // 1. Validaciones
    // 2. Lógica de negocio
    // 3. Persistencia
    // 4. Retorno
  }
}
```

### 3. Mapper Pattern
```typescript
export class UserMapper {
  toDomain(orm: UserOrmEntity): User {
    return User.create(/* ... */);
  }

  toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    // mapping...
    return orm;
  }
}
```

### 4. Value Object Pattern
```typescript
export class Email {
  private constructor(private readonly _value: string) {}

  static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new Error('Invalid email');
    }
    return new Email(email.toLowerCase());
  }

  get value(): string {
    return this._value;
  }
}
```

## 🎯 Convenciones de Código

### Naming Conventions

1. **Entities**: `User`, `Group`, `Action`
2. **Value Objects**: `Email`, `Money`, `Address`
3. **Use Cases**: `CreateUserUseCase`, `GetUserByIdUseCase`
4. **DTOs**: `CreateUserDto`, `UserResponseDto`
5. **Repositories**: `IUserRepository`, `TypeOrmUserRepository`
6. **ORM Entities**: `UserOrmEntity`, `GroupOrmEntity`
7. **Mappers**: `UserMapper`, `GroupMapper`

### File Organization

```
feature/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts
│   └── repositories/
│       └── user.repository.interface.ts
├── application/
│   ├── dtos/
│   │   ├── create-user.dto.ts
│   │   └── user-response.dto.ts
│   └── use-cases/
│       ├── create-user.use-case.ts
│       └── user-use-cases.module.ts
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── entities/
│           │   └── user.orm-entity.ts
│           ├── mappers/
│           │   └── user.mapper.ts
│           └── repositories/
│               └── user.repository.impl.ts
└── presentation/
    ├── controllers/
    │   ├── user.controller.ts
    │   └── user-presentation.module.ts
    └── dtos/
        ├── create-user-request.dto.ts
        └── update-user-request.dto.ts
```

## 🔌 Dependency Injection

### Registro de Interfaces

```typescript
// typeorm-persistence.module.ts
@Module({
  providers: [
    UserMapper,
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: ['IUserRepository'],
})
export class TypeOrmPersistenceModule {}
```

### Inyección en Use Cases

```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IUserRepository') // String token
    private readonly userRepository: IUserRepository, // Interface type
  ) {}
}
```

## 📊 Gestión de Errores

### Domain Exceptions
```typescript
export class UserLockedException extends Error {
  constructor(
    public readonly message: string,
    public readonly lockedUntil: Date,
  ) {
    super(message);
    this.name = 'UserLockedException';
  }
}
```

### Global Exception Filter (Pendiente)
```typescript
// TODO: Crear en fase 6
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    if (exception instanceof UserLockedException) {
      // Manejar específicamente
    }
  }
}
```

## 🧪 Testing

### Unit Tests para Use Cases
```typescript
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = {
      findByUsername: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new CreateUserUseCase(repository, hashService);
  });

  it('should create user', async () => {
    repository.findByUsername.mockResolvedValue(null);
    repository.save.mockImplementation(user => Promise.resolve(user));

    const result = await useCase.execute(createDto);

    expect(result).toBeDefined();
    expect(repository.save).toHaveBeenCalled();
  });
});
```

## 🚀 Próximos Pasos

### Fase 6 - Cleanup (En progreso)
1. ✅ Documentación de arquitectura
2. ⏳ Configurar path aliases en tsconfig
3. ⏳ Actualizar README principal
4. ⏳ Crear guía de desarrollo
5. ⏳ Documentar estrategia de migración para futuros módulos

### Fase 7 - Eliminación de Legacy (Futuro)
1. Remover `src/modules/actions/` (legacy)
2. Remover `src/modules/groups/` (legacy)
3. Remover `src/modules/users/` (legacy)
4. Remover `src/modules/auth/` (legacy)
5. Actualizar imports en código restante

## 📚 Referencias

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)

---

**Fecha de migración**: Octubre 2025  
**Estado**: Fase 5 completada - 95% migrado a Clean Architecture
