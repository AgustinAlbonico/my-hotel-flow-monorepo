import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Actions } from '../decorators/actions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { CreateRoomUseCase } from '../../application/use-cases/room/create-room.use-case';
import { UpdateRoomUseCase } from '../../application/use-cases/room/update-room.use-case';
import { DeleteRoomUseCase } from '../../application/use-cases/room/delete-room.use-case';
import { ListRoomsUseCase } from '../../application/use-cases/room/list-rooms.use-case';
import { FindRoomByIdUseCase } from '../../application/use-cases/room/find-room-by-id.use-case';
import { ChangeRoomStatusUseCase } from '../../application/use-cases/room/change-room-status.use-case';
import { CreateRoomRequestDto } from '../dtos/room/create-room-request.dto';
import { UpdateRoomRequestDto } from '../dtos/room/update-room-request.dto';
import { ChangeRoomStatusRequestDto } from '../dtos/room/change-room-status-request.dto';
import { RoomResponseDto } from '../dtos/room/room-response.dto';
import { RoomMapper } from '../mappers/room.mapper';

/**
 * RoomController
 * Patrón: Controller (MVC) con Guards y Decoradores
 * Capa: Presentation
 * Responsabilidad: Exponer endpoints REST para gestión de habitaciones
 */
@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('rooms')
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
    private readonly listRoomsUseCase: ListRoomsUseCase,
    private readonly findRoomByIdUseCase: FindRoomByIdUseCase,
    private readonly changeRoomStatusUseCase: ChangeRoomStatusUseCase,
    private readonly roomMapper: RoomMapper,
  ) {}

  /**
   * POST /api/v1/rooms - Crear nueva habitación
   */
  @Post()
  @Actions('habitaciones.crear')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva habitación' })
  @ApiResponse({
    status: 201,
    description: 'Habitación creada exitosamente',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'Habitación ya existe' })
  async createRoom(
    @Body() createRoomDto: CreateRoomRequestDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(
      `POST /rooms - Creando habitación: ${createRoomDto.numeroHabitacion}`,
    );

    const dto = this.roomMapper.toCreateDto(createRoomDto);
    const result = await this.createRoomUseCase.execute(dto);
    return this.roomMapper.toResponseDto(result);
  }

  /**
   * GET /api/v1/rooms - Listar habitaciones con filtros opcionales
   */
  @Get()
  @Actions('habitaciones.listar')
  @ApiOperation({ summary: 'Obtener lista de habitaciones' })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: ['ESTANDAR', 'SUITE', 'FAMILIAR'],
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE'],
  })
  @ApiQuery({ name: 'capacidadMinima', required: false, type: Number })
  @ApiQuery({ name: 'precioMaximo', required: false, type: Number })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Lista de habitaciones',
    type: [RoomResponseDto],
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async listRooms(
    @Query('tipo') tipo?: 'ESTANDAR' | 'SUITE' | 'FAMILIAR',
    @Query('estado')
    estado?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OUT_OF_SERVICE',
    @Query('capacidadMinima') capacidadMinima?: number,
    @Query('precioMaximo') precioMaximo?: number,
    @Query('onlyActive') onlyActive?: boolean,
  ): Promise<RoomResponseDto[]> {
    this.logger.log('GET /rooms - Listando habitaciones');

    const filters = {
      tipo,
      estado,
      capacidadMinima: capacidadMinima ? Number(capacidadMinima) : undefined,
      precioMaximo: precioMaximo ? Number(precioMaximo) : undefined,
      onlyActive: onlyActive !== undefined ? onlyActive === true : undefined,
    };

    const result = await this.listRoomsUseCase.execute(filters);
    return this.roomMapper.toResponseDtoList(result);
  }

  /**
   * GET /api/v1/rooms/:id - Obtener detalles de una habitación
   */
  @Get(':id')
  @Actions('habitaciones.ver')
  @ApiOperation({ summary: 'Obtener detalles de una habitación' })
  @ApiParam({ name: 'id', description: 'ID de la habitación', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la habitación',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  async getRoomById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoomResponseDto> {
    this.logger.log(`GET /rooms/${id} - Obteniendo detalles de habitación`);

    const result = await this.findRoomByIdUseCase.execute(id);
    return this.roomMapper.toResponseDto(result);
  }

  /**
   * PUT /api/v1/rooms/:id - Actualizar habitación
   */
  @Put(':id')
  @Actions('habitaciones.modificar')
  @ApiOperation({ summary: 'Actualizar información de una habitación' })
  @ApiParam({ name: 'id', description: 'ID de la habitación', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Habitación actualizada',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  async updateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomRequestDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(`PUT /rooms/${id} - Actualizando habitación`);

    const dto = this.roomMapper.toUpdateDto(updateRoomDto);
    const result = await this.updateRoomUseCase.execute(id, dto);
    return this.roomMapper.toResponseDto(result);
  }

  /**
   * PATCH /api/v1/rooms/:id/status - Cambiar estado de habitación
   */
  @Patch(':id/status')
  @Actions('habitaciones.cambiarEstado')
  @ApiOperation({ summary: 'Cambiar estado de una habitación' })
  @ApiParam({ name: 'id', description: 'ID de la habitación', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Estado de habitación actualizado',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  async changeRoomStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeRoomStatusRequestDto,
  ): Promise<RoomResponseDto> {
    this.logger.log(`PATCH /rooms/${id}/status - Cambiando estado`);

    const dto = this.roomMapper.toChangeStatusDto(changeStatusDto);
    const result = await this.changeRoomStatusUseCase.execute(id, dto);
    return this.roomMapper.toResponseDto(result);
  }

  /**
   * DELETE /api/v1/rooms/:id - Eliminar habitación (soft delete)
   */
  @Delete(':id')
  @Actions('habitaciones.eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar habitación (desactivación lógica)',
  })
  @ApiParam({ name: 'id', description: 'ID de la habitación', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Habitación eliminada',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Habitación no encontrada' })
  async deleteRoom(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`DELETE /rooms/${id} - Eliminando habitación`);

    await this.deleteRoomUseCase.execute(id);
  }
}
