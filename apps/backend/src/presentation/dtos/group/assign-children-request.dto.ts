/**
 * Assign Children Request DTO
 * DTO de presentación para asignar grupos hijos a un grupo
 */

import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignChildrenRequestDto {
  @ApiProperty({
    description: 'Array of group IDs to set as children',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  childrenIds: number[];
}
