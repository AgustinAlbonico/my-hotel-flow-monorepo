import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NoShowCancellationService } from './no-show-cancellation.service';
import { ReservationUseCasesModule } from '../../application/use-cases/reservation/reservation-use-cases.module';

/**
 * ScheduledJobsModule
 * Patrón: Module Pattern - NestJS
 * Capa: Infrastructure
 * Responsabilidad: Agrupar y configurar todos los trabajos programados del sistema
 */
@Module({
    imports: [
        ScheduleModule.forRoot(), // Habilita los cron jobs en la aplicación
        ReservationUseCasesModule, // Para usar AutoCancelNoShowUseCase
    ],
    providers: [NoShowCancellationService],
    exports: [NoShowCancellationService], // Exportar para uso on-demand en otros módulos
})
export class ScheduledJobsModule { }
