/**
 * Utilidades para manejo de localStorage
 * Siguiendo MEJORES_PRACTICAS.md - Manejo seguro de storage
 */

/**
 * Guardar token en localStorage
 */
export const setToken = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Obtener token de localStorage
 */
export const getToken = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

/**
 * Eliminar token de localStorage
 */
export const removeToken = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * Limpiar todo localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Guardar objeto JSON en localStorage
 */
export const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error saving object to localStorage:', error);
  }
};

/**
 * Obtener objeto JSON de localStorage
 */
export const getItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error reading object from localStorage:', error);
    return null;
  }
};
