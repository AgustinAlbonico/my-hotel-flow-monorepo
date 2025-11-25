/**
 * Migration: Create Account Movements Table
 */
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAccountMovementsTable1731402000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'account_movements',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['CHARGE', 'PAYMENT', 'ADJUSTMENT'],
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'COMPLETED', 'REVERSED'],
            default: "'COMPLETED'",
            isNullable: false,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['client_id'],
            referencedTableName: 'clients',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Índice compuesto para consultas por cliente y fecha
    await queryRunner.createIndex(
      'account_movements',
      new TableIndex({
        name: 'IDX_account_movements_client_created',
        columnNames: ['client_id', 'created_at'],
      }),
    );

    // Índice para búsqueda por referencia
    await queryRunner.createIndex(
      'account_movements',
      new TableIndex({
        name: 'IDX_account_movements_reference',
        columnNames: ['reference'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('account_movements');
  }
}
