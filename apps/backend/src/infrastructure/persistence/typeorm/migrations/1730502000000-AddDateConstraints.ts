import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateConstraints1730502000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Constraint: checkOut debe ser mayor a checkIn (R-001)
    await queryRunner.query(`
      ALTER TABLE reservations
      ADD CONSTRAINT chk_valid_date_range
      CHECK (checkOut > checkIn)
    `);

    // Constraint: cantidad de personas debe ser al menos 1 (R-005)
    // Nota: Este campo no existe en la migración original, lo agregamos si es necesario
    const table = await queryRunner.getTable('reservations');
    const hasGuestsColumn = table?.columns.find((col) => col.name === 'guests');

    if (hasGuestsColumn) {
      await queryRunner.query(`
        ALTER TABLE reservations
        ADD CONSTRAINT chk_min_guests
        CHECK (guests >= 1)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_min_guests',
    );
    await queryRunner.query(
      'ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_valid_date_range',
    );
  }
}
