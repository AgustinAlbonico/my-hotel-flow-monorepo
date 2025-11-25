/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../../../.env') });

async function forceFixAdminGroup() {
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
    console.log('🔌 Conectado\n');

    // Obtener IDs
    const admin = await dataSource.query(
      `SELECT id FROM "user" WHERE username = 'admin'`,
    );
    const adminGroup = await dataSource.query(
      `SELECT id FROM "group" WHERE key = 'rol.admin'`,
    );

    if (!admin[0] || !adminGroup[0]) {
      console.log('❌ No se encontró admin o grupo admin');
      return;
    }

    const userId = admin[0].id;
    const groupId = adminGroup[0].id;

    console.log(`👤 Usuario admin ID: ${userId}`);
    console.log(`📁 Grupo rol.admin ID: ${groupId}\n`);

    // Verificar si ya existe la relación
    const existing = await dataSource.query(
      `SELECT * FROM user_groups WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId],
    );

    if (existing.length > 0) {
      console.log('✅ La relación ya existe');
    } else {
      // Insertar la relación
      await dataSource.query(
        `INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)`,
        [userId, groupId],
      );
      console.log('✅ Relación creada exitosamente');
    }

    // Verificar
    const verify = await dataSource.query(
      `SELECT g.key, g.name, COUNT(ga.action_id) as action_count
       FROM user_groups ug
       INNER JOIN "group" g ON g.id = ug.group_id
       LEFT JOIN group_actions ga ON ga.group_id = g.id
       WHERE ug.user_id = $1
       GROUP BY g.id, g.key, g.name`,
      [userId],
    );

    console.log('\n📊 Grupos del usuario admin:');
    verify.forEach((row: any) => {
      console.log(`  - ${row.key}: ${row.action_count} acciones`);
    });

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

void forceFixAdminGroup();
