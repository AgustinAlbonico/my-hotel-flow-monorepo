import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { RoomStatus } from '../../../domain/entities/room.entity';
import { ChangeRoomStatusDto } from '../../dtos/room/change-room-status.dto';
import { RoomResponseDto } from '../../dtos/room/room-response.dto';

/**
 * Use Case: Cambiar Estado de Habitación
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Cambiar el estado de disponibilidad de una habitación
 */
@Injectable()
export class ChangeRoomStatusUseCase {
  private readonly logger = new Logger(ChangeRoomStatusUseCase.name);

  constructor(
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(
    id: number,
    dto: ChangeRoomStatusDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(`Cambiando estado de habitación ID: ${id} a ${dto.status}`);

    // 1. Buscar habitación
    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
    }

    // 2. Cambiar estado (la entidad valida las reglas de negocio)
    const newStatus = RoomStatus[dto.status];
    room.changeStatus(newStatus);

    // 3. Persistir
    const updatedRoom = await this.roomRepository.update(room);
    this.logger.log(`Habitación ${id} cambió a estado ${dto.status}`);

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
