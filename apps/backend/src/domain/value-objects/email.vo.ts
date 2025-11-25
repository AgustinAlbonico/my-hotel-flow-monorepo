/**
 * Email Value Object
 * Representa una dirección de email válida
 *
 * Este Value Object asegura que el email siempre es válido
 * y normalizado (lowercase)
 */

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Valida el formato del email usando regex
   */
  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Crea una instancia de Email validando el formato
   */
  static create(email: string): Email {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    const normalized = email.trim().toLowerCase();

    if (!this.isValid(normalized)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    if (normalized.length > 255) {
      throw new Error('Email cannot exceed 255 characters');
    }

    return new Email(normalized);
  }

  /**
   * Compara dos emails
   */
  equals(other: Email): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * Retorna la representación en string
   */
  toString(): string {
    return this._value;
  }

  /**
   * Obtiene el dominio del email
   */
  getDomain(): string {
    return this._value.split('@')[1];
  }

  /**
   * Obtiene el nombre de usuario del email (parte antes del @)
   */
  getLocalPart(): string {
    return this._value.split('@')[0];
  }
}
