# Plan de Implementación: Sistema de Auditoría

## Objetivo
Implementar un sistema completo de auditoría para MyHotelFlow que registre todas las operaciones críticas del sistema, con especial énfasis en las **Reservas** como elemento crítico principal.

---

## 1. TRAZABILIDAD

### 1.1 Elemento Crítico: RESERVA

**Objetivo**: Establecer trazabilidad completa sobre las reservas, registrando el producto/sistema que las registró, su fecha de creación, y todas las transformaciones posteriores.

#### Campos a Implementar en la Entidad Reserva

```typescript
// Campos de Auditoría Base
createdAt: Date;           // Fecha de creación
createdBy: string;         // Usuario que creó (ID o username)
createdBySystem: string;   // Sistema/módulo origen (ej: "WEB_BOOKING", "ADMIN_PANEL", "API_INTEGRATION")

updatedAt: Date;           // Última actualización
updatedBy: string;         // Último usuario que modificó

// Campos específicos de negocio
originalCheckIn: Date;     // Check-in original (inmutable)
originalCheckOut: Date;    // Check-out original (inmutable)
originalAmount: number;    // Monto original (inmutable)
currentAmount: number;     // Monto actual (mutable)

// Estado de la reserva
status: ReservationStatus; // PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED
statusHistory: StatusChange[]; // Historial de cambios de estado
```

#### Tabla de Auditoría: `reservation_audit_log`

```sql
CREATE TABLE reservation_audit_log (
  id UUID PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id),
  action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, STATUS_CHANGE, DELETE, MODIFY_DATES, MODIFY_AMOUNT
  
  -- Datos del cambio
  field_changed VARCHAR(100),      -- Campo modificado
  old_value TEXT,                  -- Valor anterior
  new_value TEXT,                  -- Valor nuevo
  change_reason TEXT,              -- Motivo del cambio (opcional)
  
  -- Auditoría
  changed_by_user_id UUID REFERENCES users(id),
  changed_by_username VARCHAR(100),
  changed_by_system VARCHAR(50),   -- Sistema que realizó el cambio
  ip_address VARCHAR(45),          -- IP de origen
  user_agent TEXT,                 -- Navegador/cliente
  
  -- Timestamps
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Metadata adicional
  metadata JSONB,                  -- Información contextual adicional
  
  INDEX idx_reservation_audit_reservation_id (reservation_id),
  INDEX idx_reservation_audit_changed_at (changed_at),
  INDEX idx_reservation_audit_user (changed_by_user_id)
);
```

### 1.2 Otros Elementos Críticos

Aplicar el mismo patrón a:
- **Pagos**: `payment_audit_log`
- **Huéspedes**: `guest_audit_log`
- **Habitaciones**: `room_audit_log`
- **Usuarios**: `user_audit_log`

---

## 2. LOGIN-LOGOUT

### 2.1 Tabla de Sesiones y Actividad

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  username VARCHAR(100) NOT NULL,
  
  -- Información de inicio de sesión
  login_at TIMESTAMP NOT NULL,
  login_ip VARCHAR(45),
  login_user_agent TEXT,
  login_location VARCHAR(255),  -- Geolocalización (opcional)
  
  -- Información de cierre de sesión
  logout_at TIMESTAMP,
  logout_type VARCHAR(20),      -- MANUAL, AUTO, EXPIRED, FORCED
  
  -- Token/sesión
  session_token VARCHAR(255),
  refresh_token VARCHAR(255),
  expires_at TIMESTAMP,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  INDEX idx_user_sessions_user_id (user_id),
  INDEX idx_user_sessions_login_at (login_at),
  INDEX idx_user_sessions_active (is_active)
);
```

### 2.2 Registro de Actividad de Usuario

```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES user_sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Actividad
  activity_type VARCHAR(50) NOT NULL,  -- PAGE_VIEW, API_CALL, SEARCH, EXPORT, etc.
  activity_description TEXT,
  endpoint VARCHAR(255),               -- Ruta/endpoint accedido
  
  -- Request details
  http_method VARCHAR(10),
  request_params JSONB,
  
  -- Response details
  response_status INTEGER,
  response_time_ms INTEGER,
  
  -- Contexto
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_activity_user_id (user_id),
  INDEX idx_activity_session_id (session_id),
  INDEX idx_activity_timestamp (activity_at)
);
```

---

## 3. REPORTES

### 3.1 Reportes de Auditoría Requeridos

#### 3.1.1 Reporte de Cambios en Reservas

**Endpoint**: `GET /api/audit/reservations/changes`

**Filtros**:
- Rango de fechas
- Usuario que modificó
- Sistema de origen
- Tipo de cambio (fechas, montos, estado)
- Reserva específica

**Información a mostrar**:
```
| Fecha | Reserva ID | Usuario | Sistema | Campo Modificado | Valor Anterior | Valor Nuevo | Motivo |
```

#### 3.1.2 Reporte de Sesiones de Usuario

**Endpoint**: `GET /api/audit/user-sessions`

**Filtros**:
- Rango de fechas
- Usuario
- Estado (activas/cerradas)
- IP de origen

**Información a mostrar**:
```
| Usuario | Login | Logout | Duración | IP | Ubicación | Estado |
```

#### 3.1.3 Reporte de Actividad por Usuario

**Endpoint**: `GET /api/audit/user-activity`

**Filtros**:
- Rango de fechas
- Usuario
- Tipo de actividad
- Endpoint

**Información a mostrar**:
```
| Fecha/Hora | Usuario | Actividad | Endpoint | Método HTTP | Estado | Tiempo Resp. |
```

#### 3.1.4 Reporte de Auditoría Consolidado

**Endpoint**: `GET /api/audit/consolidated`

**Información a mostrar**:
- Resumen de cambios por módulo
- Usuarios más activos
- Horarios de mayor actividad
- Cambios críticos (montos altos, cancelaciones, etc.)
- Alertas de seguridad (múltiples intentos fallidos, accesos sospechosos)

---

## 4. IMPLEMENTACIÓN TÉCNICA

### 4.1 Arquitectura

```
┌─────────────────────────────────────────────┐
│           Application Layer                 │
│  ┌─────────────────────────────────────┐   │
│  │     AuditInterceptor (NestJS)       │   │
│  │  - Captura request/response         │   │
│  │  - Extrae información del usuario   │   │
│  │  - Llama a AuditService            │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│           Domain Layer                      │
│  ┌─────────────────────────────────────┐   │
│  │     AuditService                    │   │
│  │  - createAuditLog()                 │   │
│  │  - logEntityChange()                │   │
│  │  - logUserSession()                 │   │
│  │  - logUserActivity()                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│         Infrastructure Layer                │
│  ┌─────────────────────────────────────┐   │
│  │  AuditRepository (TypeORM)          │   │
│  │  - PostgreSQL Database              │   │
│  │  - Tablas de auditoría              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 4.2 Entidades TypeORM

#### ReservationAuditLog Entity

```typescript
@Entity('reservation_audit_log')
export class ReservationAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Reservation)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column()
  reservationId: string;

  @Column()
  actionType: AuditActionType;

  @Column({ nullable: true })
  fieldChanged?: string;

  @Column('text', { nullable: true })
  oldValue?: string;

  @Column('text', { nullable: true })
  newValue?: string;

  @Column('text', { nullable: true })
  changeReason?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser?: User;

  @Column({ nullable: true })
  changedByUserId?: string;

  @Column()
  changedByUsername: string;

  @Column()
  changedBySystem: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column('text', { nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  changedAt: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
```

#### UserSession Entity

```typescript
@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  userId: string;

  @Column()
  username: string;

  @Column()
  loginAt: Date;

  @Column({ nullable: true })
  loginIp?: string;

  @Column('text', { nullable: true })
  loginUserAgent?: string;

  @Column({ nullable: true })
  loginLocation?: string;

  @Column({ nullable: true })
  logoutAt?: Date;

  @Column({ nullable: true })
  logoutType?: 'MANUAL' | 'AUTO' | 'EXPIRED' | 'FORCED';

  @Column({ nullable: true })
  sessionToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ default: true })
  isActive: boolean;
}
```

### 4.3 Servicios

#### AuditService

```typescript
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(ReservationAuditLog)
    private reservationAuditRepo: Repository<ReservationAuditLog>,
    @InjectRepository(UserSession)
    private userSessionRepo: Repository<UserSession>,
    @InjectRepository(UserActivityLog)
    private userActivityRepo: Repository<UserActivityLog>,
  ) {}

  async logReservationChange(params: {
    reservationId: string;
    actionType: AuditActionType;
    fieldChanged?: string;
    oldValue?: any;
    newValue?: any;
    changeReason?: string;
    userId?: string;
    username: string;
    system: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<ReservationAuditLog> {
    const auditLog = this.reservationAuditRepo.create({
      reservationId: params.reservationId,
      actionType: params.actionType,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      changeReason: params.changeReason,
      changedByUserId: params.userId,
      changedByUsername: params.username,
      changedBySystem: params.system,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });

    return this.reservationAuditRepo.save(auditLog);
  }

  async createUserSession(params: {
    userId: string;
    username: string;
    ipAddress?: string;
    userAgent?: string;
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<UserSession> {
    const session = this.userSessionRepo.create({
      userId: params.userId,
      username: params.username,
      loginAt: new Date(),
      loginIp: params.ipAddress,
      loginUserAgent: params.userAgent,
      sessionToken: params.sessionToken,
      refreshToken: params.refreshToken,
      expiresAt: params.expiresAt,
      isActive: true,
    });

    return this.userSessionRepo.save(session);
  }

  async closeUserSession(
    sessionId: string,
    logoutType: 'MANUAL' | 'AUTO' | 'EXPIRED' | 'FORCED',
  ): Promise<void> {
    await this.userSessionRepo.update(sessionId, {
      logoutAt: new Date(),
      logoutType,
      isActive: false,
    });
  }

  async logUserActivity(params: {
    sessionId: string;
    userId: string;
    activityType: string;
    activityDescription?: string;
    endpoint?: string;
    httpMethod?: string;
    requestParams?: any;
    responseStatus?: number;
    responseTimeMs?: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const activity = this.userActivityRepo.create(params);
    await this.userActivityRepo.save(activity);
  }

  // Métodos para reportes
  async getReservationChanges(filters: ReservationAuditFilters) {
    // Implementar query con filtros
  }

  async getUserSessions(filters: UserSessionFilters) {
    // Implementar query con filtros
  }

  async getUserActivity(filters: UserActivityFilters) {
    // Implementar query con filtros
  }
}
```

### 4.4 Interceptor para Captura Automática

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const responseTime = Date.now() - startTime;
        
        await this.auditService.logUserActivity({
          sessionId: request.sessionId,
          userId: user?.id,
          activityType: 'API_CALL',
          endpoint: request.url,
          httpMethod: request.method,
          requestParams: request.body,
          responseStatus: response?.statusCode || 200,
          responseTimeMs: responseTime,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
```

### 4.5 Decorator para Auditoría de Entidades

```typescript
export function Auditable(entityName: string) {
  return function (target: any) {
    const originalSave = target.prototype.save;
    
    target.prototype.save = async function (...args: any[]) {
      const oldValues = { ...this };
      const result = await originalSave.apply(this, args);
      const newValues = { ...this };
      
      // Detectar cambios y registrar en auditoría
      // ... lógica de comparación y registro
      
      return result;
    };
  };
}
```

---

## 5. MIGRACIÓN DE BASE DE DATOS

### 5.1 Crear Migración

```bash
npm run migration:create -- apps/backend/src/migrations/CreateAuditTables
```

### 5.2 Archivos de Migración

1. `CreateReservationAuditLog.ts`
2. `CreateUserSessions.ts`
3. `CreateUserActivityLog.ts`
4. `AddAuditFieldsToReservations.ts`
5. `CreateAuditIndexes.ts`

---

## 6. PLAN DE EJECUCIÓN

### Fase 1: Fundamentos (Semana 1)
- [ ] Crear tablas de auditoría en BD
- [ ] Implementar entidades TypeORM
- [ ] Crear AuditService básico
- [ ] Agregar campos de auditoría a Reservation entity

### Fase 2: Trazabilidad de Reservas (Semana 2)
- [ ] Implementar logging de creación de reservas
- [ ] Implementar logging de cambios de estado
- [ ] Implementar logging de modificaciones (fechas, montos)
- [ ] Implementar logging de eliminación
- [ ] Tests unitarios y de integración

### Fase 3: Login-Logout (Semana 3)
- [ ] Implementar UserSession al login
- [ ] Implementar cierre de sesión (manual, automático, expiración)
- [ ] Implementar logging de actividad de usuario
- [ ] Crear interceptor para captura automática
- [ ] Tests de autenticación

### Fase 4: Reportes (Semana 4)
- [ ] Implementar endpoints de reportes
- [ ] Crear DTOs para filtros
- [ ] Implementar queries optimizadas
- [ ] Crear vistas en frontend para reportes
- [ ] Dashboard de auditoría

### Fase 5: Optimización y Documentación (Semana 5)
- [ ] Optimizar queries de reportes
- [ ] Implementar paginación
- [ ] Implementar exportación (CSV/PDF)
- [ ] Documentación técnica
- [ ] Capacitación a usuarios

---

## 7. CONSIDERACIONES DE SEGURIDAD

### 7.1 Protección de Datos Sensibles
- No almacenar contraseñas en auditoría
- Ofuscar datos sensibles (tarjetas de crédito)
- Encriptar información crítica

### 7.2 Retención de Datos
- Definir política de retención (ej: 7 años para fines legales)
- Implementar archivado automático
- Implementar eliminación segura

### 7.3 Acceso a Auditoría
- Solo usuarios con permiso `VIEW_AUDIT_LOGS`
- Auditar el acceso a los logs de auditoría
- Implementar niveles de acceso (solo su actividad vs toda la actividad)

---

## 8. MÉTRICAS Y MONITOREO

### 8.1 KPIs
- Número de cambios por día/semana/mes
- Usuarios más activos
- Operaciones críticas realizadas
- Tiempo de respuesta de queries de auditoría

### 8.2 Alertas
- Cambios masivos en corto tiempo
- Accesos desde IPs sospechosas
- Múltiples intentos fallidos de login
- Modificaciones de montos significativos

---

## 9. TESTING

### 9.1 Tests Unitarios
- AuditService methods
- Interceptor logic
- Repository queries

### 9.2 Tests de Integración
- Flujo completo de creación de reserva con auditoría
- Flujo de login-logout
- Generación de reportes

### 9.3 Tests de Performance
- Inserción masiva de logs
- Queries de reportes con grandes volúmenes
- Impacto en performance del sistema principal

---

## 10. DOCUMENTACIÓN

### 10.1 Documentación Técnica
- Arquitectura del sistema de auditoría
- Modelos de datos
- APIs de auditoría

### 10.2 Documentación de Usuario
- Cómo acceder a reportes
- Interpretación de logs
- Casos de uso comunes

### 10.3 Documentación Legal
- Cumplimiento normativo
- Política de retención
- Procedimientos de respaldo

---

## RESUMEN

Este plan implementa un sistema completo de auditoría centrado en las **Reservas** como elemento crítico, proporcionando:

✅ **Trazabilidad completa**: Registro de creación, modificaciones y eliminaciones  
✅ **Login-Logout**: Control de sesiones y actividad de usuarios  
✅ **Reportes**: Información detallada para análisis y cumplimiento normativo  
✅ **Seguridad**: Protección de datos y acceso controlado  
✅ **Escalabilidad**: Diseño preparado para grandes volúmenes de datos  

El sistema permitirá responder preguntas como:
- ¿Quién creó esta reserva y cuándo?
- ¿Qué cambios se hicieron a esta reserva?
- ¿Quién modificó el monto de la reserva y por qué?
- ¿Cuándo y quién inició sesión?
- ¿Qué operaciones realizó un usuario en un período de tiempo?
