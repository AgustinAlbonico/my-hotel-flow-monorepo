/**
 * Types - Re-exportación centralizada de tipos del sistema
 */

// Permisos
export { Permission, PERMISSION_LABELS } from './permissions';
export type { PermissionValue } from './permissions';

// Auth
export type { User } from './auth.types';

// Características
export type {
  Caracteristica,
  CreateCaracteristicaRequest,
  UpdateCaracteristicaRequest,
} from './caracteristica.types';
