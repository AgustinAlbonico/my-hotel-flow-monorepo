import { RoomType } from '../../../../domain/entities/room-type.entity';
import { RoomTypeOrmEntity } from '../entities/room-type.orm-entity';
import { CaracteristicaMapper } from './caracteristica.mapper';

/**
 * RoomTypeMapper
 * Patrón: Mapper - Clean Architecture
 * Capa: Infrastructure
 * Responsabilidad: Convertir entre entidades de dominio y entidades ORM
 */
export class RoomTypeMapper {
  /**
   * Convierte de entidad de dominio a entidad ORM
   */
  static toOrm(roomType: RoomType): RoomTypeOrmEntity {
    const ormEntity = new RoomTypeOrmEntity();
    ormEntity.id = roomType.id;
    ormEntity.code = roomType.code;
    ormEntity.name = roomType.name;
    ormEntity.precioPorNoche = roomType.precioPorNoche;
    ormEntity.capacidadMaxima = roomType.capacidadMaxima;
    ormEntity.descripcion = roomType.descripcion;
    ormEntity.caracteristicas = roomType.caracteristicas.map((car) =>
      CaracteristicaMapper.toOrm(car),
    );
    ormEntity.isActive = roomType.isActive;
    ormEntity.createdAt = roomType.createdAt;
    ormEntity.updatedAt = roomType.updatedAt;
    return ormEntity;
  }

  /**
   * Convierte de entidad ORM a entidad de dominio
   */
  static toDomain(ormEntity: RoomTypeOrmEntity): RoomType {
    return RoomType.reconstruct({
      id: ormEntity.id,
      code: ormEntity.code,
      name: ormEntity.name,
      precioPorNoche: Number(ormEntity.precioPorNoche),
      capacidadMaxima: ormEntity.capacidadMaxima,
      descripcion: ormEntity.descripcion,
      caracteristicas: ormEntity.caracteristicas
        ? CaracteristicaMapper.toDomainList(ormEntity.caracteristicas)
        : [],
      isActive: ormEntity.isActive,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * Convierte un array de entidades ORM a entidades de dominio
   */
  static toDomainArray(ormEntities: RoomTypeOrmEntity[]): RoomType[] {
    return ormEntities.map((ormEntity) => this.toDomain(ormEntity));
  }
}
