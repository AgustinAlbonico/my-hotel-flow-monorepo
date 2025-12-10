import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReceiptPathToPayments1733353200000 implements MigrationInterface {
  name = 'AddReceiptPathToPayments1733353200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('payments');
    const hasColumn = table?.columns.find((col) => col.name === 'receipt_path');
    if (hasColumn) return;

    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'receipt_path',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payments', 'receipt_path');
  }
}
