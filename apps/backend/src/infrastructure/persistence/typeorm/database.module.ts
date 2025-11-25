/**
 * Database Module
 * Configura la conexión a PostgreSQL con TypeORM
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ActionOrmEntity } from './entities/action.orm-entity';
import { GroupOrmEntity } from './entities/group.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { RevokedTokenEntity } from './entities/revoked-token.orm-entity';
import { ClientOrmEntity } from './entities/client.orm-entity';
import { RoomOrmEntity } from './entities/room.orm-entity';
import { RoomTypeOrmEntity } from './entities/room-type.orm-entity';
import { CaracteristicaOrmEntity } from './entities/caracteristica.orm-entity';
import { ReservationOrmEntity } from './entities/reservation.orm-entity';
import { InvoiceOrmEntity } from './entities/invoice.orm-entity';
import { PaymentOrmEntity } from './entities/payment.orm-entity';
import { AccountMovementOrmEntity } from './entities/account-movement.orm-entity';
import { MercadoPagoPaymentOrmEntity } from './entities/mercadopago-payment.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          ActionOrmEntity,
          GroupOrmEntity,
          UserOrmEntity,
          RevokedTokenEntity,
          ClientOrmEntity,
          RoomOrmEntity,
          RoomTypeOrmEntity,
          CaracteristicaOrmEntity,
          ReservationOrmEntity,
          // Billing & Payments
          InvoiceOrmEntity,
          PaymentOrmEntity,
          AccountMovementOrmEntity,
          MercadoPagoPaymentOrmEntity,
        ],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        ssl: configService.get('database.ssl')
          ? {
              rejectUnauthorized: false,
            }
          : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
