/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { CreateReservationUseCase } from '../../../src/application/use-cases/reservation/create-reservation.use-case';
import type { IClientRepository } from '../../../src/domain/repositories/client.repository.interface';
import type { IRoomRepository } from '../../../src/domain/repositories/room.repository.interface';
import type { IReservationRepository } from '../../../src/domain/repositories/reservation.repository.interface';
import type { INotificationService } from '../../../src/domain/services/notification.service.interface';
import { CreateReservationDto } from '../../../src/application/dtos/reservation/create-reservation.dto';
import { Reservation } from '../../../src/domain/entities/reservation.entity';

describe('CreateReservationUseCase - idempotencia', () => {
  const makeSut = () => {
    const clientRepository: jest.Mocked<IClientRepository> = {
      findById: jest.fn(),
      findByDNI: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      findByIdWithAccountMovements: jest.fn(),
      update: jest.fn(),
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

    const notificationService: jest.Mocked<INotificationService> = {
      sendProfileCreated: jest.fn(),
      sendReservationConfirmation: jest.fn(),
      sendSMS: jest.fn(),
    };

    const sut = new CreateReservationUseCase(
      clientRepository,
      roomRepository,
      reservationRepository,
      notificationService,
    );

    return {
      sut,
      clientRepository,
      roomRepository,
      reservationRepository,
      notificationService,
    };
  };

  it('should reuse existing reservation when idempotencyKey already exists', async () => {
    const { sut, clientRepository, roomRepository, reservationRepository } =
      makeSut();

    const dto = new CreateReservationDto();
    dto.clientId = 1;
    dto.roomId = 10;
    dto.checkIn = '2025-01-01';
    dto.checkOut = '2025-01-05';
    dto.idempotencyKey = 'test-key';

    (clientRepository.findById as jest.Mock).mockResolvedValue({
      id: 1,
      isActive: true,
      hasOutstandingDebt: () => false,
      email: { toString: () => 'test@example.com' },
      firstName: 'Test',
      lastName: 'User',
      phone: null,
    });

    (roomRepository.findById as jest.Mock).mockResolvedValue({
      id: 10,
      isActive: true,
      roomType: {
        name: 'Estándar',
        calculateTotalPrice: (n: number) => 100 * n,
      },
      calculateTotalPrice: (n: number) => 100 * n,
      capacidad: 2,
    });

    (reservationRepository.countPendingByClient as jest.Mock).mockResolvedValue(
      0,
    );
    (
      reservationRepository.findOverlappingReservations as jest.Mock
    ).mockResolvedValue([]);
    (roomRepository.isRoomAvailable as jest.Mock).mockResolvedValue(true);

    const existingReservation = Reservation.create(
      dto.clientId,
      dto.roomId,
      new Date(dto.checkIn),
      new Date(dto.checkOut),
      dto.idempotencyKey,
    );
    (reservationRepository.findByIdempotencyKey as jest.Mock).mockResolvedValue(
      existingReservation,
    );

    const result = await sut.execute(dto);

    expect(reservationRepository.save).not.toHaveBeenCalled();
    expect(result.id).toBe(existingReservation.id);
  });
});
