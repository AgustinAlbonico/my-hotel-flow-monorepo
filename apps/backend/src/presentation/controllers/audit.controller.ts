import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';
import { AuditService } from '../../infrastructure/services/audit.service';
import {
  GetReservationAuditDto,
  GetUserSessionsDto,
  GetUserActivityDto,
  GetAuditSummaryDto,
} from '../dtos/audit/get-audit-reports.dto';
import {
  ReservationAuditResponseDto,
  UserSessionResponseDto,
  UserActivityResponseDto,
} from '../dtos/audit/audit-response.dto';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('reservations/changes')
  @Actions('auditoria.ver')
  @ApiOperation({ summary: 'Obtener historial de cambios en reservas' })
  @ApiResponse({
    status: 200,
    description: 'Historial de cambios de reservas',
    type: [ReservationAuditResponseDto],
  })
  async getReservationChanges(@Query() filters: GetReservationAuditDto) {
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

    const { data, total } = await this.auditService.getReservationChangesReport({
      reservationId: filters.reservationId,
      startDate,
      endDate,
      userId: filters.userId,
      actionType: filters.actionType,
      system: filters.system,
      page: filters.page,
      limit: filters.limit,
    });

    const mappedData = data.map((log) => ({
      id: log.id,
      reservationId: log.reservationId,
      actionType: log.actionType,
      fieldChanged: log.fieldChanged,
      oldValue: log.oldValue,
      newValue: log.newValue,
      changeReason: log.changeReason,
      changedByUserId: log.changedByUserId,
      changedByUsername: log.changedByUsername,
      changedBySystem: log.changedBySystem,
      ipAddress: log.ipAddress,
      changedAt: log.changedAt,
      metadata: log.metadata,
    }));

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: mappedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  @Get('reservations/:id/history')
  @Actions('auditoria.ver')
  @ApiOperation({ summary: 'Obtener historial completo de una reserva específica' })
  @ApiResponse({
    status: 200,
    description: 'Historial de cambios de la reserva',
  })
  async getReservationHistory(@Query('id') reservationId: number) {
    const logs = await this.auditService.getReservationAuditLog(reservationId);

    return {
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        fieldChanged: log.fieldChanged,
        oldValue: log.oldValue,
        newValue: log.newValue,
        changeReason: log.changeReason,
        changedByUsername: log.changedByUsername,
        changedBySystem: log.changedBySystem,
        changedAt: log.changedAt,
        metadata: log.metadata,
      })),
    };
  }

  @Get('sessions')
  @Actions('auditoria.sesiones.ver')
  @ApiOperation({ summary: 'Obtener historial de sesiones de usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Historial de sesiones',
    type: [UserSessionResponseDto],
  })
  async getUserSessions(@Query() filters: GetUserSessionsDto) {
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

    const { data, total } = await this.auditService.getUserSessionsReport({
      userId: filters.userId,
      startDate,
      endDate,
      isActive: filters.isActive,
      page: filters.page,
      limit: filters.limit,
    });

    const mappedData = data.map((session) => {
      const duration = session.logoutAt
        ? Math.floor(
            (session.logoutAt.getTime() - session.loginAt.getTime()) / 1000,
          )
        : null;

      return {
        id: session.id,
        userId: session.userId,
        username: session.username,
        loginAt: session.loginAt,
        loginIp: session.loginIp,
        logoutAt: session.logoutAt,
        logoutType: session.logoutType,
        isActive: session.isActive,
        duration,
      };
    });

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: mappedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  @Get('activity')
  @Actions('auditoria.actividad.ver')
  @ApiOperation({ summary: 'Obtener actividad de usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Actividad de usuarios',
    type: [UserActivityResponseDto],
  })
  async getUserActivity(@Query() filters: GetUserActivityDto) {
    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

    const { data, total } = await this.auditService.getUserActivityReport({
      userId: filters.userId,
      sessionId: filters.sessionId,
      activityType: filters.activityType,
      startDate,
      endDate,
      page: filters.page,
      limit: filters.limit,
    });

    const mappedData = data.map((activity) => ({
      id: activity.id,
      userId: activity.userId,
      activityType: activity.activityType,
      activityDescription: activity.activityDescription,
      endpoint: activity.endpoint,
      httpMethod: activity.httpMethod,
      responseStatus: activity.responseStatus,
      responseTimeMs: activity.responseTimeMs,
      activityAt: activity.activityAt,
    }));

    const page = filters.page || 1;
    const limit = filters.limit || 100;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: mappedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  @Get('summary')
  @Actions('auditoria.ver')
  @ApiOperation({ summary: 'Obtener resumen de auditoría' })
  @ApiResponse({
    status: 200,
    description: 'Resumen consolidado de auditoría',
  })
  async getAuditSummary(@Query() filters: GetAuditSummaryDto) {
    // Usar fechas del filtro o por defecto últimos 7 días
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() - 7);
          return date;
        })();

    const [reservationChanges, sessions, activity] = await Promise.all([
      this.auditService.getReservationChangesReport({
        startDate,
        endDate,
        page: 1,
        limit: 100,
      }),
      this.auditService.getUserSessionsReport({
        startDate,
        endDate,
        page: 1,
        limit: 100,
      }),
      this.auditService.getUserActivityReport({
        startDate,
        endDate,
        page: 1,
        limit: 100,
      }),
    ]);

    // Agrupar cambios por tipo de acción
    const changesByAction = reservationChanges.data.reduce((acc, log) => {
      acc[log.actionType] = (acc[log.actionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Usuarios más activos
    const userActivity = activity.data.reduce((acc, act) => {
      acc[act.userId] = (acc[act.userId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const topUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({ userId: Number(userId), actions: count }));

    return {
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        reservationChanges: {
          total: reservationChanges.total,
          byAction: changesByAction,
        },
        sessions: {
          total: sessions.total,
          active: sessions.data.filter((s) => s.isActive).length,
        },
        activity: {
          total: activity.total,
        },
        topUsers,
      },
    };
  }
}
