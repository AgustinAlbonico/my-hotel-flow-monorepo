import { Module } from '@nestjs/common';
import { AuditController } from './controllers/audit.controller';
import { AuditModule } from '../infrastructure/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AuditController],
})
export class AuditPresentationModule {}
