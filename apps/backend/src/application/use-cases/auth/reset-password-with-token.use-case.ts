import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IHashService } from '../../../domain/services/hash-service.interface';
import { ResetPasswordWithTokenDto } from '../../dtos/auth/reset-password-with-token.dto';

/**
 * Reset Password With Token Use Case
 *
 * Completes the password reset process using the token sent via email.
 * Validates the token, sets new password, and unlocks the account.
 * Supports both Users (staff) and Clients (guests).
 */
@Injectable()
export class ResetPasswordWithTokenUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
  ) { }

  /**
   * Execute password reset with token
   *
   * @param dto - Reset token and new password
   * @throws BadRequestException if token is invalid or expired
   */
  async execute(dto: ResetPasswordWithTokenDto): Promise<void> {
    // 1. Find user by reset token
    let user = await this.userRepository.findByPasswordResetToken(dto.token);
    let isClient = false;
    let entity: any = user;

    // 2. If not found in users, try clients
    if (!user) {
      const client = await this.clientRepository.findByPasswordResetToken(dto.token);
      if (client) {
        isClient = true;
        entity = client;
      }
    }

    if (!entity) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // 3. Validate token expiration
    if (!entity.validatePasswordResetToken(dto.token)) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // 4. Hash new password
    const newPasswordHash = await this.hashService.hash(dto.newPassword);

    // 5. Update password
    if (isClient) {
      entity.setPassword(newPasswordHash);
    } else {
      entity.updatePasswordHash(newPasswordHash);
    }

    // 6. Clear reset token (single-use token)
    entity.clearPasswordResetToken();

    // 7. Unlock account if it was locked (Only for Users)
    if (!isClient && entity.isLocked && entity.isLocked()) {
      entity.unlock();
    }

    // 8. Save updated entity
    if (isClient) {
      await this.clientRepository.save(entity);
    } else {
      await this.userRepository.save(entity);
    }
  }
}
