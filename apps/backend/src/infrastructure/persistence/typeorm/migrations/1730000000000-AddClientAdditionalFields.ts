import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientAdditionalFields1730000000000
  implements MigrationInterface
{
  name = 'AddClientAdditionalFields1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar y agregar columnas solo si no existen
    const columns = ['birth_date', 'address', 'city', 'country', 'nationality', 'observations'];
    const columnTypes: Record<string, string> = {
      birth_date: 'DATE',
      address: 'VARCHAR(255)',
      city: 'VARCHAR(100)',
      country: 'VARCHAR(100)',
      nationality: 'VARCHAR(100)',
      observations: 'TEXT',
    };

    for (const column of columns) {
      const exists = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = '${column}'
      `);
      if (exists.length === 0) {
        await queryRunner.query(
          `ALTER TABLE "clients" ADD COLUMN "${column}" ${columnTypes[column]} NULL`
        );
      }
    }
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
