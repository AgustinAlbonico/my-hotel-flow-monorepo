/**
 * Phone Value Object
 * Patrón: Value Object - Encapsula validación del teléfono
 * Representa un teléfono válido (7-15 dígitos numéricos)
 */
export class Phone {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Factory method para crear un Phone válido
   * @param value - String con el teléfono
   * @returns Instancia de Phone
   * @throws Error si el formato es inválido
   */
  static create(value: string): Phone {
    if (!Phone.isValid(value)) {
      throw new Error(
        'Teléfono inválido. Debe tener entre 7 y 15 dígitos numéricos.',
      );
    }
    return new Phone(value);
  }

  /**
   * Valida el formato del teléfono
   * @param value - String a validar
   * @returns true si es válido, false si no
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    const phoneRegex = /^[0-9]{7,15}$/;
    return phoneRegex.test(value);
  }

  /**
   * Getter del valor del teléfono
   */
  get value(): string {
    return this._value;
  }

  /**
   * Compara dos teléfonos
   * @param other - Otro Phone a comparar
   * @returns true si son iguales
   */
  equals(other: Phone): boolean {
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
