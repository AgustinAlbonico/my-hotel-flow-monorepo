/**
 * Mapper: Application DTO → Presentation DTO
 * Patrón: Mapper Pattern
 * Capa: Presentation
 * Responsabilidad: Convertir DTOs de aplicación a DTOs de presentación
 */
import { Injectable } from '@nestjs/common';
import type { ReservationMenuResponseDto } from '../../application/dtos/reservation/reservation-menu-response.dto';
import type { ReservationMenuOptionDto } from '../../application/dtos/reservation/reservation-menu-option.dto';
import { ReservationMenuResponsePresentationDto } from '../dtos/reservation/reservation-menu-response.dto';
import { ReservationMenuOptionResponseDto } from '../dtos/reservation/reservation-menu-option-response.dto';

@Injectable()
export class ReservationMapper {
  /**
   * Mapea opción de menú de aplicación a presentación
   */
  toOptionResponse(
    dto: ReservationMenuOptionDto,
  ): ReservationMenuOptionResponseDto {
    const response = new ReservationMenuOptionResponseDto();
    response.key = dto.key;
    response.label = dto.label;
    response.description = dto.description;
    response.icon = dto.icon;
    response.path = dto.path;
    response.requiredAction = dto.requiredAction;
    response.isAvailable = dto.isAvailable;
    return response;
  }

  /**
   * Mapea respuesta de menú de aplicación a presentación
   */
  toMenuResponse(
    dto: ReservationMenuResponseDto,
  ): ReservationMenuResponsePresentationDto {
    const response = new ReservationMenuResponsePresentationDto();
    response.options = dto.options.map((opt) => this.toOptionResponse(opt));
    response.totalOptions = dto.totalOptions;
    response.availableOptions = dto.availableOptions;
    return response;
  }
}
