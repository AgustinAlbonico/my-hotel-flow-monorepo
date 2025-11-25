/**
 * Refresh Token DTO
 *
 * Data Transfer Object for token refresh requests.
 */
export class RefreshTokenDto {
  /**
   * Refresh token to generate new access token
   */
  refreshToken: string;

  constructor(data: { refreshToken: string }) {
    this.refreshToken = data.refreshToken;
  }
}
