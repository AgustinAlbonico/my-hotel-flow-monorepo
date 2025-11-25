/**
 * Email Value Object
 * Patrón: Value Object - Encapsula validación y normalización del email
 * Representa un email válido normalizado a minúsculas
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase().trim();
  }

  /**
   * Factory method para crear un Email válido
   * @param value - String con el email
   * @returns Instancia de Email normalizada
   * @throws Error si el formato es inválido
   */
  static create(value: string): Email {
    if (!Email.isValid(value)) {
      throw new Error('Email inválido. Formato requerido: usuario@dominio.com');
    }
    return new Email(value);
  }

  /**
   * Valida el formato del email
   * @param value - String a validar
   * @returns true si es válido, false si no
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  }

  /**
   * Getter del valor del email (normalizado)
   */
  get value(): string {
    return this._value;
  }

  /**
   * Compara dos emails
   * @param other - Otro Email a comparar
   * @returns true si son iguales
   */
  equals(other: Email): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Representación en string
   */
  toString(): string {
    return this._value;
  }
}
