/**
 * Login DTO
 *
 * Data Transfer Object for user login requests.
 * Contains username and password for authentication.
 */
export class LoginDto {
  /**
   * Username for authentication
   */
  username: string;

  /**
   * Password for authentication
   */
  password: string;

  constructor(data: { username: string; password: string }) {
    this.username = data.username;
    this.password = data.password;
  }
}
