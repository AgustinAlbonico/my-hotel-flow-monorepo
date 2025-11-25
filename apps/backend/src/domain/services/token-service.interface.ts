/**
 * Token Service Interface
 *
 * Contract for JWT token operations.
 * Implementation should use RS256 or HS256 algorithm.
 */
export interface ITokenService {
  /**
   * Generate JWT access token
   *
   * @param payload - Token payload (user info, permissions, etc.)
   * @returns JWT access token string
   */
  generateAccessToken(payload: unknown): string;

  /**
   * Generate JWT refresh token
   *
   * @param payload - Token payload (user info, permissions, etc.)
   * @returns JWT refresh token string
   */
  generateRefreshToken(payload: unknown): string;

  /**
   * Verify and decode JWT access token
   *
   * @param token - JWT access token
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(token: string): unknown;

  /**
   * Verify and decode JWT refresh token
   *
   * @param token - JWT refresh token
   * @returns Decoded token payload
   * @throws Error if token is invalid or expired
   */
  verifyRefreshToken(token: string): unknown;
}
