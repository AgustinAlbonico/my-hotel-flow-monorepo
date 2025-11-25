/**
 * User Controller
 * Controlador REST para la gestión de usuarios
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { ListUsersUseCase } from '../../application/use-cases/user/list-users.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/user/get-user-by-id.use-case';
import { CreateUserUseCase } from '../../application/use-cases/user/create-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/user/delete-user.use-case';
import { AssignGroupsToUserUseCase } from '../../application/use-cases/user/assign-groups-to-user.use-case';
import { AssignActionsToUserUseCase } from '../../application/use-cases/user/assign-actions-to-user.use-case';
import { GetInheritedActionsUseCase } from '../../application/use-cases/user/get-inherited-actions.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/user/reset-password.use-case';
import { CreateUserRequestDto } from '../dtos/user/create-user-request.dto';
import { UpdateUserRequestDto } from '../dtos/user/update-user-request.dto';
import { AssignGroupsRequestDto } from '../dtos/user/assign-groups-request.dto';
import { AssignActionsRequestDto } from '../dtos/user/assign-actions-request.dto';
import { ResetPasswordRequestDto } from '../dtos/user/reset-password-request.dto';
import { ListUsersQueryDto } from '../dtos/user/list-users-query.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActionsGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly assignGroupsToUserUseCase: AssignGroupsToUserUseCase,
    private readonly assignActionsToUserUseCase: AssignActionsToUserUseCase,
    private readonly getInheritedActionsUseCase: GetInheritedActionsUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Get()
  @Actions('config.usuarios.listar')
  @ApiOperation({ summary: 'List all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Users listed successfully' })
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.listUsersUseCase.execute(query);
  }

  @Get(':id')
  @Actions('config.usuarios.ver')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.getUserByIdUseCase.execute(id);
  }

  @Post()
  @Actions('config.usuarios.crear')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async createUser(@Body() dto: CreateUserRequestDto) {
    return this.createUserUseCase.execute(dto);
  }

  @Patch(':id')
  @Actions('config.usuarios.modificar')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRequestDto,
  ) {
    return this.updateUserUseCase.execute(id, dto);
  }

  @Delete(':id')
  @Actions('config.usuarios.eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.deleteUserUseCase.execute(id);
  }

  @Patch(':id/groups')
  @Actions('config.usuarios.asignarGrupos')
  @ApiOperation({ summary: 'Assign groups to a user' })
  @ApiResponse({ status: 200, description: 'Groups assigned successfully' })
  @ApiResponse({ status: 404, description: 'User or group not found' })
  async assignGroups(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignGroupsRequestDto,
  ) {
    return this.assignGroupsToUserUseCase.execute(id, dto);
  }

  @Patch(':id/actions')
  @Actions('config.usuarios.asignarAcciones')
  @ApiOperation({ summary: 'Assign direct actions to a user' })
  @ApiResponse({ status: 200, description: 'Actions assigned successfully' })
  @ApiResponse({ status: 404, description: 'User or action not found' })
  async assignActions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignActionsRequestDto,
  ) {
    return this.assignActionsToUserUseCase.execute(id, dto);
  }

  @Get(':id/inherited-actions')
  @Actions('config.usuarios.ver')
  @ApiOperation({
    summary: 'Get inherited actions for a user',
    description:
      'Returns all actions including direct and inherited from groups',
  })
  @ApiResponse({ status: 200, description: 'Inherited actions retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getInheritedActions(@Param('id', ParseIntPipe) id: number) {
    return this.getInheritedActionsUseCase.execute(id);
  }

  @Post(':id/reset-password')
  @Actions('config.usuarios.resetearPassword')
  @ApiOperation({ summary: 'Reset user password (admin action)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordRequestDto,
  ) {
    return this.resetPasswordUseCase.execute(id, dto);
  }
}
