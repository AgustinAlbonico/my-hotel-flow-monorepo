import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { ICaracteristicaRepository } from '../../../domain/repositories/caracteristica.repository.interface';
import { UpdateCaracteristicaDto } from '../../dtos/caracteristica/update-caracteristica.dto';
import { CaracteristicaResponseDto } from '../../dtos/caracteristica/caracteristica-response.dto';

/**
 * Use Case: Actualizar Característica
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la actualización de una característica existente
 */
@Injectable()
export class UpdateCaracteristicaUseCase {
  private readonly logger = new Logger(UpdateCaracteristicaUseCase.name);

  constructor(
    @Inject('ICaracteristicaRepository')
    private readonly caracteristicaRepository: ICaracteristicaRepository,
  ) {}

  async execute(
    id: number,
    dto: UpdateCaracteristicaDto,
  ): Promise<CaracteristicaResponseDto> {
    this.logger.log(`Actualizando característica ID: ${id}`);

    // 1. Buscar característica existente
    const caracteristica = await this.caracteristicaRepository.findById(id);
    if (!caracteristica) {
      this.logger.warn(`Característica con ID ${id} no encontrada`);
      throw new NotFoundException(`Característica con ID ${id} no encontrada`);
    }

    // 2. Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (dto.nombre && dto.nombre !== caracteristica.nombre) {
      const existingCaracteristica =
        await this.caracteristicaRepository.findByNombre(dto.nombre);
      if (existingCaracteristica && existingCaracteristica.id !== id) {
        this.logger.warn(`Característica ${dto.nombre} ya existe`);
        throw new ConflictException(
          `Ya existe otra característica con el nombre ${dto.nombre}`,
        );
      }
    }

    // 3. Actualizar entidad (las validaciones están en el método update)
    caracteristica.update(dto.nombre, dto.descripcion);

    // 4. Actualizar estado activo si se proporciona
    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        caracteristica.activate();
      } else {
        caracteristica.deactivate();
      }
    }

    // 5. Persistir cambios
    const updatedCaracteristica =
      await this.caracteristicaRepository.update(caracteristica);
    this.logger.log(`Característica ID ${id} actualizada exitosamente`);

    // 6. Retornar DTO
    return {
      id: updatedCaracteristica.id,
      nombre: updatedCaracteristica.nombre,
      descripcion: updatedCaracteristica.descripcion,
      isActive: updatedCaracteristica.isActive,
      createdAt: updatedCaracteristica.createdAt,
      updatedAt: updatedCaracteristica.updatedAt,
    };
  }
}
