import { Inject, Injectable, Logger, ConflictException } from '@nestjs/common';
import type { ICaracteristicaRepository } from '../../../domain/repositories/caracteristica.repository.interface';
import { Caracteristica } from '../../../domain/entities/caracteristica.entity';
import { CreateCaracteristicaDto } from '../../dtos/caracteristica/create-caracteristica.dto';
import { CaracteristicaResponseDto } from '../../dtos/caracteristica/caracteristica-response.dto';

/**
 * Use Case: Crear Característica
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la creación de una nueva característica
 */
@Injectable()
export class CreateCaracteristicaUseCase {
  private readonly logger = new Logger(CreateCaracteristicaUseCase.name);

  constructor(
    @Inject('ICaracteristicaRepository')
    private readonly caracteristicaRepository: ICaracteristicaRepository,
  ) {}

  async execute(
    dto: CreateCaracteristicaDto,
  ): Promise<CaracteristicaResponseDto> {
    this.logger.log(`Creando característica: ${dto.nombre}`);

    // 1. Verificar que el nombre no exista
    const existingCaracteristica =
      await this.caracteristicaRepository.findByNombre(dto.nombre);
    if (existingCaracteristica) {
      this.logger.warn(`Característica ${dto.nombre} ya existe`);
      throw new ConflictException(`La característica ${dto.nombre} ya existe`);
    }

    // 2. Crear entidad de dominio (con validaciones)
    const caracteristica = Caracteristica.create(
      dto.nombre,
      dto.descripcion || null,
    );

    // 3. Persistir
    const savedCaracteristica =
      await this.caracteristicaRepository.save(caracteristica);
    this.logger.log(`Característica creada con ID: ${savedCaracteristica.id}`);

    // 4. Retornar DTO
    return this.mapToResponseDto(savedCaracteristica);
  }

  private mapToResponseDto(
    caracteristica: Caracteristica,
  ): CaracteristicaResponseDto {
    return {
      id: caracteristica.id,
      nombre: caracteristica.nombre,
      descripcion: caracteristica.descripcion,
      isActive: caracteristica.isActive,
      createdAt: caracteristica.createdAt,
      updatedAt: caracteristica.updatedAt,
    };
  }
}
