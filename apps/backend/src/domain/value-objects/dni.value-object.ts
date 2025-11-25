/**
 * DNI Value Object
 * Patrón: Value Object - Encapsula validación y comportamiento del DNI argentino
 * Representa un DNI válido (7-8 dígitos numéricos)
 */
export class DNI {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Factory method para crear un DNI válido
   * @param value - String con el DNI (7-8 dígitos)
   * @returns Instancia de DNI
   * @throws Error si el formato es inválido
   */
  static create(value: string): DNI {
    if (!DNI.isValid(value)) {
      throw new Error(
        'DNI inválido. Debe tener entre 7 y 8 dígitos numéricos.',
      );
    }
    return new DNI(value);
  }

  /**
   * Valida el formato del DNI
   * @param value - String a validar
   * @returns true si es válido, false si no
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    const dniRegex = /^[0-9]{7,8}$/;
    return dniRegex.test(value);
  }

  /**
   * Getter del valor del DNI
   */
  get value(): string {
    return this._value;
  }

  /**
   * Compara dos DNIs
   * @param other - Otro DNI a comparar
   * @returns true si son iguales
   */
  equals(other: DNI): boolean {
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
