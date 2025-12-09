/**
 * Audit Module
 * Módulo para gestionar la auditoría del sistema
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationAuditLogOrmEntity } from './persistence/typeorm/entities/reservation-audit-log.orm-entity';
import { UserSessionOrmEntity } from './persistence/typeorm/entities/user-session.orm-entity';
import { UserActivityLogOrmEntity } from './persistence/typeorm/entities/user-activity-log.orm-entity';
import { AuditService } from './services/audit.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReservationAuditLogOrmEntity,
      UserSessionOrmEntity,
      UserActivityLogOrmEntity,
    ]),
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
