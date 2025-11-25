/**
 * Update Action Use Case
 * Caso de uso para actualizar una action existente
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IActionRepository } from '../../../domain/repositories/action.repository.interface';
import { Action } from '../../../domain/entities/action.entity';
import { UpdateActionDto } from '../../dtos/action/update-action.dto';
import { ActionResponseDto } from '../../dtos/action/action-response.dto';

@Injectable()
export class UpdateActionUseCase {
  constructor(
    @Inject('IActionRepository')
    private readonly actionRepository: IActionRepository,
  ) {}

  async execute(id: number, dto: UpdateActionDto): Promise<ActionResponseDto> {
    const existing = await this.actionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Action with id ${id} not found`);
    }

    // Crear nueva instancia con datos actualizados
    // La key no se puede cambiar
    const updated = new Action(
      existing.id,
      existing.key,
      dto.name ?? existing.name,
      dto.description ?? existing.description,
      existing.area,
      existing.createdAt,
      new Date(),
    );

    const saved = await this.actionRepository.save(updated);

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
