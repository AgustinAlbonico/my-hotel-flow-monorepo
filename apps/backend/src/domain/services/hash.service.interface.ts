/**
 * Hash Service Interface
 * Define el contrato para servicios de hashing de contraseñas
 */

export interface IHashService {
  /**
   * Hashea un texto plano
   * @param plainText - Texto a hashear
   * @returns Hash generado
   */
  hash(plainText: string): Promise<string>;

  /**
   * Verifica si un hash corresponde a un texto plano
   * @param hash - Hash almacenado
   * @param plainText - Texto plano a verificar
   * @returns true si coincide, false en caso contrario
   */
  verify(hash: string, plainText: string): Promise<boolean>;
}
