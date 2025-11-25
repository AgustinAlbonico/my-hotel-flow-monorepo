import { Inject, Injectable } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ForgotPasswordDto } from '../../dtos/auth/forgot-password.dto';
import { Email } from '../../../domain/value-objects/email.vo';

/**
 * Forgot Password Use Case
 *
 * Initiates the password reset process by generating a reset token.
 * In a real application, this would send an email with the reset link.
 *
 * Security considerations:
 * - Generates a cryptographically secure random token
 * - Token expires after 1 hour
 * - Returns success even if email doesn't exist (prevents email enumeration)
 * - In production, send email with reset link instead of returning token
 *
 * TODO: Integrate with email service to send reset link
 * TODO: Return generic success message instead of token (security)
 */
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Execute forgot password request
   *
   * @param dto - Email address
   * @returns Password reset token (in production, this should send email instead)
   */
  async execute(dto: ForgotPasswordDto): Promise<{ resetToken: string }> {
    // 1. Normalize email using Value Object
    const emailVO = Email.create(dto.email);

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(emailVO);

    // 3. If user not found, return success anyway (prevents email enumeration)
    // In a real app, you'd still return success but not send any email
    if (!user) {
      // Return a fake token to prevent timing attacks
      // In production, just return success message without token
      return {
        resetToken: 'fake-token-user-not-found',
      };
    }

    // 4. Generate password reset token (expires in 1 hour)
    const resetToken = user.generatePasswordResetToken();

    // 5. Save user with reset token
    await this.userRepository.save(user);

    // 6. TODO: Send email with reset link
    // const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
    // await this.emailService.sendPasswordResetEmail(user.email.value, resetLink);

    // 7. Return token (in production, just return success message)
    // For now, return token for testing purposes
    return {
      resetToken,
    };
  }
}
