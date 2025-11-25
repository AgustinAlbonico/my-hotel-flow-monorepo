import {
  Inject,
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { IRoomTypeRepository } from '../../../domain/repositories/room-type.repository.interface';
import type { ICaracteristicaRepository } from '../../../domain/repositories/caracteristica.repository.interface';
import { RoomType } from '../../../domain/entities/room-type.entity';
import { CreateRoomTypeDto } from '../../dtos/room-type/create-room-type.dto';
import { RoomTypeResponseDto } from '../../dtos/room-type/room-type-response.dto';
import { Caracteristica } from '../../../domain/entities/caracteristica.entity';

/**
 * Use Case: Crear Tipo de Habitación
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la creación de un nuevo tipo de habitación
 */
@Injectable()
export class CreateRoomTypeUseCase {
  private readonly logger = new Logger(CreateRoomTypeUseCase.name);

  constructor(
    @Inject('IRoomTypeRepository')
    private readonly roomTypeRepository: IRoomTypeRepository,
    @Inject('ICaracteristicaRepository')
    private readonly caracteristicaRepository: ICaracteristicaRepository,
  ) {}

  async execute(dto: CreateRoomTypeDto): Promise<RoomTypeResponseDto> {
    this.logger.log(`Creando tipo de habitación: ${dto.code}`);

    // 1. Verificar que el código no exista
    const existingType = await this.roomTypeRepository.findByCode(dto.code);
    if (existingType) {
      this.logger.warn(`Tipo de habitación ${dto.code} ya existe`);
      throw new ConflictException(
        `El tipo de habitación ${dto.code} ya existe`,
      );
    }

    // 2. Cargar características si se proporcionaron IDs
    let caracteristicas: Caracteristica[] = [];
    if (dto.caracteristicasIds && dto.caracteristicasIds.length > 0) {
      caracteristicas = await this.caracteristicaRepository.findByIds(
        dto.caracteristicasIds,
      );
      if (caracteristicas.length !== dto.caracteristicasIds.length) {
        throw new BadRequestException('Una o más características no existen');
      }
    }

    // 3. Crear entidad de dominio (con validaciones)
    const roomType = RoomType.create(
      dto.code,
      dto.name,
      dto.precioPorNoche,
      dto.capacidadMaxima,
      dto.descripcion || null,
      caracteristicas,
    );

    // 4. Persistir
    const savedRoomType = await this.roomTypeRepository.save(roomType);
    this.logger.log(`Tipo de habitación creado con ID: ${savedRoomType.id}`);

    // 5. Retornar DTO
    return this.mapToResponseDto(savedRoomType);
  }

  private mapToResponseDto(roomType: RoomType): RoomTypeResponseDto {
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
