# STACK TECNOLÓGICO — MyHotelFlow

Sistema de reservas hoteleras con gestión integral de recepción, check-in/out, facturación y servicios.

---

## 📋 Tabla de Contenidos
- [Backend Stack](#backend-stack)
- [Frontend Stack](#frontend-stack)
- [Base de Datos](#base-de-datos)
- [DevOps y Herramientas](#devops-y-herramientas)
- [Seguridad](#seguridad)
- [Testing](#testing)
- [Documentación](#documentación)

---

## 🔧 Backend Stack

### Framework Principal
- **NestJS v11** - Framework progresivo de Node.js
  - Arquitectura modular y escalable
  - Soporte nativo para TypeScript
  - Inyección de dependencias
  - Decoradores y metadata
  - Compatible con Express y Fastify

### ORM y Base de Datos
- **TypeORM v0.3+** - Object-Relational Mapping
  - Data Mapper y Active Record patterns
  - Migraciones automáticas
  - Query Builder type-safe
  - Soporte para relaciones complejas
  - Índices y constraints personalizados
  
- **PostgreSQL 15+** - Base de datos relacional
  - ACID compliant
  - Soporte para JSON/JSONB
  - Full-text search
  - Transacciones avanzadas
  - Índices parciales y compuestos

### Autenticación y Seguridad
- **@nestjs/jwt** - Gestión de tokens JWT
  - Access tokens (15 minutos)
  - Refresh tokens (7-30 días)
  - Token rotation y blacklist
  
- **@nestjs/passport** - Estrategias de autenticación
  - JWT Strategy
  - Local Strategy
  - Guards personalizados
  
- **argon2** - Hashing de contraseñas
  - Argon2id (resistente a GPU y side-channel)
  - Configuración de memoria y paralelismo
  - Rehashing automático

- **@nestjs/throttler** - Rate limiting
  - Protección contra fuerza bruta
  - Límites por IP y por usuario
  - Configuración por endpoint

### Validación y Transformación
- **class-validator** - Validación de DTOs
  - Decoradores declarativos
  - Validación de tipos complejos
  - Mensajes de error personalizados
  
- **class-transformer** - Transformación de objetos
  - Serialización/deserialización
  - Exclusión de propiedades sensibles
  - Transformaciones personalizadas

- **zod** - Schema validation
  - Type-safe schemas
  - Inferencia de tipos TypeScript
  - Composición de validaciones

### Caché
- **@nestjs/cache-manager** - Gestión de caché
- **cache-manager-redis-store** - Store para Redis
- **Redis 7+** - Base de datos en memoria
  - Caché de permisos (TTL 15m)
  - Blacklist de tokens
  - Rate limiting
  - Sessions store

### Documentación API
- **@nestjs/swagger** - OpenAPI/Swagger
  - Generación automática de docs
  - Decoradores para schemas
  - Try-it-out integrado
  - Export de especificación OpenAPI

### Logging y Monitoreo
- **@nestjs/common Logger** - Logging integrado
- **winston** - Logger avanzado (opcional)
  - Múltiples transports
  - Niveles de log configurables
  - Rotación de archivos

### Notificaciones
- **@nestjs-modules/mailer** - Envío de emails
- **nodemailer** - Cliente SMTP
- **handlebars** - Templates de email
- **mailhog** - Testing de emails (desarrollo)

### Utilidades
- **date-fns** - Manipulación de fechas
- **uuid** - Generación de IDs únicos
- **dotenv** - Variables de entorno
- **@nestjs/config** - Configuración centralizada
  - Validación de variables de entorno
  - Configuración por módulos

### Seguridad Adicional
- **helmet** - Headers HTTP seguros
  - Content Security Policy
  - X-Frame-Options
  - HSTS
  
- **@nestjs/cors** - CORS configurado
  - Whitelist de orígenes
  - Credentials support

---

## 🎨 Frontend Stack

### Framework Core
- **React 18+** - Librería de UI
  - Server Components (opcional con Next.js)
  - Concurrent features
  - Automatic batching
  - Transitions API

- **TypeScript 5+** - Tipado estático
  - Type inference mejorada
  - Decorators support
  - Strict mode

### Build Tool
- **Vite 5+** - Build tool y dev server
  - Hot Module Replacement (HMR)
  - Optimización de builds
  - Code splitting automático
  - Tree shaking

### Gestión de Estado y Data Fetching
- **TanStack Query (React Query) v5** - Data fetching
  - Caché inteligente
  - Refetch automático
  - Optimistic updates
  - Infinite queries
  - Mutations
  - DevTools integradas

### Formularios
- **React Hook Form v7** - Gestión de formularios
  - Performance optimizado
  - Validación asíncrona
  - TypeScript support
  - Pequeño bundle size (~9KB)

- **@hookform/resolvers** - Resolvers para validación
  - Integración con Zod
  - Custom validators

### Validación
- **Zod v3** - Schema validation
  - Type inference automática
  - Composición de schemas
  - Error messages personalizados
  - Parser y safeParse
  - Transform y refine

### Estilos
- **Tailwind CSS v3** - Utility-first CSS
  - JIT compiler
  - Custom design system
  - Dark mode support
  - Responsive design
  - Plugin system

- **@tailwindcss/forms** - Estilos para formularios
- **@tailwindcss/typography** - Tipografía mejorada
- **tailwindcss-animate** - Animaciones predefinidas

### Componentes UI
- **Radix UI** o **Headless UI** - Componentes accesibles
  - WAI-ARIA compliant
  - Unstyled (compatible con Tailwind)
  - Modales, Dropdowns, Tabs, etc.

- **Lucide React** - Iconos
  - Tree-shakeable
  - Customizable
  - Consistentes

### Tablas de Datos
- **TanStack Table v8** - Tablas headless
  - Sorting
  - Filtering
  - Pagination
  - Column resizing
  - Row selection
  - Virtualización

### HTTP Client
- **Axios v1** - Cliente HTTP
  - Interceptors
  - Request/response transformation
  - Cancelación de requests
  - TypeScript support

### Routing
- **React Router v6** - Navegación
  - Nested routes
  - Lazy loading
  - Protected routes
  - Outlet y Layout

### Utilidades
- **date-fns** - Manipulación de fechas
  - Tree-shakeable
  - Inmutable
  - TypeScript support

- **clsx** y **tailwind-merge** - Gestión de clases
  - Combinación condicional de clases
  - Merge de clases Tailwind

### DevTools
- **React DevTools** - Debugging de React
- **TanStack Query DevTools** - Debugging de queries
- **Redux DevTools** (si se usa Redux)

---

## 💾 Base de Datos

### Sistema Gestor
- **PostgreSQL 15+**
  - MVCC (Multi-Version Concurrency Control)
  - JSON/JSONB support
  - Full-text search
  - Partitioning
  - Materialized views
  - Extensions (pg_trgm, uuid-ossp)

### Migraciones
- **TypeORM Migrations**
  - Versionado de schema
  - Rollback support
  - Seeds iniciales
  - Scripts de migración programáticos

### Backup y Recuperación
- **pg_dump** - Backups lógicos
- **WAL archiving** - Point-in-time recovery
- **Automated backup scripts**

---

## 🐳 DevOps y Herramientas

### Containerización
- **Docker 24+**
  - Multi-stage builds
  - Docker Compose para desarrollo
  - Optimización de layers
  
- **Docker Compose v2**
  - Servicios: API, PostgreSQL, Redis, MailHog
  - Volúmenes persistentes
  - Networks aisladas

### Control de Versiones
- **Git**
- **GitHub** / **GitLab** / **Bitbucket**
  - Conventional Commits
  - Semantic Versioning
  - Branch protection

### CI/CD (Recomendado)
- **GitHub Actions** / **GitLab CI**
  - Automated testing
  - Code quality checks
  - Automated deployments

### Code Quality
- **ESLint** - Linting JavaScript/TypeScript
  - Airbnb o Standard config
  - Custom rules
  
- **Prettier** - Formateo de código
  - Configuración unificada
  - Pre-commit hooks

- **Husky** - Git hooks
  - Pre-commit linting
  - Pre-push testing

- **lint-staged** - Linting incremental

### Package Manager
- **npm** / **yarn** / **pnpm**
  - Workspaces (monorepo opcional)
  - Lock files para reproducibilidad

---

## 🔒 Seguridad

### Políticas Implementadas
- **Contraseñas seguras**
  - Mínimo 10 caracteres
  - 1 mayúscula, 1 minúscula, 1 dígito, 1 símbolo
  - Argon2id hashing
  - Lockout tras 5 intentos fallidos (15 min)
  - Rehash automático si cambian parámetros

- **JWT Tokens**
  - Access token: 15 minutos
  - Refresh token: 7-30 días
  - JTI (JWT ID) único
  - Rotation de refresh tokens
  - Blacklist en Redis

- **Hardening**
  - CORS restrictivo
  - Helmet (security headers)
  - Rate limiting en `/auth/*`
  - DTO whitelist (forbidNonWhitelisted)
  - Mensajes de error neutros
  - SQL injection protection (TypeORM)
  - XSS protection

- **Auditoría**
  - Tabla `audit_log`
  - Eventos de autenticación
  - ABM de seguridad (usuarios, grupos, acciones)
  - IP y User-Agent logging

### Variables de Entorno (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/myhotelflow
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secretpass
DB_NAME=myhotelflow

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Argon2
ARGON2_MEMORY=65536
ARGON2_ITERATIONS=3
ARGON2_PARALLELISM=4

# SMTP
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=noreply@myhotelflow.com

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

---

## 🧪 Testing

### Backend
- **Jest** - Test runner
  - Unit tests
  - Integration tests
  - Mocks y spies

- **@nestjs/testing** - Testing utilities
  - TestingModule
  - Mocking de providers

- **Supertest** - E2E testing
  - HTTP assertions
  - Request simulation

### Frontend
- **Vitest** - Test runner (compatible con Vite)
  - Fast execution
  - ESM support
  - TypeScript nativo

- **React Testing Library** - Testing de componentes
  - User-centric testing
  - Accessibility queries

- **MSW (Mock Service Worker)** - API mocking
  - Intercepta requests
  - Response mocking

### Coverage
- **Istanbul/NYC** - Code coverage
  - Umbral mínimo: 80%
  - Reportes HTML y LCOV

### E2E (Opcional)
- **Playwright** - E2E testing
  - Multi-browser
  - Visual testing
  - Auto-wait

---

## 📚 Documentación

### API Documentation
- **Swagger UI** - Documentación interactiva
  - `/api/docs` endpoint
  - Try-it-out functionality
  - Export OpenAPI spec

### Code Documentation
- **JSDoc** / **TSDoc** - Comentarios inline
  - Interfaces y tipos documentados
  - Ejemplos de uso

### README
- Instrucciones de instalación
- Configuración de desarrollo
- Scripts disponibles
- Guías de contribución

### Diagramas
- **Mermaid** - Diagramas en Markdown
  - Casos de uso
  - Secuencia
  - ER diagrams
  - Arquitectura

---

## 📦 Estructura del Proyecto (Backend)

```
my_hotel_flow_be/
├── src/
│   ├── modules/
│   │   ├── auth/              # Autenticación
│   │   ├── users/             # Gestión de usuarios
│   │   ├── groups/            # Gestión de grupos
│   │   ├── actions/           # Catálogo de acciones
│   │   ├── audit/             # Auditoría
│   │   ├── reservations/      # Reservas
│   │   ├── checkin/           # Check-in
│   │   ├── checkout/          # Check-out
│   │   ├── rooms/             # Habitaciones
│   │   ├── clients/           # Clientes
│   │   ├── invoices/          # Comprobantes
│   │   └── payments/          # Pagos
│   ├── common/
│   │   ├── decorators/        # @Actions(), @Public()
│   │   ├── guards/            # JwtAuthGuard, ActionsGuard
│   │   ├── filters/           # Exception filters
│   │   ├── interceptors/      # Logging, Transform
│   │   ├── pipes/             # Validation pipes
│   │   └── utils/             # Helpers
│   ├── infra/
│   │   ├── database/
│   │   │   ├── entities/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   ├── cache/             # Redis setup
│   │   └── mailer/            # Email templates
│   ├── config/                # Configuration modules
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── tsconfig.json
├── package.json
├── README.md
├── MODULO_SEGURIDAD.md
├── SEGURIDAD_ADDENDUM.md
└── STACK_TECNOLOGICO.md
```

---

## 📦 Estructura del Proyecto (Frontend)

```
my_hotel_flow_fe/
├── src/
│   ├── components/
│   │   ├── ui/               # Componentes base (buttons, inputs)
│   │   ├── layout/           # Layout components
│   │   └── features/         # Componentes de negocio
│   ├── pages/                # Páginas/Rutas
│   ├── hooks/                # Custom hooks
│   ├── services/             # API calls (axios)
│   ├── schemas/              # Zod schemas
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilidades
│   ├── constants/            # Constantes
│   ├── config/               # Configuración
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🚀 Scripts Principales

### Backend
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Testing
npm run test
npm run test:e2e
npm run test:cov

# Migraciones
npm run typeorm migration:generate -- -n MigrationName
npm run typeorm migration:run
npm run typeorm migration:revert

# Linting
npm run lint
npm run format
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build
npm run build
npm run preview

# Testing
npm run test
npm run test:ui
npm run coverage

# Linting
npm run lint
npm run format
```

---

## 📝 Notas Finales

### Criterios de Selección
- **Performance**: Librerías optimizadas y bundles pequeños
- **TypeScript**: Soporte de primera clase
- **Mantenimiento**: Librerías activamente mantenidas
- **Comunidad**: Amplia adopción y documentación
- **Seguridad**: Auditorías regulares y actualizaciones
- **DX (Developer Experience)**: Herramientas que mejoran productividad

### Próximos Pasos
1. Configurar repositorio y estructura base
2. Setup de Docker Compose para desarrollo
3. Configurar NestJS con TypeORM y PostgreSQL
4. Implementar módulo de seguridad (Auth, Users, Groups, Actions)
5. Setup de frontend con Vite y React
6. Integrar React Query y formularios
7. Implementar componentes UI base
8. Testing inicial
9. CI/CD pipeline

---

**Versión**: 1.0  
**Última actualización**: Octubre 2025  
**Mantenedor**: Equipo MyHotelFlow
