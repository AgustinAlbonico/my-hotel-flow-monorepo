import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import configuration from './config/configuration';
// Infrastructure
import { DatabaseModule } from './infrastructure/persistence/typeorm/database.module';
// Clean Architecture Modules
import { AuthStrategiesModule } from './presentation/auth-strategies.module';
import { PresentationCommonModule } from './presentation/presentation-common.module';
import { ActionPresentationModule } from './presentation/controllers/action-presentation.module';
import { GroupPresentationModule } from './presentation/controllers/group-presentation.module';
import { UserPresentationModule } from './presentation/controllers/user-presentation.module';
import { AuthPresentationModule } from './presentation/controllers/auth-presentation.module';
import { ReservationPresentationModule } from './presentation/reservation-presentation.module';
import { ClientPresentationModule } from './presentation/client-presentation.module';
import { RoomPresentationModule } from './presentation/room-presentation.module';
import { RoomTypePresentationModule } from './presentation/room-type-presentation.module';
import { CaracteristicaPresentationModule } from './presentation/caracteristica-presentation.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [
        '../../.env', // Root .env del monorepo
        '.env', // Fallback a .env local (si existe)
      ],
    }),
    // Infrastructure
    DatabaseModule,
    // Authentication Strategies (Passport)
    AuthStrategiesModule,
    // Clean Architecture Modules
    PresentationCommonModule,
    ActionPresentationModule,
    GroupPresentationModule,
    UserPresentationModule,
    AuthPresentationModule,
    ReservationPresentationModule,
    ClientPresentationModule,
    RoomPresentationModule,
    RoomTypePresentationModule,
    CaracteristicaPresentationModule,
    // Utility Modules
    HealthModule,
    MetricsModule,
    BillingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
