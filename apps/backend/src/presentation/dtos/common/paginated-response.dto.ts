/**
 * Paginated Response DTO
 * DTO genérico para respuestas paginadas
 */

import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;

  constructor(data: T[], page: number, limit: number, total: number) {
    this.data = data;
    const totalPages = Math.ceil(total / limit);

    this.pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
