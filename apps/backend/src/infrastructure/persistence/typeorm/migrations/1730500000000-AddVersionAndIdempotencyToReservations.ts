import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddVersionAndIdempotencyToReservations1730500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar campo version para optimistic locking
    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'version',
        type: 'integer',
        default: 0,
        isNullable: false,
      }),
    );

    // Agregar campo idempotencyKey para prevenir duplicados
    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'idempotencyKey',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Agregar campos JSON para check-in y check-out data
    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'checkInData',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'checkOutData',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Crear índice único para idempotencyKey (solo valores no nulos)
    await queryRunner.createIndex(
      'reservations',
      new TableIndex({
        name: 'idx_reservations_idempotency_key',
        columnNames: ['idempotencyKey'],
        isUnique: true,
        where: 'idempotencyKey IS NOT NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'reservations',
      'idx_reservations_idempotency_key',
    );
    await queryRunner.dropColumn('reservations', 'checkOutData');
    await queryRunner.dropColumn('reservations', 'checkInData');
    await queryRunner.dropColumn('reservations', 'idempotencyKey');
    await queryRunner.dropColumn('reservations', 'version');
  }
}
