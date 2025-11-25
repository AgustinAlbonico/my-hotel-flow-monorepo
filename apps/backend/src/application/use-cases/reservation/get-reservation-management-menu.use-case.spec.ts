/**
 * Test: GetReservationManagementMenuUseCase
 * Verifica que el caso de uso filtre correctamente las opciones según permisos
 */
import { Test, TestingModule } from '@nestjs/testing';
import { GetReservationManagementMenuUseCase } from './get-reservation-management-menu.use-case';
import { AuthorizationService } from '../../../presentation/services/authorization.service';

describe('GetReservationManagementMenuUseCase', () => {
  let useCase: GetReservationManagementMenuUseCase;
  let authorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(async () => {
    // Mock del AuthorizationService
    const mockAuthorizationService = {
      hasAllActions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetReservationManagementMenuUseCase,
        {
          provide: AuthorizationService,
          useValue: mockAuthorizationService,
        },
      ],
    }).compile();

    useCase = module.get<GetReservationManagementMenuUseCase>(
      GetReservationManagementMenuUseCase,
    );
    authorizationService = module.get(AuthorizationService);
  });

  it('debe estar definido', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('debe retornar 5 opciones del menú', async () => {
      // Arrange: El usuario tiene todos los permisos
      authorizationService.hasAllActions.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(1);

      // Assert
      expect(result.totalOptions).toBe(5);
      expect(result.options).toHaveLength(5);
      expect(result.options[0]).toHaveProperty('key');
      expect(result.options[0]).toHaveProperty('label');
      expect(result.options[0]).toHaveProperty('isAvailable');
    });

    it('debe marcar opciones como disponibles si el usuario tiene permisos', async () => {
      // Arrange: El usuario tiene todos los permisos
      authorizationService.hasAllActions.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(1);

      // Assert
      expect(result.availableOptions).toBe(5);
      expect(result.options.every((opt) => opt.isAvailable)).toBe(true);
    });

    it('debe marcar opciones como NO disponibles si el usuario NO tiene permisos', async () => {
      // Arrange: El usuario NO tiene ningún permiso
      authorizationService.hasAllActions.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(1);

      // Assert
      expect(result.availableOptions).toBe(0);
      expect(result.options.every((opt) => !opt.isAvailable)).toBe(true);
    });

    it('debe retornar solo algunas opciones disponibles según permisos selectivos', async () => {
      // Arrange: El usuario tiene solo algunos permisos
      authorizationService.hasAllActions.mockImplementation(
        (_userId: number, actions: string[]) => {
          const allowedActions = ['reservas.crear', 'reservas.ver'];
          return Promise.resolve(allowedActions.includes(actions[0]));
        },
      );

      // Act
      const result = await useCase.execute(1);

      // Assert
      expect(result.totalOptions).toBe(5);
      expect(result.availableOptions).toBe(2);

      // Verificar que 'create' y 'search' estén disponibles
      const createOption = result.options.find((opt) => opt.key === 'create');
      const searchOption = result.options.find((opt) => opt.key === 'search');
      const cancelOption = result.options.find((opt) => opt.key === 'cancel');

      expect(createOption?.isAvailable).toBe(true);
      expect(searchOption?.isAvailable).toBe(true);
      expect(cancelOption?.isAvailable).toBe(false);
    });

    it('debe incluir todas las propiedades requeridas en cada opción', async () => {
      // Arrange
      authorizationService.hasAllActions.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(1);

      // Assert
      const option = result.options[0];
      expect(option).toHaveProperty('key');
      expect(option).toHaveProperty('label');
      expect(option).toHaveProperty('description');
      expect(option).toHaveProperty('icon');
      expect(option).toHaveProperty('path');
      expect(option).toHaveProperty('requiredAction');
      expect(option).toHaveProperty('isAvailable');

      expect(typeof option.key).toBe('string');
      expect(typeof option.label).toBe('string');
      expect(typeof option.description).toBe('string');
      expect(typeof option.icon).toBe('string');
      expect(typeof option.path).toBe('string');
      expect(typeof option.requiredAction).toBe('string');
      expect(typeof option.isAvailable).toBe('boolean');
    });

    it('debe llamar a authorizationService.hasAllActions para cada opción', async () => {
      // Arrange
      authorizationService.hasAllActions.mockResolvedValue(true);

      // Act
      await useCase.execute(1);

      // Assert: Debe haber llamado 5 veces (una por cada opción del menú)
      // eslint-disable-next-line @typescript-eslint/unbound-method -- es un mock de jest
      expect(authorizationService.hasAllActions).toHaveBeenCalledTimes(5);
    });
  });
});
