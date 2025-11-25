/**
 * Token Service Interface
 * Define el contrato para servicios de gestión de tokens JWT
 */

/**
 * Payload del JWT
 */
export interface TokenPayload {
  sub: number; // User ID
  username: string;
  email: string;
  jti: string; // JWT ID único
  type: 'access' | 'refresh';
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Par de tokens (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenService {
  /**
   * Generar un par de tokens (access + refresh)
   * @param userId - ID del usuario
   * @param username - Username del usuario
   * @param email - Email del usuario
   * @returns Par de tokens
   */
  generateTokenPair(userId: number, username: string, email: string): TokenPair;

  /**
   * Verificar y decodificar un token
   * @param token - Token a verificar
   * @param expectedType - Tipo esperado de token (opcional)
   * @returns Payload decodificado
   */
  verifyToken(
    token: string,
    expectedType?: 'access' | 'refresh',
  ): Promise<TokenPayload>;

  /**
   * Revocar un token (agregarlo a la blacklist)
   * @param jti - JWT ID
   * @param userId - ID del usuario
   * @param tokenType - Tipo de token
   * @param reason - Razón de la revocación
   * @param ip - IP del cliente (opcional)
   */
  revokeToken(
    jti: string,
    userId: number,
    tokenType: 'access' | 'refresh',
    reason: string,
    ip?: string,
  ): Promise<void>;

  /**
   * Verificar si un token está revocado
   * @param jti - JWT ID
   * @returns true si está revocado, false si no
   */
  isRevoked(jti: string): Promise<boolean>;

  /**
   * Limpiar tokens expirados de la blacklist
   * @returns Número de tokens eliminados
   */
  cleanExpiredTokens(): Promise<number>;
}
