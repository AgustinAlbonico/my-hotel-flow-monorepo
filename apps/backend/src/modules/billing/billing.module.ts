import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ORM Entities
import { InvoiceOrmEntity } from '../../infrastructure/persistence/typeorm/entities/invoice.orm-entity';
import { PaymentOrmEntity } from '../../infrastructure/persistence/typeorm/entities/payment.orm-entity';
import { ClientOrmEntity } from '../../infrastructure/persistence/typeorm/entities/client.orm-entity';
import { ReservationOrmEntity } from '../../infrastructure/persistence/typeorm/entities/reservation.orm-entity';
import { AccountMovementOrmEntity } from '../../infrastructure/persistence/typeorm/entities/account-movement.orm-entity';
import { MercadoPagoPaymentOrmEntity } from '../../infrastructure/persistence/typeorm/entities/mercadopago-payment.orm-entity';

// Repositories
import { TypeOrmInvoiceRepository } from '../../infrastructure/persistence/typeorm/repositories/invoice.repository.impl';
import { TypeOrmPaymentRepository } from '../../infrastructure/persistence/typeorm/repositories/payment.repository.impl';
import { TypeOrmClientRepository } from '../../infrastructure/persistence/typeorm/repositories/client.repository.impl';
import { TypeOrmReservationRepository } from '../../infrastructure/persistence/typeorm/repositories/reservation.repository.impl';
import { TypeOrmAccountMovementRepository } from '../../infrastructure/persistence/typeorm/repositories/account-movement.repository.impl';
import { TypeOrmMercadoPagoPaymentRepository } from '../../infrastructure/persistence/typeorm/repositories/mercadopago-payment.repository.impl';

// Mappers
import { InvoiceMapper } from '../../infrastructure/persistence/typeorm/mappers/invoice.mapper';
import { PaymentMapper } from '../../infrastructure/persistence/typeorm/mappers/payment.mapper';
import { ClientMapper } from '../../infrastructure/persistence/typeorm/mappers/client.mapper';
import { ReservationMapper } from '../../infrastructure/persistence/typeorm/mappers/reservation.mapper';
import { AccountMovementMapper } from '../../infrastructure/persistence/typeorm/mappers/account-movement.mapper';
import { MercadoPagoPaymentMapper } from '../../infrastructure/persistence/typeorm/mappers/mercadopago-payment.mapper';

// Use Cases
import { GenerateInvoiceUseCase } from '../../application/use-cases/invoice/generate-invoice.use-case';
import { RegisterPaymentUseCase } from '../../application/use-cases/payment/register-payment.use-case';
import { GetAccountStatementUseCase } from '../../application/use-cases/account/get-account-statement.use-case';
import { CreatePaymentPreferenceUseCase } from '../../application/use-cases/payment/create-payment-preference.use-case';
import { ProcessMercadoPagoWebhookUseCase } from '../../application/use-cases/payment/process-mercadopago-webhook.use-case';

// Services
import { MercadoPagoService } from '../../infrastructure/payment/mercadopago.service';

// Controllers
import { InvoicesController } from '../../presentation/controllers/invoices.controller';
import { PaymentsController } from '../../presentation/controllers/payments.controller';
import { AccountStatementsController } from '../../presentation/controllers/account-statements.controller';
import { MercadoPagoWebhooksController } from '../../presentation/controllers/mercadopago-webhooks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvoiceOrmEntity,
      PaymentOrmEntity,
      ClientOrmEntity,
      ReservationOrmEntity,
      AccountMovementOrmEntity,
      MercadoPagoPaymentOrmEntity,
    ]),
  ],
  controllers: [
    InvoicesController,
    PaymentsController,
    AccountStatementsController,
    MercadoPagoWebhooksController,
  ],
  providers: [
    // Mappers
    InvoiceMapper,
    PaymentMapper,
    ClientMapper,
    ReservationMapper,
    AccountMovementMapper,
    MercadoPagoPaymentMapper,

    // Repositories
    {
      provide: 'IInvoiceRepository',
      useClass: TypeOrmInvoiceRepository,
    },
    {
      provide: 'IPaymentRepository',
      useClass: TypeOrmPaymentRepository,
    },
    {
      provide: 'IClientRepository',
      useClass: TypeOrmClientRepository,
    },
    {
      provide: 'IReservationRepository',
      useClass: TypeOrmReservationRepository,
    },
    {
      provide: 'IAccountMovementRepository',
      useClass: TypeOrmAccountMovementRepository,
    },
    {
      provide: 'IMercadoPagoPaymentRepository',
      useClass: TypeOrmMercadoPagoPaymentRepository,
    },

    // Services
    MercadoPagoService,

    // Use Cases
    GenerateInvoiceUseCase,
    RegisterPaymentUseCase,
    GetAccountStatementUseCase,
    CreatePaymentPreferenceUseCase,
    ProcessMercadoPagoWebhookUseCase,
  ],
  exports: [
    'IInvoiceRepository',
    'IPaymentRepository',
    GenerateInvoiceUseCase,
    RegisterPaymentUseCase,
  ],
})
export class BillingModule {}
