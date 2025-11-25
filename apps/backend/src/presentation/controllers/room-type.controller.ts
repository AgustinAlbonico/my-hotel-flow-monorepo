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
import { CreateRoomTypeUseCase } from '../../application/use-cases/room-type/create-room-type.use-case';
import { ListRoomTypesUseCase } from '../../application/use-cases/room-type/list-room-types.use-case';
import { GetRoomTypeByIdUseCase } from '../../application/use-cases/room-type/get-room-type-by-id.use-case';
import { UpdateRoomTypeUseCase } from '../../application/use-cases/room-type/update-room-type.use-case';
import { DeleteRoomTypeUseCase } from '../../application/use-cases/room-type/delete-room-type.use-case';
import { CreateRoomTypeRequestDto } from '../dtos/room-type/create-room-type-request.dto';
import { UpdateRoomTypeRequestDto } from '../dtos/room-type/update-room-type-request.dto';
import { RoomTypeResponseDto } from '../dtos/room-type/room-type-response.dto';

/**
 * RoomTypeController
 * Patrón: Controller - Clean Architecture
 * Capa: Presentation
 * Responsabilidad: Exponer endpoints HTTP para gestión de tipos de habitación
 */
@ApiTags('Room Types')
@ApiBearerAuth()
@Controller('room-types')
@UseGuards(JwtAuthGuard, ActionsGuard)
export class RoomTypeController {
  constructor(
    private readonly createRoomTypeUseCase: CreateRoomTypeUseCase,
    private readonly listRoomTypesUseCase: ListRoomTypesUseCase,
    private readonly getRoomTypeByIdUseCase: GetRoomTypeByIdUseCase,
    private readonly updateRoomTypeUseCase: UpdateRoomTypeUseCase,
    private readonly deleteRoomTypeUseCase: DeleteRoomTypeUseCase,
  ) {}

  @Post()
  @Actions('habitaciones.crear')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo tipo de habitación' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de habitación creado exitosamente',
    type: RoomTypeResponseDto,
  })
  async create(
    @Body() createDto: CreateRoomTypeRequestDto,
  ): Promise<RoomTypeResponseDto> {
    return this.createRoomTypeUseCase.execute(createDto);
  }

  @Get()
  @Actions('habitaciones.listar')
  @ApiOperation({ summary: 'Listar todos los tipos de habitación' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de habitación',
    type: [RoomTypeResponseDto],
  })
  async findAll(
    @Query('onlyActive') onlyActive?: string,
  ): Promise<RoomTypeResponseDto[]> {
    // Si no se especifica, por defecto mostrar todos (false)
    // Si es 'true', mostrar solo activos
    const active = onlyActive === 'true';
    return this.listRoomTypesUseCase.execute(active);
  }

  @Get(':id')
  @Actions('habitaciones.listar')
  @ApiOperation({ summary: 'Obtener un tipo de habitación por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de habitación encontrado',
    type: RoomTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de habitación no encontrado',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoomTypeResponseDto> {
    return this.getRoomTypeByIdUseCase.execute(id);
  }

  @Put(':id')
  @Actions('habitaciones.modificar')
  @ApiOperation({ summary: 'Actualizar un tipo de habitación' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de habitación actualizado',
    type: RoomTypeResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRoomTypeRequestDto,
  ): Promise<RoomTypeResponseDto> {
    return this.updateRoomTypeUseCase.execute(id, updateDto);
  }

  @Delete(':id')
  @Actions('habitaciones.eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un tipo de habitación (borrado lógico)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tipo de habitación eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de habitación no encontrado',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deleteRoomTypeUseCase.execute(id);
  }
}
