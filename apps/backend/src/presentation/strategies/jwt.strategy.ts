import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Strategy
 * Patrón: Strategy Pattern (Passport)
 *
 * Responsabilidad: Validar tokens JWT y extraer payload para autenticación
 *
 * Siguiendo: MEJORES_PRACTICAS.md - Sección 12 (Seguridad)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT Secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario
   * Este método es llamado automáticamente por Passport después de verificar el token
   *
   * @param payload - Payload del JWT decodificado
   * @returns Objeto de usuario que se adjuntará a request.user
   */
  validate(payload: JwtPayload): JwtUser {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // El objeto retornado se adjunta automáticamente a request.user
    return {
      id: payload.sub,
      email: payload.email,
      sub: payload.sub, // Para compatibilidad
    };
  }
}

/**
 * Estructura del payload JWT
 */
interface JwtPayload {
  sub: number; // User ID
  email: string;
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

/**
 * Usuario adjuntado a la request después de autenticación
 */
export interface JwtUser {
  id: number;
  email: string;
  sub: number; // Para compatibilidad con código existente
}
