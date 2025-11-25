import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActionsGuard } from '../guards/actions.guard';
import { Actions } from '../decorators/actions.decorator';
import { GetAccountStatementUseCase } from '../../application/use-cases/account/get-account-statement.use-case';

/**
 * Account Statements Controller
 * Controlador para obtener estados de cuenta de clientes
 */
@Controller('account-statements')
@UseGuards(JwtAuthGuard, ActionsGuard)
export class AccountStatementsController {
  constructor(
    private readonly getAccountStatementUseCase: GetAccountStatementUseCase,
  ) {}

  /**
   * Obtener estado de cuenta de un cliente
   * GET /account-statements/client/:clientId
   */
  @Get('client/:clientId')
  @Actions('cuentaCorriente.ver')
  async getAccountStatement(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 50,
  ) {
    const accountStatement = await this.getAccountStatementUseCase.execute(
      clientId,
      page,
      limit,
    );

    // Envolvemos el resultado en `data` y exponemos la paginación en el nivel raíz
    // para que el TransformInterceptor pueda detectar paginación y el frontend
    // reciba directamente un `AccountStatementResponse`.
    return {
      data: accountStatement,
      pagination: accountStatement.pagination,
    };
  }
}
