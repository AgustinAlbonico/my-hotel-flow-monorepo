/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../../../.env') });

async function checkActions() {
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
    console.log('🔌 Conectado a la base de datos\n');

    // Consultar todas las acciones
    const allActions = await dataSource.query(
      'SELECT id, key, name FROM action ORDER BY id',
    );

    console.log(`📝 Total de acciones en BD: ${allActions.length}\n`);

    // Buscar acciones con formato inválido (sin punto)
    const invalidActions = allActions.filter((a: any) => !a.key.includes('.'));

    if (invalidActions.length > 0) {
      console.log('❌ Acciones con formato INVÁLIDO (sin punto):');
      invalidActions.forEach((a: any) => {
        console.log(`  ID: ${a.id} | Key: "${a.key}" | Name: ${a.name}`);
      });
      console.log('\n💡 Estas acciones deben ser eliminadas o corregidas');
    } else {
      console.log(
        '✅ Todas las acciones tienen formato válido (contienen punto)',
      );
    }

    // Mostrar algunas acciones válidas como ejemplo
    console.log('\n📋 Ejemplo de acciones válidas:');
    allActions.slice(0, 5).forEach((a: any) => {
      console.log(`  ✓ ${a.key}`);
    });

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

void checkActions();
