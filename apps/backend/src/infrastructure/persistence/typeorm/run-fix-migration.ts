import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { FixDuplicateRoomTypes1730900000000 } from './migrations/1730900000000-FixDuplicateRoomTypes';

// Cargar variables de entorno
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'myhotelflow',
  entities: ['src/**/*.orm-entity.ts'],
  migrations: ['src/infrastructure/persistence/typeorm/migrations/*.ts'],
  synchronize: false,
  logging: true,
});

async function runMigration() {
  console.log('🔧 Conectando a la base de datos...');
  await dataSource.initialize();

  console.log('✅ Conexión establecida');
  console.log('🚀 Ejecutando migración FixDuplicateRoomTypes...\n');

  const queryRunner = dataSource.createQueryRunner();
  const migration = new FixDuplicateRoomTypes1730900000000();

  try {
    await queryRunner.connect();
    await migration.up(queryRunner);
    console.log('\n✨ Migración ejecutada exitosamente!');
  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
