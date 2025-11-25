import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { RoomResponseDto } from '../../dtos/room/room-response.dto';
import { ListRoomsFiltersDto } from '../../dtos/room/list-rooms-filters.dto';
import { Room } from '../../../domain/entities/room.entity';

/**
 * Use Case: Listar Habitaciones
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Obtener lista de habitaciones con filtros opcionales
 */
@Injectable()
export class ListRoomsUseCase {
  private readonly logger = new Logger(ListRoomsUseCase.name);

  constructor(
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(filters?: ListRoomsFiltersDto): Promise<RoomResponseDto[]> {
    this.logger.log('Listando habitaciones');

    // 1. Obtener todas las habitaciones activas
    const rooms = await this.roomRepository.findAllActive();

    // 2. Aplicar filtros en memoria
    let filteredRooms = rooms;

    if (filters) {
      filteredRooms = this.applyFilters(rooms, filters);
    }

    // 3. Mapear a DTOs
    return filteredRooms.map((room) => this.mapToResponseDto(room));
  }

  private applyFilters(rooms: Room[], filters: ListRoomsFiltersDto): Room[] {
    return rooms.filter((room) => {
      // Filtro por tipo
      if (filters.tipo && room.roomType.code.toString() !== filters.tipo) {
        return false;
      }

      // Filtro por estado
      if (filters.estado && room.estado.toString() !== filters.estado) {
        return false;
      }

      // Filtro por capacidad mínima
      if (filters.capacidadMinima && room.capacidad < filters.capacidadMinima) {
        return false;
      }

      // Filtro por precio máximo
      if (filters.precioMaximo && room.precioPorNoche > filters.precioMaximo) {
        return false;
      }

      // Filtro por activo
      if (
        filters.onlyActive !== undefined &&
        room.isActive !== filters.onlyActive
      ) {
        return false;
      }

      return true;
    });
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
