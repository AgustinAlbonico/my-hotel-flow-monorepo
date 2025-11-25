import { Inject, Injectable } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { Client } from '../../../domain/entities/client.entity';
import { ClientNotFoundException } from '../../../domain/exceptions/client.exceptions';

/**
 * GetClientByIdUseCase
 * Capa: Application
 * Caso de uso para obtener un cliente por su ID
 */
@Injectable()
export class GetClientByIdUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(id: number): Promise<Client> {
    const client = await this.clientRepository.findById(id);

    if (!client) {
      throw new ClientNotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return client;
  }
}
