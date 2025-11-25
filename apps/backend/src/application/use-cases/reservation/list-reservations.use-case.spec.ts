import { ListReservationsUseCase } from './list-reservations.use-case';
import { ListReservationsQueryDto } from '../../dtos/reservation/list-reservations-query.dto';
import type {
  IReservationRepository,
  ReservationListItemView,
} from '../../../domain/repositories/reservation.repository.interface';
import { ReservationStatus } from '../../../domain/entities/reservation.entity';

describe('ListReservationsUseCase', () => {
  const makeSut = () => {
    const reservationRepository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<IReservationRepository>;

    const sut = new ListReservationsUseCase(reservationRepository);
    return { sut, reservationRepository };
  };

  it('should forward filters and return paginated reservations', async () => {
    const { sut, reservationRepository } = makeSut();

    const query = new ListReservationsQueryDto();
    query.clientId = 5;
    query.page = 2;
    query.limit = 10;
    query.status = ReservationStatus.CONFIRMED;

    const reservationItem: ReservationListItemView = {
      id: 1,
      code: 'RES-001',
      clientId: 5,
      roomId: 3,
      status: ReservationStatus.CONFIRMED,
      checkIn: new Date('2025-01-01'),
      checkOut: new Date('2025-01-05'),
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-02'),
      totalNights: 4,
      totalPrice: 120000,
      client: {
        id: 5,
        dni: '12345678',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+541100000000',
      },
      room: {
        id: 3,
        numeroHabitacion: '305',
        roomTypeCode: 'DOUBLE',
        roomTypeName: 'Doble',
        estado: 'AVAILABLE',
        pricePerNight: 30000,
      },
    };

    (reservationRepository.findAll as jest.Mock).mockResolvedValue({
      data: [reservationItem],
      total: 21,
    });

    const result = await sut.execute(query);

    expect(reservationRepository.findAll).toHaveBeenCalledWith({
      status: ReservationStatus.CONFIRMED,
      checkInFrom: undefined,
      checkInTo: undefined,
      clientId: 5,
      roomId: undefined,
      search: undefined,
      page: 2,
      limit: 10,
    });

    expect(result.totalPages).toBe(3);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].client?.firstName).toBe('Test');
  });
});
