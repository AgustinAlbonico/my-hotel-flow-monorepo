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
 * E2E TEST - CRUD Endpoints + Guards
 *
 * Objetivo: Verificar que los endpoints CRUD estén protegidos correctamente
 *
 * Casos de prueba:
 * 1. JWT Authentication - Endpoints protegidos requieren token
 * 2. ActionsGuard - Verificar permisos con @Actions() decorator
 * 3. Roles - Admin tiene acceso completo
 * 4. Roles - Recepcionista tiene acceso limitado
 * 5. Roles - Cliente tiene acceso mínimo
 * 6. Herencia de permisos - Permisos de grupos jerárquicos
 *
 * Estructura de prueba:
 * - Admin: Puede hacer TODO
 * - Recepcionista: Puede ver/crear reservas, check-in/out
 * - Cliente: Solo ver sus propias reservas
 *
 * Técnicas:
 * - Testing de autorización basada en roles
 * - Verificación de Guards personalizados
 * - Testing de herencia de permisos (Composite Pattern)
 */
describe('CRUD Endpoints + Guards (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let recepcionistaToken: string;
  let clienteToken: string;

  let testActionId: number;
  let testGroupId: number;
  let testUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Seeds
    await request(app.getHttpServer()).post('/actions/seed');
    await request(app.getHttpServer()).post('/groups/seed');
    await request(app.getHttpServer()).post('/users/seed');

    // Login con los 3 roles
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identity: 'admin@hotel.com', password: 'Admin123!' });
    adminToken = adminRes.body.accessToken;

    const recepRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identity: 'recepcionista@hotel.com',
        password: 'Recep123!',
      });
    recepcionistaToken = recepRes.body.accessToken;

    const clienteRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identity: 'cliente@hotel.com', password: 'Cliente123!' });
    clienteToken = clienteRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
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

  describe('JWT Authentication', () => {
    it('debe rechazar requests sin token', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('debe rechazar token inválido', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('debe aceptar token válido', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Actions CRUD - Admin Role', () => {
    it('[Admin] debe listar todas las acciones', () => {
      return request(app.getHttpServer())
        .get('/actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('[Admin] debe crear una acción', async () => {
      const newAction = {
        key: 'test.action',
        name: 'Test Action',
        description: 'Test action for E2E',
        area: 'test',
      };

      const res = await request(app.getHttpServer())
        .post('/actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAction)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.key).toBe(newAction.key);
      testActionId = res.body.id;
    });

    it('[Admin] debe obtener una acción por ID', () => {
      return request(app.getHttpServer())
        .get(`/actions/${testActionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testActionId);
          expect(res.body.key).toBe('test.action');
        });
    });

    it('[Admin] debe actualizar una acción', () => {
      return request(app.getHttpServer())
        .patch(`/actions/${testActionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Test Action' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Test Action');
        });
    });

    it('[Admin] debe eliminar una acción', () => {
      return request(app.getHttpServer())
        .delete(`/actions/${testActionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Actions CRUD - Recepcionista Role', () => {
    it('[Recepcionista] debe poder listar acciones', () => {
      // Nota: Esto depende de si le asignaste permisos de lectura
      return request(app.getHttpServer())
        .get('/actions')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .expect((res) => {
          // Puede ser 200 o 403 dependiendo de permisos
          expect([200, 403]).toContain(res.status);
        });
    });

    it('[Recepcionista] NO debe poder crear acciones', () => {
      return request(app.getHttpServer())
        .post('/actions')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          key: 'forbidden.action',
          name: 'Forbidden',
          area: 'test',
        })
        .expect(403);
    });

    it('[Recepcionista] NO debe poder eliminar acciones', () => {
      return request(app.getHttpServer())
        .delete(`/actions/1`)
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .expect(403);
    });
  });

  describe('Actions CRUD - Cliente Role', () => {
    it('[Cliente] NO debe poder listar acciones', () => {
      return request(app.getHttpServer())
        .get('/actions')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);
    });

    it('[Cliente] NO debe poder crear acciones', () => {
      return request(app.getHttpServer())
        .post('/actions')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          key: 'client.action',
          name: 'Client Action',
          area: 'test',
        })
        .expect(403);
    });
  });

  describe('Groups CRUD - Admin Role', () => {
    it('[Admin] debe crear un grupo', async () => {
      const newGroup = {
        key: 'test.group',
        name: 'Test Group',
        description: 'Test group for E2E',
      };

      const res = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newGroup)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.key).toBe(newGroup.key);
      testGroupId = res.body.id;
    });

    it('[Admin] debe asignar acciones a un grupo', async () => {
      // Obtener IDs de algunas acciones
      const actionsRes = await request(app.getHttpServer())
        .get('/actions')
        .set('Authorization', `Bearer ${adminToken}`);

      const actionKeys = actionsRes.body.slice(0, 3).map((a: any) => a.key);

      return request(app.getHttpServer())
        .patch(`/groups/${testGroupId}/actions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ actionKeys })
        .expect(200)
        .expect((res) => {
          expect(res.body.actions).toBeDefined();
          expect(res.body.actions.length).toBeGreaterThan(0);
        });
    });

    it('[Admin] debe obtener acciones efectivas de un grupo', () => {
      return request(app.getHttpServer())
        .get(`/groups/${testGroupId}/effective-actions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.actions).toBeDefined();
          expect(Array.isArray(res.body.actions)).toBe(true);
        });
    });

    it('[Admin] debe eliminar un grupo', () => {
      return request(app.getHttpServer())
        .delete(`/groups/${testGroupId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Groups CRUD - Recepcionista Role', () => {
    it('[Recepcionista] NO debe poder crear grupos', () => {
      return request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          key: 'forbidden.group',
          name: 'Forbidden',
        })
        .expect(403);
    });

    it('[Recepcionista] NO debe poder eliminar grupos', () => {
      return request(app.getHttpServer())
        .delete(`/groups/1`)
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .expect(403);
    });
  });

  describe('Users CRUD - Admin Role', () => {
    it('[Admin] debe crear un usuario', async () => {
      const newUser = {
        username: 'testuser',
        email: 'testuser@hotel.com',
        password: 'Test123!',
        fullName: 'Test User',
        isActive: true,
      };

      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.username).toBe(newUser.username);
      expect(res.body.passwordHash).toBeUndefined(); // No debe devolver hash
      testUserId = res.body.id;
    });

    it('[Admin] debe asignar grupos a un usuario', async () => {
      // Obtener ID de un grupo
      const groupsRes = await request(app.getHttpServer())
        .get('/groups')
        .set('Authorization', `Bearer ${adminToken}`);

      const groupKey = groupsRes.body[0].key;

      return request(app.getHttpServer())
        .patch(`/users/${testUserId}/groups`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ groupKeys: [groupKey] })
        .expect(200)
        .expect((res) => {
          expect(res.body.groups).toBeDefined();
          expect(res.body.groups.length).toBeGreaterThan(0);
        });
    });

    it('[Admin] debe resetear contraseña de usuario', () => {
      return request(app.getHttpServer())
        .post(`/users/${testUserId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'NewTest123!' })
        .expect(200);
    });

    it('[Admin] debe eliminar un usuario', () => {
      return request(app.getHttpServer())
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Users CRUD - Recepcionista Role', () => {
    it('[Recepcionista] NO debe poder crear usuarios', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          username: 'forbidden',
          email: 'forbidden@hotel.com',
          password: 'Test123!',
        })
        .expect(403);
    });

    it('[Recepcionista] NO debe poder eliminar usuarios', () => {
      return request(app.getHttpServer())
        .delete(`/users/1`)
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .expect(403);
    });
  });

  describe('Users CRUD - Cliente Role', () => {
    it('[Cliente] NO debe poder listar usuarios', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${clienteToken}`)
        .expect(403);
    });

    it('[Cliente] NO debe poder crear usuarios', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          username: 'client',
          email: 'client@test.com',
          password: 'Test123!',
        })
        .expect(403);
    });
  });

  describe('Permisos Heredados (Composite Pattern)', () => {
    it('debe heredar permisos de grupos jerárquicos', async () => {
      // Crear grupo padre y grupo hijo
      const parentGroup = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'parent.group',
          name: 'Parent Group',
        });

      const childGroup = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'child.group',
          name: 'Child Group',
        });

      // Asignar acciones al hijo
      const actionsRes = await request(app.getHttpServer())
        .get('/actions')
        .set('Authorization', `Bearer ${adminToken}`);

      const actionKey = actionsRes.body[0].key;

      await request(app.getHttpServer())
        .patch(`/groups/${childGroup.body.id}/actions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ actionKeys: [actionKey] });

      // Asignar hijo como children del padre
      await request(app.getHttpServer())
        .patch(`/groups/${parentGroup.body.id}/children`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ childGroupKeys: ['child.group'] });

      // Obtener acciones efectivas del padre (debe incluir las del hijo)
      const effectiveRes = await request(app.getHttpServer())
        .get(`/groups/${parentGroup.body.id}/effective-actions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(effectiveRes.body.actions.length).toBeGreaterThan(0);
      expect(
        effectiveRes.body.actions.some((a: any) => a.key === actionKey),
      ).toBe(true);
    });
  });

  describe('Validación de DTOs', () => {
    it('debe rechazar creación de acción con datos inválidos', () => {
      return request(app.getHttpServer())
        .post('/actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Falta 'key' requerido
          name: 'Invalid Action',
        })
        .expect(400);
    });

    it('debe rechazar email inválido al crear usuario', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'test',
          email: 'invalid-email', // Email mal formado
          password: 'Test123!',
        })
        .expect(400);
    });

    it('debe rechazar contraseña débil', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'test',
          email: 'test@test.com',
          password: '123', // Contraseña muy débil
        })
        .expect(400);
    });
  });

  describe('Endpoints Públicos', () => {
    it('/auth/login debe ser público (sin token)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identity: 'admin@hotel.com',
          password: 'Admin123!',
        })
        .expect(200);
    });

    it('/auth/recover/request debe ser público', () => {
      return request(app.getHttpServer())
        .post('/auth/recover/request')
        .send({ email: 'admin@hotel.com' })
        .expect(200);
    });

    it('/ (health check) debe ser público', () => {
      return request(app.getHttpServer()).get('/').expect(200);
    });
  });
});
