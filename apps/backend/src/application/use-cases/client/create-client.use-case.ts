import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import type { IHashService } from '../../../domain/services/hash.service.interface';
import { Client } from '../../../domain/entities/client.entity';
import { DNI } from '../../../domain/value-objects/dni.value-object';
import { Email } from '../../../domain/value-objects/email.value-object';
import { Phone } from '../../../domain/value-objects/phone.value-object';
import {
  ClientAlreadyExistsException,
  ClientEmailAlreadyExistsException,
} from '../../../domain/exceptions/client.exceptions';
import { CreateClientDto } from '../../dtos/client/create-client.dto';
import { ClientCreatedResponseDto } from '../../dtos/client/client-created-response.dto';

/**
 * Use Case: Crear Cliente
 * Patrón: Use Case Pattern - Orquesta la lógica de negocio
 * Responsabilidad: Crear un nuevo cliente con contraseña temporal
 */
@Injectable()
export class CreateClientUseCase {
  private readonly logger = new Logger(CreateClientUseCase.name);

  constructor(
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
    @Inject('IHashService')
    private readonly hashService: IHashService,
    @Inject('INotificationService')
    private readonly notificationService?: import('../../../domain/services/notification.service.interface').INotificationService,
  ) {}

  async execute(dto: CreateClientDto): Promise<ClientCreatedResponseDto> {
    this.logger.log(`Creando cliente con DNI: ${dto.dni}`);

    // 1. Crear Value Objects (validaciones automáticas)
    const dni = DNI.create(dto.dni);
    const email = Email.create(dto.email);
    const phone = dto.phone ? Phone.create(dto.phone) : null;

    // 2. Verificar que DNI no exista
    const existingClientByDNI = await this.clientRepository.findByDNI(dni);
    if (existingClientByDNI) {
      this.logger.warn(`DNI ${dto.dni} ya existe`);
      throw new ClientAlreadyExistsException(dto.dni);
    }

    // 3. Verificar que Email no exista
    const existingClientByEmail =
      await this.clientRepository.findByEmail(email);
    if (existingClientByEmail) {
      this.logger.warn(`Email ${dto.email} ya existe`);
      throw new ClientEmailAlreadyExistsException(dto.email);
    }

    // 4. Generar contraseña temporal
    const plainPassword = Client.generatePassword();
    this.logger.debug(`Contraseña temporal generada (longitud: 8)`);

    // 5. Hashear contraseña
    const hashedPassword = await this.hashService.hash(plainPassword);

    // 6. Crear entidad de dominio
    const client = Client.create(
      dni,
      dto.firstName,
      dto.lastName,
      email,
      phone,
    );
    client.setPassword(hashedPassword);

    // 6.1. Agregar información adicional si está presente
    if (
      dto.birthDate ||
      dto.address ||
      dto.city ||
      dto.country ||
      dto.nationality ||
      dto.observations
    ) {
      client.updateAdditionalInfo(
        dto.birthDate ? new Date(dto.birthDate) : null,
        dto.address || null,
        dto.city || null,
        dto.country || null,
        dto.nationality || null,
        dto.observations || null,
      );
    }

    // 7. Persistir
    const savedClient = await this.clientRepository.save(client);
    this.logger.log(`Cliente creado con ID: ${savedClient.id}`);

    // 8. TODO: Enviar notificación (implementar después)
    if (this.notificationService) {
      try {
        await this.notificationService.sendProfileCreated(
          savedClient.email.toString(),
          {
            customer_name: `${savedClient.firstName} ${savedClient.lastName}`,
            activation_link: `${process.env.APP_URL || 'https://app.myhotelflow.example'}/activate?client=${savedClient.id}`,
            support_email:
              process.env.SUPPORT_EMAIL || 'soporte@myhotelflow.example',
            year: new Date().getFullYear(),
            temporary_password: plainPassword,
            logo_url: process.env.ASSET_BASE_URL
              ? `${process.env.ASSET_BASE_URL}/logo.png`
              : '',
          },
        );
      } catch (err) {
        // No bloquear la creación por fallo de envío
        // tslint:disable-next-line:no-console
        console.warn('Error enviando email de creación de perfil:', err);
      }
    }

    // 9. Retornar DTO con contraseña temporal
    return {
      id: savedClient.id,
      dni: savedClient.dni.value,
      firstName: savedClient.firstName,
      lastName: savedClient.lastName,
      email: savedClient.email.value,
      phone: savedClient.phone?.value ?? null,
      isActive: savedClient.isActive,
      createdAt: savedClient.createdAt,
      updatedAt: savedClient.updatedAt,
      temporaryPassword: plainPassword,
    };
  }
}
