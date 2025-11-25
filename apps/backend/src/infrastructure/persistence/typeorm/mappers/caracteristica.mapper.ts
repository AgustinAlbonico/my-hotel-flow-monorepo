import { Caracteristica } from '../../../../domain/entities/caracteristica.entity';
import { CaracteristicaOrmEntity } from '../entities/caracteristica.orm-entity';

/**
 * CaracteristicaMapper
 * Patrón: Mapper - Clean Architecture
 * Capa: Infrastructure
 * Responsabilidad: Mapear entre entidad de dominio y ORM
 */
export class CaracteristicaMapper {
  /**
   * Convertir de entidad ORM a entidad de dominio
   */
  static toDomain(ormEntity: CaracteristicaOrmEntity): Caracteristica {
    return Caracteristica.reconstruct({
      id: ormEntity.id,
      nombre: ormEntity.nombre,
      descripcion: ormEntity.descripcion,
      isActive: ormEntity.isActive,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * Convertir de entidad de dominio a entidad ORM
   */
  static toOrm(domainEntity: Caracteristica): CaracteristicaOrmEntity {
    const ormEntity = new CaracteristicaOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.nombre = domainEntity.nombre;
    ormEntity.descripcion = domainEntity.descripcion;
    ormEntity.isActive = domainEntity.isActive;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;

    return ormEntity;
  }

  /**
   * Convertir múltiples entidades ORM a dominio
   */
  static toDomainList(
    ormEntities: CaracteristicaOrmEntity[],
  ): Caracteristica[] {
    return ormEntities.map((ormEntity) => this.toDomain(ormEntity));
  }
}
