import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IRoomTypeRepository } from '../../../domain/repositories/room-type.repository.interface';
import { RoomTypeResponseDto } from '../../dtos/room-type/room-type-response.dto';

/**
 * Use Case: Listar Tipos de Habitación
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Obtener todos los tipos de habitación
 */
@Injectable()
export class ListRoomTypesUseCase {
  private readonly logger = new Logger(ListRoomTypesUseCase.name);

  constructor(
    @Inject('IRoomTypeRepository')
    private readonly roomTypeRepository: IRoomTypeRepository,
  ) {}

  async execute(onlyActive: boolean = true): Promise<RoomTypeResponseDto[]> {
    this.logger.log(`Listando tipos de habitación (onlyActive: ${onlyActive})`);

    const roomTypes = onlyActive
      ? await this.roomTypeRepository.findAllActive()
      : await this.roomTypeRepository.findAll();

    return roomTypes.map((roomType) => ({
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
    }));
  }
}
