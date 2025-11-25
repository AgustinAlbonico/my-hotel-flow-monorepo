import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para corregir tipos de habitación duplicados
 *
 * Problema: Existen tipos con códigos en MAYÚSCULAS y minúsculas duplicados
 * Solución: Reasignar habitaciones a tipos con minúsculas y eliminar duplicados con MAYÚSCULAS
 */
export class FixDuplicateRoomTypes1730900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Reasignar habitaciones de "ESTANDAR" a "estandar"
    await queryRunner.query(`
      UPDATE rooms r
      SET "roomTypeId" = (SELECT id FROM room_types WHERE code = 'estandar' LIMIT 1)
      WHERE "roomTypeId" = (SELECT id FROM room_types WHERE code = 'ESTANDAR' LIMIT 1)
      AND EXISTS (SELECT 1 FROM room_types WHERE code = 'estandar')
      AND EXISTS (SELECT 1 FROM room_types WHERE code = 'ESTANDAR');
    `);

    // 2. Reasignar habitaciones de "SUITE" a "suite"
    await queryRunner.query(`
      UPDATE rooms r
      SET "roomTypeId" = (SELECT id FROM room_types WHERE code = 'suite' LIMIT 1)
      WHERE "roomTypeId" = (SELECT id FROM room_types WHERE code = 'SUITE' LIMIT 1)
      AND EXISTS (SELECT 1 FROM room_types WHERE code = 'suite')
      AND EXISTS (SELECT 1 FROM room_types WHERE code = 'SUITE');
    `);

    // 3. Reasignar habitaciones de "FAMILIAR" a "familiar"
    await queryRunner.query(`
      UPDATE rooms r
      SET "roomTypeId" = (SELECT id FROM room_types WHERE code = 'familiar' LIMIT 1)
      WHERE "roomTypeId" = (SELECT id FROM room_types WHERE code = 'FAMILIAR' LIMIT 1)
      AND EXISTS (SELECT 1 FROM room_types WHERE code = 'familiar')
      AND EXISTS (SELECT 1 FROM room_types WHERE code = 'FAMILIAR');
    `);

    // 4. Eliminar relaciones en tabla intermedia room_type_caracteristicas para tipos duplicados
    await queryRunner.query(`
      DELETE FROM room_type_caracteristicas
      WHERE room_type_id IN (
        SELECT id FROM room_types WHERE code IN ('ESTANDAR', 'SUITE', 'FAMILIAR')
      );
    `);

    // 5. Eliminar tipos de habitación con códigos en MAYÚSCULAS
    await queryRunner.query(`
      DELETE FROM room_types
      WHERE code IN ('ESTANDAR', 'SUITE', 'FAMILIAR');
    `);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No se puede revertir esta migración de forma segura
    // ya que perdimos la asociación original de las habitaciones
  }
}
