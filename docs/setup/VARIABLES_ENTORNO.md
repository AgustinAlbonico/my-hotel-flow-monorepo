# Variables de Entorno - MyHotelFlow Monorepo

## 📍 Ubicación Centralizada

Las variables de entorno están **centralizadas en la raíz del monorepo** en el archivo `.env`.

```
my-hotel-flow/
├── .env                    ← Variables de entorno (AQUÍ)
├── .env.example            ← Template con todas las variables
├── apps/
│   ├── backend/
│   │   └── .env.example    ← Solo documentación
│   └── web/
│       └── .env.example    ← Solo documentación
└── ...
```

## ⚙️ Configuración Inicial

### 1. Crear archivo .env

```bash
# Desde la raíz del proyecto
cp .env.example .env
```

### 2. Editar valores

Abre `.env` y ajusta los valores según tu entorno:

```env
# Ejemplo: Cambiar base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_DATABASE=myhotelflow

# Ejemplo: JWT secret (IMPORTANTE en producción)
JWT_SECRET=genera-un-secreto-seguro-min-32-caracteres

# Ejemplo: Frontend API URL
VITE_API_URL=http://localhost:3000/api/v1
```

## 📋 Variables Disponibles

### General
```env
NODE_ENV=development          # development | production | test
PORT=3000                     # Puerto del backend
API_PREFIX=api                # Prefijo de rutas API
```

### Base de Datos (PostgreSQL)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=myhotelflow
DB_SYNCHRONIZE=true          # ⚠️ false en producción
DB_LOGGING=false             # true para debug SQL
```

### Redis (Cache)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### JWT (Autenticación)
```env
JWT_SECRET=change-this-in-production-min-32-chars
JWT_ACCESS_EXPIRATION=1d     # 15m, 1h, 1d, 7d
JWT_REFRESH_EXPIRATION=7d
```

### Argon2 (Hashing de Contraseñas)
```env
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4
```

### Seguridad
```env
LOCKOUT_THRESHOLD=5              # Intentos antes de bloqueo
LOCKOUT_DURATION=900000          # 15 minutos en ms
PASSWORD_RESET_EXPIRATION=3600000 # 1 hora en ms
PERMISSIONS_CACHE_TTL=900         # 15 minutos en segundos
CORS_ORIGIN=http://localhost:5173
```

### Email
```env
MAIL_HOST=localhost          # Para desarrollo: MailHog
MAIL_PORT=1025              # MailHog SMTP
MAIL_FROM="MyHotelFlow <no-reply@myhotelflow.example>"

# Producción (ejemplo con Gmail):
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_USER=tu-email@gmail.com
# MAIL_PASS=tu-app-password
```

### URLs de Aplicación
```env
APP_URL=https://app.myhotelflow.example
SUPPORT_EMAIL=soporte@myhotelflow.example
ASSET_BASE_URL=                    # CDN URL (opcional)
```

### Twilio (SMS - Opcional)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_token
TWILIO_FROM=+1234567890
```

### Frontend (Vite)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=MyHotelFlow
VITE_JWT_TOKEN_KEY=myhotelflow_access_token
VITE_JWT_REFRESH_TOKEN_KEY=myhotelflow_refresh_token
```

⚠️ **NOTA**: Las variables del frontend DEBEN tener el prefijo `VITE_` para ser accesibles en el código React.

## 🔧 Cómo Funciona

### Backend (NestJS)

El backend lee automáticamente el `.env` de la raíz gracias a la configuración en `apps/backend/src/app.module.ts`:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
  envFilePath: [
    '../../.env',  // Root .env del monorepo
    '.env',        // Fallback local (si existe)
  ],
})
```

**Uso en código:**
```typescript
import { ConfigService } from '@nestjs/config';

constructor(private configService: ConfigService) {
  const dbHost = this.configService.get<string>('DB_HOST');
  const port = this.configService.get<number>('PORT');
}
```

### Frontend (Vite + React)

El frontend lee el `.env` de la raíz gracias a la configuración en `apps/web/vite.config.ts`:

```typescript
export default defineConfig({
  envDir: path.resolve(__dirname, '../../'), // Usa .env del root
  // ...
})
```

**Uso en código:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

## 🌍 Diferentes Entornos

### Desarrollo Local
Usa `.env` en la raíz (ya configurado).

### Docker Development
Las variables se pasan desde el `.env` al docker-compose:

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT}
      # etc...
```

### Producción
Configura las variables en tu plataforma de deployment:

- **Vercel**: Settings → Environment Variables
- **Railway**: Settings → Variables
- **AWS/Azure**: Secrets Manager / Key Vault
- **Heroku**: Config Vars

## 🔒 Seguridad

### ✅ Hacer
- ✅ Mantener `.env` en `.gitignore`
- ✅ Usar `.env.example` como template
- ✅ Rotar secrets regularmente en producción
- ✅ Usar secretos diferentes por entorno
- ✅ Longitud mínima de JWT_SECRET: 32 caracteres

### ❌ NO Hacer
- ❌ Commitear `.env` al repositorio
- ❌ Compartir `.env` por email/chat
- ❌ Usar los mismos secretos en dev y producción
- ❌ Hardcodear valores sensibles en el código
- ❌ Exponer variables sin prefijo `VITE_` en frontend

## 🐛 Troubleshooting

### Variables no se cargan

1. **Verificar archivo existe:**
   ```bash
   ls -la .env
   ```

2. **Verificar sintaxis:**
   ```env
   # ✅ Correcto
   DB_HOST=localhost

   # ❌ Incorrecto (sin comillas)
   DB_HOST="localhost"

   # ✅ Correcto (con espacios)
   MAIL_FROM="MyHotelFlow <email@example.com>"
   ```

3. **Reiniciar servicios:**
   ```bash
   # Ctrl+C en ambos terminales, luego:
   pnpm dev:backend
   pnpm dev:web
   ```

### Variables de frontend no funcionan

1. **Verificar prefijo `VITE_`:**
   ```env
   # ❌ No funciona
   API_URL=http://localhost:3000

   # ✅ Funciona
   VITE_API_URL=http://localhost:3000
   ```

2. **Rebuild frontend:**
   ```bash
   pnpm build:web
   pnpm dev:web
   ```

### Docker no lee variables

Asegúrate de que docker-compose.yml tenga:

```yaml
services:
  backend:
    env_file:
      - .env  # Lee .env de la raíz
```

O pasa variables explícitamente:

```yaml
services:
  backend:
    environment:
      - DB_HOST=${DB_HOST}
```

## 📚 Referencias

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

## Resumen Rápido

```bash
# 1. Crear .env desde template
cp .env.example .env

# 2. Editar valores
nano .env  # o tu editor favorito

# 3. Reiniciar servicios
pnpm dev

# ✅ ¡Listo! Ambas apps usan el mismo .env
```

**Ubicación:** `/.env` (raíz del monorepo)

**Template:** `/.env.example`

**Backend lee desde:** `../../.env` (relativo a apps/backend)

**Frontend lee desde:** `../../` (relativo a apps/web)
