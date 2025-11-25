import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IHashService } from '../../../domain/services/hash-service.interface';
import { ChangePasswordDto } from '../../dtos/auth/change-password.dto';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';

/**
 * Change Password Use Case
 *
 * Allows authenticated users to change their password.
 * Requires verification of current password before allowing the change.
 *
 * Security considerations:
 * - Validates current password using constant-time comparison
 * - Hashes new password using Argon2id
 * - Only authenticated users can change their own password
 * - Unlocks account if it was locked (successful password change is treated as account recovery)
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
  ) {}

  /**
   * Execute password change
   *
   * @param userId - ID of the user changing password
   * @param dto - Current and new password
   * @throws NotFoundException if user doesn't exist
   * @throws InvalidCredentialsException if current password is incorrect
   */
  async execute(userId: number, dto: ChangePasswordDto): Promise<void> {
    // 1. Find user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Verify current password
    const isCurrentPasswordValid = await this.hashService.verify(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsException('Current password is incorrect');
    }

    // 3. Hash new password
    const newPasswordHash = await this.hashService.hash(dto.newPassword);

    // 4. Update password in domain entity
    user.updatePasswordHash(newPasswordHash);

    // 5. If account was locked, unlock it (successful password change = account recovery)
    if (user.isLocked()) {
      user.unlock();
    }

    // 6. Save updated user
    await this.userRepository.save(user);
  }
}
