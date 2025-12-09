/**
 * Audit Service
 * Servicio para gestionar la auditoría del sistema
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReservationAuditLogOrmEntity,
  AuditActionType,
} from '../persistence/typeorm/entities/reservation-audit-log.orm-entity';
import {
  UserSessionOrmEntity,
  LogoutType,
} from '../persistence/typeorm/entities/user-session.orm-entity';
import { UserActivityLogOrmEntity } from '../persistence/typeorm/entities/user-activity-log.orm-entity';

export interface LogReservationChangeParams {
  reservationId: number;
  actionType: AuditActionType;
  fieldChanged?: string;
  oldValue?: string | number | boolean | Record<string, unknown> | null;
  newValue?: string | number | boolean | Record<string, unknown> | null;
  changeReason?: string;
  userId?: number;
  username: string;
  system: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateUserSessionParams {
  userId: number;
  username: string;
  ipAddress?: string;
  userAgent?: string;
  sessionToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface LogUserActivityParams {
  sessionId?: string;
  userId: number;
  activityType: string;
  activityDescription?: string;
  endpoint?: string;
  httpMethod?: string;
  requestParams?: Record<string, unknown> | null;
  responseStatus?: number;
  responseTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(ReservationAuditLogOrmEntity)
    private reservationAuditRepo: Repository<ReservationAuditLogOrmEntity>,
    @InjectRepository(UserSessionOrmEntity)
    private userSessionRepo: Repository<UserSessionOrmEntity>,
    @InjectRepository(UserActivityLogOrmEntity)
    private userActivityRepo: Repository<UserActivityLogOrmEntity>,
  ) {}

  /**
   * Registrar cambio en una reserva
   */
  async logReservationChange(
    params: LogReservationChangeParams,
  ): Promise<ReservationAuditLogOrmEntity> {
    const auditLog = this.reservationAuditRepo.create({
      reservationId: params.reservationId,
      actionType: params.actionType,
      fieldChanged: params.fieldChanged,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      changeReason: params.changeReason,
      changedByUserId: params.userId,
      changedByUsername: params.username,
      changedBySystem: params.system,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    });

    return this.reservationAuditRepo.save(auditLog);
  }

  /**
   * Crear sesión de usuario al hacer login
   */
  async createUserSession(
    params: CreateUserSessionParams,
  ): Promise<UserSessionOrmEntity> {
    const session = this.userSessionRepo.create({
      userId: params.userId,
      username: params.username,
      loginAt: new Date(),
      loginIp: params.ipAddress,
      loginUserAgent: params.userAgent,
      sessionToken: params.sessionToken,
      refreshToken: params.refreshToken,
      expiresAt: params.expiresAt,
      isActive: true,
    });

    return this.userSessionRepo.save(session);
  }

  /**
   * Cerrar sesión de usuario
   */
  async closeUserSession(
    sessionId: string,
    logoutType: LogoutType = LogoutType.MANUAL,
  ): Promise<void> {
    await this.userSessionRepo.update(sessionId, {
      logoutAt: new Date(),
      logoutType,
      isActive: false,
    });
  }

  /**
   * Buscar sesión activa por token
   */
  async findActiveSessionByToken(
    sessionToken: string,
  ): Promise<UserSessionOrmEntity | null> {
    return this.userSessionRepo.findOne({
      where: {
        sessionToken,
        isActive: true,
      },
    });
  }

  /**
   * Cerrar todas las sesiones activas de un usuario
   */
  async closeAllUserSessions(
    userId: number,
    logoutType: LogoutType = LogoutType.FORCED,
  ): Promise<void> {
    await this.userSessionRepo.update(
      {
        userId,
        isActive: true,
      },
      {
        logoutAt: new Date(),
        logoutType,
        isActive: false,
      },
    );
  }

  /**
   * Registrar actividad de usuario
   */
  async logUserActivity(params: LogUserActivityParams): Promise<void> {
    const activity = this.userActivityRepo.create({
      sessionId: params.sessionId,
      userId: params.userId,
      activityType: params.activityType,
      activityDescription: params.activityDescription,
      endpoint: params.endpoint,
      httpMethod: params.httpMethod,
      requestParams: params.requestParams,
      responseStatus: params.responseStatus,
      responseTimeMs: params.responseTimeMs,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    await this.userActivityRepo.save(activity);
  }

  /**
   * Obtener historial de cambios de una reserva
   */
  async getReservationAuditLog(
    reservationId: number,
  ): Promise<ReservationAuditLogOrmEntity[]> {
    return this.reservationAuditRepo.find({
      where: { reservationId },
      order: { changedAt: 'DESC' },
    });
  }

  /**
   * Obtener sesiones de un usuario
   */
  async getUserSessions(
    userId: number,
    limit: number = 10,
  ): Promise<UserSessionOrmEntity[]> {
    return this.userSessionRepo.find({
      where: { userId },
      order: { loginAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Obtener actividad reciente de un usuario
   */
  async getUserActivity(
    userId: number,
    limit: number = 50,
  ): Promise<UserActivityLogOrmEntity[]> {
    return this.userActivityRepo.find({
      where: { userId },
      order: { activityAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Cerrar sesiones expiradas
   */
  async closeExpiredSessions(): Promise<void> {
    const now = new Date();

    await this.userSessionRepo
      .createQueryBuilder()
      .update(UserSessionOrmEntity)
      .set({
        logoutAt: now,
        logoutType: LogoutType.EXPIRED,
        isActive: false,
      })
      .where('isActive = :isActive', { isActive: true })
      .andWhere('expiresAt < :now', { now })
      .execute();
  }

  /**
   * Obtener cambios de reservas con filtros y paginación
   */
  async getReservationChangesReport(filters: {
    reservationId?: number;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    actionType?: string;
    system?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ReservationAuditLogOrmEntity[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reservationAuditRepo
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.reservation', 'reservation')
      .leftJoinAndSelect('audit.changedByUser', 'user');

    if (filters.reservationId) {
      queryBuilder.andWhere('audit.reservationId = :reservationId', {
        reservationId: filters.reservationId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit.changedAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit.changedAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.userId) {
      queryBuilder.andWhere('audit.changedByUserId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.actionType) {
      queryBuilder.andWhere('audit.actionType = :actionType', {
        actionType: filters.actionType,
      });
    }

    if (filters.system) {
      queryBuilder.andWhere('audit.changedBySystem = :system', {
        system: filters.system,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('audit.changedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Obtener sesiones de usuarios con filtros y paginación
   */
  async getUserSessionsReport(filters: {
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: UserSessionOrmEntity[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userSessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user');

    if (filters.userId) {
      queryBuilder.andWhere('session.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('session.loginAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('session.loginAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('session.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('session.loginAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Obtener actividad de usuarios con filtros y paginación
   */
  async getUserActivityReport(filters: {
    userId?: number;
    sessionId?: string;
    activityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: UserActivityLogOrmEntity[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 100;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userActivityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.session', 'session');

    if (filters.userId) {
      queryBuilder.andWhere('activity.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.sessionId) {
      queryBuilder.andWhere('activity.sessionId = :sessionId', {
        sessionId: filters.sessionId,
      });
    }

    if (filters.activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', {
        activityType: filters.activityType,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('activity.activityAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('activity.activityAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('activity.activityAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }
}
