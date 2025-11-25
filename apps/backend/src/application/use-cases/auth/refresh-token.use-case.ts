import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type {
  ITokenService,
  TokenPayload,
} from '../../../domain/services/token.service.interface';
import { RefreshTokenDto } from '../../dtos/auth/refresh-token.dto';
import { RefreshTokenResponseDto } from '../../dtos/auth/refresh-token-response.dto';

/**
 * Refresh Token Use Case
 *
 * Handles JWT token refresh to extend user sessions.
 * Validates the refresh token and generates new access and refresh tokens.
 *
 * Security considerations:
 * - Validates refresh token signature and expiration
 * - Generates new token pair (access + refresh)
 * - Original refresh token should be invalidated (implement token blacklist if needed)
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * Execute token refresh
   *
   * @param dto - Refresh token DTO
   * @returns New access and refresh tokens
   * @throws UnauthorizedException if refresh token is invalid or expired
   */
  async execute(dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    try {
      // 1. Verificar y decodificar el refresh token como token de tipo 'refresh'
      const payload: TokenPayload = await this.tokenService.verifyToken(
        dto.refreshToken,
        'refresh',
      );

      // 2. Generar nuevo par de tokens usando los datos del payload
      const tokenPair = this.tokenService.generateTokenPair(
        payload.sub,
        payload.username,
        payload.email,
      );

      // 3. TODO: Implementar blacklist para invalidar el refresh token anterior
      // Esto prevendría ataques de reutilización de refresh tokens

      // 4. Retornar nuevos tokens
      return new RefreshTokenResponseDto({
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      });
    } catch {
      // Si la verificación falla, lanzar Unauthorized
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
