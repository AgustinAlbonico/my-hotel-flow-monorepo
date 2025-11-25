/**
 * Action Domain Entity
 * Representa una acción/permiso atómico en el sistema
 * Contiene lógica de negocio pura, independiente de frameworks
 */

export class Action {
  constructor(
    public readonly id: number,
    public readonly key: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly area?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {
    this.validateKey(key);
  }

  /**
   * Validar formato de la key
   * Formato esperado: "module.operation" (ej: "users.create", "auth.login")
   * Se permite formato legacy con mayúsculas y guiones
   */
  private validateKey(key: string): void {
    // Formato flexible: permite letras, números, guiones, guiones bajos y múltiples niveles con puntos
    // Debe tener al menos un punto separador
    // Ejemplos válidos: "reservas.crear", "config.usuarios.listar", "checkin.habitacion.asignar"
    const keyRegex = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    if (!keyRegex.test(key)) {
      throw new Error(
        'Invalid action key format. Expected: "module.operation" or "module.submodule.operation" (with at least one dot separator)',
      );
    }
  }

  /**
   * Lógica de negocio: ¿Pertenece este action a un módulo específico?
   */
  belongsToModule(moduleName: string): boolean {
    return this.key.startsWith(`${moduleName}.`);
  }

  /**
   * Lógica de negocio: Obtener el módulo del action
   */
  getModule(): string {
    return this.key.split('.')[0];
  }

  /**
   * Lógica de negocio: Obtener la operación del action
   */
  getOperation(): string {
    return this.key.split('.')[1];
  }

  /**
   * Lógica de negocio: Comparar si dos actions son iguales
   */
  equals(other: Action): boolean {
    return this.key === other.key;
  }
}
