/**
 * Group Controller
 * Controlador REST para la gestión de grupos
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
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListGroupsUseCase } from '../../application/use-cases/group/list-groups.use-case';
import { GetGroupByIdUseCase } from '../../application/use-cases/group/get-group-by-id.use-case';
import { CreateGroupUseCase } from '../../application/use-cases/group/create-group.use-case';
import { UpdateGroupUseCase } from '../../application/use-cases/group/update-group.use-case';
import { DeleteGroupUseCase } from '../../application/use-cases/group/delete-group.use-case';
import { AssignActionsToGroupUseCase } from '../../application/use-cases/group/assign-actions-to-group.use-case';
import { AssignChildrenToGroupUseCase } from '../../application/use-cases/group/assign-children-to-group.use-case';
import { GetEffectiveActionsUseCase } from '../../application/use-cases/group/get-effective-actions.use-case';
import { CreateGroupRequestDto } from '../dtos/group/create-group-request.dto';
import { UpdateGroupRequestDto } from '../dtos/group/update-group-request.dto';
import { AssignActionsRequestDto } from '../dtos/group/assign-actions-request.dto';
import { AssignChildrenRequestDto } from '../dtos/group/assign-children-request.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('groups')
export class GroupController {
  constructor(
    private readonly listGroupsUseCase: ListGroupsUseCase,
    private readonly getGroupByIdUseCase: GetGroupByIdUseCase,
    private readonly createGroupUseCase: CreateGroupUseCase,
    private readonly updateGroupUseCase: UpdateGroupUseCase,
    private readonly deleteGroupUseCase: DeleteGroupUseCase,
    private readonly assignActionsToGroupUseCase: AssignActionsToGroupUseCase,
    private readonly assignChildrenToGroupUseCase: AssignChildrenToGroupUseCase,
    private readonly getEffectiveActionsUseCase: GetEffectiveActionsUseCase,
  ) {}

  @Get()
  @Actions('config.grupos.listar')
  @ApiOperation({ summary: 'List all groups' })
  @ApiResponse({ status: 200, description: 'Groups listed successfully' })
  async listGroups() {
    return this.listGroupsUseCase.execute();
  }

  @Get(':id')
  @Actions('config.grupos.ver')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiResponse({ status: 200, description: 'Group found' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupById(@Param('id', ParseIntPipe) id: number) {
    return this.getGroupByIdUseCase.execute(id);
  }

  @Post()
  @Actions('config.grupos.crear')
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Group key already exists' })
  async createGroup(@Body() dto: CreateGroupRequestDto) {
    return this.createGroupUseCase.execute(dto);
  }

  @Patch(':id')
  @Actions('config.grupos.modificar')
  @ApiOperation({ summary: 'Update a group' })
  @ApiResponse({ status: 200, description: 'Group updated successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async updateGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupRequestDto,
  ) {
    return this.updateGroupUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Actions('config.grupos.eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group' })
  @ApiResponse({ status: 204, description: 'Group deleted successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async deleteGroup(@Param('id', ParseIntPipe) id: number) {
    await this.deleteGroupUseCase.execute(id);
  }

  @Patch(':id/actions')
  @Actions('config.grupos.asignarAcciones')
  @ApiOperation({ summary: 'Assign actions to a group' })
  @ApiResponse({ status: 200, description: 'Actions assigned successfully' })
  @ApiResponse({ status: 404, description: 'Group or action not found' })
  async assignActions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignActionsRequestDto,
  ) {
    return this.assignActionsToGroupUseCase.execute(id, dto);
  }

  @Patch(':id/children')
  @Actions('config.grupos.asignarHijos')
  @ApiOperation({ summary: 'Assign child groups to a group' })
  @ApiResponse({ status: 200, description: 'Children assigned successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid hierarchy (cycle detected)',
  })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async assignChildren(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignChildrenRequestDto,
  ) {
    return this.assignChildrenToGroupUseCase.execute(id, dto);
  }

  @Get(':id/effective-actions')
  @Actions('config.grupos.ver')
  @ApiOperation({
    summary: 'Get effective actions for a group',
    description: 'Returns all actions including inherited from child groups',
  })
  @ApiResponse({ status: 200, description: 'Effective actions retrieved' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getEffectiveActions(@Param('id', ParseIntPipe) id: number) {
    return this.getEffectiveActionsUseCase.execute(id);
  }
}
