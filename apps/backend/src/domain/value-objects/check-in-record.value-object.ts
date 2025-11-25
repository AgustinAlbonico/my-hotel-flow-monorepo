/**
 * CheckInRecord Value Object
 * Representa los datos del check-in de una reserva
 */
export class CheckInRecord {
  readonly timestamp: Date;
  readonly performedBy: number; // Usuario ID (recepcionista)
  readonly documentsVerified: boolean;
  readonly observations?: string;

  private constructor(data: {
    timestamp: Date;
    performedBy: number;
    documentsVerified?: boolean;
    observations?: string;
  }) {
    this.timestamp = data.timestamp;
    this.performedBy = data.performedBy;
    this.documentsVerified = data.documentsVerified ?? false;
    this.observations = data.observations;
  }

  static create(
    performedBy: number,
    documentsVerified?: boolean,
    observations?: string,
  ): CheckInRecord {
    if (performedBy <= 0) {
      throw new Error('performedBy must be a valid user ID');
    }

    return new CheckInRecord({
      timestamp: new Date(),
      performedBy,
      documentsVerified: documentsVerified ?? false,
      observations: observations?.trim() || undefined,
    });
  }

  static fromJSON(json: any): CheckInRecord {
    return new CheckInRecord({
      timestamp: new Date(json.timestamp),
      performedBy: json.performedBy,
      documentsVerified: json.documentsVerified,
      observations: json.observations,
    });
  }

  toJSON(): any {
    return {
      timestamp: this.timestamp.toISOString(),
      performedBy: this.performedBy,
      documentsVerified: this.documentsVerified,
      observations: this.observations,
    };
  }
}
