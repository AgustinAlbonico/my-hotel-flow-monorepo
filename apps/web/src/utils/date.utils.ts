/**
 * Date utility functions
 * Helper functions for date manipulation avoiding timezone issues
 */

/**
 * Get today's date in YYYY-MM-DD format in local timezone
 * Avoids UTC conversion issues that occur with toISOString()
 * 
 * @returns Current date in YYYY-MM-DD format (e.g., "2025-12-04")
 */
export const getTodayLocalDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert a Date object to YYYY-MM-DD format in local timezone
 * 
 * @param date - Date object to convert
 * @returns Date in YYYY-MM-DD format
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
