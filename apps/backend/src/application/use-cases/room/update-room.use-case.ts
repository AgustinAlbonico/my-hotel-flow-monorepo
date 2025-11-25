import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { UpdateRoomDto } from '../../dtos/room/update-room.dto';
import { RoomResponseDto } from '../../dtos/room/room-response.dto';

/**
 * Use Case: Actualizar Habitación
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la actualización de una habitación existente
 */
@Injectable()
export class UpdateRoomUseCase {
  private readonly logger = new Logger(UpdateRoomUseCase.name);

  constructor(
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(id: number, dto: UpdateRoomDto): Promise<RoomResponseDto> {
    this.logger.log(`Actualizando habitación ID: ${id}`);

    // 1. Buscar habitación
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
    }

    // 2. Actualizar campos (la entidad valida)
    room.update(dto.descripcion, dto.caracteristicasAdicionales);

    // 3. Persistir
    const updatedRoom = await this.roomRepository.update(room);
    this.logger.log(`Habitación ${id} actualizada`);

    // 4. Retornar DTO
    return {
      id: updatedRoom.id,
      numeroHabitacion: updatedRoom.numeroHabitacion,
      tipo: updatedRoom.roomType.code,
      tipoNombre: updatedRoom.roomType.name,
      estado: updatedRoom.estado,
      capacidad: updatedRoom.capacidad,
      precioPorNoche: updatedRoom.precioPorNoche,
      descripcion: updatedRoom.descripcion,
      caracteristicas: updatedRoom.caracteristicasCompletas,
      isActive: updatedRoom.isActive,
      createdAt: updatedRoom.createdAt,
      updatedAt: updatedRoom.updatedAt,
    };
  }
}
