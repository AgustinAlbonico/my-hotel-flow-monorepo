import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { INotificationService } from '../../../domain/services/notification.service.interface';
import { ForgotPasswordDto } from '../../dtos/auth/forgot-password.dto';
import { Email as UserEmail } from '../../../domain/value-objects/email.vo';
import { Email as ClientEmail } from '../../../domain/value-objects/email.value-object';
import { ConfigService } from '@nestjs/config';

/**
 * Forgot Password Use Case
 *
 * Initiates the password reset process by generating a reset token and sending an email.
 * Supports both Users (staff) and Clients (guests).
 */
@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('INotificationService')
    private readonly notificationService: INotificationService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Execute forgot password request
   *
   * @param dto - Email address
   * @returns Success message (never reveals if email exists)
   */
  async execute(dto: ForgotPasswordDto): Promise<{ message: string }> {
    // 1. Try to find user by email (Staff)
    // User repository uses email.vo.ts
    const userEmailVO = UserEmail.create(dto.email);
    let user = await this.userRepository.findByEmail(userEmailVO);
    let isClient = false;
    let entity: any = user;

    // 3. If not found in users, try clients
    if (!user) {
      // Client repository uses email.value-object.ts
      const clientEmailVO = ClientEmail.create(dto.email);
      const client = await this.clientRepository.findByEmail(clientEmailVO);
      if (client) {
        isClient = true;
        entity = client;
      }
    }

    // 4. If not found in either, return success anyway (prevents email enumeration)
    if (!entity) {
      return {
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
      };
    }

    // 5. Generate password reset token (expires in 1 hour)
    // Both User and Client entities have this method now
    const resetToken = entity.generatePasswordResetToken();

    // 6. Save entity with reset token
    if (isClient) {
      await this.clientRepository.save(entity);
    } else {
      await this.userRepository.save(entity);
    }

    // 7. Build reset link
    const frontendUrl = this.configService.get<string>('CORS_ORIGIN') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // 8. Send email with reset link
    try {
      const name = isClient ? entity.firstName : entity.username;

      await this.notificationService.sendPasswordReset(entity.email.value, {
        username: name,
        reset_link: resetLink,
        logo_url: this.configService.get<string>('ASSET_BASE_URL')
          ? `${this.configService.get<string>('ASSET_BASE_URL')}/logo.png`
          : 'https://via.placeholder.com/140x40/3b82f6/ffffff?text=MyHotelFlow',
        support_email: this.configService.get<string>('SUPPORT_EMAIL') || 'soporte@myhotelflow.example',
        year: new Date().getFullYear(),
      });
    } catch (error) {
      this.logger.error('Error sending password reset email', error instanceof Error ? error.stack : String(error));
    }

    // 9. Return generic success message
    return {
      message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
    };
  }
}
