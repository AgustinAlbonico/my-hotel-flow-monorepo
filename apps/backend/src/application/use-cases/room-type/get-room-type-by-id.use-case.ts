import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { IRoomTypeRepository } from '../../../domain/repositories/room-type.repository.interface';
import { RoomTypeResponseDto } from '../../dtos/room-type/room-type-response.dto';

/**
 * Use Case: Obtener Tipo de Habitación por ID
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Obtener un tipo de habitación específico
 */
@Injectable()
export class GetRoomTypeByIdUseCase {
  private readonly logger = new Logger(GetRoomTypeByIdUseCase.name);

  constructor(
    @Inject('IRoomTypeRepository')
    private readonly roomTypeRepository: IRoomTypeRepository,
  ) {}

  async execute(id: number): Promise<RoomTypeResponseDto> {
    this.logger.log(`Obteniendo tipo de habitación con ID: ${id}`);

    const roomType = await this.roomTypeRepository.findById(id);

    if (!roomType) {
      throw new NotFoundException(
        `Tipo de habitación con ID ${id} no encontrado`,
      );
    }

    return {
      id: roomType.id,
      code: roomType.code,
      name: roomType.name,
      precioPorNoche: roomType.precioPorNoche,
      capacidadMaxima: roomType.capacidadMaxima,
      descripcion: roomType.descripcion,
      caracteristicas: roomType.caracteristicas.map((car) => ({
        id: car.id,
        nombre: car.nombre,
        descripcion: car.descripcion,
        isActive: car.isActive,
        createdAt: car.createdAt,
        updatedAt: car.updatedAt,
      })),
      isActive: roomType.isActive,
      createdAt: roomType.createdAt,
      updatedAt: roomType.updatedAt,
    };
  }
}
