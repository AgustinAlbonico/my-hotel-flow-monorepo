/**
 * Utilidades de fecha compartidas
 * Centraliza funciones de parseo y manipulación de fechas para evitar duplicación
 */

/**
 * Parsea una fecha en formato YYYY-MM-DD como fecha local (sin desfasajes por zona horaria)
 * @param dateStr - String de fecha en formato YYYY-MM-DD o ISO
 * @returns Date objeto con la fecha local
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [yearStr, monthStr, dayStr] = dateStr.substring(0, 10).split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  return new Date(year, month - 1, day);
};

/**
 * Convierte un valor Date o string a Date local
 * @param value - Date o string en formato ISO/YYYY-MM-DD
 * @returns Date objeto con la fecha local
 */
export const toLocalDate = (value: Date | string): Date => {
  if (value instanceof Date) return value;
  return parseLocalDate(String(value));
};

/**
 * Formatea una fecha como string YYYY-MM-DD
 * @param date - Fecha a formatear
 * @returns String en formato YYYY-MM-DD
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de fin
 * @returns Número de días entre las fechas
 */
export const daysBetween = (startDate: Date, endDate: Date): number => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 * @returns String con la fecha de hoy
 */
export const getTodayLocalDateString = (): string => {
  return formatDateToISO(new Date());
};

