/**
 * TypeORM Persistence Module
 * Módulo que proporciona la implementación de repositorios con TypeORM
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionOrmEntity } from './entities/action.orm-entity';
import { GroupOrmEntity } from './entities/group.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { ClientOrmEntity } from './entities/client.orm-entity';
import { RoomOrmEntity } from './entities/room.orm-entity';
import { RoomTypeOrmEntity } from './entities/room-type.orm-entity';
import { CaracteristicaOrmEntity } from './entities/caracteristica.orm-entity';
import { TypeOrmActionRepository } from './repositories/action.repository.impl';
import { TypeOrmGroupRepository } from './repositories/group.repository.impl';
import { TypeOrmUserRepository } from './repositories/user.repository.impl';
import { TypeOrmClientRepository } from './repositories/client.repository.impl';
import { TypeOrmRoomRepository } from './repositories/room.repository.impl';
import { TypeOrmRoomTypeRepository } from './repositories/room-type.repository';
import { CaracteristicaRepository } from './repositories/caracteristica.repository.impl';
import { ActionMapper } from './mappers/action.mapper';
import { GroupMapper } from './mappers/group.mapper';
import { UserMapper } from './mappers/user.mapper';
import { ClientMapper } from './mappers/client.mapper';
import { RoomMapper } from './mappers/room.mapper';
import { RoomTypeMapper } from './mappers/room-type.mapper';
import { CaracteristicaMapper } from './mappers/caracteristica.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActionOrmEntity,
      GroupOrmEntity,
      UserOrmEntity,
      ClientOrmEntity,
      RoomOrmEntity,
      RoomTypeOrmEntity,
      CaracteristicaOrmEntity,
    ]),
  ],
  providers: [
    ActionMapper,
    GroupMapper,
    UserMapper,
    ClientMapper,
    RoomMapper,
    RoomTypeMapper,
    CaracteristicaMapper,
    {
      provide: 'IActionRepository',
      useClass: TypeOrmActionRepository,
    },
    {
      provide: 'IGroupRepository',
      useClass: TypeOrmGroupRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
    {
      provide: 'IClientRepository',
      useClass: TypeOrmClientRepository,
    },
    {
      provide: 'IRoomRepository',
      useClass: TypeOrmRoomRepository,
    },
    {
      provide: 'IRoomTypeRepository',
      useClass: TypeOrmRoomTypeRepository,
    },
    {
      provide: 'ICaracteristicaRepository',
      useClass: CaracteristicaRepository,
    },
  ],
  exports: [
    'IActionRepository',
    'IGroupRepository',
    'IUserRepository',
    'IClientRepository',
    'IRoomRepository',
    'IRoomTypeRepository',
    'ICaracteristicaRepository',
  ],
})
export class TypeOrmPersistenceModule {}
