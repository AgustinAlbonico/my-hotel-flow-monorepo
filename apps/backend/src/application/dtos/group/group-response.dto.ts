/**
 * Group Response DTO
 * DTO para devolver información de un grupo
 */

import { ActionResponseDto } from '../action/action-response.dto';

export class GroupResponseDto {
  id: number;
  key: string;
  name: string;
  description?: string;
  actions: ActionResponseDto[];
  children: GroupResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
