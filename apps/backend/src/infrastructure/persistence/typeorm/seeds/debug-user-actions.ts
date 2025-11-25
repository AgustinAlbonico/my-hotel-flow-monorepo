/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../../../.env') });

async function debugUserActions() {
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

    // Obtener el admin user
    const adminUser = await dataSource.query(
      `SELECT id, username, role FROM "user" WHERE username = 'admin'`,
    );

    if (adminUser.length === 0) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }

    console.log('👤 Usuario Admin:');
    console.log(`  ID: ${adminUser[0].id}`);
    console.log(`  Username: ${adminUser[0].username}`);
    console.log(`  Role: ${adminUser[0].role}\n`);

    // Obtener los grupos del admin
    const adminGroups = await dataSource.query(
      `SELECT g.id, g.key, g.name 
       FROM "group" g
       INNER JOIN user_groups ug ON ug.group_id = g.id
       WHERE ug.user_id = $1`,
      [adminUser[0].id],
    );

    console.log(`📁 Grupos del Admin: ${adminGroups.length}`);
    adminGroups.forEach((g: any) => {
      console.log(`  - ${g.key} (${g.name})`);
    });
    console.log('');

    // Obtener las acciones de cada grupo
    for (const group of adminGroups) {
      const groupActions = await dataSource.query(
        `SELECT a.id, a.key, a.name, a.area, a.description
         FROM action a
         INNER JOIN group_actions ga ON ga.action_id = a.id
         WHERE ga.group_id = $1
         ORDER BY a.key
         LIMIT 10`,
        [group.id],
      );

      console.log(
        `🔑 Acciones del grupo "${group.key}" (mostrando primeras 10):`,
      );
      groupActions.forEach((a: any) => {
        console.log(
          `  ${a.id}. key="${a.key}" | area="${a.area}" | name="${a.name}"`,
        );

        // Verificar si la key es válida
        if (!a.key || !a.key.includes('.')) {
          console.log(`    ⚠️  INVÁLIDA: "${a.key}" no tiene formato correcto`);
        }
      });
      console.log('');

      // Verificar si el grupo tiene hijos
      const groupChildren = await dataSource.query(
        `SELECT g.id, g.key, g.name
         FROM "group" g
         INNER JOIN group_children gc ON gc.child_group_id = g.id
         WHERE gc.parent_group_id = $1`,
        [group.id],
      );

      if (groupChildren.length > 0) {
        console.log(
          `👶 Grupos hijos de "${group.key}": ${groupChildren.length}`,
        );
        groupChildren.forEach((child: any) => {
          console.log(`  - ${child.key}`);
        });
        console.log('');
      }
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

void debugUserActions();
