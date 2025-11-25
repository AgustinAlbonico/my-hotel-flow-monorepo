import type { Client } from '../entities/client.entity';
import type { DNI } from '../value-objects/dni.value-object';
import type { Email } from '../value-objects/email.value-object';

export interface IClientRepository {
  findByDNI(dni: DNI): Promise<Client | null>;
  findByEmail(email: Email): Promise<Client | null>;
  findById(id: number): Promise<Client | null>;
  save(client: Client): Promise<Client>;
  update(client: Client): Promise<Client>;
  delete(id: number): Promise<void>;
  findAll(): Promise<Client[]>;
  findByDni(dni: string): Promise<Client | null>;
}
