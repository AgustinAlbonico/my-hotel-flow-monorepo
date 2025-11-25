/**
 * Action Controller
 * Controlador para el módulo de Actions (capa de presentación)
 * Maneja las peticiones HTTP y delega la lógica a los casos de uso
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ListActionsUseCase } from '../../application/use-cases/action/list-actions.use-case';
import { GetActionByIdUseCase } from '../../application/use-cases/action/get-action-by-id.use-case';
import { CreateActionUseCase } from '../../application/use-cases/action/create-action.use-case';
import { UpdateActionUseCase } from '../../application/use-cases/action/update-action.use-case';
import { DeleteActionUseCase } from '../../application/use-cases/action/delete-action.use-case';
import { CreateActionRequestDto } from '../dtos/action/create-action-request.dto';
import { UpdateActionRequestDto } from '../dtos/action/update-action-request.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';

@ApiTags('Actions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('actions')
export class ActionController {
  constructor(
    private readonly listActionsUseCase: ListActionsUseCase,
    private readonly getActionByIdUseCase: GetActionByIdUseCase,
    private readonly createActionUseCase: CreateActionUseCase,
    private readonly updateActionUseCase: UpdateActionUseCase,
    private readonly deleteActionUseCase: DeleteActionUseCase,
  ) {}

  @Get()
  @Actions('config.acciones.listar')
  @ApiOperation({ summary: 'List all actions' })
  async findAll() {
    return await this.listActionsUseCase.execute();
  }

  @Get(':id')
  @Actions('config.acciones.listar')
  @ApiOperation({ summary: 'Get action by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.getActionByIdUseCase.execute(id);
  }

  @Post()
  @Actions('config.acciones.crear')
  @ApiOperation({ summary: 'Create a new action' })
  async create(@Body() dto: CreateActionRequestDto) {
    return await this.createActionUseCase.execute({
      key: dto.key,
      name: dto.name,
      description: dto.description,
    });
  }

  @Patch(':id')
  @Actions('config.acciones.modificar')
  @ApiOperation({ summary: 'Update an action' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActionRequestDto,
  ) {
    return await this.updateActionUseCase.execute(id, {
      name: dto.name,
      description: dto.description,
    });
  }

  @Delete(':id')
  @Actions('config.acciones.eliminar')
  @ApiOperation({ summary: 'Delete an action' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteActionUseCase.execute(id);
  }
}
