import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ICaracteristicaRepository } from '../../../domain/repositories/caracteristica.repository.interface';

/**
 * Use Case: Eliminar Característica
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la eliminación (soft delete) de una característica
 */
@Injectable()
export class DeleteCaracteristicaUseCase {
  private readonly logger = new Logger(DeleteCaracteristicaUseCase.name);

  constructor(
    @Inject('ICaracteristicaRepository')
    private readonly caracteristicaRepository: ICaracteristicaRepository,
  ) {}

  async execute(id: number): Promise<void> {
    this.logger.log(`Eliminando característica ID: ${id}`);

    // 1. Verificar que exista
    const caracteristica = await this.caracteristicaRepository.findById(id);
    if (!caracteristica) {
      this.logger.warn(`Característica con ID ${id} no encontrada`);
      throw new NotFoundException(`Característica con ID ${id} no encontrada`);
    }

    // 2. Realizar soft delete
    await this.caracteristicaRepository.delete(id);
    this.logger.log(`Característica ID ${id} eliminada exitosamente`);
  }
}
