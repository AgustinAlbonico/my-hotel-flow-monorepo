import { DataSource } from 'typeorm';
import { hash } from 'argon2';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { RoomOrmEntity } from '../entities/room.orm-entity';
import { RoomTypeOrmEntity } from '../entities/room-type.orm-entity';

export async function seedReservationData(
  dataSource: DataSource,
): Promise<void> {
  const clientRepository = dataSource.getRepository(ClientOrmEntity);
  const roomRepository = dataSource.getRepository(RoomOrmEntity);
  const roomTypeRepository = dataSource.getRepository(RoomTypeOrmEntity);

  console.log('🌱 Seeding reservation data...');

  // Obtener tipos de habitación
  // Los códigos en el seed de tipos se guardan en minúsculas ('estandar','suite','familiar')
  const estandarType = await roomTypeRepository.findOne({
    where: { code: 'estandar' },
  });
  const suiteType = await roomTypeRepository.findOne({
    where: { code: 'suite' },
  });
  const familiarType = await roomTypeRepository.findOne({
    where: { code: 'familiar' },
  });

  if (!estandarType || !suiteType || !familiarType) {
    throw new Error('Room types not found. Please run room type seed first.');
  }

  // Verificar si ya existen clientes
  const existingClients = await clientRepository.count();
  if (existingClients === 0) {
    // Crear clientes de prueba
    const hashedPassword = await hash('Cliente123!');

    const clients = [
      clientRepository.create({
        dni: '12345678',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        phone: '1134567890',
        password: hashedPassword,
        isActive: true,
      }),
      clientRepository.create({
        dni: '23456789',
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@example.com',
        phone: '1145678901',
        password: hashedPassword,
        isActive: true,
      }),
      clientRepository.create({
        dni: '34567890',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@example.com',
        phone: '1156789012',
        password: hashedPassword,
        isActive: true,
      }),
      clientRepository.create({
        dni: '45678901',
        firstName: 'Ana',
        lastName: 'Martínez',
        email: 'ana.martinez@example.com',
        phone: '1167890123',
        password: hashedPassword,
        isActive: true,
      }),
    ];

    await clientRepository.save(clients);
    console.log(`✅ Created ${clients.length} clients`);
  } else {
    console.log(`⏭️ ${existingClients} clients already exist, skipping`);
  }

  // Crear habitaciones (siempre, incluso si los clientes existen)
  const existingRooms = await roomRepository.count();
  if (existingRooms === 0) {
    const rooms = [
      // Habitaciones Estándar
      roomRepository.create({
        numeroHabitacion: '101',
        roomTypeId: estandarType.id,
        estado: 'AVAILABLE',
        descripcion: 'Habitación estándar con dos camas individuales',
        caracteristicasAdicionales: [],
        isActive: true,
      }),
      roomRepository.create({
        numeroHabitacion: '102',
        roomTypeId: estandarType.id,
        estado: 'AVAILABLE',
        descripcion: 'Habitación estándar con cama matrimonial',
        caracteristicasAdicionales: [],
        isActive: true,
      }),
      roomRepository.create({
        numeroHabitacion: '103',
        roomTypeId: estandarType.id,
        estado: 'AVAILABLE',
        descripcion: 'Habitación estándar con vista al jardín',
        caracteristicasAdicionales: ['Vista al jardín'],
        isActive: true,
      }),

      // Suites
      roomRepository.create({
        numeroHabitacion: '201',
        roomTypeId: suiteType.id,
        estado: 'AVAILABLE',
        descripcion: 'Suite con sala de estar separada',
        caracteristicasAdicionales: [],
        isActive: true,
      }),
      roomRepository.create({
        numeroHabitacion: '202',
        roomTypeId: suiteType.id,
        estado: 'AVAILABLE',
        descripcion: 'Suite Premium con balcón privado',
        caracteristicasAdicionales: [],
        isActive: true,
      }),

      // Habitaciones Familiares
      roomRepository.create({
        numeroHabitacion: '301',
        roomTypeId: familiarType.id,
        estado: 'AVAILABLE',
        descripcion: 'Habitación familiar con dos dormitorios',
        caracteristicasAdicionales: ['Dos dormitorios', 'Dos baños'],
        isActive: true,
      }),
      roomRepository.create({
        numeroHabitacion: '302',
        roomTypeId: familiarType.id,
        estado: 'AVAILABLE',
        descripcion: 'Habitación familiar con camas múltiples',
        caracteristicasAdicionales: [],
        isActive: true,
      }),

      // Habitaciones en mantenimiento (no disponibles)
      roomRepository.create({
        numeroHabitacion: '104',
        roomTypeId: estandarType.id,
        estado: 'MAINTENANCE',
        descripcion: 'Habitación en mantenimiento',
        caracteristicasAdicionales: [],
        isActive: true,
      }),
    ];

    await roomRepository.save(rooms);
    console.log(`✅ Created ${rooms.length} rooms`);
  } else {
    console.log(`⏭️ ${existingRooms} rooms already exist, skipping`);
  }

  console.log('✅ Reservation data seeded successfully');
}
