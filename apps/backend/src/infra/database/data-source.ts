import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno desde la raíz del monorepo
config({ path: join(__dirname, '../../../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'myhotelflow',
  entities: [
    join(
      __dirname,
      'infrastructure/persistence/typeorm/entities/**/*.orm-entity.ts',
    ),
  ],
  migrations: [
    join(__dirname, 'infrastructure/persistence/typeorm/migrations/**/*.ts'),
  ],
  synchronize: true, // NUNCA usar true en producción
  logging: process.env.DB_LOGGING === 'true',
});
