/**
 * Tests para AccountStatementsController
 * Verifica que el controlador envuelva el resultado en la propiedad `data`
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AccountStatementsController } from './account-statements.controller';
import { GetAccountStatementUseCase } from '../../application/use-cases/account/get-account-statement.use-case';

describe('AccountStatementsController', () => {
  let controller: AccountStatementsController;
  let useCase: GetAccountStatementUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountStatementsController],
      providers: [
        {
          provide: GetAccountStatementUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AccountStatementsController>(
      AccountStatementsController,
    );
    useCase = module.get<GetAccountStatementUseCase>(GetAccountStatementUseCase);
  });

  it('debería envolver el resultado del use case en la propiedad data', async () => {
    const mockResult = {
      client: {
        id: 1,
        name: 'Juan Pérez',
        dni: '12345678',
        email: 'juan@example.com',
      },
      currentBalance: 1000,
      movements: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    jest.spyOn(useCase, 'execute').mockResolvedValueOnce(mockResult as never);

    const response = await controller.getAccountStatement(1, 1, 20);

    expect(useCase.execute).toHaveBeenCalledWith(1, 1, 20);
    expect(response).toEqual({
      data: mockResult,
      pagination: mockResult.pagination,
    });
  });
});


