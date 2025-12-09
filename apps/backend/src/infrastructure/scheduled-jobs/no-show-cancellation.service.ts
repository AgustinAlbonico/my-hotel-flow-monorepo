import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutoCancelNoShowUseCase } from '../../application/use-cases/reservation/auto-cancel-no-show.use-case';

/**
 * NoShowCancellationService
 * Patrón: Scheduled Job
 * Capa: Infrastructure
 * Responsabilidad: Ejecutar cancelación automática de reservas no-show
 * 
 * Implementa 3 mecanismos:
 * 1. Cron Job (3 AM diario) - Si el servidor está corriendo
 * 2. Catch-up al inicio - Al arrancar el servidor
 * 3. Método público - Para llamadas on-demand desde otros servicios
 */
@Injectable()
export class NoShowCancellationService implements OnApplicationBootstrap {
    private readonly logger = new Logger(NoShowCancellationService.name);
    private isProcessing = false;

    constructor(
        private readonly autoCancelNoShowUseCase: AutoCancelNoShowUseCase,
    ) { }

    /**
     * Mecanismo 2: Catch-up al iniciar el servidor
     * Se ejecuta automáticamente cuando el servidor arranca
     */
    async onApplicationBootstrap() {
        this.logger.log('Servidor iniciado - Ejecutando catch-up de no-shows pendientes');
        await this.processNoShows('CATCH-UP AL INICIO');
    }

    /**
     * Mecanismo 1: Cron Job diario a las 3:00 AM
     * Se ejecuta solo si el servidor está corriendo a esa hora
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleScheduledCheck() {
        this.logger.log('Ejecutando verificación programada de no-shows (3:00 AM)');
        await this.processNoShows('CRON JOB 3AM');
    }

    /**
     * Mecanismo 3: Método público para llamadas on-demand
     * Puede ser invocado por otros servicios cuando sea necesario
     */
    async processNoShows(trigger: string = 'ON-DEMAND'): Promise<number> {
        // Prevenir ejecuciones concurrentes
        if (this.isProcessing) {
            this.logger.warn('Ya hay un proceso de cancelación en ejecución, omitiendo');
            return 0;
        }

        this.isProcessing = true;
        const startTime = Date.now();

        try {
            this.logger.log(`[${trigger}] Iniciando proceso de cancelación de no-shows`);

            const canceledCount = await this.autoCancelNoShowUseCase.execute();

            const duration = Date.now() - startTime;

            if (canceledCount > 0) {
                this.logger.log(
                    `[${trigger}] ✅ Proceso completado: ${canceledCount} reservas canceladas en ${duration}ms`,
                );
            } else {
                this.logger.debug(
                    `[${trigger}] ℹ️  No se encontraron reservas no-show para cancelar (${duration}ms)`,
                );
            }

            return canceledCount;
        } catch (error) {
            this.logger.error(
                `[${trigger}] ❌ Error durante el proceso de cancelación de no-shows: ${error.message}`,
                error.stack,
            );
            return 0;
        } finally {
            this.isProcessing = false;
        }
    }
}
