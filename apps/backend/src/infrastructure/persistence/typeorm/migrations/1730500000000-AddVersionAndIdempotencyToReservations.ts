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
    const table = await queryRunner.getTable('reservations');
    const hasVersion = table?.columns.find((col) => col.name === 'version');
    const hasIdempotencyKey = table?.columns.find((col) => col.name === 'idempotencyKey');
    const hasCheckInData = table?.columns.find((col) => col.name === 'checkInData');
    const hasCheckOutData = table?.columns.find((col) => col.name === 'checkOutData');

    // Agregar campo version para optimistic locking
    if (!hasVersion) {
      await queryRunner.addColumn(
        'reservations',
        new TableColumn({
          name: 'version',
          type: 'integer',
          default: 0,
          isNullable: false,
        }),
      );
    }

    // Agregar campo idempotencyKey para prevenir duplicados
    if (!hasIdempotencyKey) {
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
    }

    // Agregar campos JSON para check-in y check-out data
    if (!hasCheckInData) {
      await queryRunner.addColumn(
        'reservations',
        new TableColumn({
          name: 'checkInData',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }

    if (!hasCheckOutData) {
      await queryRunner.addColumn(
        'reservations',
        new TableColumn({
          name: 'checkOutData',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }

    // Crear índice único para idempotencyKey (solo valores no nulos)
    const indexExists = table?.indices.find((idx) => idx.name === 'idx_reservations_idempotency_key');
    if (!indexExists && !hasIdempotencyKey) {
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
