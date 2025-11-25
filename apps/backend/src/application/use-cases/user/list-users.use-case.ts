/**
 * List Users Use Case
 * Caso de uso para listar todos los usuarios con paginación y filtros
 */

import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserResponseDto } from '../../dtos/user/user-response.dto';

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedUsersResponse {
  data: UserResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListUsersQuery = {}): Promise<PaginatedUsersResponse> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Obtener todos los usuarios (en producción esto debería venir del repositorio con paginación)
    const allUsers = await this.userRepository.findAll();

    // Filtrar por búsqueda
    let filteredUsers = allUsers;
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(searchLower) ||
          user.email.value.toLowerCase().includes(searchLower) ||
          (user.fullName && user.fullName.toLowerCase().includes(searchLower)),
      );
    }

    // Filtrar por isActive
    if (query.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(
        (user) => user.isActive === query.isActive,
      );
    }

    // Calcular totales
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);

    // Aplicar paginación
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    return {
      data: paginatedUsers.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email.value,
        fullName: user.fullName,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        groups: user.groups.map((group) => ({
          id: group.id,
          key: group.key,
          name: group.name,
          description: group.description,
          actions: [],
          children: [],
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        })),
        actions: user.actions.map((action) => ({
          id: action.id,
          key: action.key,
          name: action.name,
          description: action.description,
          module: action.getModule(),
          operation: action.getOperation(),
          createdAt: action.createdAt,
          updatedAt: action.updatedAt,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
