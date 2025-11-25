/**
 * Constantes de configuración de la aplicación
 * Siguiendo MEJORES_PRACTICAS.md - Centralización de configuración
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'MyHotelFlow';
export const TOKEN_KEY = import.meta.env.VITE_JWT_TOKEN_KEY || 'access_token';
export const REFRESH_TOKEN_KEY =
  import.meta.env.VITE_JWT_REFRESH_TOKEN_KEY || 'refresh_token';

// Claves de storage
export const PERMISSIONS_CACHE_KEY = 'user_permissions';
export const USER_PROFILE_KEY = 'user_profile';

// Tiempos de caché (en milisegundos)
export const PERMISSIONS_CACHE_TTL = 15 * 60 * 1000; // 15 minutos
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutos
