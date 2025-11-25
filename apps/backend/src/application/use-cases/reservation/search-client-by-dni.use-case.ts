import { Injectable, Inject } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { SearchClientByDNIDto } from '../../dtos/reservation/search-client-by-dni.dto';
import { ClientFoundDto } from '../../dtos/reservation/client-found.dto';

/**
 * SearchClientByDNIUseCase
 * Patrón: Use Case - Clean Architecture
 * Capa: Application
 * Responsabilidad: Buscar cliente por DNI y retornar sus datos
 */
@Injectable()
export class SearchClientByDNIUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(dto: SearchClientByDNIDto): Promise<ClientFoundDto | null> {
    // Buscar cliente en el repositorio
    const client = await this.clientRepository.findByDni(dto.dni);

    if (!client) {
      return null;
    }

    // Mapear entidad de dominio a DTO de aplicación
    return new ClientFoundDto(
      client.id,
      client.dni.value,
      client.firstName,
      client.lastName,
      client.email.value,
      client.phone?.value ?? null,
    );
  }
}
