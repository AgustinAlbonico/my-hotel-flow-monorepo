import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para parámetros de búsqueda y paginación de clientes
 */
export class ListClientsQueryDto {
    @ApiPropertyOptional({
        description: 'Número de página (base 1)',
        example: 1,
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Cantidad de resultados por página',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Filtro de búsqueda por DNI (completo o parcial)',
        example: '12345678',
    })
    @IsOptional()
    @IsString()
    dni?: string;

    @ApiPropertyOptional({
        description: 'Búsqueda general por DNI, nombre o apellido',
        example: 'juan',
    })
    @IsOptional()
    @IsString()
    search?: string;
}
