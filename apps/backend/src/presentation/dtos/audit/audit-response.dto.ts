import { ApiProperty } from '@nestjs/swagger';

export class ReservationAuditResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reservationId: number;

  @ApiProperty()
  actionType: string;

  @ApiProperty({ nullable: true })
  fieldChanged: string | null;

  @ApiProperty({ nullable: true })
  oldValue: string | null;

  @ApiProperty({ nullable: true })
  newValue: string | null;

  @ApiProperty({ nullable: true })
  changeReason: string | null;

  @ApiProperty({ nullable: true })
  changedByUserId: number | null;

  @ApiProperty()
  changedByUsername: string;

  @ApiProperty()
  changedBySystem: string;

  @ApiProperty({ nullable: true })
  ipAddress: string | null;

  @ApiProperty()
  changedAt: Date;

  @ApiProperty({ nullable: true })
  metadata: Record<string, unknown> | null;
}

export class UserSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  loginAt: Date;

  @ApiProperty({ nullable: true })
  loginIp: string | null;

  @ApiProperty({ nullable: true })
  logoutAt: Date | null;

  @ApiProperty({ nullable: true })
  logoutType: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ nullable: true })
  duration: number | null; // en segundos
}

export class UserActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  activityType: string;

  @ApiProperty({ nullable: true })
  activityDescription: string | null;

  @ApiProperty({ nullable: true })
  endpoint: string | null;

  @ApiProperty({ nullable: true })
  httpMethod: string | null;

  @ApiProperty({ nullable: true })
  responseStatus: number | null;

  @ApiProperty({ nullable: true })
  responseTimeMs: number | null;

  @ApiProperty()
  activityAt: Date;
}

export class AuditReportResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
