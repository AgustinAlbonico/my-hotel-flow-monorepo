/**
 * Room Type Seed Data
 * Tipos de habitación por defecto del sistema
 */

import { DataSource } from 'typeorm';
import { RoomTypeOrmEntity } from '../entities/room-type.orm-entity';

export const roomTypesData = [
  {
    code: 'ESTANDAR',
    name: 'Habitación Estándar',
    precioPorNoche: 1500.0,
    capacidadMaxima: 2,
    descripcion:
      'Habitación cómoda y funcional con todas las comodidades básicas para una estadía placentera.',
    caracteristicasIncluidas: [
      'Cama matrimonial o 2 camas individuales',
      'Baño privado',
      'TV por cable',
      'Wi-Fi gratuito',
      'Aire acondicionado',
      'Minibar',
    ],
  },
  {
    code: 'SUITE',
    name: 'Suite Premium',
    precioPorNoche: 3500.0,
    capacidadMaxima: 4,
    descripcion:
      'Suite espaciosa con área de estar separada, comodidades de lujo y vista panorámica.',
    caracteristicasIncluidas: [
      'Cama king size',
      'Sala de estar independiente',
      'Baño con jacuzzi',
      'TV Smart 55"',
      'Wi-Fi de alta velocidad',
      'Aire acondicionado centralizado',
      'Minibar premium',
      'Cafetera Nespresso',
      'Balcón privado',
      'Servicio de habitaciones 24/7',
    ],
  },
  {
    code: 'FAMILIAR',
    name: 'Habitación Familiar',
    precioPorNoche: 2500.0,
    capacidadMaxima: 6,
    descripcion:
      'Habitación amplia ideal para familias, con espacio suficiente para hasta 6 personas.',
    caracteristicasIncluidas: [
      '2 camas matrimoniales',
      '2 camas individuales',
      'Baño privado grande',
      'TV por cable',
      'Wi-Fi gratuito',
      'Aire acondicionado',
      'Minibar',
      'Área de juegos para niños',
      'Cocina pequeña',
    ],
  },
];

/**
 * Seed de tipos de habitación
 */
export async function seedRoomTypes(dataSource: DataSource): Promise<void> {
  const roomTypeRepo = dataSource.getRepository(RoomTypeOrmEntity);

  console.log('🏨 Creando tipos de habitación...');

  const roomTypes = await Promise.all(
    roomTypesData.map(async (data) => {
      // Verificar si ya existe
      const existing = await roomTypeRepo.findOne({
        where: { code: data.code },
      });

      if (existing) {
        console.log(`  ⏭️  Tipo "${data.name}" ya existe, actualizando...`);
        Object.assign(existing, data);
        return roomTypeRepo.save(existing);
      }

      const roomType = roomTypeRepo.create({
        ...data,
        isActive: true,
      });

      return roomTypeRepo.save(roomType);
    }),
  );

  console.log(`✅ ${roomTypes.length} tipos de habitación creados\n`);
}
