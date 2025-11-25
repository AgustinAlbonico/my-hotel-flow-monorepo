/**
 * ReservationCreatedDto
 * Patrón: DTO - Application Layer
 * Responsabilidad: Representar datos de la reserva creada
 */
export class ReservationCreatedDto {
  id: number;
  code: string;
  clientId: number;
  roomId: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
  cantidadNoches: number;
  precioTotal: number;
  createdAt: Date;

  constructor(
    id: number,
    code: string,
    clientId: number,
    roomId: number,
    checkIn: Date,
    checkOut: Date,
    status: string,
    cantidadNoches: number,
    precioTotal: number,
    createdAt: Date,
  ) {
    this.id = id;
    this.code = code;
    this.clientId = clientId;
    this.roomId = roomId;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.status = status;
    this.cantidadNoches = cantidadNoches;
    this.precioTotal = precioTotal;
    this.createdAt = createdAt;
  }
}
