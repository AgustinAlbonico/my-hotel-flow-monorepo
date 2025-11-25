import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientAdditionalFields1730000000000
  implements MigrationInterface
{
  name = 'AddClientAdditionalFields1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients" 
      ADD COLUMN "birth_date" DATE NULL,
      ADD COLUMN "address" VARCHAR(255) NULL,
      ADD COLUMN "city" VARCHAR(100) NULL,
      ADD COLUMN "country" VARCHAR(100) NULL,
      ADD COLUMN "nationality" VARCHAR(100) NULL,
      ADD COLUMN "observations" TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clients" 
      DROP COLUMN "observations",
      DROP COLUMN "nationality",
      DROP COLUMN "country",
      DROP COLUMN "city",
      DROP COLUMN "address",
      DROP COLUMN "birth_date"
    `);
  }
}
