/**
 * List Clients Use Case
 * Caso de uso para listar todos los clientes activos
 */

import { Injectable, Inject } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { Client } from '../../../domain/entities/client.entity';

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(): Promise<Client[]> {
    // Por ahora devuelve todos los clientes
    // En el futuro se puede agregar filtros, paginación, etc.
    return await this.clientRepository.findAll();
  }
}
