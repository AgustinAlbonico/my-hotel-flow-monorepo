# MyHotelFlow - Frontend

Sistema de Reservas Hoteleras - Interfaz de Usuario

## 🚀 Stack Tecnológico

- **React 18+** - Librería de UI
- **TypeScript 5+** - Tipado estático con strict mode
- **Vite 5+** - Build tool y dev server
- **Tailwind CSS 3+** - Utility-first CSS
- **TanStack Query v5** - Data fetching y state management
- **React Hook Form** - Gestión de formularios
- **Zod** - Schema validation
- **Axios** - HTTP client
- **React Router v6** - Routing
- **Lucide React** - Iconos
- **Headless UI** - Componentes accesibles

## 📋 Requisitos Previos

- Node.js 18+ o 20+
- npm 9+ o yarn 1.22+

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tu configuración
```

## 🔧 Configuración

Editar el archivo `.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=MyHotelFlow
VITE_JWT_TOKEN_KEY=myhotelflow_access_token
VITE_JWT_REFRESH_TOKEN_KEY=myhotelflow_refresh_token
```

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor estará disponible en http://localhost:5173
```

## 🏗️ Build

```bash
# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## ✅ Quality Checks

```bash
# Verificar tipos de TypeScript
npm run typecheck

# Ejecutar linting
npm run lint

# Formatear código
npm run format

# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage
```

## 📁 Estructura del Proyecto

```
src/
├── api/                    # Configuración de axios y endpoints
├── components/             # Componentes reutilizables
│   ├── ui/                # Componentes base (Button, Input, Modal)
│   ├── layout/            # Layout components (Navbar, Sidebar)
│   ├── features/          # Componentes de negocio
│   └── auth/              # Componentes de autenticación
├── contexts/              # Context providers
├── hooks/                 # Custom hooks
├── pages/                 # Páginas/Rutas
├── routes/                # Configuración de rutas
├── schemas/               # Zod schemas
├── types/                 # TypeScript types
├── utils/                 # Utilidades
├── config/                # Configuración
└── test/                  # Setup de tests
```

## 🔐 Autenticación

El sistema usa JWT con refresh tokens automáticos:

- **Access Token:** 15 minutos
- **Refresh Token:** 7 días
- **Storage:** localStorage
- **Auto-refresh:** Automático via axios interceptors

## 🛡️ Sistema de Permisos

Basado en acciones granulares. Ejemplo:

```tsx
import { Can } from '@/components/auth/Can';

// Renderizado condicional
<Can perform="users.create">
  <button>Crear Usuario</button>
</Can>

// Múltiples permisos (AND)
<Can perform={['users.create', 'users.edit']} requireAll>
  <button>Gestionar Usuarios</button>
</Can>

// Múltiples permisos (OR)
<Can perform={['users.view', 'users.edit']} requireAll={false}>
  <button>Ver o Editar Usuarios</button>
</Can>
```

## 🛣️ Rutas Protegidas

```tsx
import { ProtectedRoute } from '@/routes/ProtectedRoute';

// Ruta solo autenticada
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>

// Ruta con permisos específicos
<Route element={<ProtectedRoute requiredPermissions={['users.create']} />}>
  <Route path="/users/create" element={<UserFormPage />} />
</Route>
```

## 🎨 Design System

El proyecto sigue el design system definido en `DESIGN_SYSTEM.md`:

- **Paleta de colores:** Primary, Accent, Success, Warning, Error
- **Componentes:** Button, Input, Modal, Alert, Spinner, etc.
- **Clases utilitarias:** `.btn-primary`, `.input`, `.card`, `.badge-*`
- **Responsive:** Mobile-first con breakpoints Tailwind

## 📝 Mejores Prácticas

Ver `MEJORES_PRACTICAS.md` para:

- TypeScript strict mode
- ESLint configuración
- Patrones de diseño
- Testing guidelines
- Comentarios y documentación
- Performance y optimización

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test -- --watch

# Coverage report
npm run test:coverage
```

## 📦 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Previsualiza build de producción |
| `npm run typecheck` | Verifica tipos de TypeScript |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea código con Prettier |
| `npm run test` | Ejecuta tests con Vitest |
| `npm run test:ui` | Abre UI de tests |
| `npm run test:coverage` | Genera reporte de coverage |

## 🤝 Contribución

1. Seguir las mejores prácticas definidas en `MEJORES_PRACTICAS.md`
2. Usar TypeScript strict mode (sin `any`)
3. Pasar typecheck, lint y tests antes de commit
4. Documentar funciones públicas con JSDoc
5. Escribir tests para nuevas features

## 📄 Licencia

Privado - MyHotelFlow © 2025

## 🔗 Enlaces

- [Backend](../backend/README.md)
- [Design System](../DESIGN_SYSTEM.md)
- [Stack Tecnológico](../STACK_TECNOLOGICO.md)
- [Mejores Prácticas](../MEJORES_PRACTICAS.md)
