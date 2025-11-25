import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrmEntity } from '../../infrastructure/persistence/typeorm/entities/client.orm-entity';
import { RoomOrmEntity } from '../../infrastructure/persistence/typeorm/entities/room.orm-entity';
import { ReservationOrmEntity } from '../../infrastructure/persistence/typeorm/entities/reservation.orm-entity';
import { InvoiceOrmEntity } from '../../infrastructure/persistence/typeorm/entities/invoice.orm-entity';
import { TypeOrmClientRepository } from '../../infrastructure/persistence/typeorm/repositories/client.repository.impl';
import { TypeOrmRoomRepository } from '../../infrastructure/persistence/typeorm/repositories/room.repository.impl';
import { TypeOrmReservationRepository } from '../../infrastructure/persistence/typeorm/repositories/reservation.repository.impl';
import { ClientMapper } from '../../infrastructure/persistence/typeorm/mappers/client.mapper';
import { RoomMapper } from '../../infrastructure/persistence/typeorm/mappers/room.mapper';
import { ReservationMapper } from '../../infrastructure/persistence/typeorm/mappers/reservation.mapper';
import { SearchClientByDNIUseCase } from '../../application/use-cases/reservation/search-client-by-dni.use-case';
import { SearchClientWithDebtByDNIUseCase } from '../../application/use-cases/reservation/search-client-with-debt-by-dni.use-case';
import { SearchAvailableRoomsUseCase } from '../../application/use-cases/reservation/search-available-rooms.use-case';
import { CreateReservationUseCase } from '../../application/use-cases/reservation/create-reservation.use-case';
import { GetReservationManagementMenuUseCase } from '../../application/use-cases/reservation/get-reservation-management-menu.use-case';
import { TypeOrmInvoiceRepository } from '../../infrastructure/persistence/typeorm/repositories/invoice.repository.impl';
import { InvoiceMapper } from '../../infrastructure/persistence/typeorm/mappers/invoice.mapper';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationManagementController } from '../controllers/reservation-management.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientOrmEntity,
      RoomOrmEntity,
      ReservationOrmEntity,
      InvoiceOrmEntity,
    ]),
  ],
  controllers: [ReservationController, ReservationManagementController],
  providers: [
    ClientMapper,
    RoomMapper,
    ReservationMapper,
    {
      provide: 'IClientRepository',
      useClass: TypeOrmClientRepository,
    },
    {
      provide: 'IRoomRepository',
      useClass: TypeOrmRoomRepository,
    },
    {
      provide: 'IReservationRepository',
      useClass: TypeOrmReservationRepository,
    },
    SearchClientByDNIUseCase,
    SearchAvailableRoomsUseCase,
    CreateReservationUseCase,
    GetReservationManagementMenuUseCase,
    SearchClientWithDebtByDNIUseCase,
    InvoiceMapper,
    {
      provide: 'IInvoiceRepository',
      useClass: TypeOrmInvoiceRepository,
    },
  ],
  exports: [
    SearchClientByDNIUseCase,
    SearchAvailableRoomsUseCase,
    CreateReservationUseCase,
  ],
})
export class ReservationModule {}
