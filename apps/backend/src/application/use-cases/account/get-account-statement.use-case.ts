/**
 * Get Account Statement Use Case
 * Obtener estado de cuenta corriente de un cliente
 */
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IAccountMovementRepository } from '../../../domain/repositories/account-movement.repository.interface';
import type { IClientRepository } from '../../../domain/repositories/client.repository.interface';

@Injectable()
export class GetAccountStatementUseCase {
  constructor(
    @Inject('IAccountMovementRepository')
    private readonly movementRepository: IAccountMovementRepository,
    @Inject('IClientRepository')
    private readonly clientRepository: IClientRepository,
  ) {}

  async execute(
    clientId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    client: {
      id: number;
      name: string;
      dni: string;
      email: string;
    };
    currentBalance: number;
    movements: Array<{
      id: number;
      type: string;
      amount: number;
      balance: number;
      status: string;
      reference: string;
      description: string;
      date: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Verificar que el cliente existe
    const client = await this.clientRepository.findById(clientId);
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    // Obtener movimientos paginados
    const { movements, total, currentBalance } =
      await this.movementRepository.findByClientIdPaginated(
        clientId,
        page,
        limit,
      );

    return {
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        dni: client.dni.value,
        email: client.email.value,
      },
      currentBalance,
      movements: movements.map((m) => ({
        id: m.id,
        type: m.type,
        amount: m.amount,
        balance: m.balance,
        status: m.status,
        reference: m.reference,
        description: m.description,
        date: m.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
