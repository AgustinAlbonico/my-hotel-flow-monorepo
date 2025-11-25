import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ConflictException,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Actions } from '../decorators/actions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { CreateClientUseCase } from '../../application/use-cases/client/create-client.use-case';
import { ListClientsUseCase } from '../../application/use-cases/client/list-clients.use-case';
import { GetClientByIdUseCase } from '../../application/use-cases/client/get-client-by-id.use-case';
import { UpdateClientUseCase } from '../../application/use-cases/client/update-client.use-case';
import { DeleteClientUseCase } from '../../application/use-cases/client/delete-client.use-case';
import { CreateClientRequestDto } from '../dtos/client/create-client-request.dto';
import { UpdateClientRequestDto } from '../dtos/client/update-client-request.dto';
import { ClientCreatedResponseDto } from '../dtos/client/client-created-response.dto';
import { CheckDniResponseDto } from '../dtos/client/check-dni-response.dto';
import { ClientListItemResponseDto } from '../dtos/client/client-list-response.dto';
import { ClientDetailResponseDto } from '../dtos/client/client-detail-response.dto';
import {
  ClientAlreadyExistsException,
  ClientEmailAlreadyExistsException,
  ClientNotFoundException,
} from '../../domain/exceptions/client.exceptions';
import { DNI } from '../../domain/value-objects/dni.value-object';
import { Inject } from '@nestjs/common';
import type { IClientRepository } from '../../domain/repositories/client.repository.interface';

/**
 * ClientController
 * Capa: Presentation
 * Endpoints REST para gestión de clientes
 */
@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('clients')
export class ClientController {
  private readonly logger = new Logger(ClientController.name);

  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly getClientByIdUseCase: GetClientByIdUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  /**
   * GET /api/v1/clients - Listar todos los clientes
   */
  @Get()
  @Actions('clientes.listar')
  @ApiOperation({ summary: 'Obtener lista de todos los clientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes',
    type: [ClientListItemResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async listClients(): Promise<{
    success: boolean;
    data: ClientListItemResponseDto[];
    timestamp: string;
  }> {
    this.logger.log('GET /clients - Listando clientes');

    const clients = await this.listClientsUseCase.execute();

    const data: ClientListItemResponseDto[] = clients.map((client) => ({
      id: client.id,
      dni: client.dni.value,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email.value,
      phone: client.phone?.value || null,
      isActive: client.isActive,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/v1/clients/:id - Obtener detalles de un cliente
   */
  @Get(':id')
  @Actions('clientes.ver')
  @ApiOperation({ summary: 'Obtener detalles completos de un cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Detalles del cliente',
    type: ClientDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async getClientById(@Param('id') id: string): Promise<{
    success: boolean;
    data: ClientDetailResponseDto;
    timestamp: string;
  }> {
    this.logger.log(`GET /clients/${id} - Obteniendo detalles del cliente`);

    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    try {
      const client = await this.getClientByIdUseCase.execute(clientId);

      const data: ClientDetailResponseDto = {
        id: client.id,
        dni: client.dni.value,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email.value,
        phone: client.phone?.value || null,
        birthDate: client.birthDate
          ? client.birthDate.toISOString().split('T')[0]
          : null,
        address: client.address,
        city: client.city,
        country: client.country,
        nationality: client.nationality,
        observations: client.observations,
        isActive: client.isActive,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
      };

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ClientNotFoundException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/clients - Crear nuevo cliente
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Actions('clientes.crear')
  @ApiOperation({ summary: 'Crear nuevo cliente con contraseña temporal' })
  @ApiResponse({
    status: 201,
    description: 'Cliente creado exitosamente',
    type: ClientCreatedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Cliente ya existe (DNI o email duplicado)',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async create(@Body() dto: CreateClientRequestDto): Promise<{
    success: boolean;
    data: ClientCreatedResponseDto;
    message: string;
    timestamp: string;
  }> {
    try {
      this.logger.log(`POST /clients - Creando cliente con DNI: ${dto.dni}`);

      const result = await this.createClientUseCase.execute({
        dni: dto.dni,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        birthDate: dto.birthDate,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        nationality: dto.nationality,
        observations: dto.observations,
      });

      return {
        success: true,
        data: result,
        message: 'Cliente creado exitosamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ClientAlreadyExistsException) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'CLIENT_ALREADY_EXISTS',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      if (error instanceof ClientEmailAlreadyExistsException) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Errores de Value Objects (validaciones)
      if (error instanceof Error && error.message.includes('inválido')) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Error genérico
      this.logger.error('Error al crear cliente', error);
      throw error;
    }
  }

  /**
   * GET /api/v1/clients/check-dni/:dni - Verificar disponibilidad de DNI
   */
  @Get('check-dni/:dni')
  @Actions('clientes.ver')
  @ApiOperation({ summary: 'Verificar si un DNI está disponible' })
  @ApiParam({ name: 'dni', description: 'DNI a verificar (7-8 dígitos)' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de verificación',
    type: CheckDniResponseDto,
  })
  @ApiResponse({ status: 400, description: 'DNI inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async checkDni(@Param('dni') dni: string): Promise<{
    success: boolean;
    data: CheckDniResponseDto;
    timestamp: string;
  }> {
    try {
      this.logger.log(`GET /clients/check-dni/${dni}`);

      // Validar formato de DNI
      if (!DNI.isValid(dni)) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_DNI',
            message: 'DNI inválido. Debe tener entre 7 y 8 dígitos numéricos.',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const dniVO = DNI.create(dni);
      const existingClient = await this.clientRepository.findByDNI(dniVO);

      const result: CheckDniResponseDto = {
        exists: !!existingClient,
        message: existingClient ? 'DNI ya registrado' : 'DNI disponible',
      };

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Error al verificar DNI', error);
      throw error;
    }
  }

  /**
   * PUT /api/v1/clients/:id - Actualizar datos de un cliente
   */
  @Put(':id')
  @Actions('clientes.modificar')
  @ApiOperation({ summary: 'Actualizar datos de un cliente existente' })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado exitosamente',
    type: ClientDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateClientRequestDto,
  ): Promise<{
    success: boolean;
    data: ClientDetailResponseDto;
    timestamp: string;
  }> {
    this.logger.log(`PUT /clients/${id} - Actualizando cliente`);

    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    try {
      const updated = await this.updateClientUseCase.execute({
        id: clientId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        birthDate: dto.birthDate,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        nationality: dto.nationality,
        observations: dto.observations,
      });

      const data: ClientDetailResponseDto = {
        id: updated.id,
        dni: updated.dni.value,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email.value,
        phone: updated.phone?.value || null,
        birthDate: updated.birthDate
          ? updated.birthDate.toISOString().split('T')[0]
          : null,
        address: updated.address,
        city: updated.city,
        country: updated.country,
        nationality: updated.nationality,
        observations: updated.observations,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ClientNotFoundException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * DELETE /api/v1/clients/:id - Dar de baja un cliente (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Actions('clientes.eliminar')
  @ApiOperation({ summary: 'Dar de baja un cliente (no elimina físicamente)' })
  @ApiParam({ name: 'id', description: 'ID del cliente', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cliente dado de baja exitosamente',
  })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async deleteClient(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    this.logger.log(`DELETE /clients/${id} - Dando de baja cliente`);

    const clientId = parseInt(id, 10);
    if (isNaN(clientId)) {
      throw new BadRequestException('ID de cliente inválido');
    }

    try {
      await this.deleteClientUseCase.execute(clientId);

      return {
        success: true,
        message: 'Cliente dado de baja exitosamente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof ClientNotFoundException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
