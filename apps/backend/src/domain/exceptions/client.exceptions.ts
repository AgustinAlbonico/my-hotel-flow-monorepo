/**
 * Excepción lanzada cuando se intenta crear un cliente con un DNI que ya existe
 */
export class ClientAlreadyExistsException extends Error {
  constructor(dni: string) {
    super(`Cliente con DNI ${dni} ya existe.`);
    this.name = 'ClientAlreadyExistsException';
  }
}

/**
 * Excepción lanzada cuando se intenta crear un cliente con un email que ya existe
 */
export class ClientEmailAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`Cliente con email ${email} ya existe.`);
    this.name = 'ClientEmailAlreadyExistsException';
  }
}

/**
 * Excepción lanzada cuando no se encuentra un cliente
 */
export class ClientNotFoundException extends Error {
  constructor(identifier: string) {
    super(`Cliente con identificador ${identifier} no encontrado.`);
    this.name = 'ClientNotFoundException';
  }
}
