import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOutstandingBalanceToClients1731400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clients');
    const hasColumn = table?.columns.find((col) => col.name === 'outstanding_balance');

    // Agregar columna outstanding_balance a la tabla clients
    if (!hasColumn) {
      await queryRunner.addColumn(
        'clients',
        new TableColumn({
          name: 'outstanding_balance',
          type: 'decimal',
          precision: 10,
          scale: 2,
          default: 0,
          isNullable: false,
        }),
      );
    }

    // Crear índice para búsquedas de clientes deudores
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_outstanding_balance
      ON clients(outstanding_balance)
      WHERE outstanding_balance > 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_clients_outstanding_balance;
    `);

    // Eliminar columna
    await queryRunner.dropColumn('clients', 'outstanding_balance');
  }
}
