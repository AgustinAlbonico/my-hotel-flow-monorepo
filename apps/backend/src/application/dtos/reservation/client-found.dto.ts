/**
 * ClientFoundDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Representar los datos del cliente encontrado
 */
export class ClientFoundDto {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;

  constructor(
    id: number,
    dni: string,
    nombre: string,
    apellido: string,
    email: string,
    telefono: string | null,
  ) {
    this.id = id;
    this.dni = dni;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.telefono = telefono;
  }
}
