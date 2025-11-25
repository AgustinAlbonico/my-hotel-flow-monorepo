/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { UserOrmEntity } from '../entities/user.orm-entity';

config({ path: resolve(__dirname, '../../../../../.env') });

async function debugTypeORMLoad() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'myhotelflow',
    entities: [resolve(__dirname, '../entities/*.orm-entity.{ts,js}')],
    synchronize: false,
    logging: true, // Ver las queries SQL
  });

  try {
    await dataSource.initialize();
    console.log('🔌 Conectado\n');

    const userRepo = dataSource.getRepository(UserOrmEntity);

    // Simular exactamente lo que hace el repository
    console.log('📥 Cargando usuario admin con relaciones...\n');

    const user = await userRepo.findOne({
      where: { username: 'admin' },
      relations: ['groups', 'groups.actions', 'actions'],
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('\n👤 Usuario cargado:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Groups: ${user.groups?.length || 0}`);
    console.log(`  Direct Actions: ${user.actions?.length || 0}\n`);

    if (user.groups && user.groups.length > 0) {
      console.log('📁 Grupos del usuario:');
      for (const group of user.groups) {
        console.log(`\n  Grupo: ${group.key} (${group.name})`);
        console.log(`    ID: ${group.id}`);
        console.log(`    Actions: ${group.actions?.length || 0}`);
        console.log(`    Children: ${group.children?.length || 0}`);

        if (group.actions && group.actions.length > 0) {
          console.log(`\n    Primeras 5 acciones:`);
          for (let i = 0; i < Math.min(5, group.actions.length); i++) {
            const action = group.actions[i];
            console.log(
              `      ${i + 1}. ID=${action.id} | key="${action.key}" | name="${action.name}"`,
            );

            // Verificar integridad
            if (!action.key) {
              console.log(`        ⚠️  ERROR: key es undefined/null`);
            } else if (!action.key.includes('.')) {
              console.log(
                `        ⚠️  ERROR: key "${action.key}" no tiene punto`,
              );
            }
          }
        }

        if (group.children) {
          console.log(`\n    Children loaded: ${group.children}`);
        }
      }
    }

    await dataSource.destroy();
    console.log('\n✅ Debug completado');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

void debugTypeORMLoad();
