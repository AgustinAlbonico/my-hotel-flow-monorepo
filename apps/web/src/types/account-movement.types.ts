/**
 * Account Movement Types
 * Tipos para movimientos de cuenta corriente
 */

export enum MovementType {
  CHARGE = 'CHARGE',
  PAYMENT = 'PAYMENT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum MovementStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REVERSED = 'REVERSED',
}

export interface AccountMovement {
  id: number;
  clientId: number;
  type: MovementType;
  amount: number;
  balance: number;
  description: string;
  reference: string | null;
  status: MovementStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AccountStatementResponse {
  client: {
    id: number;
    name: string;
    dni: string;
    email: string;
  };
  currentBalance: number;
  movements: AccountMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
