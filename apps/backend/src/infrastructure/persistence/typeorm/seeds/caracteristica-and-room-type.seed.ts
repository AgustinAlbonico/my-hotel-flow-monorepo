import { DataSource } from 'typeorm';
import { CaracteristicaOrmEntity } from '../entities/caracteristica.orm-entity';
import { RoomTypeOrmEntity } from '../entities/room-type.orm-entity';
import { Logger } from '@nestjs/common';

/**
 * Seed de Características y Tipos de Habitación
 * Crea características predeterminadas y tipos de habitación con sus relaciones
 */
export class CaracteristicaAndRoomTypeSeed {
  private readonly logger = new Logger(CaracteristicaAndRoomTypeSeed.name);

  async run(dataSource: DataSource): Promise<void> {
    this.logger.log(
      '🌱 Ejecutando seed de características y tipos de habitación...',
    );

    const caracteristicaRepository = dataSource.getRepository(
      CaracteristicaOrmEntity,
    );
    const roomTypeRepository = dataSource.getRepository(RoomTypeOrmEntity);

    // 1. Crear características predeterminadas
    const caracteristicas = [
      {
        nombre: 'Wi-Fi',
        descripcion: 'Conexión a internet inalámbrica de alta velocidad',
      },
      {
        nombre: 'TV por Cable',
        descripcion: 'Televisor con señal de cable y canales premium',
      },
      {
        nombre: 'Aire Acondicionado',
        descripcion: 'Sistema de climatización individual',
      },
      {
        nombre: 'Mini-bar',
        descripcion: 'Refrigerador con bebidas y snacks',
      },
      {
        nombre: 'Caja Fuerte',
        descripcion: 'Caja de seguridad personal',
      },
      {
        nombre: 'Balcón',
        descripcion: 'Balcón privado con vista',
      },
      {
        nombre: 'Bañera',
        descripcion: 'Bañera de inmersión en el baño',
      },
      {
        nombre: 'Escritorio',
        descripcion: 'Espacio de trabajo con escritorio y silla',
      },
      {
        nombre: 'Teléfono',
        descripcion: 'Teléfono fijo con línea directa',
      },
      {
        nombre: 'Secador de Pelo',
        descripcion: 'Secador de pelo profesional',
      },
      {
        nombre: 'Cafetera',
        descripcion: 'Máquina de café y té',
      },
      {
        nombre: 'Vista al Mar',
        descripcion: 'Habitación con vista directa al mar',
      },
      {
        nombre: 'Jacuzzi',
        descripcion: 'Jacuzzi privado',
      },
      {
        nombre: 'Room Service 24h',
        descripcion: 'Servicio a la habitación las 24 horas',
      },
    ];

    const savedCaracteristicas: CaracteristicaOrmEntity[] = [];
    for (const car of caracteristicas) {
      const existing = await caracteristicaRepository.findOne({
        where: { nombre: car.nombre },
      });
      if (!existing) {
        const newCar = caracteristicaRepository.create(car);
        const saved = await caracteristicaRepository.save(newCar);
        savedCaracteristicas.push(saved);
        this.logger.log(`✅ Característica creada: ${car.nombre}`);
      } else {
        savedCaracteristicas.push(existing);
        this.logger.log(`⏭️ Característica ya existe: ${car.nombre}`);
      }
    }

    // 2. Crear tipos de habitación con características asociadas
    const roomTypes = [
      {
        code: 'estandar',
        name: 'Habitación Estándar',
        precioPorNoche: 1500,
        capacidadMaxima: 2,
        descripcion: 'Habitación cómoda con comodidades básicas',
        caracteristicas: [
          'Wi-Fi',
          'TV por Cable',
          'Aire Acondicionado',
          'Escritorio',
        ],
      },
      {
        code: 'suite',
        name: 'Suite',
        precioPorNoche: 3000,
        capacidadMaxima: 4,
        descripcion: 'Suite espaciosa con sala de estar separada',
        caracteristicas: [
          'Wi-Fi',
          'TV por Cable',
          'Aire Acondicionado',
          'Mini-bar',
          'Caja Fuerte',
          'Balcón',
          'Escritorio',
          'Cafetera',
        ],
      },
      {
        code: 'familiar',
        name: 'Habitación Familiar',
        precioPorNoche: 2200,
        capacidadMaxima: 5,
        descripcion: 'Habitación amplia ideal para familias',
        caracteristicas: [
          'Wi-Fi',
          'TV por Cable',
          'Aire Acondicionado',
          'Caja Fuerte',
          'Escritorio',
        ],
      },
      {
        code: 'deluxe-vista-mar',
        name: 'Deluxe Vista al Mar',
        precioPorNoche: 4500,
        capacidadMaxima: 3,
        descripcion: 'Habitación de lujo con vista panorámica al mar',
        caracteristicas: [
          'Wi-Fi',
          'TV por Cable',
          'Aire Acondicionado',
          'Mini-bar',
          'Caja Fuerte',
          'Balcón',
          'Bañera',
          'Escritorio',
          'Vista al Mar',
          'Cafetera',
          'Room Service 24h',
        ],
      },
      {
        code: 'presidential-suite',
        name: 'Suite Presidencial',
        precioPorNoche: 8000,
        capacidadMaxima: 6,
        descripcion: 'Suite de lujo máximo con todas las comodidades premium',
        caracteristicas: [
          'Wi-Fi',
          'TV por Cable',
          'Aire Acondicionado',
          'Mini-bar',
          'Caja Fuerte',
          'Balcón',
          'Bañera',
          'Escritorio',
          'Jacuzzi',
          'Vista al Mar',
          'Cafetera',
          'Room Service 24h',
        ],
      },
    ];

    for (const roomTypeData of roomTypes) {
      const existing = await roomTypeRepository.findOne({
        where: { code: roomTypeData.code },
      });

      if (!existing) {
        // Buscar las características por nombre
        const caracteristicasEntities = savedCaracteristicas.filter((car) =>
          roomTypeData.caracteristicas.includes(car.nombre),
        );

        const newRoomType = roomTypeRepository.create({
          code: roomTypeData.code,
          name: roomTypeData.name,
          precioPorNoche: roomTypeData.precioPorNoche,
          capacidadMaxima: roomTypeData.capacidadMaxima,
          descripcion: roomTypeData.descripcion,
          caracteristicas: caracteristicasEntities,
          isActive: true,
        });

        await roomTypeRepository.save(newRoomType);
        this.logger.log(`✅ Tipo de habitación creado: ${roomTypeData.name}`);
      } else {
        this.logger.log(
          `⏭️ Tipo de habitación ya existe: ${roomTypeData.name}`,
        );
      }
    }

    this.logger.log(
      '✨ Seed de características y tipos de habitación completado!',
    );
  }
}
