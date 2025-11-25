import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IHashService } from '../../../domain/services/hash-service.interface';
import { ResetPasswordWithTokenDto } from '../../dtos/auth/reset-password-with-token.dto';

/**
 * Reset Password With Token Use Case
 *
 * Completes the password reset process using the token sent via email.
 * Validates the token, sets new password, and unlocks the account.
 *
 * Security considerations:
 * - Token is single-use (cleared after successful reset)
 * - Token expires after 1 hour
 * - Unlocks account if it was locked
 * - Hashes new password using Argon2id
 */
@Injectable()
export class ResetPasswordWithTokenUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
  ) {}

  /**
   * Execute password reset with token
   *
   * @param dto - Reset token and new password
   * @throws BadRequestException if token is invalid or expired
   */
  async execute(dto: ResetPasswordWithTokenDto): Promise<void> {
    // 1. Find user by reset token
    const user = await this.userRepository.findByPasswordResetToken(dto.token);

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // 2. Validate token expiration
    if (!user.validatePasswordResetToken(dto.token)) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // 3. Hash new password
    const newPasswordHash = await this.hashService.hash(dto.newPassword);

    // 4. Update password
    user.updatePasswordHash(newPasswordHash);

    // 5. Clear reset token (single-use token)
    user.clearPasswordResetToken();

    // 6. Unlock account if it was locked
    if (user.isLocked()) {
      user.unlock();
    }

    // 7. Save updated user
    await this.userRepository.save(user);
  }
}
