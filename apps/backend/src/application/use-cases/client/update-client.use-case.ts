import { Inject, Injectable } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { Client } from '../../../domain/entities/client.entity';
import { ClientNotFoundException } from '../../../domain/exceptions/client.exceptions';
import { Email } from '../../../domain/value-objects/email.value-object';
import { Phone } from '../../../domain/value-objects/phone.value-object';

export interface UpdateClientDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  observations?: string;
}

/**
 * UpdateClientUseCase
 * Capa: Application
 * Caso de uso para actualizar los datos de un cliente
 */
@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(dto: UpdateClientDto): Promise<Client> {
    // Verificar que el cliente existe
    const existingClient = await this.clientRepository.findById(dto.id);
    if (!existingClient) {
      throw new ClientNotFoundException(
        `Cliente con ID ${dto.id} no encontrado`,
      );
    }

    // Crear value objects
    const email = Email.create(dto.email);
    const phone = dto.phone ? Phone.create(dto.phone) : null;

    // Actualizar los datos del cliente
    existingClient.updateContactInfo(email, phone);
    existingClient.updatePersonalInfo(dto.firstName, dto.lastName);

    // Actualizar información adicional
    existingClient.updateAdditionalInfo(
      dto.birthDate ? new Date(dto.birthDate) : null,
      dto.address || null,
      dto.city || null,
      dto.country || null,
      dto.nationality || null,
      dto.observations || null,
    );

    // Guardar cambios
    const updated = await this.clientRepository.update(existingClient);

    return updated;
  }
}
