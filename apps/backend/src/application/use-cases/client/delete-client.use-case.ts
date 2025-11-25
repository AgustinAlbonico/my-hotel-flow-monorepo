import { Inject, Injectable } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientNotFoundException } from '../../../domain/exceptions/client.exceptions';

/**
 * DeleteClientUseCase
 * Capa: Application
 * Caso de uso para eliminar (dar de baja) un cliente
 */
@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(id: number): Promise<void> {
    // Verificar que el cliente existe
    const existingClient = await this.clientRepository.findById(id);
    if (!existingClient) {
      throw new ClientNotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    // Dar de baja (soft delete)
    await this.clientRepository.delete(id);
  }
}
