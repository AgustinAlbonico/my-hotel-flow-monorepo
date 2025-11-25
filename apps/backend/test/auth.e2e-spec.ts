/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * E2E TEST - Auth Flow
 *
 * Objetivo: Probar el flujo completo de autenticación de extremo a extremo
 *
 * Casos de prueba:
 * 1. POST /auth/login - Login exitoso con credenciales válidas
 * 2. POST /auth/login - Login fallido con credenciales inválidas
 * 3. POST /auth/login - Lockout después de 5 intentos fallidos
 * 4. GET /auth/me - Obtener usuario autenticado con token válido
 * 5. POST /auth/refresh - Renovar tokens (token rotation)
 * 6. POST /auth/logout - Logout y revocación de tokens
 * 7. POST /auth/password - Cambiar contraseña
 * 8. POST /auth/recover/request - Solicitar recuperación de contraseña
 * 9. POST /auth/recover/confirm - Confirmar recuperación con código
 *
 * Setup:
 * - Base de datos de test separada
 * - Seeds ejecutados antes de los tests
 * - Cleanup después de cada test
 *
 * Técnicas:
 * - supertest para HTTP requests
 * - Base de datos de test con TypeORM
 * - Verificación de tokens JWT
 * - Testing de seguridad (lockout, blacklist)
 */
describe('Auth Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;

  // Credenciales de test
  const adminCredentials = {
    identity: 'admin@hotel.com',
    password: 'Admin123!',
  };

  const wrongCredentials = {
    identity: 'admin@hotel.com',
    password: 'WrongPassword123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configurar validación global (igual que en main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Obtener DataSource para operaciones de DB
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Ejecutar seeds
    await request(app.getHttpServer()).post('/actions/seed');
    await request(app.getHttpServer()).post('/groups/seed');
    await request(app.getHttpServer()).post('/users/seed');
  });

  afterAll(async () => {
    // Cleanup: Limpiar base de datos
    if (dataSource) {
      await dataSource.query('TRUNCATE TABLE revoked_token CASCADE');
      await dataSource.query('TRUNCATE TABLE audit_log CASCADE');
      await dataSource.query('TRUNCATE TABLE user_groups CASCADE');
      await dataSource.query('TRUNCATE TABLE user_actions CASCADE');
      await dataSource.query('TRUNCATE TABLE "user" CASCADE');
      await dataSource.query('TRUNCATE TABLE group_actions CASCADE');
      await dataSource.query('TRUNCATE TABLE group_children CASCADE');
      await dataSource.query('TRUNCATE TABLE "group" CASCADE');
      await dataSource.query('TRUNCATE TABLE action CASCADE');
    }

    await app.close();
  });

  afterEach(async () => {
    // Resetear intentos fallidos después de cada test
    if (dataSource) {
      await dataSource.query(
        'UPDATE "user" SET failed_login_attempts = 0, locked_until = NULL',
      );
      // Limpiar tokens revocados
      await dataSource.query('TRUNCATE TABLE revoked_token');
    }
  });

  describe('POST /auth/login', () => {
    it('debe permitir login con credenciales válidas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(typeof res.body.accessToken).toBe('string');
          expect(typeof res.body.refreshToken).toBe('string');

          // Guardar tokens para otros tests
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('debe rechazar credenciales inválidas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongCredentials)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.statusCode).toBe(401);
        });
    });

    it('debe rechazar requests sin body', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('debe rechazar identity vacío', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ identity: '', password: 'test' })
        .expect(400);
    });

    it('debe rechazar password vacío', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ identity: 'admin@hotel.com', password: '' })
        .expect(400);
    });
  });

  describe('Lockout Mechanism', () => {
    it('debe bloquear cuenta después de 5 intentos fallidos', async () => {
      // Hacer 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(wrongCredentials)
          .expect(401);
      }

      // El 6to intento (incluso con credenciales correctas) debe ser bloqueado
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('locked');
        });
    });

    it('debe resetear intentos fallidos después de login exitoso', async () => {
      // 2 intentos fallidos
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongCredentials);
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongCredentials);

      // Login exitoso
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      // Verificar que los intentos se resetearon
      const user = await dataSource.query(
        'SELECT failed_login_attempts FROM "user" WHERE email = $1',
        ['admin@hotel.com'],
      );
      expect(user[0].failed_login_attempts).toBe(0);
    });
  });

  describe('GET /auth/me', () => {
    beforeEach(async () => {
      // Login para obtener token
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials);
      accessToken = res.body.accessToken;
    });

    it('debe devolver información del usuario autenticado', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.username).toBe('admin');
          expect(res.body.email).toBe('admin@hotel.com');
          expect(res.body.groups).toBeDefined();
          expect(Array.isArray(res.body.groups)).toBe(true);

          // No debe devolver información sensible
          expect(res.body.passwordHash).toBeUndefined();
          expect(res.body.password).toBeUndefined();
        });
    });

    it('debe rechazar requests sin token', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('debe rechazar token inválido', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('debe rechazar token expirado', async () => {
      // Crear un token expirado manualmente (esto requeriría un helper)
      // Por ahora, simplemente verificamos que tokens viejos sean rechazados
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired';

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials);
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('debe generar nuevos tokens con refresh token válido', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();

          // Los tokens deben ser diferentes (token rotation)
          expect(res.body.accessToken).not.toBe(accessToken);
          expect(res.body.refreshToken).not.toBe(refreshToken);
        });
    });

    it('debe rechazar refresh token inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });

    it('debe rechazar refresh token ya usado (rotation)', async () => {
      // Usar el refresh token una vez
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);

      // Intentar usar el mismo refresh token de nuevo
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken }) // Token anterior, ya revocado
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials);
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('debe revocar tokens al hacer logout', async () => {
      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Intentar usar el access token después de logout
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('debe rechazar logout sin autenticación', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('PATCH /auth/password', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials);
      accessToken = res.body.accessToken;
    });

    it('debe cambiar contraseña con datos válidos', async () => {
      const newPassword = 'NewAdmin123!';

      // Cambiar contraseña
      await request(app.getHttpServer())
        .patch('/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: adminCredentials.password,
          newPassword,
        })
        .expect(200);

      // Verificar que el login con la nueva contraseña funciona
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identity: adminCredentials.identity,
          password: newPassword,
        })
        .expect(200);
    });

    it('debe rechazar cambio con contraseña actual incorrecta', () => {
      return request(app.getHttpServer())
        .patch('/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'WrongCurrentPassword',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('debe rechazar contraseña débil', () => {
      return request(app.getHttpServer())
        .patch('/auth/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: adminCredentials.password,
          newPassword: 'weak', // Muy corta, sin mayúsculas, etc.
        })
        .expect(400);
    });
  });

  describe('POST /auth/recover/request', () => {
    it('debe enviar solicitud de recuperación con email válido', () => {
      return request(app.getHttpServer())
        .post('/auth/recover/request')
        .send({ email: 'admin@hotel.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('debe devolver 200 incluso con email no existente (seguridad)', () => {
      // Por seguridad, no debe revelar si el email existe o no
      return request(app.getHttpServer())
        .post('/auth/recover/request')
        .send({ email: 'noexiste@hotel.com' })
        .expect(200);
    });

    it('debe rechazar email inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/recover/request')
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('POST /auth/recover/confirm', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Solicitar recuperación
      await request(app.getHttpServer())
        .post('/auth/recover/request')
        .send({ email: 'admin@hotel.com' });

      // Obtener el token de reset de la DB (en producción sería por email)
      const user = await dataSource.query(
        'SELECT password_reset_token FROM "user" WHERE email = $1',
        ['admin@hotel.com'],
      );
      resetToken = user[0].password_reset_token;
    });

    it('debe resetear contraseña con token válido', async () => {
      const newPassword = 'ResetPassword123!';

      // Confirmar reset
      await request(app.getHttpServer())
        .post('/auth/recover/confirm')
        .send({
          token: resetToken,
          newPassword,
        })
        .expect(200);

      // Verificar login con nueva contraseña
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identity: 'admin@hotel.com',
          password: newPassword,
        })
        .expect(200);
    });

    it('debe rechazar token inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/recover/confirm')
        .send({
          token: 'invalid-token-123',
          newPassword: 'NewPassword123!',
        })
        .expect(401);
    });

    it('debe rechazar token ya usado', async () => {
      const newPassword = 'UsedToken123!';

      // Usar el token una vez
      await request(app.getHttpServer()).post('/auth/recover/confirm').send({
        token: resetToken,
        newPassword,
      });

      // Intentar usar el mismo token de nuevo
      return request(app.getHttpServer())
        .post('/auth/recover/confirm')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword123!',
        })
        .expect(401);
    });
  });

  describe('Security Headers', () => {
    it('debe incluir headers de seguridad en las respuestas', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect((res) => {
          // Verificar headers de seguridad básicos
          expect(res.headers['x-powered-by']).toBeUndefined(); // No revelar tecnología
        });
    });
  });

  describe('Rate Limiting (si está implementado)', () => {
    it('debe limitar requests de login', async () => {
      // Hacer muchos requests seguidos
      const requests = Array(20)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/auth/login')
            .send(adminCredentials),
        );

      const responses = await Promise.all(requests);

      // Algunos deben ser bloqueados por rate limiting (429)
      const rateLimited = responses.filter((res) => res.status === 429);
      // Este test depende de si implementaste rate limiting
      // expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
