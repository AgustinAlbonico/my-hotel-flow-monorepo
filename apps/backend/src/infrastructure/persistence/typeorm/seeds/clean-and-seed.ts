import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
config({ path: resolve(__dirname, '../../../../../.env') });

async function cleanAndSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'myhotelflow',
  });

  try {
    await dataSource.initialize();
    console.log('🔌 Conectado a la base de datos');

    // Limpiar todas las tablas en el orden correcto para evitar conflictos de FK
    console.log('\n🧹 Limpiando base de datos...');

    await dataSource.query('DELETE FROM user_actions');
    console.log('  ✓ user_actions limpiada');

    await dataSource.query('DELETE FROM user_groups');
    console.log('  ✓ user_groups limpiada');

    await dataSource.query('DELETE FROM group_actions');
    console.log('  ✓ group_actions limpiada');

    await dataSource.query('DELETE FROM group_children');
    console.log('  ✓ group_children limpiada');

    await dataSource.query('DELETE FROM "user"');
    console.log('  ✓ user limpiada');

    await dataSource.query('DELETE FROM "group"');
    console.log('  ✓ group limpiada');

    await dataSource.query('DELETE FROM action');
    console.log('  ✓ action limpiada');

    console.log('\n✅ Base de datos limpiada');
    console.log('\n🌱 Ahora ejecuta el seed: npm run seed');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

void cleanAndSeed();
