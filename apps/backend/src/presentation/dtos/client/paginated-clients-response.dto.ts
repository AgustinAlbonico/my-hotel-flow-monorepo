import { ApiProperty } from '@nestjs/swagger';
import { ClientListItemResponseDto } from './client-list-response.dto';

/**
 * DTO para información de paginación
 */
export class PaginationMetaDto {
    @ApiProperty({ description: 'Página actual', example: 1 })
    page: number;

    @ApiProperty({ description: 'Elementos por página', example: 10 })
    limit: number;

    @ApiProperty({ description: 'Total de elementos', example: 50 })
    total: number;

    @ApiProperty({ description: 'Total de páginas', example: 5 })
    totalPages: number;
}

/**
 * DTO para respuesta paginada de clientes
 */
export class PaginatedClientsResponseDto {
    @ApiProperty({
        description: 'Lista de clientes',
        type: [ClientListItemResponseDto],
    })
    data: ClientListItemResponseDto[];

    @ApiProperty({
        description: 'Información de paginación',
        type: PaginationMetaDto,
    })
    pagination: PaginationMetaDto;
}
