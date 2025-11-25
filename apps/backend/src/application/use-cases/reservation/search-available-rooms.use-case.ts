import { Injectable, Inject } from '@nestjs/common';
import type { IRoomRepository } from '../../../domain/repositories/room.repository.interface';
import { DateRange } from '../../../domain/value-objects/date-range.value-object';
import { SearchAvailableRoomsDto } from '../../dtos/reservation/search-available-rooms.dto';
import { AvailableRoomDto } from '../../dtos/reservation/available-room.dto';

/**
 * SearchAvailableRoomsUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Buscar habitaciones disponibles para un rango de fechas
 */
@Injectable()
export class SearchAvailableRoomsUseCase {
  constructor(
    @Inject('IRoomRepository')
    private readonly roomRepository: IRoomRepository,
  ) {}

  async execute(dto: SearchAvailableRoomsDto): Promise<AvailableRoomDto[]> {
    // Crear DateRange desde los strings
    const dateRange = DateRange.fromStrings(dto.checkInDate, dto.checkOutDate);

    // El roomType ahora es un string directamente
    const roomTypeCode = dto.roomType;

    // Buscar habitaciones disponibles
    const availableRooms = await this.roomRepository.findAvailableRooms(
      dateRange,
      roomTypeCode,
      dto.capacity,
    );

    // Calcular cantidad de noches
    const nights = dateRange.getNights();

    // Mapear entidades de dominio a DTOs de aplicación
    return availableRooms.map((room) => {
      const precioTotal = room.calculateTotalPrice(nights);

      return new AvailableRoomDto(
        room.id,
        room.numeroHabitacion,
        room.roomType.code,
        room.capacidad,
        room.precioPorNoche,
        room.descripcion,
        room.caracteristicasCompletas,
        precioTotal,
        nights,
      );
    });
  }
}
