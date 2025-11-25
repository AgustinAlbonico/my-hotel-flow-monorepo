import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { IRoomTypeRepository } from '../../../domain/repositories/room-type.repository.interface';

/**
 * DeleteRoomTypeUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar el borrado lógico de un tipo de habitación
 */
@Injectable()
export class DeleteRoomTypeUseCase {
  private readonly logger = new Logger(DeleteRoomTypeUseCase.name);

  constructor(
    @Inject('IRoomTypeRepository')
    private readonly roomTypeRepository: IRoomTypeRepository,
  ) {}

  async execute(id: number): Promise<void> {
    this.logger.log(`Eliminando tipo de habitación con ID: ${id}`);

    const roomType = await this.roomTypeRepository.findById(id);
    if (!roomType) {
      throw new NotFoundException(
        `Tipo de habitación con ID ${id} no encontrado`,
      );
    }

    // Borrado lógico: cambiar isActive a false
    roomType.deactivate();
    await this.roomTypeRepository.update(roomType);

    this.logger.log(`Tipo de habitación con ID ${id} eliminado exitosamente`);
  }
}
