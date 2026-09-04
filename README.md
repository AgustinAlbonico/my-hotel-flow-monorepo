# My Hotel Flow

Sistema de gestión hotelera full-stack que cubre todo el ciclo de vida de una
estadía: **Cliente → Reserva → Check-In → Estadía → Check-Out → Factura →
Pagos → Cierre**. Incluye gestión de habitaciones y tipos, clientes, usuarios
con permisos granulares (RBAC), facturación con comprobantes PDF y cobros
online con MercadoPago.

---

## Funcionalidades

- **Reservas**: creación y gestión de reservas por habitación y tipo, con
  estados y transiciones auditables (`docs/FLUJO_OPERATIVO_HOTEL.md`).
- **Check-In / Check-Out**: flujo operativo completo de la estadía.
- **Habitaciones**: administración de habitaciones, tipos y características.
- **Clientes**: ficha completa (DNI, contacto, dirección), búsqueda y histórico.
- **Facturación**: generación de facturas y comprobantes en PDF (Puppeteer en
  backend; vista de ejemplo en `docs/factura-ejemplo.html`).
- **Pagos online**: integración con MercadoPago (checkout Pro, webhooks de
  notificación, flujo de prueba documentado).
- **Seguridad**: RBAC con acciones y grupos de permisos, JWT access + refresh,
  hash de contraseñas con Argon2, lockout por intentos fallidos, cache de
  permisos en Redis.
- **Notificaciones**: email transaccional con templates Handlebars (MailHog en
  dev) y SMS opcional vía Twilio.
- **Dashboard**: métricas y reportes del hotel.

---

## Stack

- **Backend**: NestJS 11 + TypeScript, TypeORM 0.3, PostgreSQL, Redis
  (cache), Passport (JWT access/refresh), Argon2, Helmet, Swagger, Terminus
  (health checks), @nestjs/schedule, MercadoPago SDK, Puppeteer (PDF),
  Nodemailer + Handlebars, Twilio (opcional).
- **Frontend**: React 18 + Vite 5 + TypeScript, TanStack Query, React Hook
  Form + Zod, Tailwind CSS, Headless UI, Recharts, jsPDF + xlsx, React Router.
- **Monorepo**: npm workspaces + Turborepo.
- **Calidad**: Jest (unit + e2e), ESLint + Prettier, SonarQube
  (`sonar-project.properties`).
- **Infra local**: Docker Compose con PostgreSQL, Redis, MailHog y Adminer.

---

## Estructura del monorepo

```
my-hotel-flow-monorepo/
├── apps/
│   ├── backend/            # @myhotelflow/backend — NestJS + TypeORM + PostgreSQL
│   └── web/                # @myhotelflow/web — React + Vite
├── docs/
│   ├── architecture/       # ADRs, stack tecnológico, design system, respuestas API
│   ├── features/           # checkout, pagos, comprobantes PDF, habitaciones, auditoría
│   ├── security/           # RBAC, permisos y acceso, módulo de seguridad
│   ├── setup/              # guía de instalación, variables de entorno, cuentas seed
│   ├── FLUJO_OPERATIVO_HOTEL.md
│   └── MERCADOPAGO_SETUP.md / COMO_PROBAR_MERCADOPAGO.md
├── docker-compose.yml      # postgres + redis + mailhog + adminer
└── package.json            # scripts raíz del monorepo
```

---

## Setup local

### 1. Prerrequisitos

- Node.js 20+ y npm 10+
- Docker Desktop (o Docker Engine) corriendo

### 2. Levantar la infraestructura

```bash
docker compose up -d
```

Expone PostgreSQL (5432), Redis (6379), MailHog (http://localhost:8025) y
Adminer (http://localhost:8080).

### 3. Variables de entorno

Backend: copiar `.env.example` a `apps/backend/.env` y ajustar valores. El
archivo documenta base de datos, Redis, JWT, Argon2, email, Twilio y
MercadoPago. Las credenciales de prueba de MercadoPago se obtienen del [panel
de desarrolladores](https://www.mercadopago.com.ar/developers/panel)
(ver `docs/MERCADOPAGO_SETUP.md`).

### 4. Instalar dependencias

```bash
npm install
```

### 5. Migraciones y seed

```bash
# desde apps/backend
npm run migration:run   # aplica migraciones TypeORM
npm run seed            # usuarios, roles, permisos y datos de prueba
```

Las cuentas creadas por el seed están descriptas en
`docs/setup/CUENTAS_SEED.md`.

### 6. Levantar dev servers

```bash
npm run dev             # backend + web en paralelo (Turborepo)
npm run dev:backend     # solo backend — http://localhost:3000
npm run dev:web         # solo web — http://localhost:5173
```

Swagger UI disponible en desarrollo.

---

## Comandos útiles

```bash
# Raíz (Turborepo)
npm run build           # build de todos los workspaces
npm run dev             # dev backend + web
npm run start           # modo producción

# Backend (apps/backend)
npm test                # jest
npm run test:e2e        # jest e2e
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm run migration:run   # migraciones TypeORM
npm run seed            # datos iniciales
```

---

## Seguridad y RBAC

El backend implementa un módulo de seguridad propio con acciones y grupos de
permisos asignables por usuario, guardas de NestJS por permiso, lockout
temporario tras intentos fallidos y expiración de tokens con refresh. El
detalle completo vive en `docs/security/`.

---

## Documentación

- `docs/FLUJO_OPERATIVO_HOTEL.md` — flujo operativo completo del hotel.
- `docs/architecture/` — ADRs, estructura de respuestas API, mejores prácticas.
- `docs/features/` — diseño de módulos (checkout, pagos, comprobantes, auditoría).
- `docs/setup/` — instalación, variables de entorno y cuentas de prueba.

---

## Licencia

Privado. Todos los derechos reservados.
