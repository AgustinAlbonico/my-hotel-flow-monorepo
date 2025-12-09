/**
 * Request Types
 * Tipos compartidos para requests HTTP con información de usuario
 */
import { Request } from 'express';
import { UserOrmEntity } from '../../infrastructure/persistence/typeorm/entities/user.orm-entity';

/**
 * JWT Payload interface
 * Representa la estructura del payload decodificado del JWT
 */
export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  userType: 'user' | 'client';
  iat?: number;
  exp?: number;
}

/**
 * Request type with authenticated user (ORM entity attached by JWT strategy)
 * Usado cuando el JwtStrategy adjunta la entidad completa del usuario
 */
export interface RequestWithUser extends Request {
  user: UserOrmEntity;
}

/**
 * Request type with JWT payload
 * Usado cuando solo se tiene el payload del JWT
 */
export interface RequestWithJwtPayload extends Request {
  user: JwtPayload;
}

/**
 * Request type flexible for auth endpoints
 * Combina ambos tipos para endpoints que manejan usuarios y clientes
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id?: number;
    sub?: number;
    userId?: number;
    username?: string;
    email?: string;
    userType?: 'user' | 'client';
  } & Partial<UserOrmEntity>;
}
