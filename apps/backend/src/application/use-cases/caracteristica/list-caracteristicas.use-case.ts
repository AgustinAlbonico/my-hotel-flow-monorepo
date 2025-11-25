import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ICaracteristicaRepository } from '../../../domain/repositories/caracteristica.repository.interface';
import { CaracteristicaResponseDto } from '../../dtos/caracteristica/caracteristica-response.dto';

/**
 * Use Case: Listar Características
 * Patrón: Use Case Pattern - Clean Architecture
 * Capa: Application
 * Responsabilidad: Orquestar la obtención de la lista de características
 */
@Injectable()
export class ListCaracteristicasUseCase {
  private readonly logger = new Logger(ListCaracteristicasUseCase.name);

  constructor(
    @Inject('ICaracteristicaRepository')
    private readonly caracteristicaRepository: ICaracteristicaRepository,
  ) {}

  async execute(
    onlyActive: boolean = true,
  ): Promise<CaracteristicaResponseDto[]> {
    this.logger.log(`Listando características (solo activas: ${onlyActive})`);

    const caracteristicas = onlyActive
      ? await this.caracteristicaRepository.findAllActive()
      : await this.caracteristicaRepository.findAll();

    this.logger.log(`Se encontraron ${caracteristicas.length} características`);

    return caracteristicas.map((car) => ({
      id: car.id,
      nombre: car.nombre,
      descripcion: car.descripcion,
      isActive: car.isActive,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    }));
  }
}
