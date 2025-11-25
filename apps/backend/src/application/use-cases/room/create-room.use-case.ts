import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import type { IRoomTypeRepository } from '../../../domain/repositories/room-type.repository.interface';
import { Room } from '../../../domain/entities/room.entity';
import { RoomAlreadyExistsException } from '../../../domain/exceptions/room.exceptions';
import { CreateRoomDto } from '../../dtos/room/create-room.dto';
import { RoomResponseDto } from '../../dtos/room/room-response.dto';

/**
 * Use Case: Crear Habitación
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la creación de una nueva habitación
 */
@Injectable()
export class CreateRoomUseCase {
  private readonly logger = new Logger(CreateRoomUseCase.name);

  constructor(
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
    @Inject('IRoomTypeRepository')
    private readonly roomTypeRepository: IRoomTypeRepository,
  ) {}

  async execute(dto: CreateRoomDto): Promise<RoomResponseDto> {
    this.logger.log(`Creando habitación: ${dto.numeroHabitacion}`);

    // 1. Verificar que el número de habitación no exista
    const existingRoom = await this.roomRepository.findByNumero(
      dto.numeroHabitacion,
    );
    if (existingRoom) {
      this.logger.warn(`Habitación ${dto.numeroHabitacion} ya existe`);
      throw new RoomAlreadyExistsException(dto.numeroHabitacion);
    }

    // 2. Buscar el tipo de habitación
    const roomType = await this.roomTypeRepository.findById(dto.roomTypeId);
    if (!roomType) {
      throw new Error(`Room type with ID ${dto.roomTypeId} not found`);
    }

    // 3. Crear entidad de dominio (con validaciones)
    const room = Room.create(
      dto.numeroHabitacion,
      roomType,
      dto.descripcion || null,
      dto.caracteristicasAdicionales || [],
    );

    // 4. Persistir
    const savedRoom = await this.roomRepository.create(room);
    this.logger.log(`Habitación creada con ID: ${savedRoom.id}`);

    // 5. Retornar DTO
    return this.mapToResponseDto(savedRoom);
  }

  private mapToResponseDto(room: Room): RoomResponseDto {
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
