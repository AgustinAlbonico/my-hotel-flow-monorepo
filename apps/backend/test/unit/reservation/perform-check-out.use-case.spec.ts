import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PerformCheckOutUseCase } from '../../../src/application/use-cases/reservation/perform-check-out.use-case';
import type { IReservationRepository } from '../../../src/domain/repositories/reservation.repository.interface';
import type { IRoomRepository } from '../../../src/domain/repositories/room.repository.interface';
import type { IInvoiceRepository } from '../../../src/domain/repositories/invoice.repository.interface';
import type { IClientRepository } from '../../../src/domain/repositories/client.repository.interface';
import type { IAccountMovementRepository } from '../../../src/domain/repositories/account-movement.repository.interface';
import { Reservation, ReservationStatus } from '../../../src/domain/entities/reservation.entity';
import { Room, RoomStatus } from '../../../src/domain/entities/room.entity';
import { Client } from '../../../src/domain/entities/client.entity';
import { Invoice } from '../../../src/domain/entities/invoice.entity';
import { AuditService } from '../../../src/infrastructure/services/audit.service';
import { RoomCondition } from '../../../src/domain/value-objects/check-out-record.value-object';

describe('PerformCheckOutUseCase', () => {
  let useCase: PerformCheckOutUseCase;
  let mockReservationRepository: jest.Mocked<IReservationRepository>;
  let mockRoomRepository: jest.Mocked<IRoomRepository>;
  let mockInvoiceRepository: jest.Mocked<IInvoiceRepository>;
  let mockClientRepository: jest.Mocked<IClientRepository>;
  let mockAccountMovementRepository: jest.Mocked<IAccountMovementRepository>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    // Crear mocks
    mockReservationRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    mockRoomRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockInvoiceRepository = {
      findByReservationId: jest.fn(),
      save: jest.fn(),
    } as any;

    mockClientRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    mockAccountMovementRepository = {
      save: jest.fn(),
    } as any;

    mockAuditService = {
      logReservationChange: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformCheckOutUseCase,
        { provide: 'IReservationRepository', useValue: mockReservationRepository },
        { provide: 'IRoomRepository', useValue: mockRoomRepository },
        { provide: 'IInvoiceRepository', useValue: mockInvoiceRepository },
        { provide: 'IClientRepository', useValue: mockClientRepository },
        { provide: 'IAccountMovementRepository', useValue: mockAccountMovementRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    useCase = module.get<PerformCheckOutUseCase>(PerformCheckOutUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CB-CO-04: Reserva no encontrada', () => {
    it('debería lanzar NotFoundException si la reserva no existe', async () => {
      // Arrange
      mockReservationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute(99999, 1, { roomCondition: RoomCondition.GOOD }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        useCase.execute(99999, 1, { roomCondition: RoomCondition.GOOD }),
      ).rejects.toThrow('Reserva con ID 99999 no encontrada');
    });
  });

  describe('CB-CO-05: Estado de reserva inválido', () => {
    it('debería lanzar BadRequestException si la reserva no está en estado IN_PROGRESS', async () => {
      // Arrange
      const mockReservation = {
        id: 1,
        status: ReservationStatus.CONFIRMED,
        roomId: 101,
      } as Reservation;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);

      // Act & Assert
      await expect(
        useCase.execute(1, 1, { roomCondition: RoomCondition.GOOD }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        useCase.execute(1, 1, { roomCondition: RoomCondition.GOOD }),
      ).rejects.toThrow('Solo se puede hacer check-out de reservas en progreso');
    });
  });

  describe('CB-CO-01: Check-out exitoso (limpieza normal)', () => {
    it('debería completar el check-out correctamente y dejar la habitación AVAILABLE', async () => {
      // Arrange
      const mockReservation = {
        id: 1,
        code: 'RES-001',
        clientId: 10,
        roomId: 101,
        checkIn: new Date('2025-12-01'),
        checkOut: new Date('2025-12-03'),
        status: ReservationStatus.IN_PROGRESS,
        complete: jest.fn(),
        calculateNights: jest.fn().mockReturnValue(2),
      } as any;

      const mockRoom = {
        id: 101,
        numero: '101',
        estado: RoomStatus.OCCUPIED,
        changeStatus: jest.fn(),
      } as any;

      const mockClient = {
        id: 10,
        addDebt: jest.fn(),
      } as any;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockRoomRepository.findById.mockResolvedValue(mockRoom);
      mockInvoiceRepository.findByReservationId.mockResolvedValue(null); // No hay factura previa
      mockClientRepository.findById.mockResolvedValue(mockClient);

      // Act
      await useCase.execute(1, 1, { 
        roomCondition: RoomCondition.GOOD,
        observations: 'Todo en orden',
      });

      // Assert
      expect(mockReservation.complete).toHaveBeenCalled();
      expect(mockRoom.changeStatus).toHaveBeenCalledWith(RoomStatus.AVAILABLE);
      expect(mockInvoiceRepository.save).toHaveBeenCalled();
      expect(mockClient.addDebt).toHaveBeenCalled();
      expect(mockReservationRepository.save).toHaveBeenCalled();
      expect(mockRoomRepository.update).toHaveBeenCalled();
    });
  });

  describe('CB-CO-02: Check-out con limpieza profunda', () => {
    it('debería dejar la habitación en estado MAINTENANCE si requiere limpieza profunda', async () => {
      // Arrange
      const mockReservation = {
        id: 2,
        code: 'RES-002',
        clientId: 11,
        roomId: 102,
        checkIn: new Date('2025-12-01'),
        checkOut: new Date('2025-12-05'),
        status: ReservationStatus.IN_PROGRESS,
        complete: jest.fn(),
        calculateNights: jest.fn().mockReturnValue(4),
      } as any;

      const mockRoom = {
        id: 102,
        numero: '102',
        estado: RoomStatus.OCCUPIED,
        changeStatus: jest.fn(),
      } as any;

      const mockClient = {
        id: 11,
        addDebt: jest.fn(),
      } as any;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockRoomRepository.findById.mockResolvedValue(mockRoom);
      mockInvoiceRepository.findByReservationId.mockResolvedValue(null);
      mockClientRepository.findById.mockResolvedValue(mockClient);

      // Act
      await useCase.execute(2, 1, { 
        roomCondition: RoomCondition.NEEDS_DEEP_CLEANING,
        observations: 'Requiere limpieza profunda',
      });

      // Assert
      expect(mockRoom.changeStatus).toHaveBeenCalledWith(RoomStatus.MAINTENANCE);
    });
  });

  describe('CB-CO-03: Check-out sin generar factura (ya existe)', () => {
    it('no debería crear una nueva factura si ya existe una para la reserva', async () => {
      // Arrange
      const mockReservation = {
        id: 3,
        code: 'RES-003',
        clientId: 12,
        roomId: 103,
        status: ReservationStatus.IN_PROGRESS,
        complete: jest.fn(),
        calculateNights: jest.fn().mockReturnValue(3),
      } as any;

      const mockRoom = {
        id: 103,
        numero: '103',
        estado: RoomStatus.OCCUPIED,
        changeStatus: jest.fn(),
      } as any;

      const existingInvoice = {
        id: 1,
        reservationId: 3,
        total: 3000,
      } as Invoice;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockRoomRepository.findById.mockResolvedValue(mockRoom);
      mockInvoiceRepository.findByReservationId.mockResolvedValue(existingInvoice);

      // Act
      await useCase.execute(3, 1, { roomCondition: RoomCondition.REGULAR });

      // Assert
      expect(mockInvoiceRepository.save).not.toHaveBeenCalled(); // No debe crear nueva factura
      expect(mockClientRepository.findById).not.toHaveBeenCalled(); // No debe actualizar saldo
    });
  });

  describe('CN-CO-01: Habitación en buen estado (GOOD)', () => {
    it('debería procesar correctamente cuando roomCondition es GOOD', async () => {
      // Arrange
      const mockReservation = {
        id: 4,
        clientId: 13,
        roomId: 104,
        status: ReservationStatus.IN_PROGRESS,
        complete: jest.fn(),
        calculateNights: jest.fn().mockReturnValue(1),
      } as any;

      const mockRoom = {
        id: 104,
        changeStatus: jest.fn(),
      } as any;

      const mockClient = {
        id: 13,
        addDebt: jest.fn(),
      } as any;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockRoomRepository.findById.mockResolvedValue(mockRoom);
      mockInvoiceRepository.findByReservationId.mockResolvedValue(null);
      mockClientRepository.findById.mockResolvedValue(mockClient);

      // Act
      await useCase.execute(4, 1, { roomCondition: RoomCondition.GOOD });

      // Assert
      expect(mockRoom.changeStatus).toHaveBeenCalledWith(RoomStatus.AVAILABLE);
    });
  });

  describe('CN-CO-02: Habitación en estado regular (REGULAR)', () => {
    it('debería procesar correctamente cuando roomCondition es REGULAR', async () => {
      // Arrange
      const mockReservation = {
        id: 5,
        clientId: 14,
        roomId: 105,
        status: ReservationStatus.IN_PROGRESS,
        complete: jest.fn(),
        calculateNights: jest.fn().mockReturnValue(2),
      } as any;

      const mockRoom = {
        id: 105,
        changeStatus: jest.fn(),
      } as any;

      const mockClient = {
        id: 14,
        addDebt: jest.fn(),
      } as any;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockRoomRepository.findById.mockResolvedValue(mockRoom);
      mockInvoiceRepository.findByReservationId.mockResolvedValue(null);
      mockClientRepository.findById.mockResolvedValue(mockClient);

      // Act
      await useCase.execute(5, 1, { roomCondition: RoomCondition.REGULAR });

      // Assert
      expect(mockRoom.changeStatus).toHaveBeenCalledWith(RoomStatus.AVAILABLE);
    });
  });

  describe('CN-CO-04: Check-out sin observaciones', () => {
    it('debería permitir check-out sin observaciones (campo opcional)', async () => {
      // Arrange
      const mockReservation = {
        id: 6,
        clientId: 15,
        roomId: 106,
        status: ReservationStatus.IN_PROGRESS,
        complete: jest.fn(),
        calculateNights: jest.fn().mockReturnValue(1),
      } as any;

      const mockRoom = {
        id: 106,
        changeStatus: jest.fn(),
      } as any;

      const mockClient = {
        id: 15,
        addDebt: jest.fn(),
      } as any;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockRoomRepository.findById.mockResolvedValue(mockRoom);
      mockInvoiceRepository.findByReservationId.mockResolvedValue(null);
      mockClientRepository.findById.mockResolvedValue(mockClient);

      // Act
      await useCase.execute(6, 1, { 
        roomCondition: RoomCondition.GOOD,
        // observations: undefined (sin observaciones)
      });

      // Assert
      expect(mockReservation.complete).toHaveBeenCalled();
      expect(mockInvoiceRepository.save).toHaveBeenCalled();
    });
  });

  describe('Auditoría', () => {
    it('debería registrar auditoría si se proporciona auditContext', async () => {
      // Arrange
      const mockReservation = {
        id: 7,
        clientId: 16,
        roomId: 107,
        status: ReservationStatus.IN_PROGRESS,
        complete: jest.fn(),
        calculateNights: jest.fn().mockReturnValue(2),
      } as any;

      const mockRoom = {
        id: 107,
        changeStatus: jest.fn(),
      } as any;

      const mockClient = {
        id: 16,
        addDebt: jest.fn(),
      } as any;

      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockRoomRepository.findById.mockResolvedValue(mockRoom);
      mockInvoiceRepository.findByReservationId.mockResolvedValue(null);
      mockClientRepository.findById.mockResolvedValue(mockClient);

      const auditContext = {
        userId: 1,
        username: 'admin',
        system: 'ADMIN_PANEL',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test',
      };

      // Act
      await useCase.execute(7, 1, { roomCondition: RoomCondition.GOOD }, auditContext);

      // Assert
      expect(mockAuditService.logReservationChange).toHaveBeenCalled();
    });
  });
});
