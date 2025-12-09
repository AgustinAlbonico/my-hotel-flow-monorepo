import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { ReservationOrmEntity } from '../../infrastructure/persistence/typeorm/entities/reservation.orm-entity';
import { RoomOrmEntity } from '../../infrastructure/persistence/typeorm/entities/room.orm-entity';
import { PaymentOrmEntity } from '../../infrastructure/persistence/typeorm/entities/payment.orm-entity';
import { InvoiceOrmEntity } from '../../infrastructure/persistence/typeorm/entities/invoice.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservationOrmEntity,
      RoomOrmEntity,
      PaymentOrmEntity,
      InvoiceOrmEntity,
    ]),
  ],
  controllers: [DashboardController],
})
export class DashboardPresentationModule {}
