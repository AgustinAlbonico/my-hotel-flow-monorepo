import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IHashService } from '../../../domain/services/hash-service.interface';
import type { ITokenService } from '../../../domain/services/token.service.interface';
import { LoginDto } from '../../dtos/auth/login.dto';
import { LoginResponseDto } from '../../dtos/auth/login-response.dto';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';
import { Email as UserEmail } from '../../../domain/value-objects/email.vo';
import { Email as ClientEmail } from '../../../domain/value-objects/email.value-object';
import { User } from '../../../domain/entities/user.entity';
import { Client } from '../../../domain/entities/client.entity';
import { AuditService } from '../../../infrastructure/services/audit.service';

export interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Login Use Case
 *
 * Handles user and client authentication with the following security features:
 * - Validates username/email and password
 * - Checks if account is active
 * - Checks if account is locked due to failed attempts (Users only)
 * - Records failed login attempts (Users only)
 * - Generates JWT access and refresh tokens
 * - Returns user/client information and permissions
 */
@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
    private readonly auditService: AuditService,
  ) { }

  /**
   * Execute login
   *
   * @param dto - Login credentials (username can be username or email)
   * @param context - Login context with IP and user agent
   * @returns Login response with tokens and user information
   * @throws InvalidCredentialsException if username doesn't exist or password is incorrect
   */
  async execute(
    dto: LoginDto,
    context?: LoginContext,
  ): Promise<LoginResponseDto> {
    // 1. Try to find USER first
    let user: User | null = null;
    let client: Client | null = null;
    let isClient = false;

    // Try by email first if it looks like an email
    if (dto.username.includes('@')) {
      try {
        const userEmailVO = UserEmail.create(dto.username);
        user = await this.userRepository.findByEmail(userEmailVO);
      } catch {
        // If email format is invalid for User, ignore
      }

      if (!user) {
        try {
          const clientEmailVO = ClientEmail.create(dto.username);
          client = await this.clientRepository.findByEmail(clientEmailVO);
          if (client) isClient = true;
        } catch {
          // If email format is invalid for Client, ignore
        }
      }
    }

    // If not found by email and not a client yet, try by username (only for Users)
    if (!user && !client) {
      user = await this.userRepository.findByUsername(dto.username);
    }

    // 2. If neither found, throw generic error
    if (!user && !client) {
      throw new InvalidCredentialsException();
    }

    // ==========================================
    // CLIENT LOGIN FLOW
    // ==========================================
    // ==========================================
    // CLIENT LOGIN FLOW
    // ==========================================
    if (isClient && client) {
      if (!client.isActive) {
        throw new InvalidCredentialsException(); // Or UserNotActiveException
      }

      const isPasswordValid = await this.hashService.verify(
        client.password,
        dto.password,
      );

      if (!isPasswordValid) {
        throw new InvalidCredentialsException();
      }

      // Generate tokens for Client
      // Note: We might want to add a 'role' or 'type' claim to the token to distinguish
      const tokens = this.tokenService.generateTokenPair(
        client.id,
        client.email.value, // Use email as username for clients
        client.email.value,
        'client',
      );

      return new LoginResponseDto({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: client.id,
        username: `${client.firstName} ${client.lastName}`,
        email: client.email.value,
        groupIds: client.groups.map((g) => g.id),
        actionKeys: [], // Clients usually don't have direct action keys like users
      });
    }

    // ==========================================
    // USER LOGIN FLOW
    // ==========================================
    if (user) {
      // 3. Check if user can login (active and not locked)
      user.canLogin();

      // 4. Verify password using constant-time comparison
      const isPasswordValid = await this.hashService.verify(
        user.passwordHash,
        dto.password,
      );

      // 5. If password is invalid, record failed attempt and throw exception
      if (!isPasswordValid) {
        user.recordFailedLoginAttempt();
        await this.userRepository.updateLoginInfo(
          user.id,
          user.lastLoginAt,
          user.failedLoginAttempts,
          user.lockedUntil,
        );
        throw new InvalidCredentialsException();
      }

      // 6. Password is valid - record successful login
      user.recordSuccessfulLogin();
      await this.userRepository.updateLoginInfo(
        user.id,
        user.lastLoginAt,
        user.failedLoginAttempts,
        user.lockedUntil,
      );

      // 7. Load user with relations
      const userWithRelations = await this.userRepository.findByIdWithRelations(
        user.id,
        true, // includeGroups
        true, // includeActions
      );

      const groups = userWithRelations?.groups || [];
      const actions = userWithRelations?.actions || [];
      const inheritedActions = userWithRelations?.getInheritedActions() || [];
      const allActionKeys = Array.from(
        new Set([
          ...actions.map((a) => a.key),
          ...inheritedActions.map((a) => a.key),
        ]),
      );

      // 8. Generate JWT tokens
      const tokens = this.tokenService.generateTokenPair(
        user.id,
        user.username,
        user.email.value,
        'user',
      );

      // 9. Create user session for audit
      try {
        await this.auditService.createUserSession({
          userId: user.id,
          username: user.username,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          sessionToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        });
      } catch (error) {
        // Log error but don't block login
        this.logger.error('Error creating user session', error instanceof Error ? error.stack : String(error));
      }

      // 10. Return login response
      return new LoginResponseDto({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        username: user.username,
        email: user.email.value,
        groupIds: groups.map((g) => g.id),
        actionKeys: allActionKeys,
      });
    }

    throw new InvalidCredentialsException();
  }
}
