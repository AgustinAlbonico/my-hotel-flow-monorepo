/**
 * Account Movement Repository Interface
 */
import { AccountMovement } from '../entities/account-movement.entity';

export interface IAccountMovementRepository {
  /**
   * Guardar un movimiento
   */
  save(movement: AccountMovement): Promise<AccountMovement>;

  /**
   * Obtener movimiento por ID
   */
  findById(id: number): Promise<AccountMovement | null>;

  /**
   * Obtener todos los movimientos de un cliente (estado de cuenta)
   */
  findByClientId(clientId: number): Promise<AccountMovement[]>;

  /**
   * Obtener movimientos de un cliente con paginación
   */
  findByClientIdPaginated(
    clientId: number,
    page: number,
    limit: number,
  ): Promise<{
    movements: AccountMovement[];
    total: number;
    currentBalance: number;
  }>;

  /**
   * Obtener el último balance de un cliente
   */
  getLastBalance(clientId: number): Promise<number>;

  /**
   * Obtener movimientos por referencia (ej: invoice ID, payment ID)
   */
  findByReference(reference: string): Promise<AccountMovement[]>;
}
