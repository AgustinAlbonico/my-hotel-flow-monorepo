/**
 * User Response DTO
 * DTO para devolver información de un usuario
 */

import { GroupResponseDto } from '../group/group-response.dto';
import { ActionResponseDto } from '../action/action-response.dto';

export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  groups: GroupResponseDto[];
  actions: ActionResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
