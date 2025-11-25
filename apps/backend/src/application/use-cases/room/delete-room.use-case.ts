import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';

/**
 * Use Case: Eliminar Habitación (Soft Delete)
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Desactivar una habitación (no elimina físicamente)
 */
@Injectable()
export class DeleteRoomUseCase {
  private readonly logger = new Logger(DeleteRoomUseCase.name);

  constructor(
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(id: number): Promise<void> {
    this.logger.log(`Eliminando (desactivando) habitación ID: ${id}`);

    // 1. Buscar habitación
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
    }

    // 2. Desactivar (soft delete) - la entidad valida si se puede
    room.deactivate();

    // 3. Persistir
    await this.roomRepository.update(room);
    this.logger.log(`Habitación ${id} desactivada`);
  }
}
