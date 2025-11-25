/**
 * Argon2 Hash Service Implementation
 * Implementación concreta del servicio de hashing usando Argon2id
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { IHashService } from '../../domain/services/hash.service.interface';

@Injectable()
export class Argon2HashService implements IHashService {
  private readonly options: argon2.Options;

  constructor(private config: ConfigService) {
    this.options = {
      type: argon2.argon2id,
      memoryCost: this.config.get<number>('argon2.memoryCost', 65536),
      timeCost: this.config.get<number>('argon2.timeCost', 3),
      parallelism: this.config.get<number>('argon2.parallelism', 4),
    };
  }

  async hash(plainText: string): Promise<string> {
    return await argon2.hash(plainText, this.options);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText, this.options);
    } catch {
      return false;
    }
  }

  async verify(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText, this.options);
    } catch {
      return false;
    }
  }

  /**
   * Método adicional (no en la interfaz): verificar si un hash necesita rehash
   * @param hash - Hash a verificar
   * @returns true si necesita rehash, false si no
   */
  needsRehash(hash: string): boolean {
    return argon2.needsRehash(hash, this.options);
  }
}
