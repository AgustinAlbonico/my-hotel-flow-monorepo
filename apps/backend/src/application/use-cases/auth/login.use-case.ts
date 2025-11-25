import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IHashService } from '../../../domain/services/hash-service.interface';
import type { ITokenService } from '../../../domain/services/token.service.interface';
import { LoginDto } from '../../dtos/auth/login.dto';
import { LoginResponseDto } from '../../dtos/auth/login-response.dto';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';
import { Email } from '../../../domain/value-objects/email.vo';
import { User } from '../../../domain/entities/user.entity';

/**
 * Login Use Case
 *
 * Handles user authentication with the following security features:
 * - Validates username and password
 * - Checks if user account is active
 * - Checks if account is locked due to failed attempts
 * - Records failed login attempts (locks after 5 failures for 15 minutes)
 * - Records successful login (resets failed attempts counter)
 * - Generates JWT access and refresh tokens
 * - Returns user information and permissions
 *
 * Security considerations:
 * - Uses constant-time comparison for passwords via IHashService
 * - Implements account lockout mechanism (5 attempts = 15 min lockout)
 * - Always returns generic "Invalid credentials" message to prevent username enumeration
 * - Checks account status before validating password
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
    @Inject('ITokenService')
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * Execute login
   *
   * @param dto - Login credentials (username can be username or email)
   * @returns Login response with tokens and user information
   * @throws InvalidCredentialsException if username doesn't exist or password is incorrect
   * @throws UserNotActiveException if user account is not active
   * @throws UserLockedException if account is locked due to failed attempts
   */
  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    // 1. Find user by email or username (WITHOUT relations to avoid mapper issues)
    let user: User | null = null;

    // Try by email first if it looks like an email
    if (dto.username.includes('@')) {
      try {
        const emailVO = Email.create(dto.username);
        user = await this.userRepository.findByEmail(emailVO);
      } catch {
        // If email format is invalid, continue to try username
      }
    }

    // If not found by email, try by username
    if (!user) {
      user = await this.userRepository.findByUsername(dto.username);
    }

    // 2. If user not found, throw generic error to prevent enumeration
    if (!user) {
      throw new InvalidCredentialsException();
    }

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
      // Usar updateLoginInfo para no borrar relaciones
      await this.userRepository.updateLoginInfo(
        user.id,
        user.lastLoginAt,
        user.failedLoginAttempts,
        user.lockedUntil,
      );
      throw new InvalidCredentialsException();
    }

    // 6. Password is valid - record successful login (resets failed attempts)
    user.recordSuccessfulLogin();
    // Usar updateLoginInfo para no borrar relaciones
    await this.userRepository.updateLoginInfo(
      user.id,
      user.lastLoginAt,
      user.failedLoginAttempts,
      user.lockedUntil,
    );

    // 7. Load user with relations AFTER successful authentication to get permissions
    // This is done separately to avoid validation errors during authentication
    const userWithRelations = await this.userRepository.findByIdWithRelations(
      user.id,
      true, // includeGroups
      true, // includeActions
    );

    // If relations failed to load, use empty arrays as fallback
    const groups = userWithRelations?.groups || [];
    const actions = userWithRelations?.actions || [];

    // Calculate all effective actions (direct + inherited from groups)
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
    );

    // 9. Return login response
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
}
