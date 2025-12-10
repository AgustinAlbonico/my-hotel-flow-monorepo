import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAuditFieldsToReservations1733400100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('reservations');
    const hasCreatedByUserId = table?.columns.find((col) => col.name === 'createdByUserId');
    
    // Si ya existe la columna, salir
    if (hasCreatedByUserId) return;

    // Agregar campos de auditoría a la tabla reservations
    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'createdByUserId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'createdByUsername',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'createdBySystem',
        type: 'varchar',
        length: '50',
        default: "'WEB_BOOKING'",
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'updatedByUserId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'updatedByUsername',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    // Campos inmutables para trazabilidad
    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'originalCheckIn',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'originalCheckOut',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'originalAmount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'reservations',
      new TableColumn({
        name: 'currentAmount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    // Crear foreign keys (IF NOT EXISTS usando DO block)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE reservations
        ADD CONSTRAINT fk_reservations_created_by_user
        FOREIGN KEY ("createdByUserId") REFERENCES users(id)
        ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE reservations
        ADD CONSTRAINT fk_reservations_updated_by_user
        FOREIGN KEY ("updatedByUserId") REFERENCES users(id)
        ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Actualizar registros existentes con valores originales
    await queryRunner.query(`
      UPDATE reservations
      SET 
        "originalCheckIn" = "checkIn",
        "originalCheckOut" = "checkOut",
        "createdBySystem" = 'LEGACY_SYSTEM'
      WHERE "originalCheckIn" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`
      ALTER TABLE reservations
      DROP CONSTRAINT IF EXISTS fk_reservations_created_by_user
    `);

    await queryRunner.query(`
      ALTER TABLE reservations
      DROP CONSTRAINT IF EXISTS fk_reservations_updated_by_user
    `);

    // Eliminar columnas
    await queryRunner.dropColumn('reservations', 'currentAmount');
    await queryRunner.dropColumn('reservations', 'originalAmount');
    await queryRunner.dropColumn('reservations', 'originalCheckOut');
    await queryRunner.dropColumn('reservations', 'originalCheckIn');
    await queryRunner.dropColumn('reservations', 'updatedByUsername');
    await queryRunner.dropColumn('reservations', 'updatedByUserId');
    await queryRunner.dropColumn('reservations', 'createdBySystem');
    await queryRunner.dropColumn('reservations', 'createdByUsername');
    await queryRunner.dropColumn('reservations', 'createdByUserId');
  }
}
