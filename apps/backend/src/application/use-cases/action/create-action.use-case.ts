/**
 * Create Action Use Case
 * Caso de uso para crear una nueva action
 */

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IActionRepository } from '../../../domain/repositories/action.repository.interface';
import { Action } from '../../../domain/entities/action.entity';
import { CreateActionDto } from '../../dtos/action/create-action.dto';
import { ActionResponseDto } from '../../dtos/action/action-response.dto';

@Injectable()
export class CreateActionUseCase {
  constructor(
    @Inject('IActionRepository')
    private readonly actionRepository: IActionRepository,
  ) {}

  async execute(dto: CreateActionDto): Promise<ActionResponseDto> {
    // Verificar que no exista una action con la misma key
    const existing = await this.actionRepository.findByKey(dto.key);
    if (existing) {
      throw new BadRequestException(
        `Action with key '${dto.key}' already exists`,
      );
    }

    // Crear entidad de dominio (la validación del formato se hace en el constructor)
    const action = new Action(
      0, // ID temporal, será asignado por la BD
      dto.key,
      dto.name,
      dto.description,
      dto.key.split('.')[0], // Extraer área del key
    );

    // Persistir
    const saved = await this.actionRepository.save(action);

    return {
      id: saved.id,
      key: saved.key,
      name: saved.name,
      description: saved.description,
      area: saved.area,
      module: saved.getModule(),
      operation: saved.getOperation(),
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
