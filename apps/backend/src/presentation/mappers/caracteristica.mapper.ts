import { Injectable } from '@nestjs/common';
import { CreateCaracteristicaDto } from '../../application/dtos/caracteristica/create-caracteristica.dto';
import { CreateCaracteristicaRequestDto } from '../dtos/caracteristica/create-caracteristica-request.dto';
import { UpdateCaracteristicaDto } from '../../application/dtos/caracteristica/update-caracteristica.dto';
import { UpdateCaracteristicaRequestDto } from '../dtos/caracteristica/update-caracteristica-request.dto';

/**
 * CaracteristicaMapper
 * Patrón: Mapper Pattern
 * Capa: Presentation
 * Responsabilidad: Convertir entre DTOs de aplicación y presentación
 */
@Injectable()
export class CaracteristicaMapper {
  /**
   * Convierte CreateCaracteristicaRequestDto a CreateCaracteristicaDto
   */
  toCreateDto(
    request: CreateCaracteristicaRequestDto,
  ): CreateCaracteristicaDto {
    return {
      nombre: request.nombre,
      descripcion: request.descripcion,
    };
  }

  /**
   * Convierte UpdateCaracteristicaRequestDto a UpdateCaracteristicaDto
   */
  toUpdateDto(
    request: UpdateCaracteristicaRequestDto,
  ): UpdateCaracteristicaDto {
    return {
      nombre: request.nombre,
      descripcion: request.descripcion,
      isActive: request.isActive,
    };
  }
}
