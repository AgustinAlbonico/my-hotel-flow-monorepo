import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IRoomTypeRepository } from '../../../domain/repositories/room-type.repository.interface';
import type { ICaracteristicaRepository } from '../../../domain/repositories/caracteristica.repository.interface';
import { UpdateRoomTypeDto } from '../../dtos/room-type/update-room-type.dto';
import { RoomTypeResponseDto } from '../../dtos/room-type/room-type-response.dto';
import { Caracteristica } from '../../../domain/entities/caracteristica.entity';

/**
 * Use Case: Actualizar Tipo de Habitación
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la actualización de un tipo de habitación
 */
@Injectable()
export class UpdateRoomTypeUseCase {
  private readonly logger = new Logger(UpdateRoomTypeUseCase.name);

  constructor(
    @Inject('IRoomTypeRepository')
    private readonly roomTypeRepository: IRoomTypeRepository,
    @Inject('ICaracteristicaRepository')
    private readonly caracteristicaRepository: ICaracteristicaRepository,
  ) {}

  async execute(
    id: number,
    dto: UpdateRoomTypeDto,
  ): Promise<RoomTypeResponseDto> {
    this.logger.log(`Actualizando tipo de habitación ID: ${id}`);

    // 1. Buscar tipo de habitación
    const roomType = await this.roomTypeRepository.findById(id);
    if (!roomType) {
      throw new NotFoundException(
        `Tipo de habitación con ID ${id} no encontrado`,
      );
    }

    // 2. Cargar características si se proporcionaron IDs
    let caracteristicas: Caracteristica[] | undefined;
    if (dto.caracteristicasIds) {
      caracteristicas = await this.caracteristicaRepository.findByIds(
        dto.caracteristicasIds,
      );
      if (caracteristicas.length !== dto.caracteristicasIds.length) {
        throw new BadRequestException('Una o más características no existen');
      }
    }

    // 3. Actualizar campos
    if (dto.precioPorNoche !== undefined) {
      roomType.updatePrice(dto.precioPorNoche);
    }

    roomType.update(
      dto.name,
      dto.capacidadMaxima,
      dto.descripcion,
      caracteristicas,
    );

    // 4. Persistir
    const updatedRoomType = await this.roomTypeRepository.update(roomType);
    this.logger.log(`Tipo de habitación ${id} actualizado`);

    // 5. Retornar DTO
    return {
      id: updatedRoomType.id,
      code: updatedRoomType.code,
      name: updatedRoomType.name,
      precioPorNoche: updatedRoomType.precioPorNoche,
      capacidadMaxima: updatedRoomType.capacidadMaxima,
      descripcion: updatedRoomType.descripcion,
      caracteristicas: updatedRoomType.caracteristicas.map((car) => ({
        id: car.id,
        nombre: car.nombre,
        descripcion: car.descripcion,
        isActive: car.isActive,
        createdAt: car.createdAt,
        updatedAt: car.updatedAt,
      })),
      isActive: updatedRoomType.isActive,
      createdAt: updatedRoomType.createdAt,
      updatedAt: updatedRoomType.updatedAt,
    };
  }
}
