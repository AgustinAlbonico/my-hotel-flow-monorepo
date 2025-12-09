import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';
import { ReservationOrmEntity } from '../../infrastructure/persistence/typeorm/entities/reservation.orm-entity';
import { RoomOrmEntity } from '../../infrastructure/persistence/typeorm/entities/room.orm-entity';
import { PaymentOrmEntity } from '../../infrastructure/persistence/typeorm/entities/payment.orm-entity';
import { InvoiceOrmEntity } from '../../infrastructure/persistence/typeorm/entities/invoice.orm-entity';

interface MonthlyData {
  month: string;
  reservas: number;
  ingresos: number;
}

interface RoomOccupancyData {
  tipo: string;
  ocupadas: number;
  disponibles: number;
}

interface ReservationStatusData {
  name: string;
  value: number;
  color: string;
}

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  color: string;
}

interface DashboardStatsResponse {
  statsCards: StatsCard[];
  monthlyReservations: MonthlyData[];
  roomOccupancy: RoomOccupancyData[];
  reservationStatus: ReservationStatusData[];
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    @InjectRepository(ReservationOrmEntity)
    private readonly reservationRepository: Repository<ReservationOrmEntity>,
    @InjectRepository(RoomOrmEntity)
    private readonly roomRepository: Repository<RoomOrmEntity>,
    @InjectRepository(PaymentOrmEntity)
    private readonly paymentRepository: Repository<PaymentOrmEntity>,
    @InjectRepository(InvoiceOrmEntity)
    private readonly invoiceRepository: Repository<InvoiceOrmEntity>,
  ) {}

  @Get('stats')
  @Actions('reservas.listar')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 1. Stats Cards
    // Ocupación actual
    const totalRooms = await this.roomRepository.count({ where: { isActive: true } });
    const occupiedRooms = await this.roomRepository.count({
      where: { estado: 'OCCUPIED', isActive: true },
    });
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Obtener ocupación del mes pasado para la tendencia
    const lastMonthReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.checkIn >= :start', { start: lastMonthStart })
      .andWhere('reservation.checkIn <= :end', { end: lastMonthEnd })
      .andWhere('reservation.status = :status', { status: 'CONFIRMED' })
      .getCount();

    // Reservas del mes actual
    const currentMonthReservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.checkIn >= :start', { start: startOfMonth })
      .andWhere('reservation.checkIn <= :end', { end: endOfMonth })
      .getCount();

    const reservationChange = lastMonthReservations > 0
      ? (((currentMonthReservations - lastMonthReservations) / lastMonthReservations) * 100).toFixed(0)
      : '0';

    // Huéspedes actuales (reservas en progreso)
    const currentGuests = await this.reservationRepository.count({
      where: {
        status: 'IN_PROGRESS',
      },
    });

    // Ingresos mensuales
    const monthlyPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.paidAt >= :startOfMonth', { startOfMonth })
      .andWhere('payment.paidAt <= :endOfMonth', { endOfMonth })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const lastMonthPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.paidAt >= :lastMonthStart', { lastMonthStart })
      .andWhere('payment.paidAt <= :lastMonthEnd', { lastMonthEnd })
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const monthlyIncome = parseFloat(monthlyPayments?.total || '0');
    const lastMonthIncome = parseFloat(lastMonthPayments?.total || '0');
    const incomeChange = lastMonthIncome > 0
      ? (((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(0)
      : '0';

    const statsCards: StatsCard[] = [
      {
        title: 'Ocupación',
        value: `${occupancyRate.toFixed(0)}%`,
        change: `${reservationChange}%`,
        trend: parseInt(reservationChange) >= 0 ? 'up' : 'down',
        color: 'primary',
      },
      {
        title: 'Reservas Mes',
        value: currentMonthReservations.toString(),
        change: `${reservationChange}%`,
        trend: parseInt(reservationChange) >= 0 ? 'up' : 'down',
        color: 'success',
      },
      {
        title: 'Huéspedes',
        value: currentGuests.toString(),
        change: '+0',
        trend: 'up',
        color: 'info',
      },
      {
        title: 'Ingresos',
        value: `$${(monthlyIncome / 1000).toFixed(0)}k`,
        change: `${incomeChange}%`,
        trend: parseInt(incomeChange) >= 0 ? 'up' : 'down',
        color: 'warning',
      },
    ];

    // 2. Monthly Reservations (últimos 6 meses)
    const monthlyReservations: MonthlyData[] = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.checkIn >= :start', { start: monthDate })
        .andWhere('reservation.checkIn <= :end', { end: monthEnd })
        .getCount();

      const payments = await this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.paidAt >= :monthDate', { monthDate })
        .andWhere('payment.paidAt <= :monthEnd', { monthEnd })
        .select('SUM(payment.amount)', 'total')
        .getRawOne();

      monthlyReservations.push({
        month: monthNames[monthDate.getMonth()],
        reservas: reservations,
        ingresos: parseFloat(payments?.total || '0'),
      });
    }

    // 3. Room Occupancy by Type
    const roomTypes = await this.roomRepository
      .createQueryBuilder('room')
      .innerJoin('room.roomType', 'roomType')
      .select('"roomType"."id"', 'tipoId')
      .addSelect('"roomType"."name"', 'tipo')
      .addSelect('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN room.estado = 'OCCUPIED' THEN 1 ELSE 0 END)", 'ocupadas')
      .where('room.isActive = :isActive', { isActive: true })
      .groupBy('"roomType"."id"')
      .addGroupBy('"roomType"."name"')
      .getRawMany();

    const roomOccupancy: RoomOccupancyData[] = roomTypes.map((rt) => ({
      tipo: rt.tipo || 'Sin tipo',
      ocupadas: parseInt(rt.ocupadas || '0'),
      disponibles: parseInt(rt.total || '0') - parseInt(rt.ocupadas || '0'),
    }));

    // 4. Reservation Status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const confirmedCount = await this.reservationRepository.count({
      where: { status: 'CONFIRMED' },
    });

    const pendingCount = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.status = :status', { status: 'CONFIRMED' })
      .andWhere('reservation.checkIn >= :tomorrow', { tomorrow })
      .getCount();

    const checkInToday = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.checkIn >= :today', { today })
      .andWhere('reservation.checkIn < :tomorrow', { tomorrow })
      .andWhere('reservation.status = :status', { status: 'CONFIRMED' })
      .getCount();

    const checkOutToday = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.checkOut >= :today', { today })
      .andWhere('reservation.checkOut < :tomorrow', { tomorrow })
      .andWhere('reservation.status = :status', { status: 'IN_PROGRESS' })
      .getCount();

    const reservationStatus: ReservationStatusData[] = [
      { name: 'Confirmadas', value: confirmedCount, color: '#10b981' },
      { name: 'Pendientes', value: pendingCount, color: '#f59e0b' },
      { name: 'Check-In Hoy', value: checkInToday, color: '#3b82f6' },
      { name: 'Check-Out Hoy', value: checkOutToday, color: '#6366f1' },
    ];

    return {
      statsCards,
      monthlyReservations,
      roomOccupancy,
      reservationStatus,
    };
    } catch (error) {
      this.logger.error('Error al obtener estadísticas del dashboard', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
}
