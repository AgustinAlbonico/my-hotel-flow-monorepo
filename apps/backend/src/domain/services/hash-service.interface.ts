/**
 * Hash Service Interface
 *
 * Contract for password hashing operations.
 * Implementation should use Argon2id for security.
 */
export interface IHashService {
  /**
   * Hash a plain text password
   *
   * @param plainText - Plain text password
   * @returns Promise with hashed password
   */
  hash(plainText: string): Promise<string>;

  /**
   * Verify plain text password against hash
   * Uses constant-time comparison to prevent timing attacks
   *
   * @param hash - Hashed password
   * @param plainText - Plain text password to verify
   * @returns Promise with true if passwords match, false otherwise
   */
  verify(hash: string, plainText: string): Promise<boolean>;
}
