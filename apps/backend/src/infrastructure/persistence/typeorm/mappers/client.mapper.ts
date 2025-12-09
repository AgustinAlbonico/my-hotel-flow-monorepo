import { Injectable } from '@nestjs/common';
import { Client } from '../../../../domain/entities/client.entity';
import { DNI } from '../../../../domain/value-objects/dni.value-object';
import { Email } from '../../../../domain/value-objects/email.value-object';
import { Phone } from '../../../../domain/value-objects/phone.value-object';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { GroupMapper } from './group.mapper';

@Injectable()
export class ClientMapper {
  constructor(private readonly groupMapper: GroupMapper) { }

  toDomain(orm: ClientOrmEntity): Client {
    const dni = DNI.create(orm.dni);
    const email = Email.create(orm.email);
    const phone = orm.phone ? Phone.create(orm.phone) : null;

    const groups = orm.groups
      ? orm.groups
        .map((g) => this.groupMapper.toDomain(g))
        .filter((g): g is NonNullable<typeof g> => g !== null)
      : [];

    return Client.reconstruct({
      id: orm.id,
      dni,
      firstName: orm.firstName,
      lastName: orm.lastName,
      email,
      phone,
      birthDate: orm.birthDate,
      address: orm.address,
      city: orm.city,
      country: orm.country,
      nationality: orm.nationality,
      observations: orm.observations,
      password: orm.password,
      isActive: orm.isActive,
      outstandingBalance: Number(orm.outstandingBalance) || 0,
      groups,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      passwordResetToken: orm.passwordResetToken || undefined,
      passwordResetExpires: orm.passwordResetExpires || undefined,
    });
  }

  toOrm(domain: Client): ClientOrmEntity {
    const orm = new ClientOrmEntity();
    orm.id = domain.id;
    orm.dni = domain.dni.value;
    orm.firstName = domain.firstName;
    orm.lastName = domain.lastName;
    orm.email = domain.email.value;
    orm.phone = domain.phone?.value ?? null;
    orm.birthDate = domain.birthDate;
    orm.address = domain.address;
    orm.city = domain.city;
    orm.country = domain.country;
    orm.nationality = domain.nationality;
    orm.observations = domain.observations;
    orm.password = domain.password;
    orm.isActive = domain.isActive;
    orm.outstandingBalance = domain.outstandingBalance;
    orm.groups = domain.groups.map((g) => this.groupMapper.toOrm(g));
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.passwordResetToken = domain.passwordResetToken || null;
    orm.passwordResetExpires = domain.passwordResetExpires || null;
    return orm;
  }
}
