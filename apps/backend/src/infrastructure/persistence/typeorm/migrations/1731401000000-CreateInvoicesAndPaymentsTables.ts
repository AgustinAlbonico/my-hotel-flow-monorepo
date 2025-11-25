import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateInvoicesAndPaymentsTables1731401000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla invoices
    await queryRunner.createTable(
      new Table({
        name: 'invoices',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'reservation_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'invoice_number',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'tax_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'tax_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'amount_paid',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'issued_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'due_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Crear tabla payments
    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'invoice_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'int',
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
            name: 'method',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'paid_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Crear Foreign Keys para invoices
    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['reservation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'reservations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'invoices',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'CASCADE',
      }),
    );

    // Crear Foreign Keys para payments
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['invoice_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'invoices',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'CASCADE',
      }),
    );

    // Crear índices
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'idx_invoices_reservation_id',
        columnNames: ['reservation_id'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'idx_invoices_client_id',
        columnNames: ['client_id'],
      }),
    );

    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'idx_invoices_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'idx_payments_invoice_id',
        columnNames: ['invoice_id'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'idx_payments_client_id',
        columnNames: ['client_id'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'idx_payments_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'idx_payments_paid_at',
        columnNames: ['paid_at'],
      }),
    );

    // Constraint: un solo invoice por reserva
    await queryRunner.createIndex(
      'invoices',
      new TableIndex({
        name: 'idx_invoices_reservation_unique',
        columnNames: ['reservation_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas (las FKs se eliminan automáticamente)
    await queryRunner.dropTable('payments', true);
    await queryRunner.dropTable('invoices', true);
  }
}
