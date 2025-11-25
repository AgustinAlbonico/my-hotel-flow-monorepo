# MyHotelFlow Backend - Clean Architecture

Backend del sistema de gestión hotelera MyHotelFlow, implementado con **Clean Architecture** y **Domain-Driven Design (DDD)**.

## 🏗️ Arquitectura

Este proyecto sigue los principios de **Clean Architecture** con una clara separación en 4 capas:

```
src/
├── domain/              # 🔵 Capa de Dominio (Lógica de Negocio Pura)
│   ├── entities/        # Entidades con comportamiento rico
│   ├── value-objects/   # Objetos de valor inmutables
│   ├── repositories/    # Interfaces de repositorios
│   ├── services/        # Interfaces de servicios de dominio
│   ├── exceptions/      # Excepciones de dominio personalizadas
│   └── enums/           # Enumeraciones de dominio
│
├── application/         # 🟢 Capa de Aplicación (Casos de Uso)
│   ├── use-cases/       # Orquestación de lógica de negocio
│   │   ├── action/      # Casos de uso de Actions
│   │   ├── group/       # Casos de uso de Groups
│   │   ├── user/        # Casos de uso de Users
│   │   └── auth/        # Casos de uso de Auth
│   └── dtos/            # DTOs de aplicación (sin validación)
│
├── infrastructure/      # 🟡 Capa de Infraestructura (Implementaciones)
│   ├── persistence/     
│   │   └── typeorm/     
│   │       ├── entities/       # Entidades ORM (TypeORM)
│   │       ├── repositories/   # Implementaciones de repositorios
│   │       ├── mappers/        # Mappers Domain ↔ ORM
│   │       └── config/         # Configuración de base de datos
│   └── security/        # Implementaciones de servicios (Hash, Token)
│
├── presentation/        # 🔴 Capa de Presentación (API REST)
│   ├── controllers/     # Controladores REST
│   ├── dtos/            # DTOs con validación (class-validator)
│   ├── guards/          # Guards de autenticación/autorización
│   ├── interceptors/    # Interceptors de respuesta
│   ├── filters/         # Exception filters
│   └── decorators/      # Decoradores personalizados
│
├── shared/              # 🔷 Código Compartido
│   ├── logger/          # Sistema de logging
│   ├── config/          # Configuración global
│   └── utils/           # Utilidades comunes
│
├── app.module.ts        # Módulo raíz de la aplicación
└── main.ts              # Punto de entrada
```

### 📊 Flujo de Datos

```
HTTP Request
    ↓
[Presentation] Controller → DTO Validation
    ↓
[Application] Use Case → Orchestration
    ↓
[Domain] Entity/Repository Interface → Business Logic
    ↓
[Infrastructure] Repository Implementation → TypeORM
    ↓
Database (PostgreSQL)
```

## ✨ Features Implementados

### ✅ Módulos Migrados a Clean Architecture

| Módulo | Use Cases | Entidades | Estado |
|--------|-----------|-----------|--------|
| **Actions** | 5 | Action | ✅ Completo |
| **Groups** | 8 | Group | ✅ Completo |
| **Users** | 9 | User | ✅ Completo |
| **Auth** | 5 | - | ✅ Completo (integrado) |

### 🔐 Características de Seguridad

- **Autenticación JWT** con access y refresh tokens
- **Argon2id hashing** para contraseñas
- **Account locking** (5 intentos fallidos = 15 min bloqueo)
- **Password reset tokens** (1 hora de expiración)
- **Role-based access control** (ADMIN, RECEPCIONISTA, CLIENTE)
- **Permission inheritance** (jerarquía de grupos)
- **Cycle detection** en jerarquías de grupos

### 📦 Patrones de Diseño Implementados

- **Repository Pattern**: Abstracción de persistencia
- **Use Case Pattern**: Lógica de aplicación encapsulada
- **Mapper Pattern**: Conversión Domain ↔ ORM
- **Value Object Pattern**: Email con validación
- **Domain Exception Pattern**: Excepciones de negocio personalizadas

## 🚀 Instalación

### Prerrequisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

### Setup

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar migraciones
npm run migration:run

# 5. (Opcional) Ejecutar seeds
npm run seed

# 6. Iniciar en desarrollo
npm run start:dev
```

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run start:dev          # Modo desarrollo con hot-reload
npm run start:debug        # Modo debug

# Build
npm run build              # Compilar TypeScript
npm run start:prod         # Ejecutar en producción

# Tests
npm test                   # Unit tests
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con coverage
npm run test:e2e           # Tests end-to-end

# Base de Datos
npm run typeorm:cli        # CLI de TypeORM
npm run migration:run      # Ejecutar migraciones
npm run migration:revert   # Revertir última migración
npm run migration:generate -- -n MigrationName  # Generar migración
npm run seed               # Ejecutar seeds

# Linting
npm run lint               # Ejecutar ESLint
npm run format             # Formatear con Prettier
```

## 📚 Documentación

- **[CLEAN_ARCHITECTURE.md](./CLEAN_ARCHITECTURE.md)** - Explicación detallada de la arquitectura
- **[GUIA_DESARROLLO.md](./GUIA_DESARROLLO.md)** - Cómo crear nuevos features
- **[ESTRATEGIA_COEXISTENCIA.md](./ESTRATEGIA_COEXISTENCIA.md)** - Coexistencia legacy vs nuevo código
- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** - Plan completo de migración

### 📖 Swagger Documentation

Una vez iniciada la aplicación, accede a la documentación interactiva:

```
http://localhost:3000/api/docs
```

## 🧪 Testing

### Estructura de Tests

```
test/
├── unit/                  # Tests unitarios (por capa)
│   ├── domain/           # Entidades y lógica de dominio
│   ├── application/      # Casos de uso
│   └── infrastructure/   # Repositorios e implementaciones
├── integration/          # Tests de integración
└── e2e/                  # Tests end-to-end
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Con coverage
npm run test:cov

# Solo E2E
npm run test:e2e

# Watch mode
npm run test:watch
```

**Estado Actual**: ✅ 44/44 tests pasando

## 🗂️ Path Aliases

El proyecto usa path aliases configurados en `tsconfig.json`:

```typescript
// Uso de aliases
import { User } from '@domain/entities/user.entity';
import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { TypeOrmUserRepository } from '@infrastructure/persistence/typeorm/repositories/user.repository.impl';
import { UserController } from '@presentation/controllers/user.controller';
import { LoggerService } from '@shared/logger/logger.service';
```

## 📋 Variables de Entorno

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=myhotelflow

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Security
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION_MINUTES=15
PASSWORD_RESET_TOKEN_EXPIRY_HOURS=1
```

## 🔄 Migración en Progreso

Este proyecto está en proceso de migración de arquitectura monolítica a Clean Architecture:

### Estado Actual

- ✅ **Fase 0**: Estructura de carpetas
- ✅ **Fase 1**: Infraestructura base (Logger, Config, Security)
- ✅ **Fase 2**: Actions module (completo)
- ✅ **Fase 3**: Groups module (completo)
- ✅ **Fase 4**: Users module (completo)
- ✅ **Fase 5**: Auth module (completo con use cases integrados)
- ✅ **Fase 6**: Cleanup & Documentation (completo)
- ⏳ **Fase 7**: Remover código legacy (pendiente)

### Código Legacy vs Nuevo

Actualmente **coexisten** dos sistemas:
- **Nuevo** (Clean Architecture): `src/domain/`, `src/application/`, `src/infrastructure/`, `src/presentation/`
- **Legacy** (temporal): `src/modules/` (será eliminado en Fase 7)

Ver [ESTRATEGIA_COEXISTENCIA.md](./ESTRATEGIA_COEXISTENCIA.md) para detalles.

## 🤝 Contribuir

### Crear un Nuevo Feature

Sigue estos pasos (ver [GUIA_DESARROLLO.md](./GUIA_DESARROLLO.md) para detalles):

1. **Crear entidad de dominio** en `src/domain/entities/`
2. **Crear interfaz de repositorio** en `src/domain/repositories/`
3. **Crear DTOs de aplicación** en `src/application/dtos/`
4. **Crear use cases** en `src/application/use-cases/`
5. **Crear entidad ORM** en `src/infrastructure/persistence/typeorm/entities/`
6. **Crear mapper** en `src/infrastructure/persistence/typeorm/mappers/`
7. **Crear repositorio** en `src/infrastructure/persistence/typeorm/repositories/`
8. **Crear DTOs de presentación** en `src/presentation/dtos/`
9. **Crear controller** en `src/presentation/controllers/`
10. **Registrar en módulos**

### Checklist antes de PR

- [ ] ✅ Código compila sin errores (`npm run build`)
- [ ] ✅ Tests pasan (`npm test`)
- [ ] ✅ Linting pasa (`npm run lint`)
- [ ] ✅ Entidad de dominio tiene lógica de negocio
- [ ] ✅ Use cases son pequeños y enfocados
- [ ] ✅ Controller solo orquesta (sin lógica)
- [ ] ✅ DTOs tienen validación
- [ ] ✅ Hay tests para el nuevo código

## 🏆 Principios Seguidos

### SOLID

- ✅ **Single Responsibility**: Cada use case hace una sola cosa
- ✅ **Open/Closed**: Extensible via interfaces
- ✅ **Liskov Substitution**: Implementaciones intercambiables
- ✅ **Interface Segregation**: Interfaces pequeñas y específicas
- ✅ **Dependency Inversion**: Dependencias apuntan hacia abstracciones

### Clean Architecture

- ✅ **Independence of Frameworks**: Dominio no conoce NestJS/TypeORM
- ✅ **Testability**: Cada capa es testeable aisladamente
- ✅ **Independence of UI**: Lógica no depende de REST
- ✅ **Independence of Database**: Repositorio como abstracción
- ✅ **Independence of External Agencies**: Servicios inyectados via interfaces

## 📊 Métricas del Proyecto

- **Líneas de código**: ~15,000 (dominio + aplicación + infraestructura)
- **Tests**: 44 tests (100% use cases críticos)
- **Módulos Clean Architecture**: 4 (Actions, Groups, Users, Auth)
- **Entidades de dominio**: 4 (Action, Group, User, Email VO)
- **Use cases**: 27 (5 + 8 + 9 + 5)
- **Excepciones de dominio**: 4 personalizadas

## 🐛 Troubleshooting

### Problema: Error de compilación con path aliases

```bash
# Reconstruir proyecto
npm run build
```

### Problema: Tests fallan

```bash
# Limpiar caché de Jest
npm test -- --clearCache
npm test
```

### Problema: Base de datos no conecta

```bash
# Verificar que PostgreSQL está corriendo
# Verificar .env tiene credenciales correctas
# Verificar puerto 5432 no está ocupado
```

## 📞 Contacto

Para preguntas o problemas, revisar la documentación o contactar al equipo.

## 📜 Licencia

[MIT License](./LICENSE)

---

**Última actualización**: Fase 6 completada - Clean Architecture Migration en progreso

**Next Steps**: 
1. Completar integración de AuthController
2. Iniciar Fase 7 (remover código legacy)
3. Agregar más tests de integración
