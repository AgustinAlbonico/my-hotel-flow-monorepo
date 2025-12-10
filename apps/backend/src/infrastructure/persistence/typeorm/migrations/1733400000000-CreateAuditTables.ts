import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditTables1733400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const auditLogExists = await queryRunner.hasTable('reservation_audit_log');
    const userSessionsExists = await queryRunner.hasTable('user_sessions');
    const userActivityLogExists = await queryRunner.hasTable('user_activity_log');

    // Crear tabla reservation_audit_log solo si no existe
    if (!auditLogExists) {
    await queryRunner.createTable(
      new Table({
        name: 'reservation_audit_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'reservationId',
            type: 'int',
          },
          {
            name: 'actionType',
            type: 'enum',
            enum: [
              'CREATE',
              'UPDATE',
              'STATUS_CHANGE',
              'DELETE',
              'MODIFY_DATES',
              'MODIFY_AMOUNT',
              'CHECK_IN',
              'CHECK_OUT',
              'CANCEL',
            ],
          },
          {
            name: 'fieldChanged',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'oldValue',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'newValue',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'changeReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'changedByUserId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'changedByUsername',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'changedBySystem',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'changedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear foreign key para reservationId
    await queryRunner.query(`
      ALTER TABLE reservation_audit_log
      ADD CONSTRAINT fk_reservation_audit_reservation
      FOREIGN KEY ("reservationId") REFERENCES reservations(id)
      ON DELETE CASCADE
    `);

    // Crear foreign key para changedByUserId
    await queryRunner.query(`
      ALTER TABLE reservation_audit_log
      ADD CONSTRAINT fk_reservation_audit_user
      FOREIGN KEY ("changedByUserId") REFERENCES users(id)
      ON DELETE SET NULL
    `);

    // Crear índices
    await queryRunner.createIndex(
      'reservation_audit_log',
      new TableIndex({
        name: 'IDX_reservation_audit_reservationId',
        columnNames: ['reservationId'],
      }),
    );

    await queryRunner.createIndex(
      'reservation_audit_log',
      new TableIndex({
        name: 'IDX_reservation_audit_changedAt',
        columnNames: ['changedAt'],
      }),
    );

    await queryRunner.createIndex(
      'reservation_audit_log',
      new TableIndex({
        name: 'IDX_reservation_audit_changedByUserId',
        columnNames: ['changedByUserId'],
      }),
    );
    }

    // Crear tabla user_sessions solo si no existe
    if (!userSessionsExists) {
    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'loginAt',
            type: 'timestamp',
          },
          {
            name: 'loginIp',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'loginUserAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'loginLocation',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'logoutAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'logoutType',
            type: 'enum',
            enum: ['MANUAL', 'AUTO', 'EXPIRED', 'FORCED'],
            isNullable: true,
          },
          {
            name: 'sessionToken',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'refreshToken',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true,
    );

    // Crear foreign key para userId
    await queryRunner.query(`
      ALTER TABLE user_sessions
      ADD CONSTRAINT fk_user_sessions_user
      FOREIGN KEY ("userId") REFERENCES users(id)
      ON DELETE CASCADE
    `);

    // Crear índices para user_sessions
    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_sessions_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_sessions_loginAt',
        columnNames: ['loginAt'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_user_sessions_isActive',
        columnNames: ['isActive'],
      }),
    );
    }

    // Crear tabla user_activity_log solo si no existe
    if (!userActivityLogExists) {
    await queryRunner.createTable(
      new Table({
        name: 'user_activity_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sessionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'int',
          },
          {
            name: 'activityType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'activityDescription',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'endpoint',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'httpMethod',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'requestParams',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'responseStatus',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'responseTimeMs',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'activityAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear foreign keys para user_activity_log
    await queryRunner.query(`
      ALTER TABLE user_activity_log
      ADD CONSTRAINT fk_user_activity_user
      FOREIGN KEY ("userId") REFERENCES users(id)
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE user_activity_log
      ADD CONSTRAINT fk_user_activity_session
      FOREIGN KEY ("sessionId") REFERENCES user_sessions(id)
      ON DELETE SET NULL
    `);

    // Crear índices para user_activity_log
    await queryRunner.createIndex(
      'user_activity_log',
      new TableIndex({
        name: 'IDX_user_activity_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity_log',
      new TableIndex({
        name: 'IDX_user_activity_sessionId',
        columnNames: ['sessionId'],
      }),
    );

    await queryRunner.createIndex(
      'user_activity_log',
      new TableIndex({
        name: 'IDX_user_activity_activityAt',
        columnNames: ['activityAt'],
      }),
    );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas en orden inverso
    await queryRunner.dropTable('user_activity_log', true);
    await queryRunner.dropTable('user_sessions', true);
    await queryRunner.dropTable('reservation_audit_log', true);
  }
}
