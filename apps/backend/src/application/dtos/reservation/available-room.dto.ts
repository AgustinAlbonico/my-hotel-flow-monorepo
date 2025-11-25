/**
 * AvailableRoomDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Representar datos de habitación disponible
 */
export class AvailableRoomDto {
  id: number;
  numeroHabitacion: string;
  tipo: string;
  capacidad: number;
  precioPorNoche: number;
  descripcion: string | null;
  caracteristicas: string[];
  precioTotal: number;
  cantidadNoches: number;

  constructor(
    id: number,
    numeroHabitacion: string,
    tipo: string,
    capacidad: number,
    precioPorNoche: number,
    descripcion: string | null,
    caracteristicas: string[],
    precioTotal: number,
    cantidadNoches: number,
  ) {
    this.id = id;
    this.numeroHabitacion = numeroHabitacion;
    this.tipo = tipo;
    this.capacidad = capacidad;
    this.precioPorNoche = precioPorNoche;
    this.descripcion = descripcion;
    this.caracteristicas = caracteristicas;
    this.precioTotal = precioTotal;
    this.cantidadNoches = cantidadNoches;
  }
}
