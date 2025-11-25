# Sistema de Reservas - My Hotel Flow

## Índice de Documentación

Este directorio contiene la especificación técnica completa del sistema de reservas para My Hotel Flow.

---

## 📚 Documentos

### 1. [Inventario del Sistema](./01-inventario-sistema.md)
**Estado actual vs Requerimientos**

- ✅ Stack tecnológico identificado (NestJS + TypeORM + PostgreSQL)
- ✅ Entidades existentes y faltantes
- ✅ Endpoints requeridos y gaps críticos
- ✅ Brechas de funcionalidad por iteración

**Hallazgos clave**:
- Backend con NestJS + TypeORM ya existe
- Estados actuales: `CONFIRMED`, `IN_PROGRESS`, `CANCELLED`, `COMPLETED`
- 0% de funcionalidad de reservas implementada

---

### 2. [Modelo de Dominio](./02-modelo-dominio.md)
**Arquitectura de entidades y relaciones**

- ✅ Entidades de dominio (DDD)
- ✅ Pseudo-ERD con relaciones
- ✅ Value Objects (Email, Phone, DNI, DateRange)
- ✅ Agregados y boundaries
- ✅ Schema de TypeORM propuesto
- ✅ Domain Events

**Entidades principales**:
- `Reservation` (Aggregate Root)
- `Room`, `RoomType`
- `Client`, `User`
- `Invoice`, `Payment` (Iteración 2)

---

### 3. [Máquina de Estados](./03-maquina-estados.md)
**Transiciones válidas y guardas**

- ✅ Estados de Reserva: `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`
- ✅ Estados de Habitación: `AVAILABLE` → `OCCUPIED` → `MAINTENANCE`
- ✅ Tabla de transiciones con condiciones
- ✅ Políticas de expiración (TTL)
- ✅ Implementación en TypeScript con NestJS

**Features**:
- State machine service con validación automática
- Event handlers para sincronización
- Logs de auditoría de transiciones

---

### 4. [Reglas de Negocio](./04-reglas-negocio.md)
**Formato R-###: Enunciado | Motivación | Validación | ErrorCode**

- ✅ 30+ reglas documentadas
- ✅ Categorías: Validación, Disponibilidad, Cancelación, Check-in/out, Facturación, Seguridad
- ✅ Códigos de error estructurados (RES-001 a RES-604)
- ✅ Validaciones en DTOs y Service Layer

**Reglas críticas**:
- **R-100**: Verificación de disponibilidad obligatoria
- **R-101**: Prevención de overbooking (exclusión de solapamiento)
- **R-200**: Política de cancelación 24h (RF-05)
- **R-603**: Idempotencia en POST

---

### 5. [Contratos de API REST](./05-contratos-api.md)
**Especificación OpenAPI con DTOs TypeScript**

- ✅ Base URL: `/api/v1`
- ✅ Endpoints completos con request/response
- ✅ DTOs con class-validator
- ✅ Headers requeridos (Authorization, Idempotency-Key)
- ✅ Códigos HTTP y manejo de errores
- ✅ Paginación, filtrado y ordenamiento

**Endpoints principales**:
- `POST /reservations` - Crear reserva
- `GET /reservations` - Listar reservas
- `PATCH /reservations/:id` - Modificar fechas
- `DELETE /reservations/:id` - Cancelar
- `POST /reservations/:id/check-in` - Check-in
- `POST /reservations/:id/check-out` - Check-out
- `GET /rooms/availability` - Verificar disponibilidad

---

### 6. [Prevención de Overbooking](./06-prevencion-overbooking.md)
**Estrategia multi-capa para evitar sobreventa**

- ✅ Enfoque 3 capas: DB + Aplicación + API
- ✅ Optimistic Locking con campo `version`
- ✅ Pessimistic Locking (`SELECT FOR UPDATE`)
- ✅ Transacciones SERIALIZABLE
- ✅ Redis Distributed Locks (opcional, alta concurrencia)
- ✅ Idempotency Keys

**Implementaciones**:
- TypeORM con `@VersionColumn()`
- PostgreSQL Exclusion Constraints (migración futura)
- Tests de race conditions

---

### 7. [Casos de Uso en Gherkin](./07-casos-uso-gherkin.md)
**Especificación BDD para tests de aceptación**

- ✅ 25+ escenarios en formato Given-When-Then
- ✅ Features: Crear, Modificar, Cancelar, Check-in, Check-out, Disponibilidad
- ✅ Happy paths y edge cases
- ✅ Validaciones de reglas de negocio
- ✅ Configuración con jest-cucumber

**Cobertura**:
- Validaciones de fechas
- Overbooking prevention
- Concurrencia
- Idempotencia
- Autorización

---

### 8. [Observabilidad y Métricas](./08-observabilidad.md)
**Logs, métricas y alertas**

- ✅ Taxonomía de códigos de error (RES-001 a RES-604)
- ✅ Logs estructurados con Winston (JSON)
- ✅ Métricas Prometheus (Counter, Gauge, Histogram)
- ✅ Trace IDs para correlación
- ✅ Dashboards Grafana
- ✅ Alertas críticas

**Métricas clave**:
- `reservations_created_total`
- `reservations_overbooking_rejections_total`
- `hotel_occupancy_rate`
- `reservations_concurrency_conflicts_total`

---

## 🎯 Flujo de Implementación Recomendado

### Fase 1: Fundamentos (Sprint 1)
1. Configurar TypeORM entities según `02-modelo-dominio.md`
2. Implementar DTOs de `05-contratos-api.md`
3. Crear ReservationsService con reglas básicas de `04-reglas-negocio.md`
4. Implementar state machine de `03-maquina-estados.md`

### Fase 2: Prevención Overbooking (Sprint 2)
1. Agregar campo `version` para optimistic locking
2. Implementar transacciones con `SELECT FOR UPDATE`
3. Crear interceptor de Idempotency
4. Tests de concurrencia de `07-casos-uso-gherkin.md`

### Fase 3: Check-in/Check-out (Sprint 3)
1. Implementar endpoints de check-in/check-out
2. Integrar con state machine de Habitación
3. Validaciones de horario y permisos
4. Logs y métricas de `08-observabilidad.md`

### Fase 4: Observabilidad (Sprint 4)
1. Configurar Winston para logs estructurados
2. Implementar métricas Prometheus
3. Crear dashboards Grafana
4. Configurar alertas críticas

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

**Ubicación**: `apps/backend/src/**/__tests__/*.spec.ts`

**Cobertura esperada**:
- Domain entities: 100%
- Services: > 80%
- Validators: 100%

### Integration Tests
```bash
npm run test:e2e
```

**Ubicación**: `apps/backend/test/**/*.e2e-spec.ts`

**Escenarios**: Ver `07-casos-uso-gherkin.md`

### Load Testing
```bash
artillery run artillery-config.yml
```

**Objetivo**: 50 req/s sin errores de overbooking

---

## 📊 Stack Tecnológico

### Backend
- **Framework**: NestJS 11.x
- **ORM**: TypeORM 0.3.x
- **Base de Datos**: PostgreSQL 15+
- **Validación**: class-validator + class-transformer
- **Autenticación**: JWT con Passport
- **Cache**: Redis 7.x (para locks distribuidos)
- **Logs**: Winston
- **Métricas**: Prometheus (prom-client)

### Frontend
- **Framework**: React 18.3
- **Build**: Vite 5.4
- **State**: TanStack Query 5.x
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS 3.4

---

## 🔑 Variables de Entorno

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=myhotelflow
DATABASE_PASSWORD=secret
DATABASE_NAME=myhotelflow_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# Email (SendGrid)
SENDGRID_API_KEY=your-api-key
FROM_EMAIL=noreply@myhotelflow.com

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Metrics
ENABLE_METRICS=true
METRICS_PORT=9090
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar backend en modo watch
npm run build                  # Build producción

# Migraciones
npm run typeorm migration:generate -- -n MigrationName
npm run typeorm migration:run
npm run typeorm migration:revert

# Tests
npm run test                   # Unit tests
npm run test:watch             # Unit tests en watch mode
npm run test:e2e               # Integration tests
npm run test:cov               # Coverage report

# Linting
npm run lint                   # ESLint
npm run format                 # Prettier
npm run typecheck              # TypeScript check

# Métricas
curl http://localhost:3000/metrics    # Ver métricas Prometheus
curl http://localhost:3000/health     # Health check
```

---

## 📖 Referencias Externas

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [class-validator](https://github.com/typestack/class-validator)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

---

## 👥 Equipo

- **Arquitecto**: Diseño del sistema de reservas
- **Backend**: Implementación NestJS + TypeORM
- **Frontend**: Integración React con API
- **DevOps**: Configuración de métricas y alertas
- **QA**: Tests de aceptación con Gherkin

---

## 📝 Notas de Implementación

### Consideraciones Importantes

1. **Migración a PostgreSQL**: El sistema actual usa MySQL pero se recomienda PostgreSQL para aprovechar Exclusion Constraints en prevención de overbooking.

2. **Optimistic Locking**: Es crítico implementar el campo `version` desde el inicio para prevenir race conditions.

3. **Idempotency**: Todos los endpoints POST deben requerir `Idempotency-Key` header.

4. **Logs Estructurados**: Usar formato JSON desde el inicio para facilitar búsquedas en producción.

5. **Métricas**: Implementar métricas de negocio (no solo técnicas) para monitoreo proactivo.

### Deuda Técnica Identificada

- [ ] Migración de MySQL a PostgreSQL (para Exclusion Constraints)
- [ ] Implementación de Event Sourcing (opcional, para auditoría completa)
- [ ] CQRS para separar lectura/escritura (si la carga lo requiere)
- [ ] Circuit breakers para servicios externos (email, SMS)

---

## 📅 Versión del Documento

- **Versión**: 1.0
- **Fecha**: 2025-11-12
- **Autor**: Tech Lead / Arquitecto
- **Estado**: ✅ Completo y listo para implementación

---

**¿Siguiente paso?** Comenzar implementación siguiendo el flujo de Fase 1 → Fase 2 → Fase 3 → Fase 4.
