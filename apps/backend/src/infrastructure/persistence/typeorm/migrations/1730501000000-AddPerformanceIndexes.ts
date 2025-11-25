import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1730501000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índice compuesto para búsquedas de disponibilidad
    // WHERE status IN ('CONFIRMED', 'IN_PROGRESS')
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_room_dates_status
      ON reservations (roomId, checkIn, checkOut, status)
      WHERE status IN ('CONFIRMED', 'IN_PROGRESS')
    `);

    // Índice BRIN para rangos de fechas (muy eficiente para datos ordenados por tiempo)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_dates_brin
      ON reservations USING BRIN (checkIn, checkOut)
    `);

    // Índice para búsquedas por cliente y estado
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_client_status
      ON reservations (clientId, status)
    `);

    // Índice para búsquedas de habitaciones por tipo y estado
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_type_active
      ON rooms (roomTypeId, isActive, estado)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_rooms_type_active');
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_reservations_client_status',
    );
    await queryRunner.query('DROP INDEX IF EXISTS idx_reservations_dates_brin');
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_reservations_room_dates_status',
    );
  }
}
