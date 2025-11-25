/**
 * Assign Groups Request DTO
 * DTO de presentación para asignar grupos a un usuario
 */

import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignGroupsRequestDto {
  @ApiProperty({
    description: 'Array of group IDs to assign to the user',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  groupIds: number[];
}
