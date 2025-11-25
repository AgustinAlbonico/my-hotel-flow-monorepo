import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateReservationTables1730394000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla clients
    await queryRunner.createTable(
      new Table({
        name: 'clients',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'dni',
            type: 'varchar',
            length: '8',
            isUnique: true,
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'apellido',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'telefono',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla rooms
    await queryRunner.createTable(
      new Table({
        name: 'rooms',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'numeroHabitacion',
            type: 'varchar',
            length: '10',
            isUnique: true,
          },
          {
            name: 'tipo',
            type: 'enum',
            enum: ['ESTANDAR', 'SUITE', 'FAMILIAR'],
          },
          {
            name: 'estado',
            type: 'enum',
            enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'OUT_OF_SERVICE'],
            default: "'AVAILABLE'",
          },
          {
            name: 'capacidad',
            type: 'int',
          },
          {
            name: 'precioPorNoche',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'descripcion',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'caracteristicas',
            type: 'text',
            default: "''",
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla reservations
    await queryRunner.createTable(
      new Table({
        name: 'reservations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'clientId',
            type: 'int',
          },
          {
            name: 'roomId',
            type: 'int',
          },
          {
            name: 'checkIn',
            type: 'date',
          },
          {
            name: 'checkOut',
            type: 'date',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['CONFIRMED', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED'],
            default: "'CONFIRMED'",
          },
          {
            name: 'cancelReason',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear foreign key: reservations -> clients
    await queryRunner.createForeignKey(
      'reservations',
      new TableForeignKey({
        columnNames: ['clientId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Crear foreign key: reservations -> rooms
    await queryRunner.createForeignKey(
      'reservations',
      new TableForeignKey({
        columnNames: ['roomId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'rooms',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    // Crear índices para mejorar performance
    await queryRunner.query(
      'CREATE INDEX idx_reservations_dates ON reservations (checkIn, checkOut)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_reservations_status ON reservations (status)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_rooms_tipo_estado ON rooms (tipo, estado)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_rooms_tipo_estado ON rooms',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_reservations_status ON reservations',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_reservations_dates ON reservations',
    );

    // Eliminar foreign keys primero
    const reservationsTable = await queryRunner.getTable('reservations');
    if (reservationsTable) {
      const foreignKeys = reservationsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('reservations', fk);
      }
    }

    // Eliminar tablas en orden inverso
    await queryRunner.dropTable('reservations', true);
    await queryRunner.dropTable('rooms', true);
    await queryRunner.dropTable('clients', true);
  }
}
