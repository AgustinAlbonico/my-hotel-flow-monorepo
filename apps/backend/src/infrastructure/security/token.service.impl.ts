/**
 * JWT Token Service Implementation
 * Implementación concreta del servicio de gestión de tokens JWT
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  ITokenService,
  TokenPayload,
  TokenPair,
} from '../../domain/services/token.service.interface';
import { RevokedTokenEntity } from '../persistence/typeorm/entities/revoked-token.orm-entity';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RevokedTokenEntity)
    private readonly revokedTokenRepo: Repository<RevokedTokenEntity>,
  ) {}

  generateTokenPair(
    userId: number,
    username: string,
    email: string,
  ): TokenPair {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      username,
      email,
      jti: accessJti,
      type: 'access',
    };

    const refreshPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: userId,
      username,
      email,
      jti: refreshJti,
      type: 'refresh',
    };

    const accessExpiration =
      this.config.get<string>('jwt.accessExpiration') || '15m';
    const refreshExpiration =
      this.config.get<string>('jwt.refreshExpiration') || '7d';

    const accessToken = this.jwtService.sign(
      accessPayload as any,
      {
        expiresIn: accessExpiration,
      } as any,
    );

    const refreshToken = this.jwtService.sign(
      refreshPayload as any,
      {
        expiresIn: refreshExpiration,
      } as any,
    );

    const expiresIn = this.parseExpirationToSeconds(accessExpiration);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async verifyToken(
    token: string,
    expectedType?: 'access' | 'refresh',
  ): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token);

      if (await this.isRevoked(payload.jti)) {
        throw new UnauthorizedException('Token has been revoked');
      }

      return payload;
    } catch (error) {
      if ((error as Error).message === 'Token has been revoked') {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async revokeToken(
    jti: string,
    userId: number,
    tokenType: 'access' | 'refresh',
    reason: string,
    ip?: string,
  ): Promise<void> {
    const expiration = tokenType === 'access' ? '15m' : '7d';
    const expiresAt = this.calculateExpirationDate(expiration);

    const revokedToken = this.revokedTokenRepo.create({
      jti,
      userId,
      tokenType,
      reason,
      expiresAt,
      ip,
    });

    await this.revokedTokenRepo.save(revokedToken);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const revoked = await this.revokedTokenRepo.findOne({
      where: { jti },
    });

    return revoked !== null;
  }

  async cleanExpiredTokens(): Promise<number> {
    const result = await this.revokedTokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  private parseExpirationToSeconds(expiration: string): number {
    const value = parseInt(expiration.slice(0, -1));
    const unit = expiration.slice(-1);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  private calculateExpirationDate(expiration: string): Date {
    const seconds = this.parseExpirationToSeconds(expiration);
    return new Date(Date.now() + seconds * 1000);
  }
}
