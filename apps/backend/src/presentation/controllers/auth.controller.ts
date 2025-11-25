import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/auth/change-password.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordWithTokenUseCase } from '../../application/use-cases/auth/reset-password-with-token.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/user/get-user-by-id.use-case';
import { GetInheritedActionsUseCase } from '../../application/use-cases/user/get-inherited-actions.use-case';
import { LoginRequestDto } from '../dtos/auth/login-request.dto';
import { RefreshTokenRequestDto } from '../dtos/auth/refresh-token-request.dto';
import { ChangePasswordRequestDto } from '../dtos/auth/change-password-request.dto';
import { ForgotPasswordRequestDto } from '../dtos/auth/forgot-password-request.dto';
import { ResetPasswordWithTokenRequestDto } from '../dtos/auth/reset-password-with-token-request.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordWithTokenUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getInheritedActionsUseCase: GetInheritedActionsUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with username/email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  async login(@Body() dto: LoginRequestDto) {
    return await this.loginUseCase.execute({
      username: dto.identity,
      password: dto.password,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return await this.getUserByIdUseCase.execute(userId);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obtener permisos (acciones) del usuario autenticado',
    description:
      'Retorna un array de strings con las keys de las acciones heredadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de permisos del usuario',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getPermissions(@Req() req: any): Promise<string[]> {
    const userId = req.user?.id || req.user?.sub;
    const actions = await this.getInheritedActionsUseCase.execute(userId);
    // Retornar solo las keys de las acciones
    return actions.map((action) => action.key);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refreshToken(@Body() dto: RefreshTokenRequestDto) {
    return await this.refreshTokenUseCase.execute({
      refreshToken: dto.refreshToken,
    });
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambiar contraseña (requiere autenticación)' })
  @ApiResponse({ status: 204, description: 'Contraseña cambiada' })
  @ApiResponse({
    status: 401,
    description: 'Contraseña actual incorrecta o no autenticado',
  })
  async changePassword(@Body() dto: ChangePasswordRequestDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    await this.changePasswordUseCase.execute(userId, {
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Token de recuperación generado' })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    return await this.forgotPasswordUseCase.execute({
      email: dto.email,
    });
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  @ApiResponse({ status: 204, description: 'Contraseña reseteada' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() dto: ResetPasswordWithTokenRequestDto) {
    await this.resetPasswordUseCase.execute({
      token: dto.token,
      newPassword: dto.newPassword,
    });
  }
}
