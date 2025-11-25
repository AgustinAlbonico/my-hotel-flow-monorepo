/**
 * RoomCondition Enum
 * Condición de la habitación al momento del check-out
 */
export enum RoomCondition {
  GOOD = 'GOOD',
  REGULAR = 'REGULAR',
  NEEDS_DEEP_CLEANING = 'NEEDS_DEEP_CLEANING',
}

/**
 * CheckOutRecord Value Object
 * Representa los datos del check-out de una reserva
 */
export class CheckOutRecord {
  readonly timestamp: Date;
  readonly performedBy: number; // Usuario ID (recepcionista)
  readonly roomCondition: RoomCondition;
  readonly observations?: string;

  private constructor(data: {
    timestamp: Date;
    performedBy: number;
    roomCondition: RoomCondition;
    observations?: string;
  }) {
    this.timestamp = data.timestamp;
    this.performedBy = data.performedBy;
    this.roomCondition = data.roomCondition;
    this.observations = data.observations;
  }

  static create(
    performedBy: number,
    roomCondition: RoomCondition,
    observations?: string,
  ): CheckOutRecord {
    if (performedBy <= 0) {
      throw new Error('performedBy must be a valid user ID');
    }

    if (!Object.values(RoomCondition).includes(roomCondition)) {
      throw new Error('Invalid room condition');
    }

    return new CheckOutRecord({
      timestamp: new Date(),
      performedBy,
      roomCondition,
      observations: observations?.trim() || undefined,
    });
  }

  static fromJSON(json: any): CheckOutRecord {
    return new CheckOutRecord({
      timestamp: new Date(json.timestamp),
      performedBy: json.performedBy,
      roomCondition: json.roomCondition,
      observations: json.observations,
    });
  }

  toJSON(): any {
    return {
      timestamp: this.timestamp.toISOString(),
      performedBy: this.performedBy,
      roomCondition: this.roomCondition,
      observations: this.observations,
    };
  }

  requiresDeepCleaning(): boolean {
    return this.roomCondition === RoomCondition.NEEDS_DEEP_CLEANING;
  }
}
