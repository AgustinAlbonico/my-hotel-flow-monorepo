/**
 * Refresh Token Response DTO
 *
 * Data Transfer Object for successful token refresh responses.
 */
export class RefreshTokenResponseDto {
  /**
   * New JWT access token
   */
  accessToken: string;

  /**
   * New JWT refresh token
   */
  refreshToken: string;

  constructor(data: { accessToken: string; refreshToken: string }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
  }
}
