import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './services/authorization.service';
import { ActionsGuard } from './guards/actions.guard';
import { UserUseCasesModule } from '../application/use-cases/user/user-use-cases.module';
import { MailModule } from '../infrastructure/notifications/mail.module';
import { MailService } from '../infrastructure/notifications/mail.service';

/**
 * Presentation Common Module
 *
 * Módulo global que proporciona servicios y guards comunes
 * para toda la capa de presentación
 */
@Global()
@Module({
  imports: [UserUseCasesModule, MailModule],
  providers: [
    AuthorizationService,
    ActionsGuard,
    {
      provide: 'INotificationService',
      useClass: MailService,
    },
  ],
  exports: [AuthorizationService, ActionsGuard, 'INotificationService'],
})
export class PresentationCommonModule {}
