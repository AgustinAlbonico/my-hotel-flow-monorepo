/**
 * Assign Actions Request DTO
 * DTO de presentación para asignar acciones directas a un usuario
 */

import { IsArray, IsNumber, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignActionsRequestDto {
  @ApiProperty({
    description: 'Array of action IDs to assign to the user',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @ValidateIf((o) => !o.actionKeys)
  @IsArray()
  @IsNumber({}, { each: true })
  actionIds?: number[];

  @ApiProperty({
    description:
      'Array of action keys to assign to the user (alternative to actionIds)',
    example: ['config.usuarios.listar', 'config.grupos.ver'],
    type: [String],
    required: false,
  })
  @ValidateIf((o) => !o.actionIds)
  @IsArray()
  @IsString({ each: true })
  actionKeys?: string[];
}
