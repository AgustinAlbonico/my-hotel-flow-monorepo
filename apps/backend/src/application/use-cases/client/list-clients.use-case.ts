/**
 * List Clients Use Case
 * Caso de uso para listar clientes con filtros y paginación
 */

import { Injectable, Inject } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { Client } from '../../../domain/entities/client.entity';

export interface ListClientsParams {
  page?: number;
  limit?: number;
  dni?: string;
  search?: string;
}

export interface ListClientsResult {
  clients: Client[];
  total: number;
}

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) { }

  async execute(params?: ListClientsParams): Promise<ListClientsResult> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    // Obtener todos los clientes (después filtraremos)
    const allClients = await this.clientRepository.findAll();

    // Filtrar por DNI si se proporciona
    let filteredClients = allClients;
    if (params?.dni) {
      filteredClients = filteredClients.filter(client =>
        client.dni.value.includes(params.dni!)
      );
    }

    // Filtrar por búsqueda general (DNI, nombre, apellido)
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredClients = filteredClients.filter(client =>
        client.dni.value.includes(params.search!) ||
        client.firstName.toLowerCase().includes(searchLower) ||
        client.lastName.toLowerCase().includes(searchLower)
      );
    }

    // Total después del filtrado
    const total = filteredClients.length;

    // Aplicar paginación
    const paginatedClients = filteredClients.slice(offset, offset + limit);

    return {
      clients: paginatedClients,
      total,
    };
  }
}

