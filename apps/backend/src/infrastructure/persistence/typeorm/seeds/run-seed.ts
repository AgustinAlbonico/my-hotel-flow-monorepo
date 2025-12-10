/**
 * Script de Seed - Carga inicial de datos
 *
 * Ejecutar: npm run seed
 */

import { DataSource, In } from 'typeorm';
import { hash } from 'argon2';
import { ActionOrmEntity } from '../entities/action.orm-entity';
import { GroupOrmEntity } from '../entities/group.orm-entity';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { RoomOrmEntity } from '../entities/room.orm-entity';
import { RoomTypeOrmEntity } from '../entities/room-type.orm-entity';
import { CaracteristicaOrmEntity } from '../entities/caracteristica.orm-entity';
import { ReservationOrmEntity } from '../entities/reservation.orm-entity';
import { seedReservationData } from './reservation.seed';
import { CaracteristicaAndRoomTypeSeed } from './caracteristica-and-room-type.seed';

// Catálogo de acciones según MODULO_SEGURIDAD.md
const actionsData = [
  // Reservas
  {
    key: 'reservas.listar',
    name: 'Listar Reservas',
    description: 'Ver lista de reservas',
  },
  {
    key: 'reservas.ver',
    name: 'Ver Reserva',
    description: 'Ver detalle de una reserva',
  },
  {
    key: 'reservas.crear',
    name: 'Crear Reserva',
    description: 'Crear nueva reserva',
  },
  {
    key: 'reservas.modificar',
    name: 'Modificar Reserva',
    description: 'Editar reserva existente',
  },
  {
    key: 'reservas.cancelar',
    name: 'Cancelar Reserva',
    description: 'Cancelar una reserva',
  },
  {
    key: 'reservas.checkin',
    name: 'Realizar Check-in',
    description: 'Cambiar estado de reserva a IN_PROGRESS',
  },
  {
    key: 'reservas.checkout',
    name: 'Realizar Check-out',
    description: 'Finalizar reserva y generar factura automáticamente',
  },

  // Check-in
  {
    key: 'checkin.registrar',
    name: 'Registrar Check-in',
    description: 'Realizar check-in de huésped',
  },
  {
    key: 'checkin.asignarHabitacion',
    name: 'Asignar Habitación',
    description: 'Asignar habitación en check-in',
  },
  {
    key: 'checkin.adjuntarGarantia',
    name: 'Adjuntar Garantía',
    description: 'Adjuntar garantía de pago',
  },
  {
    key: 'checkin.imprimirComprobante',
    name: 'Imprimir Comprobante Check-in',
    description: 'Imprimir comprobante de check-in',
  },

  // Check-out
  {
    key: 'checkout.calcularCargos',
    name: 'Calcular Cargos',
    description: 'Calcular cargos totales',
  },
  {
    key: 'checkout.registrarPago',
    name: 'Registrar Pago',
    description: 'Registrar pago en check-out',
  },
  {
    key: 'checkout.cerrar',
    name: 'Cerrar Check-out',
    description: 'Finalizar proceso de check-out',
  },
  {
    key: 'checkout.imprimirComprobante',
    name: 'Imprimir Comprobante Check-out',
    description: 'Imprimir comprobante de check-out',
  },

  // Comprobantes
  {
    key: 'comprobantes.emitir',
    name: 'Emitir Comprobante',
    description: 'Emitir comprobante fiscal',
  },
  {
    key: 'comprobantes.anular',
    name: 'Anular Comprobante',
    description: 'Anular comprobante emitido',
  },
  {
    key: 'comprobantes.imprimir',
    name: 'Imprimir Comprobante',
    description: 'Imprimir comprobante',
  },
  {
    key: 'comprobantes.ver',
    name: 'Ver Comprobante',
    description: 'Ver detalle de comprobante',
  },

  // Habitaciones
  {
    key: 'habitaciones.listar',
    name: 'Listar Habitaciones',
    description: 'Ver lista de habitaciones',
  },
  {
    key: 'habitaciones.ver',
    name: 'Ver Habitación',
    description: 'Ver detalle de habitación',
  },
  {
    key: 'habitaciones.crear',
    name: 'Crear Habitación',
    description: 'Crear nueva habitación',
  },
  {
    key: 'habitaciones.modificar',
    name: 'Modificar Habitación',
    description: 'Editar habitación',
  },
  {
    key: 'habitaciones.eliminar',
    name: 'Eliminar Habitación',
    description: 'Dar de baja habitación',
  },
  {
    key: 'habitaciones.cambiarEstado',
    name: 'Cambiar Estado Habitación',
    description: 'Cambiar estado de habitación',
  },

  // Tipos de Habitación
  {
    key: 'tiposHabitacion.listar',
    name: 'Listar Tipos de Habitación',
    description: 'Ver listado de tipos de habitación',
  },
  {
    key: 'tiposHabitacion.ver',
    name: 'Ver Tipo de Habitación',
    description: 'Ver detalle de un tipo de habitación',
  },
  {
    key: 'tiposHabitacion.crear',
    name: 'Crear Tipo de Habitación',
    description: 'Crear nuevo tipo de habitación',
  },
  {
    key: 'tiposHabitacion.modificar',
    name: 'Modificar Tipo de Habitación',
    description: 'Editar un tipo de habitación existente',
  },
  {
    key: 'tiposHabitacion.eliminar',
    name: 'Eliminar Tipo de Habitación',
    description: 'Dar de baja un tipo de habitación',
  },

  // Características de Habitación
  {
    key: 'caracteristicas.listar',
    name: 'Listar Características',
    description: 'Ver listado de características de habitación',
  },
  {
    key: 'caracteristicas.ver',
    name: 'Ver Característica',
    description: 'Ver detalle de una característica de habitación',
  },
  {
    key: 'caracteristicas.crear',
    name: 'Crear Característica',
    description: 'Crear nueva característica de habitación',
  },
  {
    key: 'caracteristicas.modificar',
    name: 'Modificar Característica',
    description: 'Editar característica de habitación',
  },
  {
    key: 'caracteristicas.eliminar',
    name: 'Eliminar Característica',
    description: 'Dar de baja característica de habitación',
  },

  // Clientes
  {
    key: 'clientes.listar',
    name: 'Listar Clientes',
    description: 'Ver lista de clientes',
  },
  {
    key: 'clientes.ver',
    name: 'Ver Cliente',
    description: 'Ver detalle de cliente',
  },
  {
    key: 'clientes.crear',
    name: 'Crear Cliente',
    description: 'Crear nuevo cliente',
  },
  {
    key: 'clientes.modificar',
    name: 'Modificar Cliente',
    description: 'Editar cliente',
  },
  {
    key: 'clientes.eliminar',
    name: 'Eliminar Cliente',
    description: 'Dar de baja cliente',
  },

  // Pagos
  {
    key: 'pagos.listar',
    name: 'Listar Pagos',
    description: 'Ver listado de pagos registrados',
  },
  {
    key: 'pagos.ver',
    name: 'Ver Pago',
    description: 'Ver detalle de un pago específico',
  },
  {
    key: 'pagos.registrar',
    name: 'Registrar Pago',
    description: 'Registrar nuevos pagos (manual o automático)',
  },
  {
    key: 'pagos.anular',
    name: 'Anular Pago',
    description: 'Anular pagos registrados',
  },

  // Facturación
  {
    key: 'facturas.listar',
    name: 'Listar Facturas',
    description: 'Ver listado de facturas generadas',
  },
  {
    key: 'facturas.ver',
    name: 'Ver Factura',
    description: 'Ver detalles de una factura específica',
  },
  {
    key: 'facturas.crear',
    name: 'Crear Factura',
    description: 'Generar nuevas facturas manualmente',
  },
  {
    key: 'facturas.anular',
    name: 'Anular Factura',
    description: 'Anular facturas emitidas',
  },

  // Cuenta Corriente
  {
    key: 'cuentaCorriente.ver',
    name: 'Ver Cuenta Corriente',
    description: 'Ver estado de cuenta de un cliente',
  },
  {
    key: 'cuentaCorriente.crear',
    name: 'Crear Movimiento',
    description: 'Crear movimientos manuales (cargos/pagos/ajustes)',
  },
  {
    key: 'cuentaCorriente.modificar',
    name: 'Modificar Movimiento',
    description: 'Editar o anular movimientos existentes',
  },

  // MercadoPago
  {
    key: 'mercadopago.crear',
    name: 'Crear Preferencia de Pago',
    description: 'Generar link de pago con MercadoPago',
  },

  // Servicios
  {
    key: 'servicios.listar',
    name: 'Listar Servicios',
    description: 'Ver lista de servicios',
  },
  {
    key: 'servicios.asignar',
    name: 'Asignar Servicio',
    description: 'Asignar servicio a reserva',
  },
  {
    key: 'servicios.remover',
    name: 'Remover Servicio',
    description: 'Quitar servicio de reserva',
  },

  // Notificaciones
  {
    key: 'notificaciones.enviar',
    name: 'Enviar Notificación',
    description: 'Enviar notificaciones',
  },
  {
    key: 'notificaciones.ver',
    name: 'Ver Notificaciones',
    description: 'Ver notificaciones',
  },

  // Reportes
  {
    key: 'reportes.ver',
    name: 'Ver Reportes',
    description: 'Ver reportes del sistema',
  },
  {
    key: 'reportes.exportar',
    name: 'Exportar Reportes',
    description: 'Exportar reportes',
  },

  // Auditoría
  {
    key: 'auditoria.ver',
    name: 'Ver Auditoría de Reservas',
    description: 'Ver historial de cambios en reservas y operaciones críticas',
  },
  {
    key: 'auditoria.sesiones.ver',
    name: 'Ver Sesiones de Usuarios',
    description: 'Ver historial de inicios y cierres de sesión',
  },
  {
    key: 'auditoria.actividad.ver',
    name: 'Ver Actividad de Usuarios',
    description: 'Ver registro de actividad detallada de usuarios',
  },
  {
    key: 'auditoria.exportar',
    name: 'Exportar Auditoría',
    description: 'Exportar reportes de auditoría en diversos formatos',
  },

  // Configuración - Usuarios
  {
    key: 'config.usuarios.listar',
    name: 'Listar Usuarios',
    description: 'Ver lista de usuarios',
  },
  {
    key: 'config.usuarios.ver',
    name: 'Ver Usuario',
    description: 'Ver detalle de usuario',
  },
  {
    key: 'config.usuarios.crear',
    name: 'Crear Usuario',
    description: 'Crear nuevo usuario',
  },
  {
    key: 'config.usuarios.modificar',
    name: 'Modificar Usuario',
    description: 'Editar usuario',
  },
  {
    key: 'config.usuarios.eliminar',
    name: 'Eliminar Usuario',
    description: 'Eliminar usuario',
  },
  {
    key: 'config.usuarios.asignarGrupos',
    name: 'Asignar Grupos',
    description: 'Asignar grupos a usuario',
  },
  {
    key: 'config.usuarios.asignarAcciones',
    name: 'Asignar Acciones',
    description: 'Asignar acciones a usuario',
  },
  {
    key: 'config.usuarios.resetearPassword',
    name: 'Resetear Contraseña',
    description: 'Resetear contraseña de usuario',
  },

  // Configuración - Grupos
  {
    key: 'config.grupos.listar',
    name: 'Listar Grupos',
    description: 'Ver lista de grupos',
  },
  {
    key: 'config.grupos.ver',
    name: 'Ver Grupo',
    description: 'Ver detalle de grupo',
  },
  {
    key: 'config.grupos.crear',
    name: 'Crear Grupo',
    description: 'Crear nuevo grupo',
  },
  {
    key: 'config.grupos.modificar',
    name: 'Modificar Grupo',
    description: 'Editar grupo',
  },
  {
    key: 'config.grupos.eliminar',
    name: 'Eliminar Grupo',
    description: 'Eliminar grupo',
  },
  {
    key: 'config.grupos.asignarAcciones',
    name: 'Asignar Acciones a Grupo',
    description: 'Asignar acciones a grupo',
  },
  {
    key: 'config.grupos.asignarHijos',
    name: 'Asignar Grupos Hijos',
    description: 'Asignar subgrupos',
  },

  // Configuración - Acciones
  {
    key: 'config.acciones.listar',
    name: 'Listar Acciones',
    description: 'Ver catálogo de acciones',
  },
  {
    key: 'config.acciones.ver',
    name: 'Ver Acción',
    description: 'Ver detalle de acción',
  },
  {
    key: 'config.acciones.crear',
    name: 'Crear Acción',
    description: 'Crear nueva acción',
  },
  {
    key: 'config.acciones.modificar',
    name: 'Modificar Acción',
    description: 'Editar acción',
  },
  {
    key: 'config.acciones.eliminar',
    name: 'Eliminar Acción',
    description: 'Eliminar acción',
  },
];

async function runSeed() {
  // Configuración de conexión a la base de datos
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'myhotelflow',
    entities: [
      ActionOrmEntity,
      GroupOrmEntity,
      UserOrmEntity,
      ClientOrmEntity,
      RoomOrmEntity,
      RoomTypeOrmEntity,
      CaracteristicaOrmEntity,
      ReservationOrmEntity,
    ],
    synchronize: true,
  });

  try {
    console.log('🌱 Iniciando seed de datos...\n');

    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida\n');

    const actionRepo = dataSource.getRepository(ActionOrmEntity);
    const groupRepo = dataSource.getRepository(GroupOrmEntity);
    const userRepo = dataSource.getRepository(UserOrmEntity);

    // 1. Crear Acciones
    console.log('📝 Creando acciones...');
    const actions = await Promise.all(
      actionsData.map(async (actionData) => {
        let action = await actionRepo.findOne({
          where: { key: actionData.key },
        });
        if (!action) {
          action = actionRepo.create(actionData);
          await actionRepo.save(action);
          console.log(`  ✓ ${actionData.key}`);
        } else {
          console.log(`  ⏭️  ${actionData.key} (ya existe)`);
        }
        return action;
      }),
    );
    console.log(`✅ ${actions.length} acciones creadas\n`);

    // 2. Crear Grupos
    console.log('👥 Creando grupos...');

    // Grupo Cliente
    let clienteGroup = await groupRepo.findOne({
      where: { key: 'rol.cliente' },
      relations: ['actions'],
    });
    if (!clienteGroup) {
      const clienteActions = actions.filter((a) =>
        [
          'reservas.ver',
          'reservas.crear',
          'comprobantes.ver',
          'clientes.modificar',
        ].includes(a.key),
      );
      clienteGroup = groupRepo.create({
        key: 'rol.cliente',
        name: 'Cliente',
        description: 'Grupo para clientes del hotel',
        actions: clienteActions,
        children: [],
      });
      await groupRepo.save(clienteGroup);
      console.log('  ✓ rol.cliente');
    } else {
      console.log('  ⏭️  rol.cliente (ya existe)');
    }

    // Grupo Recepcionista
    let recepcionistaGroup = await groupRepo.findOne({
      where: { key: 'rol.recepcionista' },
      relations: ['actions'],
    });
    if (!recepcionistaGroup) {
      const recepcionistaActions = actions.filter(
        (a) =>
          a.key.startsWith('reservas.') ||
          a.key.startsWith('checkin.') ||
          a.key.startsWith('checkout.') ||
          a.key === 'comprobantes.imprimir' ||
          a.key === 'comprobantes.ver' ||
          a.key.startsWith('pagos.') ||
          a.key.startsWith('facturas.') ||
          a.key === 'cuentaCorriente.ver' ||
          a.key === 'cuentaCorriente.crear' ||
          a.key === 'mercadopago.crear' ||
          a.key.startsWith('clientes.') ||
          a.key === 'habitaciones.listar' ||
          a.key === 'habitaciones.ver' ||
          a.key === 'habitaciones.cambiarEstado',
      );
      recepcionistaGroup = groupRepo.create({
        key: 'rol.recepcionista',
        name: 'Recepcionista',
        description: 'Grupo para personal de recepción',
        actions: recepcionistaActions,
        children: [],
      });
      await groupRepo.save(recepcionistaGroup);
      console.log('  ✓ rol.recepcionista');
    } else {
      // Actualizar acciones del grupo recepcionista existente
      const recepcionistaActions = actions.filter(
        (a) =>
          a.key.startsWith('reservas.') ||
          a.key.startsWith('checkin.') ||
          a.key.startsWith('checkout.') ||
          a.key === 'comprobantes.imprimir' ||
          a.key === 'comprobantes.ver' ||
          a.key.startsWith('pagos.') ||
          a.key.startsWith('facturas.') ||
          a.key === 'cuentaCorriente.ver' ||
          a.key === 'cuentaCorriente.crear' ||
          a.key === 'mercadopago.crear' ||
          a.key.startsWith('clientes.') ||
          a.key === 'habitaciones.listar' ||
          a.key === 'habitaciones.ver' ||
          a.key === 'habitaciones.cambiarEstado',
      );
      recepcionistaGroup.actions = recepcionistaActions;
      await groupRepo.save(recepcionistaGroup);
      console.log('  ✓ rol.recepcionista (actualizado)');
    }

    // Grupo Administrador (TODAS las acciones)
    let adminGroup = await groupRepo.findOne({
      where: { key: 'rol.admin' },
      relations: ['actions'],
    });
    if (!adminGroup) {
      adminGroup = groupRepo.create({
        key: 'rol.admin',
        name: 'Administrador',
        description: 'Grupo con acceso completo al sistema',
        actions: actions, // TODAS las acciones
        children: [],
      });
      await groupRepo.save(adminGroup);
      console.log('  ✓ rol.admin (con TODAS las acciones)');
    } else {
      // Actualizar acciones del grupo admin existente
      adminGroup.actions = actions;
      await groupRepo.save(adminGroup);
      console.log('  ✓ rol.admin (actualizado con TODAS las acciones)');
    }

    console.log('✅ 3 grupos creados\n');

    // 3. Crear Usuarios
    console.log('👤 Creando usuarios...');

    // Limpiar usuarios clientes obsoletos si existen
    const obsoleteUsers = ['cliente1', 'cliente2', 'cliente3'];
    const deleteResult = await userRepo.delete({ username: In(obsoleteUsers) });
    if (deleteResult.affected && deleteResult.affected > 0) {
      console.log(`🧹 Eliminados ${deleteResult.affected} usuarios clientes obsoletos de la tabla de usuarios.`);
    }

    const usersData = [
      {
        username: 'admin',
        email: 'admin@hotel.com',
        password: 'Admin123!',
        fullName: 'Administrador',
        group: adminGroup,
      },
      {
        username: 'admin2',
        email: 'admin2@hotel.com',
        password: 'Admin123!',
        fullName: 'Administrador 2',
        group: adminGroup,
      },
      {
        username: 'recepcionista1',
        email: 'recepcionista1@hotel.com',
        password: 'Recep123!',
        fullName: 'María García',
        group: recepcionistaGroup,
      },
      {
        username: 'recepcionista2',
        email: 'recepcionista2@hotel.com',
        password: 'Recep123!',
        fullName: 'Carlos Rodríguez',
        group: recepcionistaGroup,
      },

    ];

    for (const userData of usersData) {
      let user = await userRepo.findOne({
        where: { username: userData.username },
        relations: ['groups', 'actions'],
      });

      if (!user) {
        const passwordHash = await hash(userData.password, {
          type: 2, // Argon2id
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });

        user = userRepo.create({
          username: userData.username,
          email: userData.email,
          passwordHash,
          fullName: userData.fullName,
          isActive: true,
          groups: [userData.group],
          actions: [], // Sin acciones directas, heredan de grupos
        });
        await userRepo.save(user);
        console.log(`  ✓ ${userData.username}`);
      } else {
        // Actualizar grupo si el usuario ya existe
        let needsUpdate = false;

        if (
          !user.groups ||
          user.groups.length === 0 ||
          !user.groups.find((g) => g.id === userData.group.id)
        ) {
          user.groups = [userData.group];
          needsUpdate = true;
        }

        if (needsUpdate) {
          await userRepo.save(user);
          console.log(`  ✓ ${userData.username} (actualizado grupo)`);
        } else {
          console.log(`  ⏭️  ${userData.username} (ya existe)`);
        }
      }
    }

    console.log('✅ 7 usuarios creados\n');

    // ========== Seed de tipos de habitación y características ==========
    const caracteristicaSeed = new CaracteristicaAndRoomTypeSeed();
    await caracteristicaSeed.run(dataSource);

    // ========== Seed de datos de reservas ==========
    await seedReservationData(dataSource);

    console.log('🎉 Seed completado exitosamente!\n');
    console.log('📋 Resumen:');
    console.log(`  • ${actions.length} acciones`);
    console.log(`  • 3 grupos`);
    console.log(`  • 7 usuarios`);
    console.log(`  • 4 clientes de prueba`);
    console.log(`  • 8 habitaciones`);
    console.log('\n🔐 Credenciales:');
    console.log('  Admin: admin / Admin123!');
    console.log('  Admin2: admin2 / Admin123!');
    console.log('  Recepcionista: recepcionista1 / Recep123!');

    console.log('\n👥 Clientes DNI (para buscar):');
    console.log('  • 12345678 - Juan Pérez');
    console.log('  • 23456789 - María González');
    console.log('  • 34567890 - Carlos Rodríguez');
    console.log('  • 45678901 - Ana Martínez');
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    process.exit(0);
  }
}

void runSeed();
