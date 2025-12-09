# 🚀 Guía de Instalación - MyHotelFlow

Esta guía te llevará paso a paso para levantar el proyecto MyHotelFlow desde cero en tu entorno de desarrollo.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta | Versión Mínima | Verificar |
|-------------|----------------|-----------|
| **Node.js** | v18+ | `node --version` |
| **npm** | v9+ | `npm --version` |
| **Docker** | v20+ | `docker --version` |
| **Docker Compose** | v2+ | `docker compose version` |
| **Git** | v2+ | `git --version` |

---

## 📦 Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/AgustinAlbonico/my-hotel-flow-monorepo.git
cd my-hotel-flow-monorepo
```

---

## ⚙️ Paso 2: Configurar Variables de Entorno

### 2.1 Crear archivo `.env`

Copia el archivo de ejemplo a `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

### 2.2 Variables por defecto (desarrollo)

El archivo `.env.example` ya tiene valores configurados para desarrollo local. Los más importantes son:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=myhotelflow

# JWT (cambia esto en producción)
JWT_SECRET=change-this-secret-key-min-32-chars-long-for-production

# Frontend
VITE_API_URL=http://localhost:3000/api/v1

# CORS
CORS_ORIGIN=http://localhost:5173
```

> 💡 **Nota:** Para desarrollo, los valores por defecto funcionan perfectamente.

---

## 🐳 Paso 3: Levantar Servicios con Docker

Inicia los servicios necesarios (PostgreSQL, Redis, MailHog):

```bash
docker compose up -d
```

Esto levantará:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **PostgreSQL** | 5432 | Base de datos principal |
| **Redis** | 6379 | Cache y blacklist de tokens |
| **MailHog** | 1025 (SMTP) / 8025 (Web) | Servidor de email para pruebas |
| **Adminer** | 8080 | Interfaz web para la BD |

### Verificar que los servicios están corriendo:

```bash
docker compose ps
```

### Acceso a interfaces web:

- **MailHog UI:** http://localhost:8025 (ver emails enviados)
- **Adminer:** http://localhost:8080 (gestionar BD)
  - Sistema: PostgreSQL
  - Servidor: postgres
  - Usuario: postgres
  - Contraseña: postgres
  - Base de datos: myhotelflow

---

## 📥 Paso 4: Instalar Dependencias

Desde la raíz del monorepo:

```bash
npm install
```

Esto instalará las dependencias de todos los workspaces (backend y web).

---

## 🗃️ Paso 5: Ejecutar Migraciones de Base de Datos

Las migraciones crean la estructura de tablas en PostgreSQL:

```bash
cd apps/backend
npm run migration:run
```

Deberías ver:

```
13 migrations were found in the source code.
13 migrations are new migrations must be executed.
...
Migration completed successfully.
```

---

## 🌱 Paso 6: Ejecutar el Seed (Datos Iniciales)

El seed crea usuarios, roles, permisos y datos de prueba:

```bash
npm run seed
```

### Cuentas creadas por el Seed:

#### 👨‍💼 Administrador

| Campo | Valor |
|-------|-------|
| **Usuario** | `admin` |
| **Email** | `admin@hotel.com` |
| **Contraseña** | `Admin123!` |

#### 👩‍💼 Recepcionistas

| Usuario | Email | Contraseña |
|---------|-------|------------|
| `recepcionista1` | `recepcionista1@hotel.com` | `Recep123!` |
| `recepcionista2` | `recepcionista2@hotel.com` | `Recep123!` |

#### 👤 Clientes

| Usuario | Email | Contraseña |
|---------|-------|------------|
| `cliente1` | `cliente1@hotel.com` | `Cliente123!` |
| `cliente2` | `cliente2@hotel.com` | `Cliente123!` |
| `cliente3` | `cliente3@hotel.com` | `Cliente123!` |

---

## ▶️ Paso 7: Iniciar la Aplicación

### Opción A: Iniciar ambos servicios (recomendado)

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto inicia tanto el backend como el frontend en paralelo usando Turbo.

### Opción B: Iniciar por separado

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:web
```

---

## 🌐 Paso 8: Acceder a la Aplicación

Una vez iniciada, accede a:

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000/api/v1 |
| **Swagger (API Docs)** | http://localhost:3000/api |
| **MailHog** | http://localhost:8025 |
| **Adminer** | http://localhost:8080 |

### Iniciar sesión:

1. Ve a http://localhost:5173
2. Usa las credenciales del administrador:
   - **Email:** `admin@hotel.com`
   - **Contraseña:** `Admin123!`

---

## 📝 Resumen de Comandos

```bash
# 1. Clonar repositorio
git clone https://github.com/AgustinAlbonico/my-hotel-flow-monorepo.git
cd my-hotel-flow-monorepo

# 2. Configurar variables
cp .env.example .env

# 3. Levantar Docker
docker compose up -d

# 4. Instalar dependencias
npm install

# 5. Ejecutar migraciones
cd apps/backend
npm run migration:run

# 6. Ejecutar seed
npm run seed

# 7. Volver a la raíz e iniciar
cd ../..
npm run dev
```

---

## 🔧 Comandos Útiles

### Base de Datos

```bash
# Ver estado de migraciones
npm run migration:show

# Revertir última migración
npm run migration:revert

# Generar nueva migración
npm run migration:generate src/infrastructure/persistence/typeorm/migrations/NombreMigracion
```

### Docker

```bash
# Ver logs de un servicio
docker compose logs -f postgres

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker compose down -v

# Reiniciar un servicio específico
docker compose restart postgres
```

### Desarrollo

```bash
# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:web

# Build de producción
npm run build

# Ejecutar tests
cd apps/backend && npm test
cd apps/web && npm test
```

---

## ❗ Solución de Problemas Comunes

### Error: "relation does not exist"

La tabla `migrations` está vacía pero las migraciones ya se aplicaron. Solución:

```bash
# Verificar tablas existentes en Adminer (http://localhost:8080)
# Si las tablas existen, insertar registros de migración manualmente
```

### Error: Puerto en uso

```bash
# Verificar qué está usando el puerto
netstat -ano | findstr :5432

# Cambiar puertos en docker-compose.yml o .env
```

### Error: Docker no conecta

```bash
# Verificar que Docker está corriendo
docker info

# Reiniciar servicios
docker compose down
docker compose up -d
```

### Error: npm install falla

```bash
# Limpiar cache
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules apps/*/node_modules
npm install
```

---

## 📚 Documentación Adicional

- [Variables de Entorno](./VARIABLES_ENTORNO.md)
- [Cuentas del Seed](./CUENTAS_SEED.md)
- [Arquitectura del Proyecto](../architecture/STACK_TECNOLOGICO.md)
- [Flujo Operativo del Hotel](../FLUJO_OPERATIVO_HOTEL.md)

---

**Última actualización:** 9 de diciembre de 2025
