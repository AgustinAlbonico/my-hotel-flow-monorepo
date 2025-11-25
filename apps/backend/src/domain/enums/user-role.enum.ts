/**
 * User Role Enum
 * Define los roles disponibles en el sistema
 */

export enum UserRole {
  ADMIN = 'admin',
  RECEPCIONISTA = 'recepcionista',
  CLIENTE = 'cliente',
}

/**
 * Valida si un string es un rol válido
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Convierte un string a UserRole con fallback
 * DEPRECADO: El campo role no se usa para autorización, solo se mantiene por compatibilidad
 * Si el valor es inválido, retorna 'cliente' por defecto
 */
export function toUserRole(role: string): UserRole {
  if (!isValidUserRole(role)) {
    console.warn(
      `Invalid user role: ${role}, defaulting to 'cliente'. Note: role field is deprecated.`,
    );
    return UserRole.CLIENTE;
  }
  return role;
}
