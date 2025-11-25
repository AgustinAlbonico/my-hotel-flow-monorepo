/**
 * Action Response DTO
 * DTO para respuestas de actions
 */

export class ActionResponseDto {
  id: number;
  key: string;
  name: string;
  description?: string;
  area?: string;
  module: string;
  operation: string;
  createdAt?: Date;
  updatedAt?: Date;
}
