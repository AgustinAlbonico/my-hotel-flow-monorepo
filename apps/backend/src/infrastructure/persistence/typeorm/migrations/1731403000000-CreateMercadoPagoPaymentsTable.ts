import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateMercadoPagoPaymentsTable1731403000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para status
    await queryRunner.query(`
      CREATE TYPE mercadopago_payment_status_enum AS ENUM (
        'pending',
        'approved',
        'authorized',
        'in_process',
        'in_mediation',
        'rejected',
        'cancelled',
        'refunded',
        'charged_back'
      )
    `);

    // Crear enum para payment_type
    await queryRunner.query(`
      CREATE TYPE mercadopago_payment_type_enum AS ENUM (
        'credit_card',
        'debit_card',
        'ticket',
        'atm',
        'digital_wallet'
      )
    `);

    // Crear tabla
    await queryRunner.createTable(
      new Table({
        name: 'mercadopago_payments',
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
            name: 'preference_id',
            type: 'varchar',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'external_payment_id',
            type: 'varchar',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'status',
            type: 'mercadopago_payment_status_enum',
            default: "'pending'",
          },
          {
            name: 'payment_type',
            type: 'mercadopago_payment_type_enum',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status_detail',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'payment_method_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'payer_email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
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
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'mercadopago_payments',
      new TableIndex({
        name: 'IDX_MERCADOPAGO_PAYMENTS_PREFERENCE_ID',
        columnNames: ['preference_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'mercadopago_payments',
      new TableIndex({
        name: 'IDX_MERCADOPAGO_PAYMENTS_EXTERNAL_PAYMENT_ID',
        columnNames: ['external_payment_id'],
        isUnique: true,
        where: 'external_payment_id IS NOT NULL',
      }),
    );

    await queryRunner.createIndex(
      'mercadopago_payments',
      new TableIndex({
        name: 'IDX_MERCADOPAGO_PAYMENTS_INVOICE_ID',
        columnNames: ['invoice_id'],
      }),
    );

    await queryRunner.createIndex(
      'mercadopago_payments',
      new TableIndex({
        name: 'IDX_MERCADOPAGO_PAYMENTS_CLIENT_ID',
        columnNames: ['client_id'],
      }),
    );

    await queryRunner.createIndex(
      'mercadopago_payments',
      new TableIndex({
        name: 'IDX_MERCADOPAGO_PAYMENTS_STATUS',
        columnNames: ['status'],
      }),
    );

    // Crear foreign keys
    await queryRunner.createForeignKey(
      'mercadopago_payments',
      new TableForeignKey({
        name: 'FK_MERCADOPAGO_PAYMENTS_INVOICE',
        columnNames: ['invoice_id'],
        referencedTableName: 'invoices',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'mercadopago_payments',
      new TableForeignKey({
        name: 'FK_MERCADOPAGO_PAYMENTS_CLIENT',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.dropForeignKey(
      'mercadopago_payments',
      'FK_MERCADOPAGO_PAYMENTS_INVOICE',
    );
    await queryRunner.dropForeignKey(
      'mercadopago_payments',
      'FK_MERCADOPAGO_PAYMENTS_CLIENT',
    );

    // Eliminar índices
    await queryRunner.dropIndex(
      'mercadopago_payments',
      'IDX_MERCADOPAGO_PAYMENTS_PREFERENCE_ID',
    );
    await queryRunner.dropIndex(
      'mercadopago_payments',
      'IDX_MERCADOPAGO_PAYMENTS_EXTERNAL_PAYMENT_ID',
    );
    await queryRunner.dropIndex(
      'mercadopago_payments',
      'IDX_MERCADOPAGO_PAYMENTS_INVOICE_ID',
    );
    await queryRunner.dropIndex(
      'mercadopago_payments',
      'IDX_MERCADOPAGO_PAYMENTS_CLIENT_ID',
    );
    await queryRunner.dropIndex(
      'mercadopago_payments',
      'IDX_MERCADOPAGO_PAYMENTS_STATUS',
    );

    // Eliminar tabla
    await queryRunner.dropTable('mercadopago_payments');

    // Eliminar enums
    await queryRunner.query('DROP TYPE mercadopago_payment_status_enum');
    await queryRunner.query('DROP TYPE mercadopago_payment_type_enum');
  }
}
