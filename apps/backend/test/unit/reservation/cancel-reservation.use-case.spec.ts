/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { CancelReservationUseCase } from '../../../src/application/use-cases/reservation/cancel-reservation.use-case';
import type { IReservationRepository } from '../../../src/domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../src/domain/repositories/room.repository.interface';
import { RoomStatus } from '../../../src/domain/entities/room.entity';

describe('CancelReservationUseCase', () => {
  const makeSut = () => {
    const reservationRepository: jest.Mocked<IReservationRepository> = {
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByClientDni: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOverlappingReservations: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      countPendingByClient: jest.fn(),
      findWithLock: jest.fn(),
      findAll: jest.fn(),
    } as any;

    const roomRepository: jest.Mocked<IRoomRepository> = {
      findById: jest.fn(),
      findByNumero: jest.fn(),
      findAllActive: jest.fn(),
      findAvailableRooms: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      isRoomAvailable: jest.fn(),
    } as any;

    const sut = new CancelReservationUseCase(
      reservationRepository,
      roomRepository,
    );

    return { sut, reservationRepository, roomRepository };
  };

  it('should mark room as available when cancelling an active reservation with occupied room', async () => {
    const { sut, reservationRepository, roomRepository } = makeSut();

    const reservationMock: any = {
      id: 1,
      roomId: 10,
      status: 'CONFIRMED',
      canBeCancelled: jest.fn().mockReturnValue(true),
      cancel: jest.fn(),
    };

    (reservationRepository.findById as jest.Mock).mockResolvedValue(
      reservationMock,
    );

    const roomMock: any = {
      id: 10,
      estado: RoomStatus.OCCUPIED,
      markAsAvailable: jest.fn(() => {
        roomMock.estado = RoomStatus.AVAILABLE;
      }),
    };

    (roomRepository.findById as jest.Mock).mockResolvedValue(roomMock);

    await sut.execute(1, { reason: 'Prueba' });

    expect(reservationMock.cancel).toHaveBeenCalledWith('Prueba');
    expect(roomMock.markAsAvailable).toHaveBeenCalled();
    expect(roomRepository.update).toHaveBeenCalledWith(roomMock);
    expect(reservationRepository.update).toHaveBeenCalledWith(reservationMock);
  });
});
