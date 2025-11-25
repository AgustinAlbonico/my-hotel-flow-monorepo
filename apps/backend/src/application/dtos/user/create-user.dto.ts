/**
 * Create User DTO
 * DTO para crear un nuevo usuario
 */

export class CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}
