import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';
import { CreateCaracteristicaUseCase } from '../../application/use-cases/caracteristica/create-caracteristica.use-case';
import { ListCaracteristicasUseCase } from '../../application/use-cases/caracteristica/list-caracteristicas.use-case';
import { UpdateCaracteristicaUseCase } from '../../application/use-cases/caracteristica/update-caracteristica.use-case';
import { DeleteCaracteristicaUseCase } from '../../application/use-cases/caracteristica/delete-caracteristica.use-case';
import { CreateCaracteristicaRequestDto } from '../dtos/caracteristica/create-caracteristica-request.dto';
import { UpdateCaracteristicaRequestDto } from '../dtos/caracteristica/update-caracteristica-request.dto';
import { CaracteristicaResponseDto } from '../dtos/caracteristica/caracteristica-response.dto';
import { CaracteristicaMapper } from '../mappers/caracteristica.mapper';

/**
 * CaracteristicaController
 * Patrón: Controller - Clean Architecture
 * Capa: Presentation
 * Responsabilidad: Exponer endpoints HTTP para gestión de características
 */
@ApiTags('Características')
@ApiBearerAuth()
@Controller('caracteristicas')
@UseGuards(JwtAuthGuard, ActionsGuard)
export class CaracteristicaController {
  constructor(
    private readonly createCaracteristicaUseCase: CreateCaracteristicaUseCase,
    private readonly listCaracteristicasUseCase: ListCaracteristicasUseCase,
    private readonly updateCaracteristicaUseCase: UpdateCaracteristicaUseCase,
    private readonly deleteCaracteristicaUseCase: DeleteCaracteristicaUseCase,
    private readonly mapper: CaracteristicaMapper,
  ) {}

  @Post()
  @Actions('habitaciones.crear')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva característica' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Característica creada exitosamente',
    type: CaracteristicaResponseDto,
  })
  async create(
    @Body() createDto: CreateCaracteristicaRequestDto,
  ): Promise<CaracteristicaResponseDto> {
    const appDto = this.mapper.toCreateDto(createDto);
    return this.createCaracteristicaUseCase.execute(appDto);
  }

  @Get()
  @Actions('habitaciones.listar')
  @ApiOperation({ summary: 'Listar todas las características' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de características',
    type: [CaracteristicaResponseDto],
  })
  async findAll(
    @Query('onlyActive') onlyActive?: string,
  ): Promise<CaracteristicaResponseDto[]> {
    const active = onlyActive !== 'false';
    return this.listCaracteristicasUseCase.execute(active);
  }

  @Put(':id')
  @Actions('habitaciones.modificar')
  @ApiOperation({ summary: 'Actualizar una característica' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Característica actualizada',
    type: CaracteristicaResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCaracteristicaRequestDto,
  ): Promise<CaracteristicaResponseDto> {
    const appDto = this.mapper.toUpdateDto(updateDto);
    return this.updateCaracteristicaUseCase.execute(id, appDto);
  }

  @Delete(':id')
  @Actions('habitaciones.eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una característica' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Característica eliminada exitosamente',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deleteCaracteristicaUseCase.execute(id);
  }
}
