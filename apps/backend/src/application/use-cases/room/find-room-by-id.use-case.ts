import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { RoomResponseDto } from '../../dtos/room/room-response.dto';

/**
 * Use Case: Buscar Habitación por ID
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Obtener detalles de una habitación específica
 */
@Injectable()
export class FindRoomByIdUseCase {
  private readonly logger = new Logger(FindRoomByIdUseCase.name);

  constructor(
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(id: number): Promise<RoomResponseDto> {
    this.logger.log(`Buscando habitación ID: ${id}`);

    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
    }

    return {
      id: room.id,
      numeroHabitacion: room.numeroHabitacion,
      tipo: room.roomType.code,
      tipoNombre: room.roomType.name,
      estado: room.estado,
      capacidad: room.capacidad,
      precioPorNoche: room.precioPorNoche,
      descripcion: room.descripcion,
      caracteristicas: room.caracteristicasCompletas,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
