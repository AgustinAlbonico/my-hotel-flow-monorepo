# DESIGN SYSTEM — MyHotelFlow

Sistema de diseño y estilos predefinidos para la aplicación de reservas hoteleras MyHotelFlow.

**Última actualización:** Octubre 2025  
**Framework:** Tailwind CSS 3.x  
**Aplicable a:** Frontend (React)

---

## 📋 Tabla de Contenidos
1. [Paleta de Colores](#paleta-de-colores)
2. [Tipografía](#tipografía)
3. [Espaciado y Grid](#espaciado-y-grid)
4. [Sombras](#sombras)
5. [Bordes y Radio](#bordes-y-radio)
6. [Componentes Base](#componentes-base)
7. [Estados Interactivos](#estados-interactivos)
8. [Iconografía](#iconografía)
9. [Animaciones](#animaciones)
10. [Breakpoints Responsivos](#breakpoints-responsivos)
11. [Accesibilidad](#accesibilidad)
12. [Configuración Tailwind](#configuración-tailwind)

---

## 🎨 Paleta de Colores

### Colores Primarios (Brand)
```css
/* Azul Hotel (Primary) */
--color-primary-50:  #eff6ff;  /* Muy claro */
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Base */
--color-primary-600: #2563eb;  /* Hover/Active */
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;

/* Dorado Elegante (Accent) */
--color-accent-50:  #fefce8;
--color-accent-100: #fef9c3;
--color-accent-200: #fef08a;
--color-accent-300: #fde047;
--color-accent-400: #facc15;
--color-accent-500: #eab308;  /* Base */
--color-accent-600: #ca8a04;  /* Hover */
--color-accent-700: #a16207;
--color-accent-800: #854d0e;
--color-accent-900: #713f12;
```

### Colores Semánticos
```css
/* Success (Verde) */
--color-success-500: #10b981;
--color-success-600: #059669;

/* Warning (Amarillo) */
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;

/* Error (Rojo) */
--color-error-500: #ef4444;
--color-error-600: #dc2626;

/* Info (Azul claro) */
--color-info-500: #06b6d4;
--color-info-600: #0891b2;
```

### Colores Neutrales (Grises)
```css
--color-gray-50:  #f9fafb;  /* Backgrounds claros */
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;  /* Borders */
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;  /* Texto secundario */
--color-gray-600: #4b5563;
--color-gray-700: #374151;  /* Texto principal */
--color-gray-800: #1f2937;
--color-gray-900: #111827;  /* Muy oscuro */
```

### Uso en Tailwind
```jsx
{/* Botón primario */}
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Reservar Ahora
</button>

{/* Badge de estado */}
<span className="bg-success-100 text-success-700 px-2 py-1 rounded">
  Confirmado
</span>

{/* Texto secundario */}
<p className="text-gray-500">Información adicional</p>
```

---

## 📝 Tipografía

### Familias de Fuentes
```css
/* Recomendación: */
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-serif: 'Merriweather', Georgia, serif;  /* Títulos elegantes */
--font-mono: 'JetBrains Mono', Consolas, monospace;
```

### Escalas de Tamaño
```jsx
{/* Display (Títulos grandes) */}
<h1 className="text-5xl md:text-6xl font-bold">  {/* 48px / 60px */}
  Bienvenido a MyHotel
</h1>

{/* Headings */}
<h2 className="text-4xl font-semibold">  {/* 36px */}
<h3 className="text-3xl font-semibold">  {/* 30px */}
<h4 className="text-2xl font-medium">    {/* 24px */}
<h5 className="text-xl font-medium">     {/* 20px */}
<h6 className="text-lg font-medium">     {/* 18px */}

{/* Body */}
<p className="text-base">      {/* 16px - Default */}
<p className="text-sm">        {/* 14px - Secundario */}
<p className="text-xs">        {/* 12px - Labels, captions */}

{/* Weights */}
<span className="font-light">    {/* 300 */}
<span className="font-normal">   {/* 400 */}
<span className="font-medium">   {/* 500 */}
<span className="font-semibold"> {/* 600 */}
<span className="font-bold">     {/* 700 */}
```

### Line Height
```jsx
<p className="leading-tight">   {/* 1.25 - Headings */}
<p className="leading-normal">  {/* 1.5 - Default */}
<p className="leading-relaxed"> {/* 1.625 - Body extenso */}
<p className="leading-loose">   {/* 2 - Espaciado amplio */}
```

---

## 📏 Espaciado y Grid

### Sistema de Espaciado (8px base)
```jsx
{/* Padding / Margin */}
p-0    {/* 0px */}
p-1    {/* 4px */}
p-2    {/* 8px */}
p-3    {/* 12px */}
p-4    {/* 16px */}
p-5    {/* 20px */}
p-6    {/* 24px */}
p-8    {/* 32px */}
p-10   {/* 40px */}
p-12   {/* 48px */}
p-16   {/* 64px */}
p-20   {/* 80px */}
p-24   {/* 96px */}

{/* Ejemplo de card con espaciado */}
<div className="p-6 space-y-4">
  <h3 className="mb-2">Título</h3>
  <p className="mb-4">Descripción</p>
</div>
```

### Contenedores
```jsx
{/* Ancho máximo */}
<div className="container mx-auto px-4 max-w-7xl">
  {/* Contenido principal */}
</div>

{/* Ancho fijo por breakpoint */}
<div className="w-full md:w-2/3 lg:w-1/2 xl:w-1/3">
  {/* Elemento responsivo */}
</div>
```

### Grid Layout
```jsx
{/* Grid de habitaciones (ejemplo) */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <RoomCard />
  <RoomCard />
  <RoomCard />
</div>

{/* Grid de detalles (2 columnas) */}
<div className="grid grid-cols-2 gap-4">
  <div>Check-in</div>
  <div>Check-out</div>
</div>
```

---

## 🌑 Sombras

### Elevaciones
```jsx
{/* Sin sombra */}
<div className="shadow-none">

{/* Sombra suave (cards) */}
<div className="shadow-sm">     {/* Ligera */}
<div className="shadow">        {/* Base - recomendada para cards */}
<div className="shadow-md">     {/* Media */}

{/* Sombra fuerte (modales, dropdowns) */}
<div className="shadow-lg">     {/* Grande */}
<div className="shadow-xl">     {/* Extra grande */}
<div className="shadow-2xl">    {/* Máxima */}

{/* Sombra interior */}
<div className="shadow-inner">

{/* Ejemplo de card */}
<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <CardContent />
</div>
```

---

## 🔲 Bordes y Radio

### Border Radius
```jsx
<div className="rounded-none">   {/* 0px */}
<div className="rounded-sm">     {/* 2px */}
<div className="rounded">        {/* 4px - Default */}
<div className="rounded-md">     {/* 6px */}
<div className="rounded-lg">     {/* 8px - Cards */}
<div className="rounded-xl">     {/* 12px */}
<div className="rounded-2xl">    {/* 16px */}
<div className="rounded-3xl">    {/* 24px */}
<div className="rounded-full">   {/* 9999px - Círculos */}

{/* Bordes individuales */}
<div className="rounded-t-lg">   {/* Solo top */}
<div className="rounded-b-lg">   {/* Solo bottom */}
```

### Bordes
```jsx
{/* Grosor */}
<div className="border">         {/* 1px */}
<div className="border-2">       {/* 2px */}
<div className="border-4">       {/* 4px */}

{/* Color */}
<div className="border border-gray-300">
<div className="border-2 border-primary-600">

{/* Ejemplo de input */}
<input className="border border-gray-300 rounded-md focus:border-primary-500" />
```

---

## 🧩 Componentes Base

### Botones
```jsx
{/* Botón Primario */}
<button className="
  px-6 py-3 
  bg-primary-600 hover:bg-primary-700 
  text-white font-medium 
  rounded-lg 
  shadow-sm hover:shadow-md 
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Reservar Ahora
</button>

{/* Botón Secundario */}
<button className="
  px-6 py-3 
  bg-white hover:bg-gray-50 
  text-primary-600 font-medium 
  border-2 border-primary-600 
  rounded-lg 
  transition-colors duration-200
">
  Ver Detalles
</button>

{/* Botón Ghost */}
<button className="
  px-4 py-2 
  text-gray-700 hover:text-primary-600 hover:bg-gray-100 
  rounded-md 
  transition-colors duration-200
">
  Cancelar
</button>

{/* Botón Icono */}
<button className="
  p-2 
  text-gray-500 hover:text-primary-600 hover:bg-gray-100 
  rounded-full 
  transition-colors
">
  <IconHeart />
</button>
```

### Cards
```jsx
{/* Card Base */}
<div className="
  bg-white 
  rounded-lg 
  shadow-md hover:shadow-xl 
  transition-shadow duration-300 
  overflow-hidden
">
  <img src="room.jpg" className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="text-xl font-semibold mb-2">Suite Deluxe</h3>
    <p className="text-gray-600 mb-4">Descripción de la habitación...</p>
    <div className="flex items-center justify-between">
      <span className="text-2xl font-bold text-primary-600">$120/noche</span>
      <button className="btn-primary">Reservar</button>
    </div>
  </div>
</div>

{/* Card con borde destacado */}
<div className="
  bg-white 
  border-2 border-accent-400 
  rounded-lg 
  p-6
">
  <span className="bg-accent-400 text-accent-900 px-3 py-1 rounded-full text-sm font-medium">
    Oferta Especial
  </span>
  {/* Contenido */}
</div>
```

### Inputs y Formularios
```jsx
{/* Input Base */}
<input 
  type="text" 
  className="
    w-full 
    px-4 py-2 
    border border-gray-300 
    rounded-md 
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    placeholder:text-gray-400
    disabled:bg-gray-100 disabled:cursor-not-allowed
  " 
  placeholder="Nombre completo"
/>

{/* Input con error */}
<input 
  className="
    border-error-500 
    focus:ring-error-500
  " 
/>
<p className="text-error-600 text-sm mt-1">Campo requerido</p>

{/* Select */}
<select className="
  w-full 
  px-4 py-2 
  border border-gray-300 
  rounded-md 
  focus:ring-2 focus:ring-primary-500
">
  <option>Seleccionar tipo de habitación</option>
</select>

{/* Textarea */}
<textarea 
  className="
    w-full 
    px-4 py-2 
    border border-gray-300 
    rounded-md 
    focus:ring-2 focus:ring-primary-500
    min-h-[100px]
  "
  placeholder="Comentarios adicionales..."
></textarea>

{/* Checkbox */}
<label className="flex items-center space-x-2 cursor-pointer">
  <input 
    type="checkbox" 
    className="
      w-4 h-4 
      text-primary-600 
      border-gray-300 
      rounded 
      focus:ring-2 focus:ring-primary-500
    " 
  />
  <span className="text-gray-700">Acepto términos y condiciones</span>
</label>
```

### Badges y Tags
```jsx
{/* Badge de estado */}
<span className="
  inline-flex items-center 
  px-3 py-1 
  text-sm font-medium 
  bg-success-100 text-success-700 
  rounded-full
">
  Confirmado
</span>

<span className="bg-warning-100 text-warning-700 px-3 py-1 rounded-full text-sm">
  Pendiente
</span>

<span className="bg-error-100 text-error-700 px-3 py-1 rounded-full text-sm">
  Cancelado
</span>

{/* Tag removible */}
<span className="
  inline-flex items-center gap-1 
  px-3 py-1 
  bg-gray-100 text-gray-700 
  rounded-full text-sm
">
  Wifi gratis
  <button className="hover:text-gray-900">×</button>
</span>
```

### Alerts
```jsx
{/* Alert Success */}
<div className="
  bg-success-50 border-l-4 border-success-500 
  p-4 
  rounded-r-md
">
  <div className="flex items-start">
    <IconCheck className="text-success-500 mt-0.5" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-success-800">
        Reserva confirmada
      </h3>
      <p className="text-sm text-success-700 mt-1">
        Recibirás un email con los detalles de tu reserva.
      </p>
    </div>
  </div>
</div>

{/* Alert Error */}
<div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-r-md">
  {/* Similar estructura */}
</div>

{/* Alert Info */}
<div className="bg-info-50 border-l-4 border-info-500 p-4 rounded-r-md">
  {/* Similar estructura */}
</div>
```

### Modales
```jsx
{/* Overlay */}
<div className="
  fixed inset-0 
  bg-black bg-opacity-50 
  backdrop-blur-sm 
  z-40
"></div>

{/* Modal */}
<div className="
  fixed inset-0 
  flex items-center justify-center 
  p-4 
  z-50
">
  <div className="
    bg-white 
    rounded-lg 
    shadow-2xl 
    max-w-md w-full 
    p-6
  ">
    <h2 className="text-2xl font-bold mb-4">Título del Modal</h2>
    <p className="text-gray-600 mb-6">Contenido...</p>
    <div className="flex gap-3 justify-end">
      <button className="btn-secondary">Cancelar</button>
      <button className="btn-primary">Confirmar</button>
    </div>
  </div>
</div>
```

### Loaders
```jsx
{/* Spinner */}
<div className="
  animate-spin 
  rounded-full 
  h-8 w-8 
  border-4 border-gray-200 
  border-t-primary-600
"></div>

{/* Skeleton */}
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

---

## 🎭 Estados Interactivos

### Hover, Focus, Active
```jsx
{/* Hover */}
<div className="hover:bg-gray-100 hover:scale-105 transition-transform">

{/* Focus (importante para accesibilidad) */}
<button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-primary-500 
  focus:ring-offset-2
">

{/* Active */}
<button className="active:scale-95 transition-transform">

{/* Disabled */}
<button className="
  disabled:opacity-50 
  disabled:cursor-not-allowed 
  disabled:hover:bg-primary-600
">
```

### Transiciones
```jsx
{/* Duración */}
<div className="transition-all duration-150">   {/* Rápida */}
<div className="transition-all duration-200">   {/* Normal */}
<div className="transition-all duration-300">   {/* Suave */}

{/* Propiedades específicas */}
<div className="transition-colors duration-200">
<div className="transition-transform duration-300">
<div className="transition-shadow duration-200">

{/* Easing */}
<div className="transition ease-in-out">
<div className="transition ease-out">
```

---

## 🎨 Iconografía

### Sistema de Iconos (Lucide React)
```jsx
import { 
  Calendar, 
  Users, 
  Bed, 
  MapPin, 
  Star, 
  Heart, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

{/* Tamaños */}
<Calendar className="w-4 h-4" />   {/* 16px */}
<Calendar className="w-5 h-5" />   {/* 20px */}
<Calendar className="w-6 h-6" />   {/* 24px */}
<Calendar className="w-8 h-8" />   {/* 32px */}

{/* Con color */}
<Star className="w-5 h-5 text-accent-500 fill-accent-500" />
<Heart className="w-6 h-6 text-error-500" />

{/* En botones */}
<button className="flex items-center gap-2">
  <Calendar className="w-5 h-5" />
  <span>Seleccionar fechas</span>
</button>
```

---

## 🎬 Animaciones

### Animaciones Predefinidas
```jsx
{/* Fade In */}
<div className="animate-fade-in">

{/* Slide In */}
<div className="animate-slide-in-up">
<div className="animate-slide-in-down">
<div className="animate-slide-in-left">
<div className="animate-slide-in-right">

{/* Bounce (para notificaciones) */}
<div className="animate-bounce">

{/* Pulse (para indicadores) */}
<div className="animate-pulse">

{/* Spin (para loaders) */}
<div className="animate-spin">
```

### Custom Animations (Tailwind config)
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.4s ease-out',
      },
    },
  },
}
```

---

## 📱 Breakpoints Responsivos

### Sistema de Breakpoints
```jsx
{/* Mobile First (default) */}
<div className="text-sm md:text-base lg:text-lg xl:text-xl">

{/* Breakpoints */}
sm:   640px   /* Móvil horizontal */
md:   768px   /* Tablet */
lg:   1024px  /* Desktop pequeño */
xl:   1280px  /* Desktop */
2xl:  1536px  /* Desktop grande */

{/* Ejemplos */}
<div className="
  w-full 
  md:w-1/2 
  lg:w-1/3 
  xl:w-1/4
">

<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4
">

{/* Ocultar/Mostrar por breakpoint */}
<div className="hidden md:block">  {/* Visible desde tablet */}
<div className="block md:hidden">  {/* Solo móvil */}
```

---

## ♿ Accesibilidad

### Principios
```jsx
{/* Contraste adecuado (WCAG AA mínimo) */}
<p className="text-gray-700 bg-white">  {/* Ratio 4.5:1+ */}

{/* Focus visible */}
<button className="focus:ring-2 focus:ring-primary-500">

{/* Labels asociados */}
<label htmlFor="email">Email</label>
<input id="email" type="email" />

{/* ARIA */}
<button aria-label="Cerrar modal">
  <XIcon />
</button>

<div role="alert" aria-live="polite">
  Reserva guardada correctamente
</div>

{/* Estados deshabilitados */}
<button disabled aria-disabled="true" className="opacity-50 cursor-not-allowed">
```

---

## ⚙️ Configuración Tailwind

### tailwind.config.js (Ejemplo completo)
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.4s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
```

---

## 🎯 Componentes Específicos de Hotel

### Room Card
```jsx
<div className="
  bg-white 
  rounded-lg 
  shadow-card hover:shadow-card-hover 
  transition-shadow duration-300 
  overflow-hidden
">
  {/* Imagen */}
  <div className="relative">
    <img 
      src="/room.jpg" 
      alt="Suite Deluxe" 
      className="w-full h-48 object-cover"
    />
    <button className="
      absolute top-4 right-4 
      p-2 
      bg-white/80 backdrop-blur-sm 
      rounded-full 
      hover:bg-white 
      transition-colors
    ">
      <Heart className="w-5 h-5 text-gray-700" />
    </button>
  </div>
  
  {/* Contenido */}
  <div className="p-6">
    <div className="flex items-start justify-between mb-2">
      <h3 className="text-xl font-semibold text-gray-900">Suite Deluxe</h3>
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-accent-500 fill-accent-500" />
        <span className="text-sm font-medium">4.8</span>
      </div>
    </div>
    
    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        <span>2-3 personas</span>
      </div>
      <div className="flex items-center gap-1">
        <Bed className="w-4 h-4" />
        <span>King size</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <span className="text-3xl font-bold text-primary-600">$120</span>
        <span className="text-sm text-gray-500">/noche</span>
      </div>
      <button className="
        px-6 py-2 
        bg-primary-600 hover:bg-primary-700 
        text-white font-medium 
        rounded-lg 
        transition-colors
      ">
        Reservar
      </button>
    </div>
  </div>
</div>
```

### Date Picker Range
```jsx
<div className="
  flex items-center gap-4 
  p-4 
  bg-white 
  rounded-lg 
  shadow-md
">
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Check-in
    </label>
    <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-gray-400" />
      <input 
        type="date" 
        className="
          w-full 
          border-0 
          focus:ring-0 
          text-gray-900
        "
      />
    </div>
  </div>
  
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Check-out
    </label>
    <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-gray-400" />
      <input 
        type="date" 
        className="
          w-full 
          border-0 
          focus:ring-0 
          text-gray-900
        "
      />
    </div>
  </div>
  
  <button className="
    mt-6 
    px-8 py-3 
    bg-primary-600 hover:bg-primary-700 
    text-white font-medium 
    rounded-lg
  ">
    Buscar
  </button>
</div>
```

### Booking Summary
```jsx
<div className="
  bg-gray-50 
  border border-gray-200 
  rounded-lg 
  p-6
">
  <h3 className="text-lg font-semibold mb-4">Resumen de reserva</h3>
  
  <div className="space-y-3 mb-4">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">3 noches</span>
      <span className="font-medium">$360.00</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Impuestos</span>
      <span className="font-medium">$36.00</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Servicios adicionales</span>
      <span className="font-medium">$50.00</span>
    </div>
  </div>
  
  <div className="
    border-t border-gray-300 
    pt-3 
    flex justify-between 
    text-lg font-bold
  ">
    <span>Total</span>
    <span className="text-primary-600">$446.00</span>
  </div>
  
  <button className="
    w-full 
    mt-6 
    py-3 
    bg-primary-600 hover:bg-primary-700 
    text-white font-medium 
    rounded-lg
  ">
    Confirmar reserva
  </button>
</div>
```

---

## 📦 Clases Utilitarias Personalizadas

### Crear en globals.css
```css
@layer components {
  /* Botones */
  .btn-primary {
    @apply px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-secondary {
    @apply px-6 py-3 bg-white hover:bg-gray-50 text-primary-600 font-medium border-2 border-primary-600 rounded-lg transition-colors duration-200;
  }
  
  .btn-ghost {
    @apply px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-md transition-colors duration-200;
  }
  
  /* Cards */
  .card {
    @apply bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-300;
  }
  
  /* Inputs */
  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed;
  }
  
  /* Badges */
  .badge {
    @apply inline-flex items-center px-3 py-1 text-sm font-medium rounded-full;
  }
  
  .badge-success {
    @apply badge bg-success-100 text-success-700;
  }
  
  .badge-warning {
    @apply badge bg-warning-100 text-warning-700;
  }
  
  .badge-error {
    @apply badge bg-error-100 text-error-700;
  }
}
```

---

## 🎓 Mejores Prácticas

1. **Mobile First**: Diseñar primero para móvil y escalar hacia desktop
2. **Consistencia**: Usar las clases definidas en este sistema para mantener coherencia
3. **Accesibilidad**: Siempre incluir estados de focus y ARIA labels
4. **Performance**: Evitar animaciones pesadas; preferir `transform` y `opacity`
5. **Dark Mode** (futuro): Preparar componentes con `dark:` variants
6. **Reutilización**: Crear componentes React reutilizables con estas clases como base

---

**Versión:** 1.0  
**Mantenedor:** Equipo MyHotelFlow  
**Actualizar este documento cuando se agreguen nuevos componentes o se modifique la paleta de colores.**
