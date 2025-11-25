import { Injectable } from '@nestjs/common';
import { RoomResponseDto as ApplicationRoomResponseDto } from '../../application/dtos/room/room-response.dto';
import { RoomResponseDto as PresentationRoomResponseDto } from '../dtos/room/room-response.dto';
import { CreateRoomDto } from '../../application/dtos/room/create-room.dto';
import { CreateRoomRequestDto } from '../dtos/room/create-room-request.dto';
import { UpdateRoomDto } from '../../application/dtos/room/update-room.dto';
import { UpdateRoomRequestDto } from '../dtos/room/update-room-request.dto';
import { ChangeRoomStatusDto } from '../../application/dtos/room/change-room-status.dto';
import { ChangeRoomStatusRequestDto } from '../dtos/room/change-room-status-request.dto';

/**
 * RoomMapper
 * Patrón: Mapper Pattern
 * Capa: Presentation
 * Responsabilidad: Convertir entre DTOs de aplicación y presentación
 */
@Injectable()
export class RoomMapper {
  /**
   * Convierte CreateRoomRequestDto a CreateRoomDto
   */
  toCreateDto(request: CreateRoomRequestDto): CreateRoomDto {
    return {
      numeroHabitacion: request.numeroHabitacion,
      roomTypeId: request.roomTypeId,
      descripcion: request.descripcion,
      caracteristicasAdicionales: request.caracteristicasAdicionales,
    };
  }

  /**
   * Convierte UpdateRoomRequestDto a UpdateRoomDto
   */
  toUpdateDto(request: UpdateRoomRequestDto): UpdateRoomDto {
    return {
      descripcion: request.descripcion,
      caracteristicasAdicionales: request.caracteristicasAdicionales,
    };
  }

  /**
   * Convierte ChangeRoomStatusRequestDto a ChangeRoomStatusDto
   */
  toChangeStatusDto(request: ChangeRoomStatusRequestDto): ChangeRoomStatusDto {
    return {
      status: request.status,
    };
  }

  /**
   * Convierte RoomResponseDto de aplicación a presentación
   */
  toResponseDto(
    appDto: ApplicationRoomResponseDto,
  ): PresentationRoomResponseDto {
    return {
      id: appDto.id,
      numeroHabitacion: appDto.numeroHabitacion,
      tipo: appDto.tipo.toString(),
      estado: appDto.estado.toString(),
      capacidad: appDto.capacidad,
      precioPorNoche: appDto.precioPorNoche,
      descripcion: appDto.descripcion,
      caracteristicas: appDto.caracteristicas,
      isActive: appDto.isActive,
      createdAt: appDto.createdAt,
      updatedAt: appDto.updatedAt,
    };
  }

  /**
   * Convierte array de RoomResponseDto
   */
  toResponseDtoList(
    appDtos: ApplicationRoomResponseDto[],
  ): PresentationRoomResponseDto[] {
    return appDtos.map((dto) => this.toResponseDto(dto));
  }
}
